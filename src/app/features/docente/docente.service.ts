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
  padre?: { id: number; usuario?: { nombre?: string } };
}

export interface DocenteInfo {
  id: number;
  usuario: { id: number; nombre: string; email: string };
  institucion?: string;
  gradoGrupo?: string;
}

export interface Asignacion {
  id?: number;
  titulo: string;
  descripcion?: string;
  minimoSesiones: number;
  fechaLimite: string;
  juego?: { id: number; nombre: string } | null;
  /** Al crear: id del alumno específico (si no se manda, aplica a toda la clase). */
  perfilId?: number | null;
  /** Al listar: nombres de los alumnos enlazados a esta asignación (null/vacío = toda la clase). */
  alumnosAsignados?: string[] | null;
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

// ── Calendario ───────────────────────────────────────────────────────────
export interface EventoCalendarioItem {
  id: number;
  origen: 'EVENTO' | 'ASIGNACION';
  tipo: 'CITA' | 'RECORDATORIO' | 'ASIGNACION';
  titulo: string;
  descripcion?: string | null;
  fecha: string;          // YYYY-MM-DD
  hora?: string | null;   // HH:mm:ss, null = todo el día
  perfilId?: number | null;
  perfilNombre?: string | null;
}

export interface EventoCalendarioRequest {
  perfilId?: number | null;
  tipo: 'CITA' | 'RECORDATORIO';
  titulo: string;
  descripcion?: string | null;
  fecha: string;           // YYYY-MM-DD
  hora?: string | null;    // HH:mm
}

// ── Perfil docente (auto-servicio) ─────────────────────────────────────────
export interface DocenteProfileUpdate {
  nombre?: string;
  email?: string;
  institucion?: string;
  gradoGrupo?: string;
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
    return this.http.get<AlertaRegresion[]>(
      `${this.api}/reportes/perfil/${perfilId}/alertas/pendientes`,
    );
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
    return this.http.get<ResumenCalificacion>(
      `${this.api}/docente/${docenteId}/calificaciones/resumen`,
    );
  }
  calificar(docenteId: number, padreUsuarioId: number, puntuacion: number, comentario: string) {
    return this.http.post<any>(`${this.api}/docente/${docenteId}/calificaciones`, {
      padreUsuarioId,
      puntuacion,
      comentario,
    });
  }

  // ── Configuración / notificaciones in-app (CA-05) ───────────────────────
  getConfiguracionDocente(usuarioId: number) {
    return this.http.get<{ docenteId: number; notificacionesInAppActivas: boolean }>(
      `${this.api}/docente/configuracion?usuarioId=${usuarioId}`,
    );
  }
  toggleNotificacionesInApp(usuarioId: number, activo: boolean) {
    return this.http.patch<{ notificacionesInAppActivas: boolean }>(
      `${this.api}/docente/notificaciones-in-app?usuarioId=${usuarioId}`,
      { activo },
    );
  }

  // ── Calendario (citas / recordatorios + asignaciones combinadas) ─────────
  getCalendario(docenteUsuarioId: number, desde: string, hasta: string) {
    return this.http.get<EventoCalendarioItem[]>(`${this.api}/calendario/docente/${docenteUsuarioId}`, {
      params: { desde, hasta }
    });
  }
  crearEventoCalendario(docenteUsuarioId: number, data: EventoCalendarioRequest) {
    return this.http.post<any>(`${this.api}/calendario/docente/${docenteUsuarioId}`, data);
  }
  editarEventoCalendario(id: number, data: EventoCalendarioRequest) {
    return this.http.put<any>(`${this.api}/calendario/evento/${id}`, data);
  }
  eliminarEventoCalendario(id: number) {
    return this.http.delete<void>(`${this.api}/calendario/evento/${id}`);
  }
  /** Mueve la fecha límite de una asignación (editable directo desde el calendario). */
  moverFechaAsignacion(asignacionId: number, fechaLimite: string) {
    return this.http.patch<any>(`${this.api}/asignaciones/${asignacionId}/fecha`, { fechaLimite });
  }

  // ── Perfil del docente (auto-servicio) ────────────────────────────────────
  getPerfilDocente(usuarioId: number) {
    return this.http.get<DocenteInfo>(`${this.api}/docente/perfil`, { params: { usuarioId } });
  }
  actualizarPerfilDocente(usuarioId: number, data: DocenteProfileUpdate) {
    return this.http.put<DocenteInfo>(`${this.api}/docente/perfil`, data, { params: { usuarioId } });
  }
}
