import { Routes } from '@angular/router';

export const ninoRoutes: Routes = [
  {
    path: 'juegos',
    loadComponent: () =>
      import('./juegos/nino-juegos.component').then(m => m.NinoJuegosComponent)
  },
  {
    path: 'juego/espejo-mental',
    loadComponent: () =>
      import('./juego/espejo-mental/espejo-mental.component').then(m => m.EspejoMentalComponent)
  },
  {
    path: 'juego/palabras-ocultas',
    loadComponent: () =>
      import('./juego/sopa-letras/sopa-letras.component').then(m => m.SopaLetrasComponent)
  },
  {
    path: 'juego/historia-viva',
    loadComponent: () =>
      import('./juego/historia-viva/historia-viva.component').then(m => m.HistoriaVivaComponent)
  },
  {
    path: 'juego/piezas-tiempo',
    loadComponent: () =>
      import('./juego/piezas-tiempo/piezas-tiempo.component').then(m => m.PiezasTiempoComponent)
  }
];
