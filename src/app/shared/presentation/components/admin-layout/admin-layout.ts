import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AdminSessionService } from '../../../../iam/application/admin-session.service';
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  private router = inject(Router);
  readonly session = inject(AdminSessionService);

  logout() {
    this.session.cerrar();
    this.router.navigate(['/admin/login']);
  }

  navItems = signal([
    { icon: 'location_on', label: 'CENTRO DE CONTROL', route: '/admin/control-center' },
    { icon: 'people', label: 'GESTIÓN CONDUCTORES', route: '/admin/drivers' },
    { icon: 'directions_bus', label: 'ASIG DE UNIDADES', route: '/admin/units' },
    { icon: 'notifications', label: 'NOTIFICACIONES', route: '/admin/notifications' },
    { icon: 'history', label: 'HISTORIAL TURNOS', route: '/admin/shifts' },
    { icon: 'bar_chart', label: 'METRICAS', route: '/admin/impact' },
    { icon: 'terminal', label: 'API CONSOLE', route: '/admin/api-console' },
  ]);
}
