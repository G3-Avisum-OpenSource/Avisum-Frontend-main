import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { AdminSessionService } from './admin-session.service';

/** Solo entra quien inició sesión como conductor. */
export const conductorGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthStateService).conductorActual()
    ? true
    : router.createUrlTree(['/conductor/login']);
};

/** Solo entra quien inició sesión como administrador. */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AdminSessionService).admin() ? true : router.createUrlTree(['/admin/login']);
};
