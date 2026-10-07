import { Injectable, computed, signal } from '@angular/core';

export type TipoDestinatario = 'POLICÍA' | 'OPERACIONES' | 'EMPRESA' | 'GESTIÓN';

export interface Destinatario {
  id: number;
  nombre: string;
  tipo: TipoDestinatario;
  contacto: string;
  activo: boolean;
}

export const TIPOS_DESTINATARIO: TipoDestinatario[] = [
  'POLICÍA',
  'OPERACIONES',
  'EMPRESA',
  'GESTIÓN',
];

const ICONOS: Record<TipoDestinatario, string> = {
  POLICÍA: 'local_police',
  OPERACIONES: 'headset_mic',
  EMPRESA: 'business',
  GESTIÓN: 'manage_accounts',
};
export const iconoDe = (t: TipoDestinatario): string => ICONOS[t];

const KEY = 'avisum.recipients';

const seed = (): Destinatario[] => [
  { id: 1, nombre: 'Central PNP Lima Norte', tipo: 'POLICÍA', contacto: '105', activo: true },
  {
    id: 2,
    nombre: 'Central Avisum OPS',
    tipo: 'OPERACIONES',
    contacto: 'central@avisum.demo',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Empresa Trans Lima SAC',
    tipo: 'EMPRESA',
    contacto: 'alertas@translima.demo',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Gerencia Operativa',
    tipo: 'GESTIÓN',
    contacto: 'gerencia@translima.demo',
    activo: false,
  },
];

function load(): Destinatario[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* sin acceso a localStorage: se usan los de ejemplo */
  }
  return seed();
}

/** Quién recibe las alertas. Se guarda en el navegador para que no se pierda al refrescar. */
@Injectable({ providedIn: 'root' })
export class DestinatariosService {
  readonly lista = signal<Destinatario[]>(load());
  readonly activos = computed(() => this.lista().filter((d) => d.activo));

  activosNombres(): string[] {
    return this.activos().map((d) => d.nombre);
  }

  agregar(d: { nombre: string; tipo: TipoDestinatario; contacto: string }): void {
    const id = this.lista().reduce((max, x) => Math.max(max, x.id), 0) + 1;
    this.lista.update((l) => [...l, { id, ...d, activo: true }]);
    this.guardar();
  }

  alternar(id: number): void {
    this.lista.update((l) => l.map((d) => (d.id === id ? { ...d, activo: !d.activo } : d)));
    this.guardar();
  }

  eliminar(id: number): void {
    this.lista.update((l) => l.filter((d) => d.id !== id));
    this.guardar();
  }

  private guardar(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.lista()));
    } catch {
      /* ignorar */
    }
  }
}
