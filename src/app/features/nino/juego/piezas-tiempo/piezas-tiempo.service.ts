import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Nivel, PiezasSesionRequest } from './piezas-tiempo.model';

// Formas disponibles por nivel (CA-01 y CA-04)
const FORMAS_POR_NIVEL: Record<string, string[]> = {
  FACIL:   ['circulo', 'cuadrado', 'triangulo'],
  MEDIO:   ['circulo', 'cuadrado', 'triangulo', 'rectangulo', 'diamante'],
  DIFICIL: ['circulo', 'cuadrado', 'triangulo', 'rectangulo', 'diamante', 'pentagono'],
  EXPERTO: ['circulo', 'cuadrado', 'triangulo', 'rectangulo', 'diamante', 'pentagono', 'estrella', 'cruz']
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
    const formas = [...(FORMAS_POR_NIVEL[nivel] ?? FORMAS_POR_NIVEL['FACIL'])];
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
