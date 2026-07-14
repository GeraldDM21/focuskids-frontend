import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UsuarioRol } from '../core/models/auth.model';

export const roleGuard = (allowedRoles: UsuarioRol[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    const userRol = auth.userRol();
    if (userRol && allowedRoles.includes(userRol)) {
      return true;
    }

    return router.createUrlTree(['/unauthorized']);
  };
};
