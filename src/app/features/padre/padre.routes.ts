import { Routes } from '@angular/router';

export const padreRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/padre-dashboard.component').then(m => m.PadreDashboardComponent)
  },
  {
    path: 'perfiles',
    redirectTo: 'perfiles/selector',
    pathMatch: 'full'
  },
  {
    path: 'perfiles/nuevo',
    loadComponent: () => import('./perfiles/perfil-form.component').then(m => m.PerfilFormComponent)
  },
  {
    path: 'perfiles/editar/:id',
    loadComponent: () => import('./perfiles/perfil-form.component').then(m => m.PerfilFormComponent)
  },
  // CA-01 a CA-05: gestion multi-perfil de la cuenta padre
  {
    path: 'perfiles/selector',
    loadComponent: () => import('./perfiles/profile-selector.component').then(m => m.ProfileSelectorComponent)
  }
];
