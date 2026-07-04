import { Routes } from '@angular/router';

export const docenteRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/docente-dashboard.component').then(m => m.DocenteDashboardComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
