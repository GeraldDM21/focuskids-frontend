import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SesionJuego {
  id: number;
  juego:  { id: number; nombre: string; tipo?: string; };
  nivel:  { id: number; nivel: string; };
  inicio: string;
  fin?:   string;
  puntaje?:    number;
  completada?: boolean;
}

export interface Metrica {
  id: number;
  sesion: { id: number; };
  tiempoReaccionProm?: number;
  precisionPct?:       number;
  errores?:            number;
  zonaFallo?:          string;
}

export interface AlertaRegresion {
  id:          number;
  fecha:       string;
  descripcion: string;
  vista:       boolean;
}

export interface Notificacion {
  id:      number;
  tipo:    string;
  mensaje: string;
  leida:   boolean;
  fecha:   string;
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
    return this.http.get<AlertaRegresion[]>(`${this.api}/reportes/perfil/${perfilId}/alertas/pendientes`);
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
}
