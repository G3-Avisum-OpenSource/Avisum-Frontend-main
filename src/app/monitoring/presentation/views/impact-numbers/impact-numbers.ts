import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MonitoringDataService } from '../../../application/monitoring-data.service';
import { FleetTrackingService } from '../../../../shared/infrastructure/fleet-tracking.service';
import { UsersStateService } from '../../../../users/application/users-state.service';
import { Turno } from '../../../domain/model/turno-historial.entity';

type Metrica = 'km' | 'pasajeros' | 'recaudado';

const TIPOS = [
  { tipo: 'PÁNICO', label: 'Pánico' },
  { tipo: 'VELOCIDAD', label: 'Exceso de velocidad' },
  { tipo: 'DESVÍO', label: 'Desvío de ruta' },
];

@Component({
  selector: 'app-impact-numbers',
  standalone: true,
  imports: [MatIconModule],
  template: ` <div class="im-root">
    <h2 class="page-title">MÉTRICAS DE OPERACIÓN</h2>
    <p class="im-sub">Cifras calculados con los datos del sistema</p>

    <div class="kpi-grid">
      @for (k of kpis(); track k.label) {
        <div class="impact-card">
          <mat-icon [style.color]="k.color">{{ k.icon }}</mat-icon>
          <span class="impact-val" [style.color]="k.color">{{ k.value }}</span>
          <span class="impact-label">{{ k.label }}</span>
          <span class="impact-desc">{{ k.desc }}</span>
        </div>
      }
    </div>

    <div class="im-grid">
      <section class="im-card">
        <div class="im-card-head">
          <h3>Comparación entre unidades</h3>
          <div class="im-seg" role="group" aria-label="Métrica a comparar">
            @for (m of metricas; track m.id) {
              <button type="button" [class.on]="metrica() === m.id" (click)="metrica.set(m.id)">
                {{ m.label }}
              </button>
            }
          </div>
        </div>

        @if (finalizados().length === 0) {
          <p class="im-empty">
            Aún no hay turnos finalizados. Cuando un conductor finalice su servicio, aparecerá aquí.
          </p>
        } @else {
          <ul class="im-rows">
            @for (f of comparacion(); track f.id) {
              <li>
                <span class="im-plate">{{ f.placa }}</span>
                <span class="im-name">{{ f.nombre }}</span>
                <span class="im-track"><i [style.width.%]="f.pct"></i></span>
                <b class="im-num">{{ formato(f.valor) }}</b>
              </li>
            }
          </ul>
        }
      </section>

      <section class="im-card">
        <div class="im-card-head"><h3>Alertas por tipo</h3></div>

        @if (alertas().length === 0) {
          <p class="im-empty">
            Aún no hay alertas. Aparecen cuando un conductor activa el pánico o el sistema detecta
            exceso de velocidad o desvíos.
          </p>
        } @else {
          <ul class="im-rows type">
            @for (t of porTipo(); track t.tipo) {
              <li>
                <span class="im-name">{{ t.label }}</span>
                <span class="im-track" [class.red]="t.tipo === 'PÁNICO'"
                  ><i [style.width.%]="t.pct"></i
                ></span>
                <b class="im-num">{{ t.n }}</b>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  </div>`,
  styles: [
    `
      .im-root {
        padding: 20px;
      }
      .page-title {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 22px;
        color: var(--sb-white);
      }
      .im-sub {
        margin: 6px 0 20px;
        font-size: 12px;
        color: var(--sb-gray);
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .impact-card {
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border);
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .impact-card mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .impact-val {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 36px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .impact-label {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.12em;
        color: var(--sb-white);
        text-transform: uppercase;
      }
      .impact-desc {
        font-size: 12px;
        color: var(--sb-gray);
        line-height: 1.4;
      }

      .im-grid {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 12px;
      }
      .im-card {
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border);
        padding: 20px 22px;
      }
      .im-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }
      .im-card-head h3 {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 16px;
        color: var(--sb-white);
      }

      .im-seg {
        display: flex;
        border: 1px solid var(--sb-border2);
        border-radius: 4px;
        overflow: hidden;
      }
      .im-seg button {
        min-height: 36px;
        padding: 0 12px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        color: var(--sb-gray);
        background: transparent;
        border: none;
      }
      .im-seg button.on {
        color: #000;
        background: var(--sb-accent);
      }
      .im-seg button:focus-visible {
        outline: 2px solid var(--sb-accent);
        outline-offset: -2px;
      }

      .im-rows {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .im-rows li {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr) 2fr 84px;
        align-items: center;
        gap: 12px;
      }
      .im-rows.type li {
        grid-template-columns: minmax(0, 1.2fr) 2fr 36px;
      }
      .im-plate {
        font-family: 'Share Tech Mono', monospace;
        font-size: 13px;
        color: var(--sb-white);
      }
      .im-name {
        font-size: 13px;
        color: var(--sb-gray);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .im-track {
        height: 10px;
        background: var(--sb-bg-card2);
      }
      .im-track i {
        display: block;
        height: 100%;
        min-width: 2px;
        background: var(--sb-accent);
        transition: width 0.3s;
      }
      .im-track.red i {
        background: var(--sb-red);
      }
      .im-num {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 15px;
        color: var(--sb-white);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .im-empty {
        margin: 0;
        padding: 24px 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--sb-gray);
      }

      @media (max-width: 900px) {
        .im-grid {
          grid-template-columns: 1fr;
        }
        .im-rows li {
          grid-template-columns: 80px 1fr 70px;
        }
        .im-rows li .im-name {
          display: none;
        }
      }
    `,
  ],
})
export class ImpactNumbers {
  private svc = inject(MonitoringDataService);
  private fleet = inject(FleetTrackingService);
  private users = inject(UsersStateService);

  readonly turnos = toSignal(this.svc.getHistorial(), { initialValue: [] as Turno[] });
  readonly alertas = this.fleet.alertas;

  readonly metricas: { id: Metrica; label: string }[] = [
    { id: 'km', label: 'Kilómetros' },
    { id: 'pasajeros', label: 'Pasajeros' },
    { id: 'recaudado', label: 'Recaudado' },
  ];
  readonly metrica = signal<Metrica>('km');

  readonly finalizados = computed(() => this.turnos().filter((t) => t.estado === 'FINALIZADO'));

  private duracion(ms: number): string {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
  }

  readonly kpis = computed(() => {
    const conductores = this.users.conductores();
    const activos = conductores.filter((c) => c.estado === 'ACTIVO').length;

    const unidades = this.fleet.unidades();
    const enRuta = unidades.filter((u) => u.estado !== 'INACTIVO').length;

    const alertas = this.alertas();
    const sinResolver = alertas.filter((a) => !a.resuelta).length;
    const resueltas = alertas.filter((a) => a.resuelta);
    const conTiempo = resueltas.filter((a) => a.resueltaEn !== null);
    const promedio = conTiempo.length
      ? conTiempo.reduce((s, a) => s + ((a.resueltaEn as number) - a.creadaEn), 0) /
        conTiempo.length
      : null;

    const fin = this.finalizados();
    const km = fin.reduce((s, t) => s + t.distanciaKm, 0);
    const pax = fin.reduce((s, t) => s + t.pasajeros, 0);

    return [
      {
        icon: 'people',
        color: 'var(--sb-accent)',
        label: 'Conductores activos',
        value: String(activos),
        desc: `de ${conductores.length} registrados`,
      },
      {
        icon: 'directions_bus',
        color: 'var(--sb-accent)',
        label: 'Unidades en ruta',
        value: String(enRuta),
        desc: `de ${unidades.length} unidades monitoreadas`,
      },
      {
        icon: 'warning',
        color: sinResolver > 0 ? 'var(--sb-red)' : 'var(--sb-accent)',
        label: 'Alertas activas',
        value: String(sinResolver),
        desc: sinResolver > 0 ? 'Pendientes de resolución' : 'Ninguna pendiente',
      },
      {
        icon: 'timer',
        color: 'var(--sb-accent)',
        label: 'Tiempo de respuesta',
        value: promedio === null ? '—' : this.duracion(promedio),
        desc:
          promedio === null
            ? 'Aún no hay alertas resueltas'
            : `Promedio en ${conTiempo.length} alerta(s) resuelta(s)`,
      },
      {
        icon: 'task_alt',
        color: 'var(--sb-accent)',
        label: 'Alertas resueltas',
        value: alertas.length ? `${Math.round((resueltas.length / alertas.length) * 100)}%` : '—',
        desc: alertas.length
          ? `${resueltas.length} de ${alertas.length} generadas`
          : 'Aún no hay alertas',
      },
      {
        icon: 'history',
        color: 'var(--sb-accent)',
        label: 'Turnos finalizados',
        value: String(fin.length),
        desc: `${km.toFixed(1)} km y ${pax} pasajeros acumulados`,
      },
    ];
  });

  /** Un renglón por conductor, con lo acumulado en sus turnos finalizados. */
  readonly comparacion = computed(() => {
    const m = this.metrica();
    const fin = this.finalizados();
    const filas = this.users
      .conductores()
      .map((c) => {
        const suyos = fin.filter((t) => t.conductorId === c.id);
        const valor =
          m === 'km'
            ? suyos.reduce((s, t) => s + t.distanciaKm, 0)
            : m === 'pasajeros'
              ? suyos.reduce((s, t) => s + t.pasajeros, 0)
              : suyos.reduce((s, t) => s + t.recaudacion, 0);
        return { id: c.id, placa: c.placa, nombre: c.nombre, valor };
      })
      .sort((a, b) => b.valor - a.valor);

    const max = Math.max(0, ...filas.map((f) => f.valor));
    return filas.map((f) => ({ ...f, pct: max > 0 ? (f.valor / max) * 100 : 0 }));
  });

  readonly porTipo = computed(() => {
    const lista = this.alertas();
    const filas = TIPOS.map((t) => ({ ...t, n: lista.filter((a) => a.tipo === t.tipo).length }));
    const max = Math.max(0, ...filas.map((f) => f.n));
    return filas.map((f) => ({ ...f, pct: max > 0 ? (f.n / max) * 100 : 0 }));
  });

  formato(v: number): string {
    const m = this.metrica();
    if (m === 'km') return `${v.toFixed(1)} km`;
    if (m === 'recaudado') return `S/ ${v.toFixed(2)}`;
    return String(v);
  }
}
