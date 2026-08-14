export type EstadoJuego = 'inicio' | 'juego' | 'resultados';
export type MascotMood = 'idle' | 'thinking' | 'celebrate' | 'encourage';

export type TipoEstimulo = 'go' | 'nogo';
export type DireccionVuelo = 'ltr' | 'rtl';

export interface DefinicionEstimulo {
  tipo: TipoEstimulo;
  emoji: string;
  label: string;
}

export interface EstimuloEnVuelo extends DefinicionEstimulo {
  top: number;
  duracionMs: number;
  direccion: DireccionVuelo;
}

export interface EnsayoResultado {
  indice: number;
  tipo: TipoEstimulo;
  presiono: boolean;
  tiempoReaccionMs: number | null;
  correcto: boolean;
  ventanaLimiteMs: number;
  timestamp: number;
}

export interface MetricasSesion {
  totalEnsayos: number;
  ensayosGo: number;
  ensayosNoGo: number;
  aciertosGo: number;
  falsasAlarmasNoGo: number;
  inhibicionesCorrectas: number;
  tasaAciertosGo: number;
  tasaFalsasAlarmasNoGo: number;
  tiempoReaccionPromedioGoMs: number;
  ssrtMs: number;
  indiceImpulsividad: number;
}

export interface SesionGuardada {
  fecha: number;
  ssrtMs: number;
  indiceImpulsividad: number;
  nivelActual: number;
  probabilidadNoGo: number;
}

export interface ComparacionSesion {
  huboSesionAnterior: boolean;
  mejoraSSRTPorc: number;
  mejoraSignificativa: boolean;
}

export interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  dur: number;
  size: number;
}
