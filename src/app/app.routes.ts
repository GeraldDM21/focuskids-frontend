import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { alreadyAuthGuard } from './guards/already-auth.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [
  // Landing page pública
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full'
  },

  // Rutas públicas (si ya está logueado redirige al dashboard)
  {
    path: 'auth',
    canActivate: [alreadyAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'terminos',
    loadComponent: () =>
      import('./features/legal/terminos.component').then(m => m.TerminosComponent)
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/legal/privacidad.component').then(m => m.PrivacidadComponent)
  },

  // Padre y Niño — layout propio, fuera del Shell
  {
    path: 'padre',
    canActivate: [authGuard, roleGuard(['PADRE'])],
    loadChildren: () => import('./features/padre/padre.routes').then(m => m.padreRoutes)
  },
  {
    path: 'nino',
    canActivate: [authGuard, roleGuard(['NINO'])],
    loadChildren: () => import('./features/nino/nino.routes').then(m => m.ninoRoutes)
  },

  // Docente — layout propio, fuera del Shell
  {
    path: 'docente',
    canActivate: [authGuard, roleGuard(['DOCENTE'])],
    loadChildren: () => import('./features/docente/docente.routes').then(m => m.docenteRoutes)
  },

  // Admin — layout propio, fuera del Shell
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMINISTRADOR'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },

  // Shell solo para rutas que lo necesiten (unauthorized, etc.)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];
