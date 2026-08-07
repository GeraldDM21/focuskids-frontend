import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

/**
 * Evita que un usuario ya autenticado acceda a páginas públicas (login, register).
 * Si ya tiene sesión lo redirige al dashboard correspondiente a su rol.
 */
export const alreadyAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;   // No está logueado → puede ver login/register
  }

  // Ya autenticado: redirigir según rol
  const rol = auth.userRol();
  switch (rol) {
    case 'PADRE':         return router.createUrlTree(['/padre/dashboard']);
    case 'DOCENTE':       return router.createUrlTree(['/docente/dashboard']);
    case 'ADMINISTRADOR': return router.createUrlTree(['/admin']);
    case 'NINO':          return router.createUrlTree(['/nino/juegos']);
    default:              return true;
  }
};
