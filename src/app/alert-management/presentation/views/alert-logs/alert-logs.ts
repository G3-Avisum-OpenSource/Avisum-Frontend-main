import { Component, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { AuthStateService } from '../../../../iam/application/auth-state.service';
import { AlertStateService } from '../../../application/alert-state.service';

@Component({
  selector: 'app-alert-logs',
  standalone: true,
  imports: [MatIconModule, DecimalPipe],
  template: `
<div class="al-root">
  <div class="al-header">
    <h2 class="al-title">ALERT LOGS</h2>
    <p class="al-sub">Registro de alertas enviadas durante el servicio</p>
  </div>

  <div class="al-summary">
    <div class="sum-card">
      <mat-icon style="color:var(--sb-red)">emergency</mat-icon>
      <span class="sum-val" style="color:var(--sb-red)">{{ panicCount() }}</span>
      <span class="sb-label">PÁNICO</span>
    </div>
    <div class="sum-card">
      <mat-icon style="color:#ff6d00">speed</mat-icon>
      <span class="sum-val" style="color:#ff6d00">0</span>
      <span class="sb-label">VELOCIDAD</span>
    </div>
    <div class="sum-card">
      <mat-icon style="color:#f0a000">alt_route</mat-icon>
      <span class="sum-val" style="color:#f0a000">0</span>
      <span class="sb-label">DESVÍOS</span>
    </div>
    <div class="sum-card">
      <mat-icon style="color:var(--sb-accent)">people</mat-icon>
      <span class="sum-val" style="color:var(--sb-accent)">0</span>
      <span class="sb-label">PASAJEROS</span>
    </div>
  </div>

  <div class="sb-card al-table-card">
    <p class="section-label">HISTORIAL DE ALERTAS</p>
    @if (misAlertas().length === 0) {
      <div class="no-alerts">
        <mat-icon>check_circle</mat-icon>
        <p>Sin alertas registradas en este turno</p>
      </div>
    } @else {
      <div class="al-table">
        <div class="al-header-row">
          <span>NIVEL</span><span>TIPO</span><span>DESCRIPCIÓN</span>
          <span>HORA</span><span>COORDS</span><span>ESTADO</span>
        </div>
        @for (a of misAlertas(); track a.id) {
          <div class="al-row">
            <span class="nivel-badge" [style.color]="nivelColor(a.nivel)">{{ a.nivel }}</span>
            <span class="al-tipo">{{ a.tipo }}</span>
            <span class="al-desc">Alerta #{{ a.id }} — Unidad {{ a.bus }}</span>
            <span class="al-mono">{{ a.hora }}</span>
            <span class="al-mono">{{ a.lat | number:'1.4-4' }}, {{ a.lng | number:'1.4-4' }}</span>
            <span class="al-estado" [class.resuelta]="a.resuelta">{{ a.resuelta ? 'RESUELTA' : 'ACTIVA' }}</span>
          </div>
        }
      </div>
    }
  </div>
</div>`,
  styles: [`
.al-root { padding:20px; display:flex; flex-direction:column; gap:16px; height:calc(100vh - 48px); overflow-y:auto; }
.al-title { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:22px; color:var(--sb-white); }
.al-sub { font-size:12px; color:var(--sb-gray); margin-top:4px; }
.al-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.sum-card { background:var(--sb-bg-card); border:1px solid var(--sb-border); padding:20px 16px; display:flex; flex-direction:column; align-items:center; gap:8px; }
.sum-card mat-icon { font-size:28px; width:28px; height:28px; }
.sum-val { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:36px; line-height:1; }
.section-label { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; letter-spacing:0.2em; color:var(--sb-gray); text-transform:uppercase; margin-bottom:14px; }
.no-alerts { display:flex; flex-direction:column; align-items:center; gap:12px; padding:40px; color:var(--sb-accent); }
.no-alerts mat-icon { font-size:40px; width:40px; height:40px; }
.no-alerts p { font-size:13px; color:var(--sb-gray); }
.al-header-row,.al-row { display:grid; grid-template-columns:1fr 1fr 2fr 1.2fr 1.5fr 1fr; padding:8px 12px; border-bottom:1px solid var(--sb-border); gap:8px; align-items:center; }
.al-header-row { background:var(--sb-bg-card2); }
.al-header-row span { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:10px; letter-spacing:0.15em; color:var(--sb-gray); }
.nivel-badge { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:11px; }
.al-tipo { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:12px; color:var(--sb-white); }
.al-desc { font-size:11px; color:var(--sb-gray); }
.al-mono { font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--sb-gray); }
.al-estado { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:11px; color:var(--sb-red); }
.al-estado.resuelta { color:var(--sb-accent); }
`]
})
export class AlertLogs {
  private auth   = inject(AuthStateService);
  private alerts = inject(AlertStateService);

  misAlertas = computed(() => {
    const codigo = this.auth.conductorActual()?.codigoEmpleado;
    if (!codigo) return [];
    return this.alerts.alertas().filter(a => a.codigoEmpleado === codigo);
  });

  panicCount = computed(() => this.misAlertas().filter(a => a.tipo === 'PÁNICO').length);

  nivelColor(nivel: string): string {
    return nivel === 'CRITICO' ? 'var(--sb-red)' : nivel === 'ALTO' ? '#ff6d00' : nivel === 'MEDIO' ? '#f0a000' : 'var(--sb-gray)';
  }
}
