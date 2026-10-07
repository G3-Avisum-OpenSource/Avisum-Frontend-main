import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthStateService } from '../../../../iam/application/auth-state.service';
import { ShiftTrackingService } from '../../../../monitoring/application/shift-tracking.service';

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './driver-profile.html',
  styleUrl: './driver-profile.css',
})
export class DriverProfile {
  private router = inject(Router);
  private auth = inject(AuthStateService);
  readonly shift = inject(ShiftTrackingService);

  constructor() {
    // Sin sesión no hay perfil que mostrar
    if (!this.auth.conductorActual()) this.router.navigate(['/conductor/login']);
  }

  get driver() {
    return this.auth.conductorActual();
  }

  readonly iniciales = computed(() => {
    const d = this.auth.conductorActual();
    return d ? `${d.nombre[0] ?? ''}${d.apellido[0] ?? ''}`.toUpperCase() : '';
  });

  /** Franja decorativa del carnet, generada a partir del código del empleado. */
  readonly barcode = computed(() => {
    const code = this.auth.conductorActual()?.codigoEmpleado ?? '';
    const bars: { x: number; w: number }[] = [];
    let x = 0;
    for (const ch of `*${code}*`) {
      const n = ch.charCodeAt(0);
      for (let i = 7; i >= 0; i--) {
        const w = (n >> i) & 1 ? 3 : 1;
        bars.push({ x, w });
        x += w + 2;
      }
    }
    return { bars, width: x };
  });

  salir() {
    this.auth.clearConductor();
    this.shift.resetTurno();
    this.router.navigate(['/conductor/login']);
  }
}
