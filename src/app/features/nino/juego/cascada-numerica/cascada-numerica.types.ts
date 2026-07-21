export type EstadoJuego =
  | 'inicio'
  | 'cuenta'
  | 'jugando'
  | 'feedback'
  | 'resultados';

export type Mood =
  | 'idle'
  | 'thinking'
  | 'excited'
  | 'celebrate'
  | 'encourage';

export type OperadorMatematico =
  | '+'
  | '-'
  | '×';

export type TipoResultado =
  | 'ACIERTO'
  | 'ERROR'
  | 'OMISION';

export interface OperacionMatematica {
  numero1: number;
  numero2: number;
  operador: OperadorMatematico;
  resultado: number;
  texto: string;
}

export interface NumeroCayendo {
  id: number;
  valor: number;
  correcto: boolean;
  posicionX: number;
  duracionMs: number;
  seleccionado: boolean;
}

export interface ResultadoOperacion {
  numeroOperacion: number;

  numero1: number;
  numero2: number;
  operador: OperadorMatematico;

  resultadoCorrecto: number;
  respuestaSeleccionada: number | null;

  tipoResultado: TipoResultado;

  tiempoRespuestaMs: number | null;
  velocidadCaidaMs: number;
  nivel: number;
}

export interface IniciarCascadaRequest {
  perfilId: number;
}

export interface IniciarCascadaResponse {
  sesionId: number;
  perfilId: number;
  juegoId: number;
  nivelId: number;

  nivelInicial: number;
  velocidadCaidaMs: number;

  maxOperaciones: number;
  duracionMaximaSegundos: number;
}

export interface RegistrarOperacionResponse {
  operacionId: number;
  operacionesRegistradas: number;

  nivelSugerido: number;
  velocidadSugeridaMs: number;

  precisionUltimasOperaciones: number;
  dificultadModificada: boolean;
}

export interface FinalizarCascadaRequest {
  aciertos: number;
  errores: number;
  omisiones: number;
  maxCombo: number;
  duracionTotalMs: number;
  nivelFinal: number;
}

export interface CascadaResultadoResponse {
  sesionId: number;
  operacionesCompletadas: number;

  aciertos: number;
  errores: number;
  omisiones: number;

  precisionPorcentaje: number;
  tiempoRespuestaPromedioMs: number;
  velocidadPromedioMs: number;

  maxCombo: number;
  nivelFinal: number;
  puntaje: number;

  completada: boolean;
}
