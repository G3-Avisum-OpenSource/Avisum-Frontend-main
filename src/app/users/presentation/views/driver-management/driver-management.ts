import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  UsersStateService,
  DatosConductor,
  ErroresConductor,
  RUTAS,
} from '../../../application/users-state.service';
import { Driver } from '../../../domain/model/driver.entity';

const vacio = (): DatosConductor => ({
  nombre: '',
  apellido: '',
  dni: '',
  placa: '',
  ruta: 'R-42',
});

@Component({
  selector: 'app-driver-management',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './driver-management.html',
  styleUrl: './driver-management.css',
  host: { '(document:keydown.escape)': 'cerrar()' },
})
export class DriverManagement {
  private svc = inject(UsersStateService);

  readonly conductores = this.svc.conductores;
  readonly filtered = this.svc.filtered;
  readonly searchTerm = this.svc.searchTerm;
  readonly selected = this.svc.selected;
  readonly activos = computed(() => this.conductores().filter((c) => c.estado === 'ACTIVO').length);
  readonly rutas = RUTAS;

  // Formulario (crear / editar)
  readonly modal = signal<'crear' | 'editar' | null>(null);
  readonly editando = signal<Driver | null>(null);
  readonly form = signal<DatosConductor>(vacio());
  readonly errores = signal<ErroresConductor>({});

  // Confirmaciones
  readonly porDesactivar = signal<Driver | null>(null);
  readonly porEliminar = signal<Driver | null>(null);

  // Aviso temporal
  readonly aviso = signal('');
  private avisoTimer: ReturnType<typeof setTimeout> | null = null;

  abrirCrear() {
    this.form.set(vacio());
    this.errores.set({});
    this.editando.set(null);
    this.modal.set('crear');
  }

  abrirEditar(c: Driver) {
    this.form.set({
      nombre: c.nombre,
      apellido: c.apellido,
      dni: c.dni,
      placa: c.placa,
      ruta: this.svc.rutaDe(c.codigoEmpleado),
    });
    this.errores.set({});
    this.editando.set(c);
    this.modal.set('editar');
  }

  cerrar() {
    this.modal.set(null);
    this.porDesactivar.set(null);
    this.porEliminar.set(null);
  }

  onInput(campo: keyof DatosConductor, ev: Event) {
    const el = ev.target as HTMLInputElement | HTMLSelectElement;
    let valor = el.value;
    if (campo === 'dni') valor = valor.replace(/\D/g, '').slice(0, 8);
    if (campo === 'placa')
      valor = valor
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 8);
    if (el.value !== valor) el.value = valor;

    this.form.update((f) => ({ ...f, [campo]: valor }));
    this.errores.update((e) => {
      const { [campo]: _quitado, ...resto } = e;
      return resto;
    });
  }

  enviar(ev: Event) {
    ev.preventDefault();
    const actual = this.editando();
    const errs = this.svc.validar(this.form(), actual?.id);
    this.errores.set(errs);
    if (Object.keys(errs).length) return;

    const datos = this.form();
    if (actual) {
      this.svc.actualizar(actual.id, datos).subscribe({
        next: () => {
          this.mostrarAviso(`Datos de ${datos.nombre.trim()} actualizados.`);
          this.cerrar();
        },
        error: () =>
          this.mostrarAviso('No se pudo guardar. Revisa que el servidor esté encendido.'),
      });
    } else {
      this.svc.crear(datos).subscribe({
        next: (nuevo) => {
          this.mostrarAviso(
            `${nuevo.nombreCompleto} registrado. Su código de acceso es ${nuevo.codigoEmpleado}.`,
          );
          this.cerrar();
        },
        error: () =>
          this.mostrarAviso('No se pudo registrar. Revisa que el servidor esté encendido.'),
      });
    }
  }

  pedirDesactivar(c: Driver) {
    this.porDesactivar.set(c);
  }

  confirmarDesactivar() {
    const c = this.porDesactivar();
    if (!c) return;
    this.svc.cambiarEstado(c.id, 'INACTIVO').subscribe({
      next: () => {
        this.mostrarAviso(`${c.nombreCompleto} fue desactivado y ya no puede iniciar sesión.`);
        this.cerrar();
      },
      error: () => {
        this.mostrarAviso('No se pudo desactivar. Revisa que el servidor esté encendido.');
        this.cerrar();
      },
    });
  }

  reactivar(c: Driver) {
    this.svc.cambiarEstado(c.id, 'ACTIVO').subscribe({
      next: () => this.mostrarAviso(`${c.nombreCompleto} está activo de nuevo.`),
      error: () =>
        this.mostrarAviso('No se pudo reactivar. Revisa que el servidor esté encendido.'),
    });
  }

  pedirEliminar(c: Driver) {
    this.porEliminar.set(c);
  }

  confirmarEliminar() {
    const c = this.porEliminar();
    if (!c) return;
    this.svc.eliminar(c.id).subscribe({
      next: () => {
        this.mostrarAviso(`${c.nombreCompleto} fue eliminado.`);
        this.cerrar();
      },
      error: () => {
        this.mostrarAviso('No se pudo eliminar. Revisa que el servidor esté encendido.');
        this.cerrar();
      },
    });
  }

  private mostrarAviso(msg: string) {
    this.aviso.set(msg);
    if (this.avisoTimer) clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.set(''), 5000);
  }
}
