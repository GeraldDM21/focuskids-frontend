import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SesionJuego {
  id: number;
  juego: { id: number; nombre: string; tipo?: string };
  nivel: { id: number; nivel: string };
  inicio: string;
  fin?: string;
  puntaje?: number;
  completada?: boolean;
  // Motor de IA / gráficas de evolución:
  porcentajeAciertos?: number;
  tiempoRespuestaPromedioMs?: number | null;
  sesionValida?: boolean;
}

export interface Metrica {
  id: number;
  sesion: { id: number };
  tiempoReaccionProm?: number;
  precisionPct?: number;
  errores?: number;
  zonaFallo?: string;
}

export interface AlertaRegresion {
  id: number;
  fecha: string;
  descripcion: string;
  vista: boolean;
}

export interface Notificacion {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  ninoPerfil?: { id: number; nombre: string } | null;
  juego?: { id: number; nombre: string } | null;
  sesionesResaltadas?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PadreService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSesiones(perfilId: number) {
    return this.http.get<SesionJuego[]>(`${this.api}/sesiones/perfil/${perfilId}`);
  }

  getMetricas(perfilId: number) {
    return this.http.get<Metrica[]>(`${this.api}/reportes/perfil/${perfilId}/metricas`);
  }

  getAlertasPendientes(perfilId: number) {
    return this.http.get<AlertaRegresion[]>(
      `${this.api}/reportes/perfil/${perfilId}/alertas/pendientes`,
    );
  }

  getNotificaciones(usuarioId: number) {
    return this.http.get<Notificacion[]>(`${this.api}/notificaciones/usuario/${usuarioId}`);
  }

  marcarLeida(notifId: number) {
    return this.http.put<Notificacion>(`${this.api}/notificaciones/${notifId}/leer`, {});
  }

  marcarTodasLeidas(usuarioId: number) {
    return this.http.put<void>(`${this.api}/notificaciones/usuario/${usuarioId}/leer-todas`, {});
  }

  getConfiguracionPadre(usuarioId: number) {
    return this.http.get<{
      padreId: number;
      preferenciaResumenSemanal: boolean;
      notificacionesInAppActivas: boolean;
    }>(`${this.api}/padre/configuracion?usuarioId=${usuarioId}`);
  }

  toggleResumenSemanal(usuarioId: number, activo: boolean) {
    return this.http.patch<{ preferenciaResumenSemanal: boolean }>(
      `${this.api}/padre/resumen-semanal?usuarioId=${usuarioId}`,
      { activo },
    );
  }

  // CA-05 (Notificaciones in-app): activa/desactiva el badge de la campana.
  toggleNotificacionesInApp(usuarioId: number, activo: boolean) {
    return this.http.patch<{ notificacionesInAppActivas: boolean }>(
      `${this.api}/padre/notificaciones-in-app?usuarioId=${usuarioId}`,
      { activo },
    );
  }
}
