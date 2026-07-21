// RF-29: Laberinto Cognitivo — tipos compartidos entre el componente, las utilidades
// de generación del laberinto y el servicio que habla con el backend.

export type EstadoJuego =
  | 'inicio'
  | 'despliegue'  // CA-01: laberinto visible pero movimiento bloqueado (3s)
  | 'jugando'
  | 'feedback'
  | 'resultados';

export type Mood = 'idle' | 'thinking' | 'excited' | 'celebrate' | 'encourage';

export type Direccion = 'ARRIBA' | 'ABAJO' | 'IZQUIERDA' | 'DERECHA';

export interface Posicion {
  fila: number;
  col: number;
}

export interface Paredes {
  arriba: boolean;
  abajo: boolean;
  izquierda: boolean;
  derecha: boolean;
}

export interface Celda {
  fila: number;
  col: number;
  paredes: Paredes;
}

export interface Laberinto {
  tamano: number;
  celdas: Celda[][]; // celdas[fila][col]
  inicio: Posicion;
  meta: Posicion;
  caminoOptimo: Posicion[]; // incluye inicio y meta
}

export interface PasoJugado {
  numeroPaso: number;
  direccion: Direccion;
  posicion: Posicion;
  esCallejonSinSalida: boolean;
  tiempoDesdeInicioMs: number;
  nivel: number;
}

export interface ResultadoRonda {
  nivel: number;
  tamano: number;
  pasosUsados: number;
  pasosOptimos: number;
  callejonesSinSalida: number;
  planifico: boolean; // CA-03 — solo tiene sentido real en la ronda 1
  tiempoMs: number;
}

// ── Contratos con el backend (mirror de los DTOs de Java) ──────────────────

export interface IniciarLaberintoRequest {
  perfilId: number;
}

export interface IniciarLaberintoResponse {
  sesionId: number;
  perfilId: number;
  juegoId: number;
  nivelId: number;
  nivelInicial: number;
  tamanoMapa: number;
  obstaculosDinamicos: boolean;
  tiempoDespliegueMs: number;
}

export interface RegistrarPasoRequest {
  numeroPaso: number;
  direccion: Direccion;
  posicionX: number;
  posicionY: number;
  esCallejonSinSalida: boolean;
  tiempoDesdeInicioMs: number;
  nivel: number;
}

export interface RegistrarPasoResponse {
  pasoId: number;
  pasosRegistrados: number;
  callejonesSinSalidaHastaAhora: number;
}

export interface FinalizarLaberintoRequest {
  rondasCompletadas: number;
  pasosUsadosTotal: number;
  pasosOptimosTotal: number;
  tiempoResolucionMsTotal: number;
  callejonesSinSalidaVisitadosTotal: number;
  planificoEnPrimerMovimiento: boolean;
  nivelMaximoAlcanzado: number;
}

export interface LaberintoResultadoResponse {
  sesionId: number;
  rondasCompletadas: number;
  pasosUsadosTotal: number;
  pasosOptimosTotal: number;
  porcentajeEficiencia: number;
  tiempoResolucionMsTotal: number;
  callejonesSinSalidaVisitadosTotal: number;
  planificoEnPrimerMovimiento: boolean;
  nivelMaximoAlcanzado: number;
  puntaje: number;
  completada: boolean;
}
