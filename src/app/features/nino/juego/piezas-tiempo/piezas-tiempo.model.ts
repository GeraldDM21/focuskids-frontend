export type Nivel = 'FACIL' | 'MEDIO' | 'DIFICIL' | 'EXPERTO';

export interface PiezaData {
  id: string;
  forma: string;
  rotacion: number;   // 0 | 90 | 180 | 270
  color: string;
  colocada: boolean;
  seleccionada: boolean;
}

export interface SlotData {
  id: string;
  forma: string;
  ocupado: boolean;
  colorPieza?: string;
  animError: boolean;
  animOk: boolean;
}

export interface PiezasSesionRequest {
  perfilId: number;
  nivel: string;
  piezasTotales: number;
  piezasColocadas: number;
  rotaciones: number;
  piezasFallidas: number;
  tiempoUsadoSegundos: number;
  tiempoTotalSegundos: number;
  puntosBonus: number;
  completada: boolean;
  subioNivel: boolean;
}
