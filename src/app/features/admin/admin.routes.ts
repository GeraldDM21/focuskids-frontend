import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent)
  },
  {
    path: 'logs',
    loadComponent: () => import('./logs/admin-logs.component').then(m => m.AdminLogsComponent)
  }
];
