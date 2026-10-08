import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ShiftTrackingService } from '../../../application/shift-tracking.service';
import { AuthStateService } from '../../../../iam/application/auth-state.service';

/**
 * Final shift report.
 * Summarizes the completed service (driver, unit, route, metrics) and lets
 * the driver start a new service or close the session.
 */
@Component({
  selector: 'app-service-summary',
  standalone: true,
  imports: [MatIconModule, DecimalPipe, DatePipe],
  templateUrl: './service-summary.html',
  styleUrl: './service-summary.css',
})
export class ServiceSummary {
  private router = inject(Router);
  private auth = inject(AuthStateService);
  readonly state = inject(ShiftTrackingService);

  readonly ruta = { nombre: 'R-42', origen: 'Terminal Norte', destino: 'Estación Central' };

  readonly checklist = [
    'Vehículo estacionado en zona segura / terminal',
    'Verificación de interior sin objetos perdidos',
    'Validación de total de pasajeros en consola',
  ];
  checks = signal<boolean[]>([false, false, false]);
  doneCount = computed(() => this.checks().filter(Boolean).length);

  /** Momento en que se abrió el reporte (= fin del turno). */
  readonly fin = new Date();

  constructor() {
    // Sin turno no hay reporte que mostrar
    if (!this.state.turnoActual()) this.router.navigate(['/conductor/login']);
  }

  // Datos tomados de las señales del turno (las mismas que usa el dashboard)
  get turno() {
    return this.state.turnoActual();
  }
  get segundos() {
    return this.state.tiempoSegundos();
  }
  get distancia() {
    return this.state.distanciaKm();
  }
  get pasajeros() {
    return this.state.pasajeros();
  }
  get recaudacion() {
    return this.state.recaudacion();
  }

  get inicio(): Date {
    return new Date(this.fin.getTime() - this.segundos * 1000);
  }

  get conductor() {
    return this.auth.conductorActual();
  }
  get conductorNombre(): string {
    const c = this.conductor;
    return c ? `${c.nombre} ${c.apellido}` : '—';
  }
  get conductorCodigo(): string {
    return this.conductor?.codigoEmpleado ?? '—';
  }
  get placa(): string {
    return this.conductor?.placa || this.turno?.busId || '—';
  }

  get velocidadPromedio(): number {
    return this.segundos > 0 ? this.distancia / (this.segundos / 3600) : 0;
  }
  get ingresoPorPasajero(): number {
    return this.pasajeros > 0 ? this.recaudacion / this.pasajeros : 0;
  }

  formatTime(s: number): string {
    const h = Math.floor(s / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }

  toggle(i: number) {
    this.checks.update((a) => a.map((v, idx) => (idx === i ? !v : v)));
  }

  newService() {
    this.auth.clearConductor();
    this.state.resetTurno();
    this.router.navigate(['/conductor/login']);
  }
}
