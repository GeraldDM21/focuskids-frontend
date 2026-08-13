import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// CA-02: datos estructurados de una alerta de regresión (niño, juego y
// sesiones a resaltar), además de los campos genéricos de Notificacion.
export interface NotificacionAlerta {
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
export class NotificacionesService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNotificaciones(usuarioId: number) {
    return this.http.get<NotificacionAlerta[]>(`${this.api}/notificaciones/usuario/${usuarioId}`);
  }

  getNoLeidas(usuarioId: number) {
    return this.http.get<NotificacionAlerta[]>(
      `${this.api}/notificaciones/usuario/${usuarioId}/no-leidas`,
    );
  }

  marcarLeida(id: number) {
    return this.http.put<NotificacionAlerta>(`${this.api}/notificaciones/${id}/leer`, {});
  }

  marcarTodasLeidas(usuarioId: number) {
    return this.http.put<void>(`${this.api}/notificaciones/usuario/${usuarioId}/leer-todas`, {});
  }
}
