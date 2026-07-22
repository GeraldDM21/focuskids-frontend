import { Routes } from '@angular/router';

export const ninoRoutes: Routes = [
  {
    path: 'juegos',
    loadComponent: () =>
      import('./juegos/nino-juegos.component').then((m) => m.NinoJuegosComponent),
  },
  {
    path: 'juego/espejo-mental',
    loadComponent: () =>
      import('./juego/espejo-mental/espejo-mental.component').then((m) => m.EspejoMentalComponent),
  },
  {
    path: 'juego/palabras-ocultas',
    loadComponent: () =>
      import('./juego/sopa-letras/sopa-letras.component').then((m) => m.SopaLetrasComponent),
  },
  {
    path: 'juego/historia-viva',
    loadComponent: () =>
      import('./juego/historia-viva/historia-viva.component').then((m) => m.HistoriaVivaComponent),
  },
  {
    path: 'juego/ritmo-patron',
    loadComponent: () =>
      import('./juego/ritmo-patron/ritmo-patron.component').then(m => m.RitmoPatronComponent)
  },
  {
    path: 'juego/piezas-tiempo',
    loadComponent: () =>
      import('./juego/piezas-tiempo/piezas-tiempo.component').then((m) => m.PiezasTiempoComponent),
  },
  {
    path: 'juego/cascada-numerica',
    loadComponent: () =>
      import('./juego/cascada-numerica/cascada-numerica.component').then(
        (m) => m.CascadaNumericaComponent,
      ),
  },

  {
    path: 'juego/foco-extremo',
    loadComponent: () =>
      import('./juego/foco-extremo/foco-extremo.component').then((m) => m.FocoExtremoComponent),
  },
  {
    path: 'juego/reaccion-controlada',
    loadComponent: () =>
      import('./juego/reaccion-controlada/reaccion-controlada.component').then((m) => m.ReaccionControladaComponent),
  },
  {
    path: 'juego/laberinto',
    loadComponent: () =>
  import('./juego/laberinto/laberinto.component').then((m) => m.LaberintoComponent),
},
{
  path: 'juego/maraton-mental',
    loadComponent: () =>
      import('./juego/maraton-mental/maraton-mental.component').then((m) => m.MaratonMentalComponent),
  },
  {
    path: 'juego/mapa-aventura',
    loadComponent: () =>
      import('./juego/mapa-aventura/mapa-aventura.component').then((m) => m.MapaAventuraComponent),
  },
  {
    path: 'juego/lab-ciencias',
    loadComponent: () =>
      import('./juego/lab-ciencias/lab-ciencias.component').then((m) => m.LabCienciasComponent),
  },
];
