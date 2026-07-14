export type UsuarioRol = 'NINO' | 'PADRE' | 'DOCENTE' | 'ADMINISTRADOR';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  rol: UsuarioRol;
  telefono?: string;
  relacionConNino?: string;
  institucion?: string;
  gradoGrupo?: string;
  nivelAcceso?: string;
}

export interface AuthResponse {
  token?: string;
  usuarioId: number;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  mensaje?: string;
}
