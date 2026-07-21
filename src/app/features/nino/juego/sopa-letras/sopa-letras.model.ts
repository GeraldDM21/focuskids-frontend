// Configuracion que llega del backend para iniciar el juego
export interface SopaLetrasConfig {
  tema: string;
  nivel: string;
  gridSize: number;
  palabras: string[];
  tiempoSegundos: number;
  nivelSiguiente: string | null;
}

// Lo que se envia al backend al terminar la sesion
export interface SopaLetrasSesionRequest {
  perfilId: number;
  tema: string;
  nivel: string;
  gridSize: number;
  palabrasTotales: number;
  palabrasEncontradas: number;
  errores: number;
  tiempoUsadoSegundos: number;
  tiempoTotalSegundos: number;
  completada: boolean;
  subioNivel: boolean;
}

// Representa una palabra colocada en la grilla con su posicion y estado
export interface PalabraColocada {
  palabra: string;
  startRow: number;
  startCol: number;
  direccion: 'H' | 'V';
  celdas: { row: number; col: number }[];
  encontrada: boolean;
}

// Temas disponibles del juego (CA-06)
export type Tema = 'CIENCIAS' | 'GEOGRAFIA' | 'MATEMATICAS';

// Niveles de dificultad disponibles (CA-02)
export type Nivel = 'FACIL' | 'MEDIO' | 'DIFICIL' | 'EXPERTO';
