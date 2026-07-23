export type NivelLab =
  | 'FACIL'
  | 'MEDIO'
  | 'DIFICIL'
  | 'EXPERTO';

export type EstadoLab =
  | 'inicio'
  | 'cargando'
  | 'jugando'
  | 'completado';

export type TipoResultado =
  | 'EXITO'
  | 'FALLO';

export interface IngredienteLab {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  color: string;
}

export interface ExperimentoLab {
  id: string;

  titulo: string;

  objetivo: string;

  pista: string;

  combinacionesCorrectas: Record<
    NivelLab,
    string[]
  >;

  resultadoExito: string;

  explicacionCientifica: Record<
    NivelLab,
    string
  >;

  emojiResultado: string;
}

export interface ConfigLab {
  nivel: NivelLab;
  ingredientes: IngredienteLab[];
  experimentos: ExperimentoLab[];
  cantidadExperimentos: number;
  siguiente: NivelLab | null;
}

export interface IniciarLabResponse {
  sesionId: number;
  perfilId: number;
  juegoId: number;
  nivelId: number;
  nivelSeleccionado: NivelLab;
  ingredientesIniciales: number;
  experimentosObjetivo: number;
}

export interface RegistrarIntentoRequest {
  numeroExperimento: number;
  experimentoCodigo: string;
  ingredientes: string[];
  exitoso: boolean;
  tiempoIntentoMs: number;
  intentosAcumuladosExperimento: number;
  nivel: NivelLab;
}

export interface RegistrarIntentoResponse {
  intentoId: number;
  intentosRegistrados: number;
  nivelSugerido: NivelLab;
  ingredientesSugeridos: number;
  dificultadModificada: boolean;
}

export interface FinalizarLabRequest {
  experimentosCompletados: number;
  hipotesisCorrectas: number;
  hipotesisIncorrectas: number;
  intentosTotales: number;
  tiempoTotalMs: number;
  nivelFinal: NivelLab;
}

export interface LabResultadoResponse {
  sesionId: number;
  experimentosCompletados: number;
  hipotesisCorrectas: number;
  hipotesisIncorrectas: number;
  intentosTotales: number;
  precisionPorcentaje: number;
  tiempoDescubrimientoPromedioMs: number;
  nivelFinal: NivelLab;
  nivelSugerido: NivelLab;
  puntaje: number;
  completada: boolean;
}
