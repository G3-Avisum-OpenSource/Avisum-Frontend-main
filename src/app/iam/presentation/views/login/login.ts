import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { IamApi } from '../../../infrastructure/iam-api';
import { AuthStateService } from '../../../application/auth-state.service';
import { normalizeEmployeeCode } from '../../../../shared/infrastructure/fake-api/fake-data';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private api    = inject(IamApi);
  private state  = inject(AuthStateService);

  codigoEmpleado = signal('');
  errors = signal<string[]>([]);
  loading = signal(false);

  readonly errorList = [
    { code: 'invalid',      icon: 'error',   color: '#e8002a', title: 'Código inválido', desc: 'La firma digital no coincide con los registros actuales.' },
    { code: 'unauthorized', icon: 'info',    color: '#888',    title: 'Conductor no autorizado', desc: 'Su perfil no tiene permisos para esta zona operativa.' },
    { code: 'conflict',     icon: 'warning', color: '#f0a000', title: 'Conflicto de vehículo', desc: 'El vehículo #SB-902 ya tiene un conductor asignado.' },
  ];

  openScanner() {
    this.router.navigate(['/conductor/qr-scanner']);
  }

  verify() {
    const code = normalizeEmployeeCode(this.codigoEmpleado());
    if (!code) { this.errors.set(['invalid']); return; }
    this.loading.set(true);
    this.errors.set([]);
    this.api.verifyByCode(code).subscribe({
      next: (conductor) => {
        this.loading.set(false);
        if (conductor) {
          this.state.setConductor(conductor);
          this.router.navigate(['/conductor/access-authorized']);
        } else {
          this.errors.set(['invalid']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errors.set([err?.status === 403 ? 'unauthorized' : 'invalid']);
      },
    });
  }
}
