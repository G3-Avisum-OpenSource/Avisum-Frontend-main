import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { AuthStateService } from '../../../../iam/application/auth-state.service';
import { Driver } from '../../../../users/domain/model/driver.entity';
import { VALID_EMPLOYEE_CODES, normalizeEmployeeCode } from '../../../../shared/infrastructure/fake-api/fake-data';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
})
export class QrScanner implements OnDestroy {
  private router = inject(Router);
  private api    = inject(IamApi);
  private state  = inject(AuthStateService);

  manualCode     = signal('');
  scanning       = signal(true);
  conductorFound = signal<Driver | null>(null);
  scanLine       = signal(0);
  errorMsg       = signal('');

  /** Códigos de los integrantes del equipo (datos de prueba, sin backend). */
  private codigosRegistrados = VALID_EMPLOYEE_CODES;

  private interval: ReturnType<typeof setInterval>;
  private scanTimeout: ReturnType<typeof setTimeout>;

  constructor() {
    this.interval = setInterval(() => {
      this.scanLine.update(v => (v + 3) % 100);
    }, 30);

    this.scanTimeout = setTimeout(() => this.simulateScan(), 3000);
  }

  private simulateScan() {
    if (this.conductorFound()) return;

    const codigoAleatorio = this.codigosRegistrados[Math.floor(Math.random() * this.codigosRegistrados.length)];
    this.api.verifyByCode(codigoAleatorio).subscribe({
      next: (c) => {
        if (c) { this.conductorFound.set(c); this.state.setConductor(c); }
      },
      error: () => { this.errorMsg.set('No se pudo validar el escaneo automático.'); },
    });
  }

  validate() {
    const code = normalizeEmployeeCode(this.manualCode());
    if (!code) { this.errorMsg.set('Ingresa un código.'); return; }
    this.errorMsg.set('');
    this.api.verifyByCode(code).subscribe({
      next: (c) => {
        if (c) {
          this.conductorFound.set(c);
          this.state.setConductor(c);
        } else {
          this.errorMsg.set('Código inválido.');
        }
      },
      error: () => { this.errorMsg.set('Código inválido.'); },
    });
  }

  startShift() {
    this.router.navigate(['/conductor/access-authorized']);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
    clearTimeout(this.scanTimeout);
  }
}
