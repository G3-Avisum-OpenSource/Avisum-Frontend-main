import { Injectable, signal } from '@angular/core';

/** Cómo va el turno de un conductor, tal como lo ve otra pestaña (el panel del administrador). */
export interface TurnoEnVivo {
  conductorId: number;
  placa: string;
  inicio: number; // ms desde 1970
  fin: number | null; // null mientras sigue en ruta
  seg: number;
  km: number;
  pax: number;
  fare: number;
  visto: number; // última vez que llegó un dato de este turno
}

/**
 * Pasa el avance del turno entre pestañas del mismo navegador (BroadcastChannel):
 * el conductor lo emite cada segundo y el administrador lo recibe.
 */
@Injectable({ providedIn: 'root' })
export class TurnosEnVivoService {
  private canal: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('avisum-turnos') : null;

  /** conductorId -> último estado conocido de su turno. */
  readonly turnos = signal<Record<number, TurnoEnVivo>>({});

  constructor() {
    if (this.canal) this.canal.onmessage = (ev: MessageEvent) => this.recibir(ev.data);
  }

  /** La pestaña del conductor avisa cómo va su turno. */
  emitir(turno: Omit<TurnoEnVivo, 'visto'>): void {
    this.canal?.postMessage({ tipo: 'turno', turno });
  }

  private recibir(msg: any): void {
    if (!msg || msg.tipo !== 'turno') return;
    const t = msg.turno as Omit<TurnoEnVivo, 'visto'>;
    this.turnos.update((m) => ({ ...m, [t.conductorId]: { ...t, visto: Date.now() } }));
  }
}
