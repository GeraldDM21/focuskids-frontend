export interface FocoExtremoConfig {
  nivel: string;
  cadenciaMs: number;
  duracionSegundos: number;
  ratioDistractor: number;
  estimuloObjetivo: string;
  poolDistractores: string[];
}

export interface FocoExtremoSesionRequest {
  perfilId: number;
  nivel: string;
  cadenciaFinalMs: number;
  totalEstimulos: number;
  totalObjetivos: number;
  totalDistractores: number;
  aciertos: number;
  omisiones: number;
  falsasAlarmas: number;
  tiempoReaccionPromedioMs: number | null;
  indicePrecision: number;
  indiceControlImpulsos: number;
  seRedujoCadencia: boolean;
  duracionSegundos: number;
}

export type TipoEstimulo = 'objetivo' | 'distractor';

export interface Estimulo {
  id: number;
  simbolo: string;
  tipo: TipoEstimulo;
  timestampMostrado: number;
  respondido: boolean;
  tiempoReaccionMs: number | null;
}

export interface ResultadoSesion {
  totalEstimulos: number;
  totalObjetivos: number;
  totalDistractores: number;
  aciertos: number;
  omisiones: number;
  falsasAlarmas: number;
  tiempoReaccionPromedioMs: number | null;
  indicePrecision: number;
  indiceControlImpulsos: number;
  cadenciaFinalMs: number;
  seRedujoCadencia: boolean;
}

export type Nivel = 'FACIL' | 'MEDIO' | 'DIFICIL' | 'EXPERTO';
