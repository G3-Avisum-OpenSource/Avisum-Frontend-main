import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Driver } from '../domain/model/driver.entity';
import { environment } from '../../../environments/environment';
import { avatarFor } from '../../shared/infrastructure/fake-api/fake-data';
import { FleetTrackingService } from '../../shared/infrastructure/fleet-tracking.service';

export interface DatosConductor {
  nombre: string;
  apellido: string;
  dni: string;
  placa: string;
  ruta: string;
}
export type ErroresConductor = Partial<Record<keyof DatosConductor, string>>;

export const RUTAS = ['R-07', 'R-15', 'R-22', 'R-33', 'R-42'];

/** Lo que devuelve la API en /employees. */
interface EmployeeRes {
  id: number;
  employeeCode: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dni?: string;
  plateNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
}

/** Lo que devuelve la API en /bus-units. */
interface UnitRes {
  id: number;
  plateNumber: string;
  route: string;
  status: string;
}

const aDriver = (e: EmployeeRes): Driver => {
  const partes = (e.fullName ?? '').trim().split(' ');
  const nombre = e.firstName ?? partes.shift() ?? '';
  const apellido = e.lastName ?? partes.join(' ');
  return new Driver({
    id: e.id,
    nombre,
    apellido,
    dni: e.dni ?? '',
    codigoEmpleado: e.employeeCode,
    codigoQr: `QR-${e.employeeCode}`,
    placa: e.plateNumber,
    estado: e.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO',
    foto: avatarFor({ firstName: nombre, lastName: apellido }),
  });
};

/** Conductores y sus unidades. Todo sale de la API (json-server) y todo cambio vuelve a ella. */
@Injectable({ providedIn: 'root' })
export class UsersStateService {
  private http = inject(HttpClient);
  private fleet = inject(FleetTrackingService);

  private empUrl =
    environment.platformProviderApiBaseUrl + environment.platformProviderConductoresEndpointPath;
  private unitUrl =
    environment.platformProviderApiBaseUrl + environment.platformProviderUnidadesEndpointPath;

  readonly conductores = signal<Driver[]>([]);
  private unidades = signal<UnitRes[]>([]);
  readonly cargando = signal(true);

  readonly selected = signal<number | null>(null);
  readonly searchTerm = signal('');

  readonly filtered = computed(() => {
    const t = this.searchTerm().toLowerCase();
    return this.conductores().filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        c.apellido.toLowerCase().includes(t) ||
        c.dni.includes(t) ||
        c.codigoEmpleado.toLowerCase().includes(t) ||
        c.placa.toLowerCase().includes(t),
    );
  });

  constructor() {
    this.recargar();
  }

  getConductores(): Driver[] {
    return this.conductores();
  }

  /** Vuelve a leer conductores y unidades de la API. */
  recargar(): void {
    forkJoin({
      emp: this.http.get<EmployeeRes[]>(this.empUrl),
      units: this.http.get<UnitRes[]>(this.unitUrl),
    })
      .pipe(catchError(() => of(null)))
      .subscribe((r) => {
        if (r) {
          this.unidades.set(r.units);
          this.conductores.set(r.emp.map(aDriver));
        }
        this.cargando.set(false);
      });
  }

  /** Después de cualquier cambio: refresca esta lista y el mapa de la flota. */
  private despues(): void {
    this.recargar();
    this.fleet.recargar();
  }

  private unidadDe(placa: string | undefined): UnitRes | undefined {
    return this.unidades().find((u) => u.plateNumber === placa);
  }

  /** Ruta de la unidad que maneja un conductor. */
  rutaDe(codigoEmpleado: string): string {
    const placa = this.conductores().find((c) => c.codigoEmpleado === codigoEmpleado)?.placa;
    return this.unidadDe(placa)?.route ?? 'R-42';
  }

  validar(d: DatosConductor, idActual?: number): ErroresConductor {
    const e: ErroresConductor = {};
    const todos = this.conductores();

    if (d.nombre.trim().length < 2) e.nombre = 'Escribe los nombres del conductor.';
    if (d.apellido.trim().length < 2) e.apellido = 'Escribe los apellidos del conductor.';

    if (!/^\d{8}$/.test(d.dni)) e.dni = 'El DNI debe tener 8 dígitos.';
    else if (todos.some((x) => x.dni === d.dni && x.id !== idActual))
      e.dni = 'Ya existe un conductor con este DNI.';

    const placa = d.placa.trim().toUpperCase();
    if (!/^[A-Z0-9]{3}-[A-Z0-9]{3,4}$/.test(placa)) e.placa = 'Usa el formato ABC-1234.';
    else if (todos.some((x) => x.placa === placa && x.id !== idActual))
      e.placa = 'Esta placa ya está asignada a otro conductor.';

    if (!RUTAS.includes(d.ruta)) e.ruta = 'Elige una ruta.';
    return e;
  }

  /** Crea la unidad y el conductor. El servidor asigna el código (EMP-006, EMP-007...). */
  crear(d: DatosConductor): Observable<Driver> {
    const placa = d.placa.trim().toUpperCase();
    const firstName = d.nombre.trim();
    const lastName = d.apellido.trim();
    const unidad = {
      plateNumber: placa,
      route: d.ruta,
      currentLatitude: -12.0464 + (Math.random() - 0.5) * 0.08,
      currentLongitude: -77.0428 + (Math.random() - 0.5) * 0.08,
      status: 'ACTIVE',
    };
    return this.http.post<UnitRes>(this.unitUrl, unidad).pipe(
      switchMap(() =>
        this.http.post<EmployeeRes>(this.empUrl, {
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          dni: d.dni,
          plateNumber: placa,
          status: 'ACTIVE',
        }),
      ),
      tap(() => this.despues()),
      map(aDriver),
    );
  }

  actualizar(id: number, d: DatosConductor): Observable<unknown> {
    const actual = this.conductores().find((c) => c.id === id);
    const unidad = this.unidadDe(actual?.placa);
    const placa = d.placa.trim().toUpperCase();
    const firstName = d.nombre.trim();
    const lastName = d.apellido.trim();

    const peticiones: Observable<unknown>[] = [
      this.http.patch(`${this.empUrl}/${id}`, {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        dni: d.dni,
        plateNumber: placa,
      }),
    ];
    if (unidad)
      peticiones.push(
        this.http.patch(`${this.unitUrl}/${unidad.id}`, { plateNumber: placa, route: d.ruta }),
      );
    return forkJoin(peticiones).pipe(tap(() => this.despues()));
  }

  /** Desactivar también deja inactiva su unidad. */
  cambiarEstado(id: number, estado: 'ACTIVO' | 'INACTIVO'): Observable<unknown> {
    const actual = this.conductores().find((c) => c.id === id);
    const unidad = this.unidadDe(actual?.placa);
    const activo = estado === 'ACTIVO';

    const peticiones: Observable<unknown>[] = [
      this.http.patch(`${this.empUrl}/${id}`, { status: activo ? 'ACTIVE' : 'INACTIVE' }),
    ];
    if (unidad)
      peticiones.push(
        this.http.patch(`${this.unitUrl}/${unidad.id}`, { status: activo ? 'ACTIVE' : 'INACTIVE' }),
      );
    return forkJoin(peticiones).pipe(tap(() => this.despues()));
  }

  /** Elimina al conductor y su unidad. */
  eliminar(id: number): Observable<unknown> {
    const actual = this.conductores().find((c) => c.id === id);
    const unidad = this.unidadDe(actual?.placa);
    if (this.selected() === id) this.selected.set(null);

    const peticiones: Observable<unknown>[] = [this.http.delete(`${this.empUrl}/${id}`)];
    if (unidad) peticiones.push(this.http.delete(`${this.unitUrl}/${unidad.id}`));
    return forkJoin(peticiones).pipe(tap(() => this.despues()));
  }

  /** Dos conductores intercambian de unidad (intercambian placa). */
  intercambiarUnidades(idA: number, idB: number): Observable<unknown> {
    const a = this.conductores().find((c) => c.id === idA);
    const b = this.conductores().find((c) => c.id === idB);
    if (!a || !b) return of(null);
    return forkJoin([
      this.http.patch(`${this.empUrl}/${idA}`, { plateNumber: b.placa }),
      this.http.patch(`${this.empUrl}/${idB}`, { plateNumber: a.placa }),
    ]).pipe(tap(() => this.despues()));
  }

  /** Cambia la ruta de una unidad, sin importar quién la maneje. */
  cambiarRutaUnidad(placa: string, ruta: string): Observable<unknown> {
    const unidad = this.unidadDe(placa);
    if (!unidad) return of(null);
    return this.http
      .patch(`${this.unitUrl}/${unidad.id}`, { route: ruta })
      .pipe(tap(() => this.despues()));
  }
}
