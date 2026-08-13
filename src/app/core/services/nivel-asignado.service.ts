import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Nivel de dificultad que un docente o padre/tutor fija para un niño en un
// juego específico. Mientras exista, el niño solo puede jugar ese nivel: el
// backend lo hace cumplir al iniciar cada sesión (ver SesionService y los
// servicios dedicados de cada juego adaptativo).
export type NivelBloqueable = 'FACIL' | 'MEDIO' | 'DIFICIL';

export interface JuegoResumen {
  id: number;
  nombre: string;
}

export interface NivelAsignado {
  id: number;
  perfil: { id: number };
  juego: JuegoResumen;
  nivel: NivelBloqueable;
  asignadoPorUsuarioId: number;
  asignadoPorRol: string;
  fechaAsignacion: string;
}

@Injectable({ providedIn: 'root' })
export class NivelAsignadoService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Lista completa de juegos activos (para armar la tabla de niveles por juego).
  listarJuegos(): Observable<JuegoResumen[]> {
    return this.http.get<JuegoResumen[]>(`${this.api}/juegos`);
  }

  listarPorPerfil(perfilId: number): Observable<NivelAsignado[]> {
    return this.http.get<NivelAsignado[]>(`${this.api}/nivel-asignado/perfil/${perfilId}`);
  }

  asignar(perfilId: number, juegoId: number, nivel: NivelBloqueable): Observable<NivelAsignado> {
    return this.http.put<NivelAsignado>(
      `${this.api}/nivel-asignado/perfil/${perfilId}/juego/${juegoId}`,
      { nivel }
    );
  }

  quitar(perfilId: number, juegoId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/nivel-asignado/perfil/${perfilId}/juego/${juegoId}`);
  }
}
