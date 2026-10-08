import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ShiftTrackingService } from '../../../application/shift-tracking.service';
import { AuthStateService } from '../../../../iam/application/auth-state.service';

/**
 * Main screen shown to the driver during an active shift.
 * Displays live service metrics (distance, time, passengers, revenue) and
 * lets the driver start the shift closing protocol. Redirects to the login
 * screen when no shift is active.
 */
@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [MatIconModule, MatCheckboxModule, FormsModule, DecimalPipe],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.css',
})
export class DriverDashboard {
  private router = inject(Router);
  private auth = inject(AuthStateService);
  readonly state = inject(ShiftTrackingService);
  constructor() {
    if (!this.state.turnoActivo()) this.router.navigate(['/conductor/login']);
  }
  // Apuntan directo a las señales centrales del state service,
  // así que no se reinician al navegar entre pantallas.
  tiempoStr = this.state.tiempoStr;
  distancia = this.state.distanciaKm;
  pasajeros = this.state.pasajeros;
  recaudacion = this.state.recaudacion;

  check1 = signal(false);
  check2 = signal(false);
  check3 = signal(false);
  showFinishModal = signal(false);

  gpsStatus = signal('ESTABLE');
  telStatus = signal('SINCRO');
  cloudStatus = signal('ACTIVA');

  viewMap() {
    this.router.navigate(['/conductor/view-map']);
  }
  openFinish() {
    this.state.finalizarTurno(); // cierra el turno al abrir el modal
    this.showFinishModal.set(true);
  }

  verReporte() {
    this.showFinishModal.set(false);
    this.router.navigate(['/conductor/service-summary']);
  }

  salir() {
    this.showFinishModal.set(false);
    this.auth.clearConductor();
    this.state.resetTurno();
    this.router.navigate(['/conductor/login']);
  }
}
