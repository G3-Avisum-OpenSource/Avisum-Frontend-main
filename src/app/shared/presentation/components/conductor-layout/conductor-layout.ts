import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStateService } from '../../../../iam/application/auth-state.service';

@Component({
  selector: 'app-conductor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './conductor-layout.html',
  styleUrl: './conductor-layout.css',
})
export class ConductorLayout {
  private router = inject(Router);
  readonly state = inject(AuthStateService);

  navItems = signal([
    { icon: 'dashboard',       label: 'DASHBOARD',            route: '/conductor/dashboard' },
    { icon: 'people',          label: 'CONTEO DE PASAJEROS',  route: '/conductor/passengers' },
    { icon: 'warning_amber',   label: 'ALERT LOGS',           route: '/conductor/alert-logs' },
  ]);

  panicTriggered = signal(false);

  triggerPanic() {
    this.panicTriggered.set(true);
    this.router.navigate(['/conductor/panic-alert']);
  }

  logout() {
    this.state.clearConductor();
    this.router.navigate(['/conductor/login']);
  }
}
