import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Nivel, PiezasSesionRequest } from './piezas-tiempo.model';

// Banco de formas disponibles por nivel (CA-01 y CA-04).
// Antes esto era la lista exacta de piezas de cada ronda, así que en Fácil
// SIEMPRE salían las mismas 3 figuras (círculo, cuadrado, triángulo), sin
// variar nunca. Ahora es un banco más grande del que generarConfig() sortea
// al azar la cantidad de figuras de cada ronda (ver CANTIDAD_FORMAS_POR_NIVEL),
// así que las figuras sí cambian de una ronda a otra.
const FORMAS_FACIL   = ['circulo', 'cuadrado', 'triangulo', 'diamante', 'ovalo'];
const FORMAS_MEDIO   = [...FORMAS_FACIL, 'rectangulo', 'hexagono', 'corazon'];
const FORMAS_DIFICIL = [...FORMAS_MEDIO, 'pentagono', 'flecha'];
const FORMAS_EXPERTO = [...FORMAS_DIFICIL, 'estrella', 'cruz'];

const FORMAS_POR_NIVEL: Record<string, string[]> = {
  FACIL:   FORMAS_FACIL,
  MEDIO:   FORMAS_MEDIO,
  DIFICIL: FORMAS_DIFICIL,
  EXPERTO: FORMAS_EXPERTO
};

// Cuántas figuras distintas se usan en cada ronda por nivel (esto no cambió:
// sigue siendo 3/5/6/8 como antes — solo cambió de dónde se eligen).
const CANTIDAD_FORMAS_POR_NIVEL: Record<string, number> = {
  FACIL: 3,
  MEDIO: 5,
  DIFICIL: 6,
  EXPERTO: 8
};

// rotacionesPosibles: rotaciones iniciales de las piezas no simétricas
//   [270]        → siempre 1 clic para corregir  (más fácil)
//   [90,270]     → 1 o 3 clics
//   [90,180,270] → hasta 3 clics                 (más difícil)
const CONFIG: Record<string, { tiempo: number; rotacionesPosibles: number[]; siguiente: Nivel | null }> = {
  FACIL:   { tiempo: 50, rotacionesPosibles: [270],          siguiente: 'MEDIO'   },
  MEDIO:   { tiempo: 42, rotacionesPosibles: [90, 270],      siguiente: 'DIFICIL' },
  DIFICIL: { tiempo: 35, rotacionesPosibles: [90, 180, 270], siguiente: 'EXPERTO' },
  EXPERTO: { tiempo: 28, rotacionesPosibles: [90, 180, 270], siguiente: null       }
};

// Colores vivos para las piezas
export const COLORES_PIEZAS = [
  '#B8A7F0', '#7ECEC4', '#FFD97D', '#FF8FAB',
  '#FF9D5C', '#6BCB77', '#4CC9F0', '#FF6B6B'
];

// Formas simétricas: no requieren rotación específica para encajar
export const FORMAS_SIMETRICAS = ['circulo', 'cuadrado', 'diamante', 'estrella', 'cruz'];

@Injectable({ providedIn: 'root' })
export class PiezasTiempoService {

  private readonly API = `${environment.apiUrl}/piezas-tiempo`;

  constructor(private http: HttpClient) {}

  generarConfig(nivel: Nivel): {
    formas: string[];
    tiempo: number;
    rotacionesPosibles: number[];
    siguiente: Nivel | null;
  } {
    const cfg = CONFIG[nivel] ?? CONFIG['FACIL'];
    const banco = FORMAS_POR_NIVEL[nivel] ?? FORMAS_POR_NIVEL['FACIL'];
    const cantidad = CANTIDAD_FORMAS_POR_NIVEL[nivel] ?? CANTIDAD_FORMAS_POR_NIVEL['FACIL'];
    // Se sortea el banco y se toman solo "cantidad" figuras — así la cantidad
    // de piezas por ronda no cambia, pero cuáles figuras salen sí varía.
    const formas = [...banco].sort(() => Math.random() - 0.5).slice(0, cantidad);
    return {
      formas,
      tiempo: cfg.tiempo,
      rotacionesPosibles: cfg.rotacionesPosibles,
      siguiente: cfg.siguiente
    };
  }

  guardarSesion(request: PiezasSesionRequest): void {
    this.http.post(`${this.API}/sesion`, request).subscribe({ error: () => {} });
  }
}
