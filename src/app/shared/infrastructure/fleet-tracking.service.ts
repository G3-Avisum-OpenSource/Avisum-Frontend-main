import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DestinatariosService } from '../../alert-management/application/destinatarios.service';

export interface UnidadTrack {
  id: number; // id real del BusUnit en el backend
  placa: string;
  conductor: string;
  codigoEmpleado: string;
  ruta: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'ALERTA';
  lat: number;
  lng: number;
  pasajeros: number;
  velocidad: number;
}

export interface AlertaTrack {
  id: number; // id real del Alert en el backend
  tipo: string;
  bus: string;
  conductor: string;
  codigoEmpleado: string;
  hora: string;
  nivel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  resuelta: boolean;
  creadaEn: number;
  resueltaEn: number | null;
  /** Destinatarios activos que recibieron la alerta cuando se generó. */
  notificados: string[];
  lat: number;
  lng: number;
}

/**
 * Simula el movimiento en tiempo real de la flota y las alertas, y las
 * persiste de verdad en el backend (bus_units y alerts) para que Swagger
 * y MySQL Workbench muestren datos reales, no solo el frontend.
 *
 * Las pestañas del mismo navegador se comunican entre sí (BroadcastChannel): lo que hace
 * el conductor en una pestaña (alerta de pánico, posición) lo ve el administrador en otra.
 */
@Injectable({ providedIn: 'root' })
export class FleetTrackingService {
  private http = inject(HttpClient);
  private destinatarios = inject(DestinatariosService);
  private baseUrl = environment.platformProviderApiBaseUrl;

  readonly unidades = signal<UnidadTrack[]>([]);
  readonly alertas = signal<AlertaTrack[]>([]);

  /** placa -> id real del BusUnit en el backend */
  private busUnitIds = new Map<string, number>();
  /** codigoEmpleado -> id real del Employee en el backend */
  private employeeIds = new Map<string, number>();

  private headings = new Map<number, number>();
  private intervalRef: ReturnType<typeof setInterval> | null = null;
  private alertaIntervalRef: ReturnType<typeof setInterval> | null = null;
  private codigoPropio = signal<string | null>(null);

  /** Si es true, el simulador inventa alertas de otras unidades. Déjalo en false para demos. */
  private readonly ALERTAS_ALEATORIAS = false;

  /** Canal entre pestañas del mismo navegador. */
  private canal: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('avisum-flota') : null;
  /** placa -> última vez que otra pestaña movió esa unidad (mientras tanto, esta no la mueve sola). */
  private externos = new Map<string, number>();

  private tiposAleatorios: { tipo: string; nivel: AlertaTrack['nivel'] }[] = [
    { tipo: 'PÁNICO', nivel: 'CRITICO' },
    { tipo: 'VELOCIDAD', nivel: 'ALTO' },
    { tipo: 'DESVÍO', nivel: 'MEDIO' },
  ];

  constructor() {
    this.cargarDesdeBackend();
    if (this.canal) {
      this.canal.onmessage = (ev: MessageEvent) => this.recibir(ev.data);
      this.canal.postMessage({ tipo: 'hola' }); // pide a las demás pestañas las alertas que ya existen
    }
  }

  /** Vuelve a leer unidades y conductores de la API (después de cambios en administración). */
  recargar() {
    this.cargarDesdeBackend();
  }

  /** Trae las unidades y empleados de la API para arrancar con datos verdaderos. */
  private cargarDesdeBackend() {
    forkJoin({
      unidades: this.http.get<any[]>(`${this.baseUrl}/bus-units`).pipe(catchError(() => of(null))),
      empleados: this.http.get<any[]>(`${this.baseUrl}/employees`).pipe(catchError(() => of(null))),
    }).subscribe(({ unidades, empleados }) => {
      // placa -> conductor que la maneja (sale de la API, no de datos escritos en el programa)
      const porPlaca = new Map<string, { codigoEmpleado: string; nombre: string }>();
      if (empleados) {
        this.employeeIds.clear();
        for (const e of empleados) {
          this.employeeIds.set(e.employeeCode, e.id);
          const nombre = e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
          porPlaca.set(e.plateNumber, { codigoEmpleado: e.employeeCode, nombre });
        }
      }

      if (unidades) {
        // Conserva lo que ya estaba en vivo (posición, alerta, pasajeros) al recargar
        const previas = new Map(this.unidades().map((u) => [u.id, u]));
        const lista: UnidadTrack[] = unidades.map((u: any) => {
          const info = porPlaca.get(u.plateNumber) ?? { codigoEmpleado: '', nombre: u.plateNumber };
          const previa = previas.get(u.id);
          this.busUnitIds.set(u.plateNumber, u.id);
          const estado: UnidadTrack['estado'] =
            u.status === 'INACTIVE'
              ? 'INACTIVO'
              : previa && previa.estado !== 'INACTIVO'
                ? previa.estado
                : 'ACTIVO';
          return {
            id: u.id,
            placa: u.plateNumber,
            conductor: info.nombre,
            codigoEmpleado: info.codigoEmpleado,
            ruta: u.route,
            estado,
            lat: previa?.lat ?? u.currentLatitude,
            lng: previa?.lng ?? u.currentLongitude,
            pasajeros: previa?.pasajeros ?? Math.floor(Math.random() * 40) + 5,
            velocidad: previa?.velocidad ?? Math.floor(Math.random() * 40) + 35,
          };
        });
        this.unidades.set(lista);
      }

      // Si otra pestaña ya había mandado alertas abiertas, esas unidades quedan en alerta
      const abiertas = new Set(
        this.alertas()
          .filter((a) => !a.resuelta)
          .map((a) => a.bus),
      );
      if (abiertas.size) {
        this.unidades.update((list) =>
          list.map((u) => (abiertas.has(u.placa) ? { ...u, estado: 'ALERTA' } : u)),
        );
      }

      this.iniciarSimulacion();
    });
  }

  setCodigoPropio(codigo: string | null) {
    this.codigoPropio.set(codigo);
  }

  private iniciarSimulacion() {
    if (this.intervalRef) return;
    this.intervalRef = setInterval(() => {
      this.unidades.update((list) =>
        list.map((u) => {
          if (u.estado === 'INACTIVO') return u;
          // Si otra pestaña la está moviendo (el conductor), esta no la mueve sola
          if (Date.now() - (this.externos.get(u.placa) ?? 0) < 6000) return u;
          let heading = this.headings.get(u.id);
          if (heading === undefined || Math.random() < 0.08) {
            heading = Math.random() * Math.PI * 2;
            this.headings.set(u.id, heading);
          }
          const paso = 0.0004;
          const nuevoLat = u.lat + Math.cos(heading) * paso;
          const nuevoLng = u.lng + Math.sin(heading) * paso;
          this.persistirUbicacion(u.id, nuevoLat, nuevoLng);
          return { ...u, lat: nuevoLat, lng: nuevoLng };
        }),
      );
    }, 2000);

    if (!this.ALERTAS_ALEATORIAS || this.alertaIntervalRef) return;
    this.alertaIntervalRef = setInterval(() => {
      if (Math.random() > 0.3) return;
      const candidatos = this.unidades().filter(
        (u) => u.estado === 'ACTIVO' && u.codigoEmpleado !== this.codigoPropio(),
      );
      if (candidatos.length === 0) return;
      const unidad = candidatos[Math.floor(Math.random() * candidatos.length)];
      const { tipo, nivel } =
        this.tiposAleatorios[Math.floor(Math.random() * this.tiposAleatorios.length)];
      this.crearAlerta(unidad, tipo, nivel);
    }, 20000);
  }

  /** Guarda la nueva ubicación en el backend (bus_units). Si falla, no rompe la demo. */
  private persistirUbicacion(busUnitId: number, lat: number, lng: number) {
    if (busUnitId < 0) return; // unidad de respaldo, sin id real
    this.http
      .patch(`${this.baseUrl}/bus-units/${busUnitId}/location`, { latitude: lat, longitude: lng })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  getUnidadByCodigo(codigoEmpleado: string): UnidadTrack | undefined {
    return this.unidades().find((u) => u.codigoEmpleado === codigoEmpleado);
  }

  moverUnidadPorDistancia(codigoEmpleado: string, deltaKm: number) {
    const movidas: { placa: string; lat: number; lng: number }[] = [];
    this.unidades.update((list) =>
      list.map((u) => {
        if (u.codigoEmpleado !== codigoEmpleado || u.estado === 'INACTIVO') return u;
        let heading = this.headings.get(u.id);
        if (heading === undefined || Math.random() < 0.1) {
          heading = Math.random() * Math.PI * 2;
          this.headings.set(u.id, heading);
        }
        const paso = deltaKm * 0.03;
        const nuevoLat = u.lat + Math.cos(heading) * paso;
        const nuevoLng = u.lng + Math.sin(heading) * paso;
        this.persistirUbicacion(u.id, nuevoLat, nuevoLng);
        movidas.push({ placa: u.placa, lat: nuevoLat, lng: nuevoLng });
        return { ...u, lat: nuevoLat, lng: nuevoLng };
      }),
    );
    // Avisa a las otras pestañas (el panel del administrador) dónde está esta unidad
    for (const m of movidas) this.canal?.postMessage({ tipo: 'posicion', ...m });
  }

  triggerPanic(codigoEmpleado: string) {
    const unidad = this.getUnidadByCodigo(codigoEmpleado);
    if (!unidad) return;
    this.crearAlerta(unidad, 'PÁNICO', 'CRITICO');
  }

  private crearAlerta(unidad: UnidadTrack, tipo: string, nivel: AlertaTrack['nivel']) {
    this.unidades.update((list) =>
      list.map((u) => (u.id === unidad.id ? { ...u, estado: 'ALERTA' } : u)),
    );
    const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const employeeId = this.employeeIds.get(unidad.codigoEmpleado);
    const busUnitId = unidad.id;

    // Empuja el estado local de inmediato, para que la demo no espere a la red.
    const provisional: AlertaTrack = {
      id: -Date.now(),
      tipo,
      bus: unidad.placa,
      conductor: unidad.conductor,
      codigoEmpleado: unidad.codigoEmpleado,
      hora,
      nivel,
      resuelta: false,
      creadaEn: Date.now(),
      resueltaEn: null,
      notificados: this.destinatarios.activosNombres(),
      lat: unidad.lat,
      lng: unidad.lng,
    };
    this.alertas.update((list) => [provisional, ...list]);
    this.canal?.postMessage({ tipo: 'alerta', alerta: provisional }); // el administrador la ve al instante

    if (employeeId === undefined || busUnitId < 0) return; // sin ids reales, se queda solo local

    this.http
      .post<any>(`${this.baseUrl}/alerts`, {
        employeeId,
        busUnitId,
        alertType: tipo,
        description: `Alerta ${tipo} generada en unidad ${unidad.placa}`,
        latitude: unidad.lat,
        longitude: unidad.lng,
      })
      .pipe(catchError(() => of(null)))
      .subscribe((respuesta) => {
        if (!respuesta) return;
        // Reemplaza el id provisional por el id real que devolvió el backend.
        this.alertas.update((list) =>
          list.map((a) => (a.id === provisional.id ? { ...a, id: respuesta.id } : a)),
        );
        this.canal?.postMessage({
          tipo: 'alerta-id',
          bus: provisional.bus,
          creadaEn: provisional.creadaEn,
          id: respuesta.id,
        });
      });
  }

  resolverAlerta(id: number) {
    const alerta = this.alertas().find((a) => a.id === id);
    const ahora = Date.now();
    let placaResuelta: string | null = null;
    this.alertas.update((list) =>
      list.map((a) => {
        if (a.id === id) {
          placaResuelta = a.bus;
          return { ...a, resuelta: true, resueltaEn: ahora };
        }
        return a;
      }),
    );
    if (placaResuelta) {
      this.unidades.update((list) =>
        list.map((u) =>
          u.placa === placaResuelta && u.estado === 'ALERTA' ? { ...u, estado: 'ACTIVO' } : u,
        ),
      );
    }
    if (alerta) {
      // El conductor ve que la central ya atendió su alerta
      this.canal?.postMessage({
        tipo: 'resuelta',
        bus: alerta.bus,
        creadaEn: alerta.creadaEn,
        resueltaEn: ahora,
      });
    }
    if (id > 0) {
      this.http
        .patch(`${this.baseUrl}/alerts/${id}/resolve`, {})
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  // ---------- Sincronización entre pestañas ----------

  private recibir(msg: any) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.tipo) {
      case 'hola':
        if (this.alertas().length)
          this.canal?.postMessage({ tipo: 'estado', alertas: this.alertas() });
        break;
      case 'estado':
        for (const a of msg.alertas as AlertaTrack[]) this.agregarAlertaExterna(a);
        break;
      case 'alerta':
        this.agregarAlertaExterna(msg.alerta as AlertaTrack);
        break;
      case 'alerta-id':
        this.alertas.update((list) =>
          list.map((a) =>
            a.bus === msg.bus && a.creadaEn === msg.creadaEn ? { ...a, id: msg.id } : a,
          ),
        );
        break;
      case 'resuelta':
        this.aplicarResolucion(msg.bus, msg.creadaEn, msg.resueltaEn);
        break;
      case 'posicion':
        this.externos.set(msg.placa, Date.now());
        this.unidades.update((list) =>
          list.map((u) => (u.placa === msg.placa ? { ...u, lat: msg.lat, lng: msg.lng } : u)),
        );
        break;
    }
  }

  private agregarAlertaExterna(a: AlertaTrack) {
    const existente = this.alertas().find((x) => x.bus === a.bus && x.creadaEn === a.creadaEn);
    if (existente) {
      if (a.resuelta && !existente.resuelta)
        this.aplicarResolucion(a.bus, a.creadaEn, a.resueltaEn ?? Date.now());
      return;
    }
    this.alertas.update((list) => [a, ...list].sort((x, y) => y.creadaEn - x.creadaEn));
    if (!a.resuelta) {
      this.unidades.update((list) =>
        list.map((u) => (u.placa === a.bus ? { ...u, estado: 'ALERTA' } : u)),
      );
    }
  }

  private aplicarResolucion(bus: string, creadaEn: number, resueltaEn: number) {
    this.alertas.update((list) =>
      list.map((a) =>
        a.bus === bus && a.creadaEn === creadaEn ? { ...a, resuelta: true, resueltaEn } : a,
      ),
    );
    const sigueAbierta = this.alertas().some((a) => a.bus === bus && !a.resuelta);
    if (!sigueAbierta) {
      this.unidades.update((list) =>
        list.map((u) =>
          u.placa === bus && u.estado === 'ALERTA' ? { ...u, estado: 'ACTIVO' } : u,
        ),
      );
    }
  }
}
