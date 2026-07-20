import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SesionJuego, Metrica, AlertaRegresion } from '../padre/padre.service';

export interface AlumnoDocente {
  id: number;
  nombre: string;
  edad: number;
  avatar?: string;
  diagnostico?: string;
  activo: boolean;
  padre?: { id: number; usuario?: { nombre?: string; } };
}

export interface DocenteInfo {
  id: number;
  usuario: { id: number; nombre: string; email: string; };
  institucion?: string;
  gradoGrupo?: string;
}

export interface Asignacion {
  id?: number;
  titulo: string;
  descripcion?: string;
  minimoSesiones: number;
  fechaLimite: string;
  juego?: { id: number; nombre: string; } | null;
}

export interface AsignacionPerfil {
  id: number;
  asignacion: Asignacion;
  sesionesCompletadas: number;
  completada: boolean;
  fechaCompletada?: string;
}

export interface ResumenCalificacion {
  promedio: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Alumnos ──────────────────────────────────────────────────────────────
  getAlumnos(docenteUsuarioId: number) {
    return this.http.get<AlumnoDocente[]>(`${this.api}/perfil/docente/${docenteUsuarioId}`);
  }

  // ── Sesiones / Métricas / Alertas ────────────────────────────────────────
  getSesiones(perfilId: number) {
    return this.http.get<SesionJuego[]>(`${this.api}/sesiones/perfil/${perfilId}`);
  }
  getMetricas(perfilId: number) {
    return this.http.get<Metrica[]>(`${this.api}/reportes/perfil/${perfilId}/metricas`);
  }
  getAlertas(perfilId: number) {
    return this.http.get<AlertaRegresion[]>(`${this.api}/reportes/perfil/${perfilId}/alertas/pendientes`);
  }

  // ── Lista de docentes (para que el padre elija) ───────────────────────────
  getListaDocentes() {
    return this.http.get<DocenteInfo[]>(`${this.api}/docente/lista`);
  }

  // ── Asignar / desasignar docente a perfil ────────────────────────────────
  asignarDocente(perfilId: number, docenteId: number) {
    return this.http.patch<any>(`${this.api}/docente/asignar/${perfilId}/${docenteId}`, {});
  }
  desasignarDocente(perfilId: number) {
    return this.http.delete<any>(`${this.api}/docente/desasignar/${perfilId}`);
  }

  // ── Asignaciones del docente ──────────────────────────────────────────────
  crearAsignacion(docenteUsuarioId: number, data: Asignacion) {
    return this.http.post<Asignacion>(`${this.api}/asignaciones/docente/${docenteUsuarioId}`, data);
  }
  getAsignacionesDocente(docenteUsuarioId: number) {
    return this.http.get<Asignacion[]>(`${this.api}/asignaciones/docente/${docenteUsuarioId}`);
  }
  eliminarAsignacion(id: number) {
    return this.http.delete<void>(`${this.api}/asignaciones/${id}`);
  }

  // ── Asignaciones del niño ─────────────────────────────────────────────────
  getAsignacionesPerfil(perfilId: number) {
    return this.http.get<AsignacionPerfil[]>(`${this.api}/asignaciones/perfil/${perfilId}`);
  }

  // ── Calificaciones ────────────────────────────────────────────────────────
  getResumenCalificacion(docenteId: number) {
    return this.http.get<ResumenCalificacion>(`${this.api}/docente/${docenteId}/calificaciones/resumen`);
  }
  calificar(docenteId: number, padreUsuarioId: number, puntuacion: number, comentario: string) {
    return this.http.post<any>(`${this.api}/docente/${docenteId}/calificaciones`,
      { padreUsuarioId, puntuacion, comentario });
  }
}
