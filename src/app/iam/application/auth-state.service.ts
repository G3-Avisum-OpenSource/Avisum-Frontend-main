import { Injectable, signal, inject } from '@angular/core';
import { Driver } from '../../users/domain/model/driver.entity';
import { FleetTrackingService } from '../../shared/infrastructure/fleet-tracking.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private fleet = inject(FleetTrackingService);

  readonly conductorActual = signal<Driver | null>(null);

  setConductor(c: Driver) {
    this.conductorActual.set(c);
    this.fleet.setCodigoPropio(c.codigoEmpleado);
  }

  clearConductor() {
    this.conductorActual.set(null);
    this.fleet.setCodigoPropio(null);
  }
}