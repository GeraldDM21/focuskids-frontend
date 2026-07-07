import { Routes } from '@angular/router';

export const padreRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/padre-dashboard.component').then(m => m.PadreDashboardComponent)
  },
  {
    path: 'perfiles',
    loadComponent: () => import('./perfiles/perfil-list.component').then(m => m.PerfilListComponent)
  },
  {
    path: 'perfiles/nuevo',
    loadComponent: () => import('./perfiles/perfil-form.component').then(m => m.PerfilFormComponent)
  },
  {
    path: 'perfiles/editar/:id',
    loadComponent: () => import('./perfiles/perfil-form.component').then(m => m.PerfilFormComponent)
  }
];
