import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Juego, NivelDificultad, SesionJuego } from '../models/juego.model';

export interface SessionClickEvent {
  id?: number;
  clickX?: number;
  clickY?: number;
  elementoId?: string;
  timestampMs?: number;
  fueAcierto?: boolean;
}

export interface IniciarSesionRequest {
  perfilId: number;
  juegoId: number;
  nivelId: number;
}

// Servicio generico para catalogo de juegos y ciclo de vida de sesiones.
// Cualquier minijuego (Ritmo y Patron, Espejo Mental, etc.) puede reutilizarlo.
@Injectable({ providedIn: 'root' })
export class SesionJuegoService {
  private readonly juegosUrl = `${environment.apiUrl}/juegos`;
  private readonly sesionesUrl = `${environment.apiUrl}/sesiones`;

  constructor(private http: HttpClient) {}

  // ── Catalogo de juegos ──────────────────────────────
  listarJuegosActivos(): Observable<Juego[]> {
    return this.http.get<Juego[]>(this.juegosUrl);
  }

  obtenerJuegoPorNombre(nombre: string): Observable<Juego[]> {
    // El backend no expone /juegos/nombre todavia, filtramos sobre listarActivos.
    return this.listarJuegosActivos();
  }

  obtenerNiveles(juegoId: number): Observable<NivelDificultad[]> {
    return this.http.get<NivelDificultad[]>(`${this.juegosUrl}/${juegoId}/niveles`);
  }

  // ── Ciclo de vida de la sesion ──────────────────────
  iniciarSesion(req: IniciarSesionRequest): Observable<SesionJuego> {
    return this.http.post<SesionJuego>(`${this.sesionesUrl}/iniciar`, req);
  }

  finalizarSesion(sesionId: number, puntaje: number): Observable<SesionJuego> {
    return this.http.put<SesionJuego>(`${this.sesionesUrl}/${sesionId}/finalizar`, { puntaje });
  }

  registrarEvento(sesionId: number, evento: SessionClickEvent): Observable<SessionClickEvent> {
    return this.http.post<SessionClickEvent>(`${this.sesionesUrl}/${sesionId}/eventos`, evento);
  }
}
