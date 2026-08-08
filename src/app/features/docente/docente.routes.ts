import { Routes } from '@angular/router';

export const docenteRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/docente-dashboard.component').then(m => m.DocenteDashboardComponent)
  },
  // Spring 5: dashboard de progreso del niño
  {
    path: 'progreso',
    loadComponent: () => import('../shared/progreso/progreso-dashboard.component').then(m => m.ProgresoDashboardComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
