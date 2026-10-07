import { Injectable, signal } from '@angular/core';

export interface AdminUser {
  id: number;
  fullName: string;
  adminCode: string;
}

const KEY = 'avisum.adminSession';

function load(): AdminUser | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

/**
 * Sesión del administrador. Es independiente de la del conductor
 * y se guarda solo en esta pestaña (sessionStorage), así que recargar no la pierde.
 */
@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  readonly admin = signal<AdminUser | null>(load());

  iniciar(admin: AdminUser): void {
    this.admin.set(admin);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(admin));
    } catch {
      /* ignorar */
    }
  }

  cerrar(): void {
    this.admin.set(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignorar */
    }
  }
}
