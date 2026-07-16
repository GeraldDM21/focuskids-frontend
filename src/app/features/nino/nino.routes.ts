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
  }
];
