import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'logs',
    loadComponent: () => import('./logs/admin-logs.component').then(m => m.AdminLogsComponent)
  }
];
