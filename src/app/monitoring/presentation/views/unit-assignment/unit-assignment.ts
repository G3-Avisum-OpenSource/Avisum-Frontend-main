import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Observable, forkJoin } from 'rxjs';
import { FleetTrackingService, UnidadTrack } from '../../../../shared/infrastructure/fleet-tracking.service';
import { UsersStateService, RUTAS } from '../../../../users/application/users-state.service';
import { Driver } from '../../../../users/domain/model/driver.entity';

@Component({
  selector: 'app-unit-assignment',
  standalone: true,
  imports: [MatIconModule],
  host: { '(document:keydown.escape)': 'cerrar()' },
  template: ` <div class="ua-root">
    <h2 class="page-title">ASIGNACIÓN DE UNIDADES</h2>
    <p class="ua-sub">
      {{ resumen().total }} unidades: {{ resumen().activas }} activas, {{ resumen().alerta }} en
      alerta, {{ resumen().inactivas }} inactivas
    </p>

    <div class="unit-grid">
      @for (u of unidades(); track u.id) {
        <div class="unit-card" [class.alert]="u.estado === 'ALERTA'">
          <div class="uc-top">
            <mat-icon [style.color]="estadoColor(u.estado)">directions_bus</mat-icon>
            <span class="uc-placa">{{ u.placa }}</span>
            <span class="uc-estado" [style.color]="estadoColor(u.estado)">{{
              etiqueta(u.estado)
            }}</span>
          </div>
          <p class="uc-conductor">{{ u.conductor }}</p>
          <p class="uc-ruta">
            Ruta: <strong>{{ u.ruta }}</strong>
          </p>
          <div class="uc-stats">
            <span><mat-icon>people</mat-icon> {{ u.pasajeros }}</span>
            <span><mat-icon>speed</mat-icon> {{ u.velocidad }} km/h</span>
          </div>
          <button type="button" class="uc-btn" [disabled]="!titular(u)" (click)="reasignar(u)">
            REASIGNAR
          </button>
        </div>
      } @empty {
        <p class="ua-empty">Cargando unidades…</p>
      }
    </div>

    <!-- Reasignar -->
    @if (editando(); as u) {
      <div class="ua-overlay" (click)="cerrar()">
        <form
          class="ua-modal"
          novalidate
          (click)="$event.stopPropagation()"
          (submit)="guardar($event)"
        >
          <h3 class="ua-title">Reasignar la unidad {{ u.placa }}</h3>

          <div class="ua-field">
            <label for="r-conductor">Conductor</label>
            <select id="r-conductor" (change)="conductorSel.set(+$any($event.target).value)">
              @for (c of activos(); track c.id) {
                <option [value]="c.id" [selected]="conductorSel() === c.id">
                  {{ c.nombreCompleto
                  }}{{ c.placa === u.placa ? ' (actual)' : ', maneja ' + c.placa }}
                </option>
              }
            </select>
            @if (cambiaConductor()) {
              <small class="ua-hint">Los dos conductores intercambian de unidad.</small>
            }
          </div>

          <div class="ua-field">
            <label for="r-ruta">Ruta</label>
            <select id="r-ruta" (change)="rutaSel.set($any($event.target).value)">
              @for (r of rutas; track r) {
                <option [value]="r" [selected]="rutaSel() === r">{{ r }}</option>
              }
            </select>
          </div>

          <div class="ua-actions">
            <button type="button" class="ua-btn ghost" (click)="cerrar()">Cancelar</button>
            <button type="submit" class="ua-btn primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    }

    @if (aviso(); as a) {
      <div class="ua-toast" role="status"><mat-icon>check_circle</mat-icon> {{ a }}</div>
    }
  </div>`,
  styles: [
    `
      .ua-root {
        padding: 20px;
      }
      .page-title {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 22px;
        color: var(--sb-white);
      }
      .ua-sub {
        margin: 6px 0 20px;
        font-size: 12px;
        color: var(--sb-gray);
      }
      .ua-empty {
        color: var(--sb-gray);
        font-size: 13px;
      }

      .unit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
      }
      .unit-card {
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border);
        padding: 16px;
      }
      .unit-card.alert {
        border-color: var(--sb-red);
      }
      .uc-top {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      .uc-top mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .uc-placa {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 15px;
        color: var(--sb-white);
        flex: 1;
      }
      .uc-estado {
        font-size: 12px;
        font-weight: 700;
      }
      .uc-conductor {
        margin: 0 0 4px;
        font-size: 13px;
        color: var(--sb-white);
      }
      .uc-ruta {
        margin: 0 0 10px;
        font-size: 12px;
        color: var(--sb-gray);
      }
      .uc-ruta strong {
        color: var(--sb-accent);
      }
      .uc-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }
      .uc-stats span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--sb-gray);
      }
      .uc-stats mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .uc-btn {
        width: 100%;
        min-height: 40px;
        background: transparent;
        border: 1px solid var(--sb-border2);
        color: var(--sb-white);
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: all 0.15s;
      }
      .uc-btn:hover:not(:disabled) {
        border-color: var(--sb-accent);
        color: var(--sb-accent);
      }
      .uc-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .uc-btn:focus-visible {
        outline: 2px solid var(--sb-accent);
        outline-offset: 2px;
      }

      .ua-overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.7);
      }
      .ua-modal {
        width: 100%;
        max-width: 460px;
        padding: 26px;
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border2);
        border-top: 3px solid var(--sb-accent);
      }
      .ua-title {
        margin: 0 0 18px;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 22px;
        color: var(--sb-white);
      }
      .ua-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }
      .ua-field label {
        font-size: 12px;
        font-weight: 600;
        color: var(--sb-gray);
      }
      .ua-field select {
        min-height: 44px;
        padding: 0 12px;
        font: inherit;
        font-size: 14px;
        color: var(--sb-white);
        background: var(--sb-bg-card2);
        border: 1px solid var(--sb-border2);
        border-radius: 4px;
      }
      .ua-field select:focus-visible {
        outline: 2px solid var(--sb-accent);
        outline-offset: 1px;
      }
      .ua-hint {
        font-size: 12px;
        color: var(--sb-accent);
      }
      .ua-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 22px;
      }
      .ua-btn {
        min-height: 44px;
        padding: 0 20px;
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        border-radius: 4px;
      }
      .ua-btn.ghost {
        color: var(--sb-white);
        background: transparent;
        border: 1px solid var(--sb-border2);
      }
      .ua-btn.primary {
        color: #000;
        background: var(--sb-accent);
        border: none;
      }

      .ua-toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        z-index: 60;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: calc(100vw - 32px);
        padding: 12px 18px;
        font-size: 14px;
        color: var(--sb-white);
        background: var(--sb-bg-card2);
        border: 1px solid var(--sb-accent);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }
      .ua-toast mat-icon {
        flex: none;
        color: var(--sb-accent);
      }
    `,
  ],
})
export class UnitAssignment {
  private fleet = inject(FleetTrackingService);
  private users = inject(UsersStateService);

  readonly unidades = this.fleet.unidades;
  readonly rutas = RUTAS;

  readonly resumen = computed(() => {
    const l = this.unidades();
    return {
      total: l.length,
      activas: l.filter((u) => u.estado === 'ACTIVO').length,
      alerta: l.filter((u) => u.estado === 'ALERTA').length,
      inactivas: l.filter((u) => u.estado === 'INACTIVO').length,
    };
  });

  readonly activos = computed(() => this.users.conductores().filter((c) => c.estado === 'ACTIVO'));

  readonly editando = signal<UnidadTrack | null>(null);
  readonly conductorSel = signal(0);
  readonly rutaSel = signal('');
  readonly aviso = signal('');
  private avisoTimer: ReturnType<typeof setTimeout> | null = null;

  /** Conductor que maneja esa unidad hoy. */
  titular(u: UnidadTrack): Driver | undefined {
    return this.users.conductores().find((c) => c.placa === u.placa);
  }

  readonly cambiaConductor = computed(() => {
    const u = this.editando();
    const t = u ? this.titular(u) : undefined;
    return !!t && this.conductorSel() !== t.id;
  });

  estadoColor(e: string) {
    return e === 'ACTIVO'
      ? 'var(--sb-accent)'
      : e === 'ALERTA'
        ? 'var(--sb-red)'
        : 'var(--sb-gray)';
  }
  etiqueta(e: string) {
    return e === 'ACTIVO' ? 'Activa' : e === 'ALERTA' ? 'En alerta' : 'Inactiva';
  }

  reasignar(u: UnidadTrack) {
    const t = this.titular(u);
    if (!t) return;
    this.conductorSel.set(t.id);
    this.rutaSel.set(u.ruta);
    this.editando.set(u);
  }

  cerrar() {
    this.editando.set(null);
  }

  guardar(ev: Event) {
    ev.preventDefault();
    const u = this.editando();
    if (!u) return;
    const actual = this.titular(u);
    if (!actual) {
      this.cerrar();
      return;
    }

    const nuevo = this.users.conductores().find((c) => c.id === this.conductorSel());
    const pasos: Observable<unknown>[] = [];
    const cambios: string[] = [];

    // 1) Cambio de conductor: los dos intercambian de unidad
    if (nuevo && nuevo.id !== actual.id) {
      pasos.push(this.users.intercambiarUnidades(actual.id, nuevo.id));
      cambios.push(
        `${nuevo.nombreCompleto} ahora maneja ${u.placa} y ${actual.nombreCompleto} pasa a ${nuevo.placa}`,
      );
    }

    // 2) Cambio de ruta de la unidad
    if (this.rutaSel() !== u.ruta) {
      pasos.push(this.users.cambiarRutaUnidad(u.placa, this.rutaSel()));
      cambios.push(`${u.placa} ahora hace la ruta ${this.rutaSel()}`);
    }

    if (!pasos.length) {
      this.cerrar();
      this.mostrarAviso('No hubo cambios.');
      return;
    }

    forkJoin(pasos).subscribe({
      next: () => {
        this.cerrar();
        this.mostrarAviso(cambios.join('. ') + '.');
      },
      error: () => {
        this.cerrar();
        this.mostrarAviso('No se pudo guardar. Revisa que el servidor esté encendido.');
      },
    });
  }

  private mostrarAviso(msg: string) {
    this.aviso.set(msg);
    if (this.avisoTimer) clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.set(''), 5000);
  }
}
