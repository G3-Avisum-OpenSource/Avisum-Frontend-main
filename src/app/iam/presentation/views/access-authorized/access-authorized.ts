import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStateService } from '../../../application/auth-state.service';
import { ShiftTrackingService } from '../../../../monitoring/application/shift-tracking.service';
import { FleetTrackingService } from '../../../../shared/infrastructure/fleet-tracking.service';

@Component({
  selector: 'app-access-authorized',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './access-authorized.html',
  styleUrl: './access-authorized.css',
})
export class AccessAuthorized implements OnInit {
  private router = inject(Router);
  private state = inject(AuthStateService);
  private shift = inject(ShiftTrackingService);
  private fleet = inject(FleetTrackingService);

  /**
   * GPS coordinates shown in the access-authorized modal.
   * Defaults to Lima Metropolitana (the app's operating region) and is
   * overwritten with the real unit position once the fleet loads.
   */
  coords = signal('-12.0464° S, 77.0428° W');
  centralOk = signal(true);
  recording = signal(true);

  ngOnInit() {
    if (!this.state.conductorActual()) {
      this.router.navigate(['/conductor/login']);
      return;
    }
    this.fleet.recargar();
    this.ensureShiftStarted();
  }

  /** Inicia el turno una sola vez, aunque no se encuentre la unidad en la flota. */
  private ensureShiftStarted() {
    const c = this.state.conductorActual();
    if (!c || this.shift.turnoActivo()) return;

    const unidad = this.fleet.getUnidadByCodigo(c.codigoEmpleado);
    this.shift.iniciarTurno(c, unidad?.placa ?? (c.placa || 'BUS-7729'));
  }

  continue() {
    this.ensureShiftStarted(); // por si no arrancó en ngOnInit
    this.router.navigate(['/conductor/dashboard']);
  }
}
