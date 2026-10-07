import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  DestinatariosService,
  TIPOS_DESTINATARIO,
  TipoDestinatario,
  iconoDe,
} from '../../../application/destinatarios.service';
import { FleetTrackingService } from '../../../../shared/infrastructure/fleet-tracking.service';

const TITULOS: Record<string, string> = {
  PÁNICO: 'Alerta de pánico',
  VELOCIDAD: 'Exceso de velocidad',
  DESVÍO: 'Desvío de ruta',
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [MatIconModule],
  template: ` <div class="nt-root">
    <h2 class="page-title">NOTIFICACIONES</h2>
    <p class="nt-sub">
      Cuando se genera una alerta, el sistema avisa a los destinatarios que estén activos.
    </p>

    <div class="nt-grid">
      <!-- Destinatarios -->
      <section class="nt-card">
        <div class="nt-head">
          <h3>Destinatarios</h3>
          <button type="button" class="nt-add" (click)="abrirForm()">
            <mat-icon>add</mat-icon> Agregar
          </button>
        </div>

        @if (formAbierto()) {
          <form class="nt-form" novalidate (submit)="guardar($event)">
            <div class="nt-field">
              <label for="n-nombre">Nombre</label>
              <input
                id="n-nombre"
                [value]="nombre()"
                (input)="nombre.set($any($event.target).value)"
                [attr.aria-invalid]="!!errores().nombre"
                autocomplete="off"
              />
              @if (errores().nombre) {
                <small class="nt-err">{{ errores().nombre }}</small>
              }
            </div>
            <div class="nt-field">
              <label for="n-tipo">Tipo</label>
              <select id="n-tipo" (change)="tipo.set($any($event.target).value)">
                @for (t of tipos; track t) {
                  <option [value]="t" [selected]="tipo() === t">{{ t }}</option>
                }
              </select>
            </div>
            <div class="nt-field">
              <label for="n-contacto">Teléfono o correo</label>
              <input
                id="n-contacto"
                [value]="contacto()"
                (input)="contacto.set($any($event.target).value)"
                [attr.aria-invalid]="!!errores().contacto"
                autocomplete="off"
              />
              @if (errores().contacto) {
                <small class="nt-err">{{ errores().contacto }}</small>
              }
            </div>
            <div class="nt-form-actions">
              <button type="button" class="nt-btn ghost" (click)="cerrarForm()">Cancelar</button>
              <button type="submit" class="nt-btn primary">Guardar</button>
            </div>
          </form>
        }

        @for (r of lista(); track r.id) {
          <div class="nt-row" [class.off]="!r.activo">
            <mat-icon class="nt-ico">{{ icono(r.tipo) }}</mat-icon>
            <div class="nt-info">
              <p class="nt-name">{{ r.nombre }}</p>
              <p class="nt-meta">{{ r.tipo }}, {{ r.contacto }}</p>
            </div>
            <button
              type="button"
              class="nt-sw"
              role="switch"
              [attr.aria-checked]="r.activo"
              [attr.aria-label]="'Notificar a ' + r.nombre"
              (click)="alternar(r.id)"
            >
              <i></i>
            </button>
            <button
              type="button"
              class="nt-del"
              [class.sure]="confirmando() === r.id"
              [title]="confirmando() === r.id ? 'Toca de nuevo para eliminar' : 'Eliminar'"
              [attr.aria-label]="'Eliminar ' + r.nombre"
              (click)="pedirEliminar(r.id)"
            >
              <mat-icon>{{ confirmando() === r.id ? 'check' : 'delete' }}</mat-icon>
            </button>
          </div>
        } @empty {
          <p class="nt-empty">No hay destinatarios. Agrega uno para que reciba las alertas.</p>
        }
      </section>

      <!-- Registro de entregas -->
      <section class="nt-card">
        <div class="nt-head">
          <h3>Registro de entregas</h3>
          <span class="nt-count">{{ registro().length }} alerta(s)</span>
        </div>

        @for (a of registro(); track a.id) {
          <div class="nt-log">
            <div class="nt-log-top">
              <i class="nt-dot" [class.red]="a.tipo === 'PÁNICO'"></i>
              <div class="nt-log-text">
                <p class="nt-msg">{{ a.titulo }}, {{ a.bus }}</p>
                <p class="nt-meta">{{ a.hora }}, {{ a.conductor }}</p>
              </div>
              <span class="nt-state" [class.done]="a.resuelta">{{
                a.resuelta ? 'Resuelta' : 'Abierta'
              }}</span>
            </div>

            @if (a.entregas.length === 0) {
              <p class="nt-warn">
                <mat-icon>warning</mat-icon> No había destinatarios activos. Nadie fue notificado.
              </p>
            } @else {
              <ul class="nt-chips">
                @for (e of a.entregas; track e.nombre) {
                  <li [class.ok]="e.ok">
                    <mat-icon>{{ e.ok ? 'check_circle' : 'schedule' }}</mat-icon>
                    {{ e.nombre }}
                  </li>
                }
              </ul>
            }
          </div>
        } @empty {
          <p class="nt-empty">
            Aún no hay alertas. Cuando se genere una, aquí verás a quién se notificó y si llegó.
          </p>
        }
      </section>
    </div>
  </div>`,
  styles: [
    `
      .nt-root {
        padding: 20px;
      }
      .page-title {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 22px;
        color: var(--sb-white);
      }
      .nt-sub {
        margin: 6px 0 20px;
        font-size: 12px;
        color: var(--sb-gray);
      }
      .nt-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: start;
      }
      .nt-card {
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border);
        padding: 20px 22px;
      }
      .nt-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .nt-head h3 {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 16px;
        color: var(--sb-white);
      }
      .nt-count {
        font-size: 12px;
        color: var(--sb-gray);
      }

      .nt-add {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 14px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        color: #000;
        background: var(--sb-accent);
        border: none;
      }
      .nt-add mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .nt-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 14px;
        padding: 14px;
        background: var(--sb-bg-card2);
        border: 1px dashed var(--sb-border2);
      }
      .nt-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .nt-field label {
        font-size: 12px;
        font-weight: 600;
        color: var(--sb-gray);
      }
      .nt-field input,
      .nt-field select {
        min-height: 42px;
        padding: 0 12px;
        font: inherit;
        font-size: 14px;
        color: var(--sb-white);
        background: var(--sb-bg-card);
        border: 1px solid var(--sb-border2);
        border-radius: 4px;
      }
      .nt-field input[aria-invalid='true'] {
        border-color: var(--sb-red);
      }
      .nt-err {
        font-size: 12px;
        color: var(--sb-red);
      }
      .nt-form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .nt-btn {
        min-height: 40px;
        padding: 0 18px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border-radius: 4px;
      }
      .nt-btn.ghost {
        color: var(--sb-white);
        background: transparent;
        border: 1px solid var(--sb-border2);
      }
      .nt-btn.primary {
        color: #000;
        background: var(--sb-accent);
        border: none;
      }

      .nt-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--sb-border);
      }
      .nt-row:last-child {
        border-bottom: none;
      }
      .nt-row.off .nt-info,
      .nt-row.off .nt-ico {
        opacity: 0.5;
      }
      .nt-ico {
        color: var(--sb-accent);
        font-size: 22px;
        width: 22px;
        height: 22px;
        flex: none;
      }
      .nt-info {
        flex: 1;
        min-width: 0;
      }
      .nt-name {
        margin: 0;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 700;
        font-size: 14px;
        color: var(--sb-white);
      }
      .nt-meta {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--sb-gray);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nt-sw {
        position: relative;
        flex: none;
        width: 44px;
        height: 24px;
        padding: 0;
        cursor: pointer;
        background: var(--sb-bg-card2);
        border: 1px solid var(--sb-border2);
        border-radius: 12px;
        transition: background 0.15s;
      }
      .nt-sw i {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--sb-gray);
        transition:
          transform 0.15s,
          background 0.15s;
      }
      .nt-sw[aria-checked='true'] {
        background: rgba(181, 240, 0, 0.2);
        border-color: var(--sb-accent);
      }
      .nt-sw[aria-checked='true'] i {
        transform: translateX(20px);
        background: var(--sb-accent);
      }
      .nt-sw:focus-visible,
      .nt-del:focus-visible,
      .nt-add:focus-visible {
        outline: 2px solid var(--sb-accent);
        outline-offset: 2px;
      }

      .nt-del {
        flex: none;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--sb-gray);
        background: var(--sb-bg-card2);
        border: 1px solid var(--sb-border);
      }
      .nt-del mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .nt-del:hover {
        color: var(--sb-red);
        border-color: var(--sb-red);
      }
      .nt-del.sure {
        color: #fff;
        background: var(--sb-red);
        border-color: var(--sb-red);
      }

      .nt-log {
        padding: 12px 0;
        border-bottom: 1px solid var(--sb-border);
      }
      .nt-log:last-child {
        border-bottom: none;
      }
      .nt-log-top {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .nt-dot {
        flex: none;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--sb-accent);
      }
      .nt-dot.red {
        background: var(--sb-red);
      }
      .nt-log-text {
        flex: 1;
        min-width: 0;
      }
      .nt-msg {
        margin: 0;
        font-size: 13px;
        color: var(--sb-white);
      }
      .nt-state {
        flex: none;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: 700;
        color: var(--sb-red);
        border: 1px solid var(--sb-red);
      }
      .nt-state.done {
        color: var(--sb-accent);
        border-color: var(--sb-accent);
      }
      .nt-chips {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 10px 0 0 21px;
        padding: 0;
      }
      .nt-chips li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 12px;
        color: var(--sb-gray);
        background: var(--sb-bg-card2);
        border: 1px solid var(--sb-border);
      }
      .nt-chips li mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }
      .nt-chips li.ok {
        color: var(--sb-white);
        border-color: var(--sb-border2);
      }
      .nt-chips li.ok mat-icon {
        color: var(--sb-accent);
      }
      .nt-warn {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 10px 0 0 21px;
        font-size: 12px;
        color: var(--sb-red);
      }
      .nt-warn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .nt-empty {
        margin: 0;
        padding: 24px 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--sb-gray);
      }

      @media (max-width: 900px) {
        .nt-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class Notifications {
  private dest = inject(DestinatariosService);
  private fleet = inject(FleetTrackingService);

  readonly lista = this.dest.lista;
  readonly tipos = TIPOS_DESTINATARIO;
  readonly icono = iconoDe;

  // Formulario
  readonly formAbierto = signal(false);
  readonly nombre = signal('');
  readonly tipo = signal<TipoDestinatario>('OPERACIONES');
  readonly contacto = signal('');
  readonly errores = signal<{ nombre?: string; contacto?: string }>({});

  // Confirmación de dos toques para eliminar
  readonly confirmando = signal<number | null>(null);
  private confirmTimer: ReturnType<typeof setTimeout> | null = null;

  // Reloj para que las entregas pasen de "pendiente" a "entregada"
  private tick = signal(0);

  constructor() {
    const t = setInterval(() => this.tick.update((v) => v + 1), 1000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(t);
      if (this.confirmTimer) clearTimeout(this.confirmTimer);
    });
  }

  readonly registro = computed(() => {
    this.tick();
    const ahora = Date.now();
    return this.fleet.alertas().map((a) => ({
      id: a.id,
      tipo: a.tipo,
      titulo: TITULOS[a.tipo] ?? a.tipo,
      bus: a.bus,
      conductor: a.conductor,
      hora: a.hora,
      resuelta: a.resuelta,
      // Cada destinatario recibe la alerta un poco después del anterior (simulado)
      entregas: (a.notificados ?? []).map((nombre, i) => ({
        nombre,
        ok: ahora - a.creadaEn > 1000 + i * 700,
      })),
    }));
  });

  abrirForm() {
    this.nombre.set('');
    this.tipo.set('OPERACIONES');
    this.contacto.set('');
    this.errores.set({});
    this.formAbierto.set(true);
  }

  cerrarForm() {
    this.formAbierto.set(false);
  }

  guardar(ev: Event) {
    ev.preventDefault();
    const errs: { nombre?: string; contacto?: string } = {};
    if (this.nombre().trim().length < 3) errs.nombre = 'Escribe el nombre del destinatario.';
    if (this.contacto().trim().length < 3) errs.contacto = 'Escribe un teléfono o un correo.';
    this.errores.set(errs);
    if (Object.keys(errs).length) return;

    this.dest.agregar({
      nombre: this.nombre().trim(),
      tipo: this.tipo(),
      contacto: this.contacto().trim(),
    });
    this.cerrarForm();
  }

  alternar(id: number) {
    this.dest.alternar(id);
  }

  pedirEliminar(id: number) {
    if (this.confirmando() === id) {
      this.dest.eliminar(id);
      this.confirmando.set(null);
      return;
    }
    this.confirmando.set(id);
    if (this.confirmTimer) clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => this.confirmando.set(null), 3000);
  }
}
