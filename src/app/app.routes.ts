import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [
  // Landing page pública
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full'
  },

  // Rutas públicas
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // Rutas protegidas — todas dentro del Shell
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMINISTRADOR'])],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
      },
      {
        path: 'padre',
        canActivate: [roleGuard(['PADRE'])],
        loadChildren: () => import('./features/padre/padre.routes').then(m => m.padreRoutes)
      },
      {
        path: 'docente',
        canActivate: [roleGuard(['DOCENTE'])],
        loadChildren: () => import('./features/docente/docente.routes').then(m => m.docenteRoutes)
      },
      {
        path: 'nino',
        loadChildren: () => import('./features/nino/nino.routes').then(m => m.ninoRoutes)
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];
