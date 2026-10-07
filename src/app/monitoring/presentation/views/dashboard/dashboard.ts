import { Component, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FleetTrackingService } from '../../../../shared/infrastructure/fleet-tracking.service';

declare const L: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit, OnDestroy {
  private fleet = inject(FleetTrackingService);

  unidades = this.fleet.unidades;
  alertas  = this.fleet.alertas;

  get activasCnt()  { return this.unidades().filter(u => u.estado === 'ACTIVO' || u.estado === 'ALERTA').length; }
  get alertaCnt()   { return this.alertas().filter(a => !a.resuelta).length; }
  get pasajerosCnt(){ return this.unidades().reduce((s, u) => s + u.pasajeros, 0); }

  nivelColor(n: string) {
    return n === 'CRITICO' ? '#e8002a' : n === 'ALTO' ? '#ff6d00' : n === 'MEDIO' ? '#f0a000' : '#888';
  }
  estadoColor(e: string) {
    return e === 'ACTIVO' ? 'var(--sb-accent)' : e === 'ALERTA' ? '#e8002a' : 'var(--sb-gray)';
  }

  resolverAlerta(id: number) {
    this.fleet.resolverAlerta(id);
  }

  private map: any;
  private markers = new Map<number, any>();
  private renderInterval: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit() {
    this.map = L.map('monitoring-map').setView([-12.06, -77.04], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.renderMarcadores();
    this.renderInterval = setInterval(() => this.renderMarcadores(), 2000);
  }

  private renderMarcadores() {
    for (const u of this.unidades()) {
      const color = u.estado === 'ALERTA' ? '#e8002a' : u.estado === 'ACTIVO' ? '#c8ff00' : '#888';
      let marker = this.markers.get(u.id);
      if (!marker) {
        const icon = L.divIcon({
          className: 'bus-marker-admin',
          html: `<div class="bus-dot" style="background:${color}"></div>`,
          iconSize: [16, 16],
        });
        marker = L.marker([u.lat, u.lng], { icon })
          .addTo(this.map)
          .bindTooltip(`${u.placa} — ${u.conductor}`);
        this.markers.set(u.id, marker);
      } else {
        marker.setLatLng([u.lat, u.lng]);
        const el: HTMLElement | null = marker.getElement()?.querySelector('.bus-dot') ?? null;
        if (el) el.style.background = color;
      }
    }
  }

  focarUnidad(placa: string) {
    const unidad = this.unidades().find(u => u.placa === placa);
    if (unidad && this.map) {
      this.map.setView([unidad.lat, unidad.lng], 16, { animate: true });
      this.markers.get(unidad.id)?.openTooltip();
    }
  }

  ngOnDestroy() {
    if (this.renderInterval) clearInterval(this.renderInterval);
    if (this.map) this.map.remove();
  }
}
