import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AdminSessionService } from '../../../application/admin-session.service';
import { ADMIN_FIJO } from '../../../application/admin-config';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [MatIconModule],
  template: ` <main class="al-root">
    <form class="al-card" novalidate (submit)="entrar($event)">
      <span class="al-brand">Avisum</span>
      <span class="al-role">ADMINISTRADOR</span>

      <h1 class="al-title">Panel de administración</h1>
      <p class="al-sub">
        Ingresa tu código de administrador para gestionar conductores, unidades y alertas.
      </p>

      <div class="al-field">
        <label for="al-code">Código de administrador</label>
        <div class="al-input">
          <mat-icon>badge</mat-icon>
          <input
            id="al-code"
            placeholder="ADMIN-001"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            [value]="codigo()"
            (input)="codigo.set($any($event.target).value)"
            [attr.aria-invalid]="!!error()"
          />
        </div>
      </div>

      @if (error()) {
        <p class="al-error" role="alert"><mat-icon>error</mat-icon> {{ error() }}</p>
      }

      <button type="submit" class="al-btn">Ingresar</button>
    </form>
  </main>`,
  styles: [
    `
      .al-root {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: var(--sb-bg, #0a0a0a);
      }
      .al-card {
        width: 100%;
        max-width: 420px;
        padding: 36px 32px 32px;
        background: var(--sb-bg-card, #111);
        border: 1px solid var(--sb-border2, #2a2a2a);
        border-top: 3px solid var(--sb-red, #e8002a);
      }
      .al-brand {
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 900;
        font-size: 30px;
        color: var(--sb-accent, #b5f000);
      }
      .al-role {
        margin-left: 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--sb-red, #e8002a);
      }
      .al-title {
        margin: 22px 0 6px;
        font-family: 'Barlow Condensed', sans-serif;
        font-weight: 800;
        font-size: 26px;
        color: var(--sb-white, #f0f0f0);
      }
      .al-sub {
        margin: 0 0 24px;
        font-size: 13px;
        line-height: 1.5;
        color: var(--sb-gray, #888);
      }
      .al-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }
      .al-field label {
        font-size: 12px;
        font-weight: 600;
        color: var(--sb-gray, #888);
      }
      .al-input {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        background: var(--sb-bg-card2, #1a1a1a);
        border: 1px solid var(--sb-border2, #2a2a2a);
        border-radius: 4px;
      }
      .al-input:focus-within {
        outline: 2px solid var(--sb-accent, #b5f000);
        outline-offset: 1px;
      }
      .al-input mat-icon {
        color: var(--sb-accent, #b5f000);
      }
      .al-input input {
        flex: 1;
        min-width: 0;
        min-height: 50px;
        font:
          400 17px 'Share Tech Mono',
          monospace;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--sb-white, #f0f0f0);
        background: transparent;
        border: none;
        outline: none;
      }
      .al-input input::placeholder {
        color: var(--sb-gray2, #555);
      }
      .al-input:has(input[aria-invalid='true']) {
        border-color: var(--sb-red, #e8002a);
      }
      .al-error {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        font-size: 13px;
        color: var(--sb-red, #e8002a);
      }
      .al-error mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .al-btn {
        width: 100%;
        min-height: 50px;
        font: inherit;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        color: #000;
        background: var(--sb-accent, #b5f000);
        border: none;
        border-radius: 4px;
      }
      .al-btn:focus-visible {
        outline: 2px solid var(--sb-white, #f0f0f0);
        outline-offset: 2px;
      }
    `,
  ],
})
export class AdminLogin {
  private router = inject(Router);
  private session = inject(AdminSessionService);

  readonly codigo = signal('');
  readonly error = signal('');

  constructor() {
    // Si ya hay una sesión de administrador abierta, va directo al panel
    if (this.session.admin()) this.router.navigate(['/admin/control-center']);
  }

  entrar(ev: Event) {
    ev.preventDefault();
    const codigo = this.codigo().trim().toUpperCase(); // acepta admin-001, ADMIN-001, " Admin-001 "
    if (!codigo) {
      this.error.set('Escribe tu código de administrador.');
      return;
    }
    if (codigo !== ADMIN_FIJO.adminCode) {
      this.error.set('Código inválido. Revisa que sea tu código de administrador.');
      return;
    }
    this.session.iniciar(ADMIN_FIJO);
    this.router.navigate(['/admin/control-center']);
  }
}
