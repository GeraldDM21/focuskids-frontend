export interface Juego {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  activo: boolean;
}

export interface NivelDificultad {
  id: number;
  juego: Juego;
  nombre: string;
  umbralMin: number;
  umbralMax: number;
}

export interface SesionJuego {
  id: number;
  inicio: string;
  fin?: string;
  puntaje?: number;
  completada: boolean;
}

export interface PerfilNino {
  id: number;
  nombre: string;
  edad: number;
  diagnostico?: string;
  avatar?: string;
}
