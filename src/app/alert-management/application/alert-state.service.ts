import { Injectable, inject } from '@angular/core';
import { FleetTrackingService } from '../../shared/infrastructure/fleet-tracking.service';

/**
 * Bridges the alert views with the fleet service.
 * Exposes the active alerts and the actions available to the driver (trigger
 * a panic alert) and to the administrator (mark an alert as resolved).
 */
@Injectable({ providedIn: 'root' })
export class AlertStateService {
  private fleet = inject(FleetTrackingService);

  readonly alertas = this.fleet.alertas;

  triggerPanic(codigoEmpleado: string) {
    this.fleet.triggerPanic(codigoEmpleado);
  }

  getUnidadByCodigo(codigoEmpleado: string) {
    return this.fleet.getUnidadByCodigo(codigoEmpleado);
  }

  resolverAlerta(id: number) {
    this.fleet.resolverAlerta(id);
  }
}
