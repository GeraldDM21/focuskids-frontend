import { Routes } from '@angular/router';

export const padreRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/padre-dashboard.component').then(m => m.PadreDashboardComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
