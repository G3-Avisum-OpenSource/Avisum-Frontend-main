import { AdminUser } from './admin-session.service';

/** El único administrador del sistema (cuenta fija). */
export const ADMIN_FIJO: AdminUser = {
  id: 1,
  adminCode: 'ADMIN-001',
  fullName: 'Administrador Avisum',
};
