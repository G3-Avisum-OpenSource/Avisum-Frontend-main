import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStateService } from '../../../../iam/application/auth-state.service';
import { AlertStateService } from '../../../application/alert-state.service';

@Component({
  selector: 'app-panic-alert',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './panic-alert.html',
  styleUrl: './panic-alert.css',
})
export class PanicAlert implements OnInit, OnDestroy {
  private router  = inject(Router);
  private auth    = inject(AuthStateService);
  private alerts  = inject(AlertStateService);

  coords          = signal('4.7110° N, 74.0721° W');
  cancelCountdown = signal(5);
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const codigo = this.auth.conductorActual()?.codigoEmpleado;
    if (codigo) {
      this.alerts.triggerPanic(codigo);
      const unidad = this.alerts.getUnidadByCodigo(codigo);
      if (unidad) {
        this.coords.set(`${unidad.lat.toFixed(4)}° S, ${Math.abs(unidad.lng).toFixed(4)}° W`);
      }
    }
    this.timer = setInterval(() => {
      this.cancelCountdown.update(v => v > 0 ? v - 1 : 0);
    }, 1000);
  }
  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  cancel() { this.router.navigate(['/conductor/dashboard']); }
  ok()     { this.router.navigate(['/conductor/dashboard']); }
}
