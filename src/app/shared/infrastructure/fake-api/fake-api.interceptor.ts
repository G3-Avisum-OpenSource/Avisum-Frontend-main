import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { normalizeEmployeeCode } from './fake-data';
import { COLLECTIONS, Collection, Rec, readDb, writeDb } from './fake-db';

/**
 * API falsa para el modo sin servidor (Vercel). Responde igual que server/server.js
 * (json-server): mismos endpoints y mismas respuestas, con los datos de fake-db.ts.
 * Solo atiende las peticiones que van a `environment.platformProviderApiBaseUrl`.
 */

const LATENCY_MS = 350;

/** Posición en vivo de cada unidad (en memoria, para no escribir en el navegador cada 2 segundos). */
const live = new Map<number, { lat: number; lng: number }>();
const withLive = (u: Rec): Rec => {
  const p = live.get(u['id']);
  return p ? { ...u, currentLatitude: p.lat, currentLongitude: p.lng } : u;
};

const nextId = (list: Rec[]): number => list.reduce((max, x) => Math.max(max, x['id']), 0) + 1;

function handle(req: HttpRequest<unknown>, path: string): Observable<HttpResponse<unknown>> {
  const ok = (body: unknown, status = 200) => of(new HttpResponse({ status, body, url: req.url }));
  const fail = (status: number, statusText: string) =>
    throwError(() => new HttpErrorResponse({ status, statusText, url: req.url }));
  const notFound = () => fail(404, 'Not Found');

  const m = req.method;
  const body = (req.body ?? {}) as Rec;
  const db = readDb();
  const save = () => writeDb(db);
  let r: RegExpMatchArray | null;

  // ---------- Empleados ----------
  if (m === 'GET' && (r = path.match(/^\/employees\/code\/(.+)$/))) {
    const code = normalizeEmployeeCode(decodeURIComponent(r[1]));
    const employee = db.employees.find((e) => e['employeeCode'] === code);
    if (!employee) return notFound();
    if (employee['status'] !== 'ACTIVE') return fail(403, 'Forbidden'); // conductor desactivado
    return ok(employee);
  }

  // Alta: el servidor asigna el id y el código (EMP-006, EMP-007...) sin reutilizar los de eliminados
  if (m === 'POST' && path === '/employees') {
    const id = Math.max(db.meta.lastEmployeeId, ...db.employees.map((e) => e['id'])) + 1;
    db.meta.lastEmployeeId = id;
    const employee = {
      ...body,
      id,
      employeeCode: `EMP-${String(id).padStart(3, '0')}`,
      fullName: body['fullName'] || `${body['firstName'] ?? ''} ${body['lastName'] ?? ''}`.trim(),
      status: body['status'] || 'ACTIVE',
    };
    db.employees.push(employee);
    save();
    return ok(employee, 201);
  }

  // ---------- Unidades ----------
  if (m === 'POST' && path === '/bus-units') {
    const id = Math.max(db.meta.lastUnitId, ...db['bus-units'].map((u) => u['id'])) + 1;
    db.meta.lastUnitId = id;
    const unit = {
      currentLatitude: -12.0464,
      currentLongitude: -77.0428,
      status: 'ACTIVE',
      ...body,
      id,
    };
    db['bus-units'].push(unit);
    save();
    return ok(unit, 201);
  }

  if (m === 'PATCH' && (r = path.match(/^\/bus-units\/(\d+)\/location$/))) {
    const unit = db['bus-units'].find((u) => u['id'] === +r![1]);
    if (!unit) return notFound();
    const prev = live.get(unit['id']) ?? {
      lat: unit['currentLatitude'],
      lng: unit['currentLongitude'],
    };
    live.set(unit['id'], {
      lat: typeof body['latitude'] === 'number' ? body['latitude'] : prev.lat,
      lng: typeof body['longitude'] === 'number' ? body['longitude'] : prev.lng,
    });
    return ok(withLive(unit));
  }

  // ---------- Alertas ----------
  if (m === 'POST' && path === '/alerts') {
    const alert = {
      id: nextId(db.alerts),
      employeeId: body['employeeId'] ?? 0,
      busUnitId: body['busUnitId'] ?? 0,
      alertType: body['alertType'] || 'PÁNICO',
      description: body['description'] || '',
      latitude: body['latitude'] ?? 0,
      longitude: body['longitude'] ?? 0,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    db.alerts.push(alert);
    save();
    return ok(alert, 201);
  }

  if (m === 'PATCH' && (r = path.match(/^\/alerts\/(\d+)\/resolve$/))) {
    const alert = db.alerts.find((a) => a['id'] === +r![1]);
    if (!alert) return notFound();
    alert['resolved'] = true;
    save();
    return ok(alert);
  }

  // ---------- Turnos ----------
  if (m === 'POST' && path === '/shifts') {
    const unit = db['bus-units'].find((u) => u['id'] === body['busUnitId']);
    const shift = {
      id: nextId(db.shifts),
      employeeId: body['employeeId'] ?? 0,
      busUnitId: body['busUnitId'] ?? 0,
      routeName: unit ? unit['route'] : 'R-42',
      routeOrigin: body['routeOrigin'] || '',
      routeDestination: body['routeDestination'] || '',
      distanceKm: 0,
      durationSeconds: 0,
      passengerCount: 0,
      fareCollected: 0,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    db.shifts.push(shift);
    save();
    return ok(shift, 201);
  }

  if (m === 'PATCH' && (r = path.match(/^\/shifts\/(\d+)\/end$/))) {
    const shift = db.shifts.find((s) => s['id'] === +r![1]);
    if (!shift) return notFound();
    shift['distanceKm'] = body['distanceKm'] ?? shift['distanceKm'];
    shift['durationSeconds'] = body['durationSeconds'] ?? shift['durationSeconds'];
    shift['passengerCount'] = body['passengerCount'] ?? shift['passengerCount'];
    shift['fareCollected'] = body['fareCollected'] ?? shift['fareCollected'];
    shift['status'] = 'FINISHED';
    shift['endedAt'] = new Date().toISOString();
    save();
    return ok(shift);
  }

  if (m === 'GET' && (r = path.match(/^\/shifts\/employee\/(\d+)$/))) {
    return ok(db.shifts.filter((s) => s['employeeId'] === +r![1]));
  }

  if (m === 'GET' && (r = path.match(/^\/shifts\/bus-unit\/(\d+)\/active$/))) {
    const active = db.shifts.find((s) => s['busUnitId'] === +r![1] && s['status'] === 'ACTIVE');
    return active ? ok(active) : notFound();
  }

  // ---------- REST estándar (igual que json-server) ----------
  const g = path.match(/^\/([a-z-]+)(?:\/(\d+))?$/);
  if (g && (COLLECTIONS as string[]).includes(g[1])) {
    const name = g[1] as Collection;
    const list = db[name];
    const id = g[2] ? +g[2] : null;

    if (m === 'GET') {
      if (id === null) return ok(name === 'bus-units' ? list.map(withLive) : list);
      const item = list.find((x) => x['id'] === id);
      if (!item) return notFound();
      return ok(name === 'bus-units' ? withLive(item) : item);
    }

    if (m === 'POST' && id === null) {
      const item = { ...body, id: nextId(list) };
      list.push(item);
      save();
      return ok(item, 201);
    }

    if ((m === 'PATCH' || m === 'PUT') && id !== null) {
      const i = list.findIndex((x) => x['id'] === id);
      if (i < 0) return notFound();
      list[i] = m === 'PUT' ? { ...body, id } : { ...list[i], ...body, id };
      save();
      return ok(list[i]);
    }

    if (m === 'DELETE' && id !== null) {
      const i = list.findIndex((x) => x['id'] === id);
      if (i < 0) return notFound();
      list.splice(i, 1);
      save();
      return ok({});
    }
  }

  return notFound();
}

export const fakeApiInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.platformProviderApiBaseUrl;
  if (!environment.useFakeApi || !req.url.startsWith(base)) return next(req);

  const path = req.url.slice(base.length).split('?')[0];
  return handle(req, path).pipe(delay(LATENCY_MS));
};
