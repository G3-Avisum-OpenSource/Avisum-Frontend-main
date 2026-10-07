import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Driver } from '../../users/domain/model/driver.entity';
import { Turno } from '../domain/model/turno-historial.entity';
import { FleetTrackingService } from '../../shared/infrastructure/fleet-tracking.service';
import { ShiftsApiEndpoint } from '../infrastructure/shifts-api-endpoint';
import { UnidadesApiEndpoint } from '../infrastructure/unidades-api-endpoint';
import { TurnosEnVivoService } from './turnos-en-vivo.service';

@Injectable({ providedIn: 'root' })
export class ShiftTrackingService {
  private fleet = inject(FleetTrackingService);
  private http = inject(HttpClient);
  private enVivo = inject(TurnosEnVivoService);
  private shiftsApi = new ShiftsApiEndpoint(this.http);
  private unidadesApi = new UnidadesApiEndpoint(this.http);

  readonly turnoActual = signal<Turno | null>(null);
  readonly turnoActivo = signal(false);

  readonly tiempoSegundos = signal(0);
  readonly distanciaKm = signal(0);
  readonly pasajeros = signal(0);
  readonly recaudacion = signal(0);

  readonly tiempoStr = computed(() => {
    const s = this.tiempoSegundos();
    const h = Math.floor(s / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  // Datos del turno que se comparten con el panel del administrador
  private conductorId = 0;
  private placa = '';
  private inicioMs = 0;

  iniciarTurno(conductor: Driver, busId: string) {
    this.unidadesApi.getAll().subscribe({
      next: (unidades) => {
        const unidad = unidades.find((u) => u.placa === busId);
        if (!unidad) {
          console.error('No se encontro la unidad con placa:', busId);
          return;
        }
        this.shiftsApi
          .iniciarTurno(conductor.id, unidad.id, 'Terminal Norte', 'Estación Central')
          .subscribe({
            next: (turno) => {
              this.turnoActual.set(turno);
              this.turnoActivo.set(true);
              this.tiempoSegundos.set(0);
              this.distanciaKm.set(0);
              this.pasajeros.set(0);
              this.recaudacion.set(0);
              this.conductorId = conductor.id;
              this.placa = busId;
              this.inicioMs = Date.now();
              this.emitirEstado(null);
              this.iniciarTimer(conductor.codigoEmpleado);
            },
            error: (err) => console.error('Error al iniciar turno:', err),
          });
      },
      error: (err) => console.error('Error al buscar unidades:', err),
    });
  }

  private iniciarTimer(codigoEmpleado: string) {
    this.detenerTimer();
    this.timer = setInterval(() => {
      if (!this.turnoActivo()) return;
      this.tiempoSegundos.update((v) => v + 1);
      const deltaKm = 0.003;
      this.distanciaKm.update((v) => +(v + deltaKm).toFixed(3));
      if (this.tiempoSegundos() % 15 === 0) {
        this.pasajeros.update((v) => v + Math.floor(Math.random() * 3));
        this.recaudacion.update((v) => +(v + Math.random() * 2.5).toFixed(2));
      }
      if (codigoEmpleado) this.fleet.moverUnidadPorDistancia(codigoEmpleado, deltaKm);
      const t = this.turnoActual();
      if (t) {
        t.tiempoSegundos = this.tiempoSegundos();
        t.distanciaKm = this.distanciaKm();
        t.pasajeros = this.pasajeros();
        t.recaudacion = this.recaudacion();
      }
      this.emitirEstado(null); // el administrador ve el avance en vivo
    }, 1000);
  }

  private detenerTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Avisa al panel del administrador cómo va el turno (fin = null mientras sigue en ruta). */
  private emitirEstado(fin: number | null) {
    if (!this.conductorId) return;
    this.enVivo.emitir({
      conductorId: this.conductorId,
      placa: this.placa,
      inicio: this.inicioMs,
      fin,
      seg: this.tiempoSegundos(),
      km: this.distanciaKm(),
      pax: this.pasajeros(),
      fare: this.recaudacion(),
    });
  }

  finalizarTurno() {
    const t = this.turnoActual();
    this.detenerTimer();
    this.turnoActivo.set(false);
    this.emitirEstado(Date.now());
    if (!t) return;
    this.shiftsApi
      .finalizarTurno(
        t.id,
        this.distanciaKm(),
        this.tiempoSegundos(),
        this.pasajeros(),
        this.recaudacion(),
      )
      .subscribe({
        next: (turnoFinalizado) => this.turnoActual.set(turnoFinalizado),
        error: (err) => console.error('Error al finalizar turno:', err),
      });
  }

  resetTurno() {
    // Si el conductor cierra sesión sin finalizar, el administrador ve que el turno terminó
    if (this.turnoActivo()) this.emitirEstado(Date.now());
    this.turnoActual.set(null);
    this.turnoActivo.set(false);
    this.detenerTimer();
  }
}
