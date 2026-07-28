// RF-36: Maratón Mental — tipos compartidos entre el servicio y el componente.

export type NivelMaraton = 'FACIL' | 'MEDIO' | 'DIFICIL' | 'EXPERTO';

export type FaseRonda = 'CALIBRACION_A' | 'CALIBRACION_B' | 'DUAL';

export type Estado =
  | 'inicio'
  | 'cargando'
  | 'calibracion_a'
  | 'calibracion_b'
  | 'transicion_dual'
  | 'dual'
  | 'completado';

// ── Config que devuelve el backend al iniciar sesión ─────────────────────
export interface IniciarMaratonResponse {
  sesionId: number;
  perfilId: number;
  juegoId: number;
  nivelId: number;
  nivelSeleccionado: NivelMaraton;
  rondasCalibracionPorTarea: number;
  rondasDuales: number;
  tiempoRondaMs: number;
  objetosMin: number;
  objetosMax: number;
  opcionesConteo: number;
  opcionesColor: number;
}

export interface RegistrarRondaRequest {
  numeroRonda: number;
  fase: FaseRonda;
  tareaARespondida: boolean;
  tareaACorrecta: boolean;
  tareaATiempoRespuestaMs: number | null;
  tareaBRespondida: boolean;
  tareaBCorrecta: boolean;
  tareaBTiempoRespuestaMs: number | null;
  nivel: NivelMaraton;
}

export interface RegistrarRondaResponse {
  rondaId: number;
  rondasRegistradas: number;
  reducirTareaA: boolean;
  reducirTareaB: boolean;
  costoDualAPorcentaje: number | null;
  costoDualBPorcentaje: number | null;
}

export interface FinalizarMaratonRequest {
  nivelFinal: NivelMaraton;
  tiempoTotalMs: number;
}

export interface MaratonResultadoResponse {
  sesionId: number;
  precisionIndividualAPorcentaje: number;
  precisionIndividualBPorcentaje: number;
  precisionDualAPorcentaje: number;
  precisionDualBPorcentaje: number;
  tiempoRespuestaIndividualAMs: number;
  tiempoRespuestaIndividualBMs: number;
  tiempoRespuestaDualAMs: number;
  tiempoRespuestaDualBMs: number;
  costoDualAPorcentaje: number;
  costoDualBPorcentaje: number;
  indiceInterferenciaPorcentaje: number;
  cargaCognitivaEstimada: number;
  cargaCognitivaCategoria: 'BAJA' | 'MEDIA' | 'ALTA';
  tareaMasDebil: 'A' | 'B' | 'NINGUNA';
  rondasDualesCompletadas: number;
  aciertosDualesTotales: number;
  erroresDualesTotales: number;
  nivelFinal: NivelMaraton;
  nivelSugerido: NivelMaraton;
  puntaje: number;
  completada: boolean;
}

// ── Estímulos de cada tarea (se generan en el navegador) ─────────────────
export interface EstimuloConteo {
  emoji: string;
  cantidad: number;
  opciones: number[];
}

export interface OpcionColor {
  id: string;
  nombre: string;
  hex: string;
}

export interface EstimuloColor {
  objetivo: OpcionColor;
  opciones: OpcionColor[];
}
