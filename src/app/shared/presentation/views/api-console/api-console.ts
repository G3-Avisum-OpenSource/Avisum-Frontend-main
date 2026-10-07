import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface ApiLog { method: string; endpoint: string; status: number; time: string; ts: string; }

@Component({
  selector: 'app-api-console',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
<div class="ac-root">
  <div class="ac-header">
    <h2 class="ac-title">API CONSOLE</h2>
    <p class="ac-sub">Avisum REST API — {{ baseUrl }}</p>
  </div>

  <div class="ac-grid">
    <!-- Endpoints panel -->
    <div class="sb-card endpoints-card">
      <p class="section-label">ENDPOINTS DISPONIBLES</p>
      @for (ep of endpoints(); track ep.path) {
        <div class="ep-row" (click)="selectEndpoint(ep)">
          <span class="method-badge" [class]="'method-' + ep.method.toLowerCase()">{{ ep.method }}</span>
          <div class="ep-info">
            <p class="ep-path">{{ ep.path }}</p>
            <p class="ep-desc">{{ ep.desc }}</p>
          </div>
          <mat-icon class="ep-arrow">chevron_right</mat-icon>
        </div>
      }
    </div>

    <!-- Request panel -->
    <div class="sb-card request-card">
      <p class="section-label">PETICIÓN</p>
      @if (selected()) {
        <div class="req-info">
          <span class="method-badge" [class]="'method-' + selected()!.method.toLowerCase()">{{ selected()!.method }}</span>
          <span class="req-path">{{ baseUrl }}{{ selected()!.path }}</span>
        </div>
        <button class="sb-btn-primary send-btn" (click)="sendRequest()">
          <mat-icon>send</mat-icon> ENVIAR PETICIÓN
        </button>
        @if (response()) {
          <div class="response-box">
            <div class="resp-header">
              <span class="resp-status" [class.ok]="respStatus() < 300">{{ respStatus() }}</span>
              <span class="resp-time">{{ respTime() }}ms</span>
            </div>
            <pre class="resp-body">{{ response() }}</pre>
          </div>
        }
      } @else {
        <div class="no-selection">
          <mat-icon>api</mat-icon>
          <p>Selecciona un endpoint para probar</p>
        </div>
      }
    </div>
  </div>

  <!-- Logs -->
  <div class="sb-card logs-card">
    <div class="logs-header">
      <p class="section-label">REQUEST LOG</p>
      <button class="clear-btn" (click)="logs.set([])">LIMPIAR</button>
    </div>
    @if (logs().length === 0) {
      <p class="no-data">Sin peticiones registradas.</p>
    }
    @for (log of logs(); track log.ts) {
      <div class="log-row">
        <span class="method-badge sm" [class]="'method-' + log.method.toLowerCase()">{{ log.method }}</span>
        <span class="log-ep">{{ log.endpoint }}</span>
        <span class="log-status" [class.ok]="log.status < 300">{{ log.status }}</span>
        <span class="log-time">{{ log.time }}ms</span>
        <span class="log-ts">{{ log.ts }}</span>
      </div>
    }
  </div>
</div>`,
  styles: [`
.ac-root { padding:20px; display:flex; flex-direction:column; gap:16px; height:calc(100vh - 48px); overflow-y:auto; }
.ac-title { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:22px; color:var(--sb-white); }
.ac-sub { font-size:12px; color:var(--sb-gray); margin-top:4px; font-family:'Share Tech Mono',monospace; }
.ac-grid { display:grid; grid-template-columns:1fr 1.2fr; gap:16px; }
.section-label { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; letter-spacing:0.2em; color:var(--sb-gray); text-transform:uppercase; margin-bottom:14px; }
.ep-row { display:flex; align-items:center; gap:12px; padding:10px 8px; border-bottom:1px solid var(--sb-border); cursor:pointer; transition:background 0.15s; }
.ep-row:hover { background:var(--sb-bg-card2); }
.ep-info { flex:1; }
.ep-path { font-family:'Share Tech Mono',monospace; font-size:12px; color:var(--sb-white); }
.ep-desc { font-size:11px; color:var(--sb-gray); margin-top:2px; }
.ep-arrow { font-size:18px; width:18px; height:18px; color:var(--sb-gray2); }
.method-badge { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:10px; letter-spacing:0.1em; padding:3px 8px; flex-shrink:0; }
.method-badge.sm { font-size:9px; padding:2px 6px; }
.method-get    { background:rgba(0,200,83,0.15); color:#00c853; border:1px solid #00c853; }
.method-post   { background:rgba(255,171,0,0.15); color:#ffab00; border:1px solid #ffab00; }
.method-put    { background:rgba(0,145,234,0.15); color:#0091ea; border:1px solid #0091ea; }
.method-delete { background:rgba(232,0,42,0.15);  color:var(--sb-red); border:1px solid var(--sb-red); }
.req-info { display:flex; align-items:center; gap:10px; margin-bottom:16px; padding:10px; background:var(--sb-bg-card2); border:1px solid var(--sb-border); }
.req-path { font-family:'Share Tech Mono',monospace; font-size:12px; color:var(--sb-white); }
.send-btn { margin-bottom:16px; }
.response-box { background:#050505; border:1px solid var(--sb-border2); padding:12px; }
.resp-header { display:flex; gap:12px; margin-bottom:8px; }
.resp-status { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:13px; color:var(--sb-red); }
.resp-status.ok { color:var(--sb-accent); }
.resp-time { font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--sb-gray); }
.resp-body { font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--sb-accent); white-space:pre-wrap; word-break:break-all; max-height:200px; overflow-y:auto; }
.no-selection { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:12px; color:var(--sb-gray2); }
.no-selection mat-icon { font-size:40px; width:40px; height:40px; }
.no-selection p { font-size:13px; }
.logs-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.clear-btn { background:transparent; border:1px solid var(--sb-border2); color:var(--sb-gray); font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:10px; letter-spacing:0.1em; padding:4px 12px; cursor:pointer; }
.log-row { display:flex; align-items:center; gap:12px; padding:6px 8px; border-bottom:1px solid var(--sb-border); font-size:11px; }
.log-ep { font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--sb-gray); flex:1; }
.log-status { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:12px; color:var(--sb-red); }
.log-status.ok { color:var(--sb-accent); }
.log-time { font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--sb-gray2); }
.log-ts { font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--sb-gray2); }
.no-data { font-size:13px; color:var(--sb-gray2); }
`]
})
export class ApiConsole {
  readonly baseUrl = 'http://localhost:3000/api/v1';
  selected  = signal<any>(null);
  response  = signal<string>('');
  respStatus= signal(0);
  respTime  = signal(0);
  logs      = signal<ApiLog[]>([]);

  endpoints = signal([
    { method:'GET',    path:'/conductores',     desc:'Lista todos los conductores registrados' },
    { method:'GET',    path:'/conductores/1',   desc:'Obtiene conductor por ID' },
    { method:'GET',    path:'/turnos',           desc:'Lista todos los turnos' },
    { method:'POST',   path:'/turnos',           desc:'Registra un nuevo turno' },
    { method:'GET',    path:'/alertas',          desc:'Lista todas las alertas de emergencia' },
    { method:'POST',   path:'/alertas',          desc:'Crea una nueva alerta de pánico' },
    { method:'GET',    path:'/pasajeros',        desc:'Registros de conteo de pasajeros' },
    { method:'POST',   path:'/pasajeros',        desc:'Registra nuevo conteo de pasajeros' },
    { method:'GET',    path:'/unidades',         desc:'Estado de unidades en operación' },
    { method:'PUT',    path:'/unidades/1',       desc:'Actualiza estado de una unidad' },
  ]);

  selectEndpoint(ep: any) { this.selected.set(ep); this.response.set(''); }

  sendRequest() {
    const ep = this.selected();
    if (!ep) return;
    const start = Date.now();
    const mockResponses: Record<string, any> = {
      '/conductores':   [{ id:1, nombre:'MARCOS E.', apellido:'SILVA', placa:'ABC-1234', estado:'ACTIVO' }],
      '/conductores/1': { id:1, nombre:'MARCOS E.', apellido:'SILVA', dni:'12345678', codigoEmpleado:'EMP-001', placa:'ABC-1234', estado:'ACTIVO' },
      '/turnos':        [{ id:1, conductorId:1, busId:'BUS-7729', rutaNombre:'R-42', distanciaKm:32.5, pasajeros:45, estado:'FINALIZADO' }],
      '/alertas':       [{ id:1, tipo:'PANICO', nivelRiesgo:'CRITICO', resuelta:false, timestamp:'2025-04-26T07:05:00' }],
      '/pasajeros':     [{ id:1, turnoId:1, totalAbordo:15, totalAbordaron:45, totalBajaron:30, anomalia:false }],
      '/unidades':      [{ id:1, placa:'ABC-1234', conductor:'Marcos E. Silva', ruta:'R-42', estado:'ACTIVO', pasajeros:32 }],
    };
    const key = Object.keys(mockResponses).find(k => ep.path.startsWith(k)) || ep.path;
    const data = mockResponses[key] ?? { message: 'OK', id: Math.floor(Math.random()*100) };
    const time = Math.floor(Math.random() * 80) + 20;
    const status = ep.method === 'DELETE' ? 204 : ep.method === 'POST' ? 201 : 200;
    setTimeout(() => {
      this.respStatus.set(status);
      this.respTime.set(time);
      this.response.set(JSON.stringify(data, null, 2));
      this.logs.update(l => [{ method: ep.method, endpoint: ep.path, status, time: time.toString(), ts: new Date().toLocaleTimeString() }, ...l.slice(0, 19)]);
    }, time);
  }
}
