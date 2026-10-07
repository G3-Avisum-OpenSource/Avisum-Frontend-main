import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { MonitoringDataService } from '../../../application/monitoring-data.service';
import { ShiftTrackingService } from '../../../application/shift-tracking.service';
import { TurnosEnVivoService, TurnoEnVivo } from '../../../application/turnos-en-vivo.service';
import { UsersStateService } from '../../../../users/application/users-state.service';
import { AuthStateService } from '../../../../iam/application/auth-state.service';
import { FleetTrackingService } from '../../../../shared/infrastructure/fleet-tracking.service';
import { Driver } from '../../../../users/domain/model/driver.entity';
import { Turno } from '../../../domain/model/turno-historial.entity';
import { UnidadBus } from '../../../domain/model/unidad-bus.entity';

type Est = 'ACTIVO' | 'FINALIZADO' | 'NO_LABORABLE';
type Filtro = 'TODOS' | Est;

interface Fila {
  key: string;
  conductorId: number;
  busId: string;
  ruta: string;
  origen: string;
  destino: string;
  inicio: Date | null;
  fin: Date | null;
  seg: number;
  km: number;
  pax: number;
  fare: number;
  estado: Est;
}

/** Turno simulado de un conductor (solo para la demo). La unidad y la ruta se consultan al mostrar la fila. */
interface Sim {
  conductorId: number;
  estado: Est;
  inicio: number;
  fin: number | null;
  kmPerSec: number;
  paxEvery: number;
  farePerPax: number;
}

// Se conserva mientras no recargues la página, para que el reparto no cambie al navegar.
let rosterCache: Sim[] = [];
let rosterKey = '';

function buildRoster(conds: Driver[]): Sim[] {
  const now = Date.now();
  const idx = conds.map((_, i) => i).sort(() => Math.random() - 0.5);

  // Uno o dos conductores quedan fuera de ruta; el resto en ruta
  const fuera = new Map<number, Est>();
  const cuantos = conds.length > 2 ? (Math.random() < 0.5 ? 1 : 2) : 0;
  if (cuantos >= 1) fuera.set(idx[0], Math.random() < 0.5 ? 'FINALIZADO' : 'NO_LABORABLE');
  if (cuantos >= 2)
    fuera.set(idx[1], fuera.get(idx[0]) === 'FINALIZADO' ? 'NO_LABORABLE' : 'FINALIZADO');

  return conds.map((c, i) => {
    const estado = fuera.get(i) ?? 'ACTIVO';
    const duracionFinalizado = (2 + Math.random()) * 3600000; // 2 a 3 h
    const finalizadoHace = (10 + Math.random() * 50) * 60000; // 10 a 60 min
    const inicio =
      estado === 'ACTIVO'
        ? now - (25 + Math.random() * 95) * 60000
        : estado === 'FINALIZADO'
          ? now - finalizadoHace - duracionFinalizado
          : 0;
    return {
      conductorId: c.id,
      estado,
      inicio,
      fin: estado === 'FINALIZADO' ? now - finalizadoHace : null,
      kmPerSec: 0.0028 + Math.random() * 0.0012,
      paxEvery: 40 + Math.floor(Math.random() * 30),
      farePerPax: +(1.2 + Math.random() * 1.3).toFixed(2),
    };
  });
}

@Component({
  selector: 'app-shift-history',
  standalone: true,
  imports: [DecimalPipe, DatePipe, NgTemplateOutlet],
  template: ` <div class="sh-root">
    <div class="sh-top">
      <div>
        <h2 class="page-title">HISTORIAL DE TURNOS</h2>
        <p class="sh-live"><i></i> En vivo, se actualiza cada segundo</p>
      </div>
      <div class="sh-filters">
        <select
          #sel
          class="sh-select"
          aria-label="Filtrar por conductor"
          (change)="filtroConductor.set(+sel.value)"
        >
          <option value="0">Todos los conductores</option>
          @for (c of conductores(); track c.id) {
            <option [value]="c.id">{{ c.nombreCompleto }}</option>
          }
        </select>
        <div class="sh-seg" role="group" aria-label="Filtrar por estado">
          @for (e of estados; track e.id) {
            <button
              type="button"
              [class.on]="filtroEstado() === e.id"
              (click)="filtroEstado.set(e.id)"
            >
              {{ e.label }}
            </button>
          }
        </div>
      </div>
    </div>

    <div class="sh-totals">
      <div>
        <b>{{ totales().enRuta }}</b
        ><span>en ruta ahora</span>
      </div>
      <div>
        <b>{{ totales().km | number: '1.1-1' }}</b
        ><span>kilómetros hoy</span>
      </div>
      <div>
        <b>{{ totales().pasajeros }}</b
        ><span>pasajeros hoy</span>
      </div>
      <div>
        <b>S/ {{ totales().recaudacion | number: '1.2-2' }}</b
        ><span>recaudado hoy</span>
      </div>
    </div>

    <!-- Fila reutilizable -->
    <ng-template #rowTpl let-f>
      <div class="sh-row" [class.off]="f.estado === 'NO_LABORABLE'">
        <span class="sh-person">
          <i class="sh-ini">{{ iniciales(f.conductorId) }}</i>
          <span class="sh-name">{{ nombreConductor(f.conductorId) }}</span>
        </span>
        <span class="sh-plate">{{ f.estado === 'NO_LABORABLE' ? '—' : placaDe(f.busId) }}</span>
        <span class="sh-route">
          @if (f.estado === 'NO_LABORABLE') {
            <b>—</b>
          } @else {
            <b>{{ f.ruta }}</b>
            <small>{{ f.origen }} a {{ f.destino }}</small>
          }
        </span>
        <span class="sh-date">
          @if (f.inicio) {
            <b>{{ f.inicio | date: 'dd/MM/yyyy' }}</b>
            <small
              >{{ f.inicio | date: 'HH:mm' }} a
              {{ f.fin ? (f.fin | date: 'HH:mm') : 'ahora' }}</small
            >
          } @else {
            <b>Hoy</b><small>Sin turno asignado</small>
          }
        </span>
        <span class="sh-val">{{ f.estado === 'NO_LABORABLE' ? '—' : duracion(f.seg) }}</span>
        <span class="sh-val">{{
          f.estado === 'NO_LABORABLE' ? '—' : (f.km | number: '1.1-1')
        }}</span>
        <span class="sh-val">{{ f.estado === 'NO_LABORABLE' ? '—' : f.pax }}</span>
        <span class="sh-accent">{{
          f.estado === 'NO_LABORABLE' ? '—' : 'S/ ' + (f.fare | number: '1.2-2')
        }}</span>
        <span
          class="sh-chip"
          [class.live]="f.estado === 'ACTIVO'"
          [class.muted]="f.estado === 'NO_LABORABLE'"
        >
          {{
            f.estado === 'ACTIVO'
              ? 'En ruta'
              : f.estado === 'FINALIZADO'
                ? 'Finalizado'
                : 'No laborable'
          }}
        </span>
      </div>
    </ng-template>

    <!-- Hoy, en vivo -->
    <div class="sh-scroll">
      <div class="shift-table">
        <div class="sh-header">
          <span>CONDUCTOR</span><span>UNIDAD</span><span>RUTA</span><span>FECHA</span>
          <span>DURACIÓN</span><span>KM</span><span>PASAJ.</span><span>RECAUDADO</span
          ><span>ESTADO</span>
        </div>
        @for (f of vivo(); track f.key) {
          <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ $implicit: f }" />
        } @empty {
          <div class="sh-empty">
            <b>No hay conductores con estos filtros.</b>
            <span>Cambia el conductor o el estado para ver más.</span>
          </div>
        }
      </div>
    </div>

    <!-- Turnos anteriores (finalizados por los conductores) -->
    @if (anteriores().length) {
      <h3 class="sh-sub">Turnos anteriores</h3>
      <div class="sh-scroll">
        <div class="shift-table">
          @for (f of anteriores(); track f.key) {
            <ng-container
              [ngTemplateOutlet]="rowTpl"
              [ngTemplateOutletContext]="{ $implicit: f }"
            />
          }
        </div>
      </div>
    }
  </div>`,
  styles: [
    `
      .sh-root {
        padding: 20px;
      }
      .sh-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 18px;
      }
      .page-title {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 22px;
        color: var(--sb-white);
      }
      .sh-live {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--sb-gray);
      }
      .sh-live i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--sb-accent);
        animation: sh-pulse 1.6s ease-in-out infinite;
      }
      @keyframes sh-pulse {
        50% {
          opacity: 0.25;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .sh-live i {
          animation: none;
        }
      }

      .sh-filters {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }
      .sh-select {
        min-height: 40px;
        padding: 0 12px;
        font: inherit;
        font-size: 13px;
        color: var(--sb-white);
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border2);
        border-radius: 4px;
      }
      .sh-seg {
        display: flex;
        border: 1px solid var(--sb-border2);
        border-radius: 4px;
        overflow: hidden;
      }
      .sh-seg button {
        min-height: 40px;
        padding: 0 14px;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        color: var(--sb-gray);
        background: transparent;
        border: none;
      }
      .sh-seg button.on {
        color: #000;
        background: var(--sb-accent);
      }
      .sh-select:focus-visible,
      .sh-seg button:focus-visible {
        outline: 2px solid var(--sb-accent);
        outline-offset: 2px;
      }

      .sh-totals {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 14px;
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border);
      }
      .sh-totals div {
        flex: 1;
        min-width: 140px;
        padding: 14px 18px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-right: 1px solid var(--sb-border);
      }
      .sh-totals div:last-child {
        border-right: none;
      }
      .sh-totals b {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 26px;
        color: var(--sb-accent);
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .sh-totals span {
        font-size: 12px;
        color: var(--sb-gray);
      }

      .sh-sub {
        margin: 26px 0 10px;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 16px;
        color: var(--sb-white);
      }

      .sh-scroll {
        overflow-x: auto;
      }
      .shift-table {
        min-width: 1020px;
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border);
      }
      .sh-header,
      .sh-row {
        display: grid;
        grid-template-columns: 2.2fr 1fr 1.8fr 1.3fr 0.9fr 0.7fr 0.7fr 1fr 1.1fr;
        padding: 12px 16px;
        border-bottom: 1px solid var(--sb-border);
        align-items: center;
        gap: 10px;
      }
      .sh-header {
        background: var(--sb-bg-card2);
      }
      .sh-header span {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 10px;
        letter-spacing: 0.15em;
        color: var(--sb-gray);
      }
      .sh-row:hover {
        background: var(--sb-bg-card2);
      }
      .sh-row.off {
        opacity: 0.6;
      }

      .sh-person {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .sh-ini {
        flex: none;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        font-style: normal;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 13px;
        color: var(--sb-accent);
        background: var(--sb-bg-card2);
        border: 1px solid var(--sb-border2);
      }
      .sh-name {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 14px;
        color: var(--sb-white);
      }
      .sh-plate {
        font-family: 'Share Tech Mono', monospace;
        font-size: 13px;
        color: var(--sb-white);
      }
      .sh-route,
      .sh-date {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .sh-route b,
      .sh-date b {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 14px;
        color: var(--sb-white);
      }
      .sh-route small,
      .sh-date small {
        font-size: 11px;
        color: var(--sb-gray);
      }
      .sh-val {
        font-family: 'Share Tech Mono', monospace;
        font-size: 13px;
        color: var(--sb-white);
        font-variant-numeric: tabular-nums;
      }
      .sh-accent {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 15px;
        color: var(--sb-accent);
        font-variant-numeric: tabular-nums;
      }

      .sh-chip {
        justify-self: start;
        padding: 3px 10px;
        font-size: 12px;
        font-weight: 700;
        color: var(--sb-accent);
        border: 1px solid var(--sb-accent);
      }
      .sh-chip.live {
        color: #000;
        background: var(--sb-accent);
      }
      .sh-chip.muted {
        color: var(--sb-gray);
        border-color: var(--sb-border2);
      }

      .sh-empty {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 40px 16px;
        text-align: center;
        color: var(--sb-gray);
        font-size: 13px;
      }
      .sh-empty b {
        color: var(--sb-white);
        font-size: 15px;
      }
    `,
  ],
})
export class ShiftHistory {
  private svc = inject(MonitoringDataService);
  private users = inject(UsersStateService);
  private auth = inject(AuthStateService);
  private shift = inject(ShiftTrackingService);
  private remotos = inject(TurnosEnVivoService);
  private fleet = inject(FleetTrackingService);

  readonly historial = toSignal(this.svc.getHistorial(), { initialValue: [] as Turno[] });
  readonly unidades = toSignal(this.svc.getUnidades(), { initialValue: [] as UnidadBus[] });

  readonly conductores = this.users.conductores;
  readonly filtroConductor = signal(0);
  readonly filtroEstado = signal<Filtro>('TODOS');
  readonly estados: { id: Filtro; label: string }[] = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'ACTIVO', label: 'En ruta' },
    { id: 'FINALIZADO', label: 'Finalizados' },
    { id: 'NO_LABORABLE', label: 'No laborable' },
  ];

  private tick = signal(0);

  constructor() {
    const timer = setInterval(() => this.tick.update((v) => v + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Reparto simulado de hoy: se rehace solo si cambia la lista de conductores activos. */
  private rosterActual(): Sim[] {
    const activos = this.conductores().filter((c) => c.estado === 'ACTIVO');
    const key = activos.map((c) => c.id).join(',');
    if (key !== rosterKey) {
      rosterCache = buildRoster(activos);
      rosterKey = key;
    }
    return rosterCache;
  }

  /** Ruta de la unidad que maneja ese conductor (la lee de la flota, que viene de la API). */
  private rutaDe(c: Driver): string {
    return this.fleet.unidades().find((u) => u.placa === c.placa)?.ruta ?? 'R-42';
  }

  private filaSim(s: Sim, now: number): Fila {
    const c = this.conductor(s.conductorId);
    const base = {
      key: `v${s.conductorId}`,
      conductorId: s.conductorId,
      busId: c?.placa ?? '',
      ruta: c ? this.rutaDe(c) : 'R-42',
      origen: 'Terminal Norte',
      destino: 'Estación Central',
      estado: s.estado,
    };
    if (s.estado === 'NO_LABORABLE') {
      return { ...base, inicio: null, fin: null, seg: 0, km: 0, pax: 0, fare: 0 };
    }
    const fin = s.fin ?? now;
    const seg = Math.max(0, Math.floor((fin - s.inicio) / 1000));
    const pax = Math.floor(seg / s.paxEvery);
    return {
      ...base,
      inicio: new Date(s.inicio),
      fin: s.fin ? new Date(s.fin) : null,
      seg,
      km: seg * s.kmPerSec,
      pax,
      fare: pax * s.farePerPax,
    };
  }

  /** Fila del conductor que tiene la sesión abierta en esta pestaña: usa sus datos reales. */
  private filaReal(c: Driver, now: number): Fila {
    const seg = this.shift.tiempoSegundos();
    return {
      key: `v${c.id}`,
      conductorId: c.id,
      busId: c.placa,
      ruta: this.rutaDe(c),
      origen: 'Terminal Norte',
      destino: 'Estación Central',
      estado: 'ACTIVO',
      inicio: new Date(now - seg * 1000),
      fin: null,
      seg,
      km: this.shift.distanciaKm(),
      pax: this.shift.pasajeros(),
      fare: this.shift.recaudacion(),
    };
  }

  /** Turno real de un conductor que tiene su sesión abierta en otra pestaña. */
  private filaRemota(s: Sim, r: TurnoEnVivo, activo: boolean): Fila {
    const c = this.conductor(s.conductorId);
    return {
      key: `v${s.conductorId}`,
      conductorId: s.conductorId,
      busId: r.placa,
      ruta: c ? this.rutaDe(c) : 'R-42',
      origen: 'Terminal Norte',
      destino: 'Estación Central',
      inicio: new Date(r.inicio),
      fin: r.fin ? new Date(r.fin) : null,
      seg: r.seg,
      km: r.km,
      pax: r.pax,
      fare: r.fare,
      estado: activo ? 'ACTIVO' : 'FINALIZADO',
    };
  }

  /** Tablero de hoy: un renglón por conductor, en vivo. */
  readonly vivo = computed<Fila[]>(() => {
    this.tick();
    const now = Date.now();
    const real = this.auth.conductorActual();
    const realEnRuta = !!real && this.shift.turnoActivo();
    const cond = this.filtroConductor();
    const est = this.filtroEstado();
    const orden: Record<Est, number> = { ACTIVO: 0, FINALIZADO: 1, NO_LABORABLE: 2 };

    return this.rosterActual()
      .map((s) => {
        if (realEnRuta && real && s.conductorId === real.id) return this.filaReal(real, now);
        const r = this.remotos.turnos()[s.conductorId];
        if (r) {
          const enRuta = r.fin === null && now - r.visto < 5000; // si dejó de avisar, se descarta
          if (enRuta || r.fin !== null) return this.filaRemota(s, r, enRuta);
        }
        return this.filaSim(s, now);
      })
      .filter(
        (f) => (cond === 0 || f.conductorId === cond) && (est === 'TODOS' || f.estado === est),
      )
      .sort((a, b) => orden[a.estado] - orden[b.estado]);
  });

  /** Turnos que los conductores ya finalizaron (guardados). */
  readonly anteriores = computed<Fila[]>(() => {
    const cond = this.filtroConductor();
    return this.historial()
      .filter((t) => t.estado === 'FINALIZADO' && (cond === 0 || t.conductorId === cond))
      .sort((a, b) => b.fechaInicio.getTime() - a.fechaInicio.getTime())
      .map((t) => ({
        key: `h${t.id}`,
        conductorId: t.conductorId,
        busId: t.busId,
        ruta: t.rutaNombre,
        origen: t.rutaOrigen,
        destino: t.rutaDestino,
        inicio: t.fechaInicio,
        fin: t.fechaFin,
        seg: t.tiempoSegundos,
        km: t.distanciaKm,
        pax: t.pasajeros,
        fare: t.recaudacion,
        estado: 'FINALIZADO' as Est,
      }));
  });

  readonly totales = computed(() => {
    const list = this.vivo();
    return {
      enRuta: list.filter((f) => f.estado === 'ACTIVO').length,
      km: list.reduce((s, f) => s + f.km, 0),
      pasajeros: list.reduce((s, f) => s + f.pax, 0),
      recaudacion: list.reduce((s, f) => s + f.fare, 0),
    };
  });

  private conductor(id: number) {
    return this.conductores().find((c) => c.id === id);
  }
  nombreConductor(id: number): string {
    return this.conductor(id)?.nombreCompleto ?? 'Conductor eliminado';
  }
  iniciales(id: number): string {
    const c = this.conductor(id);
    return c ? `${c.nombre[0] ?? ''}${c.apellido[0] ?? ''}`.toUpperCase() : '?';
  }
  placaDe(busId: string): string {
    return this.unidades().find((u) => String(u.id) === busId)?.placa ?? busId;
  }
  duracion(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h} h ${m} min` : `${m} min ${s % 60} s`;
  }
}
