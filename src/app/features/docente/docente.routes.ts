import { Routes } from '@angular/router';

export const docenteRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/docente-dashboard.component').then(m => m.DocenteDashboardComponent)
  },
  // RF-Historial: historial detallado de sesiones por juego
  {
    path: 'historial/:perfilId',
    data: { back: '/docente/dashboard' },
    loadComponent: () => import('../../shared/components/historial-sesiones/historial-sesiones.component')
      .then(m => m.HistorialSesionesComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
