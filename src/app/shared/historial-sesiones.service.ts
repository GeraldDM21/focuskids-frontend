import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

// ── RF-Historial: Historial detallado de sesiones por juego ─────────────────
// Servicio compartido entre padre y docente (mismos endpoints de /api/reportes).

export interface SesionHistorial {
  id: number;
  juego: { id: number; nombre: string; tipo?: string; };
  nivel: { id: number; nivel: string; };
  inicio: string;
  fin?: string;
  puntaje?: number;
  completada?: boolean;
  duracionSesionSegundos?: number;
  totalIntentos?: number;
  totalAciertos?: number;
  porcentajeAciertos?: number;
  tiempoRespuestaPromedioMs?: number;
  rachaMaxAciertos?: number;
  sesionConcentracionBaja?: boolean;
  sesionValida?: boolean;
}

export interface HistorialPage {
  content: SesionHistorial[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface HistorialFiltros {
  page?: number;
  juegoId?: number | null;
  nivel?: string;
  fechaDesde?: string;   // ISO datetime
  fechaHasta?: string;   // ISO datetime
}

export interface ComparacionSesion {
  sesionActualId: number;
  haySesionAnterior: boolean;
  sesionAnteriorId?: number;
  fechaSesionAnterior?: string;
  porcentajeAciertosActual?: number;
  porcentajeAciertosAnterior?: number;
  deltaPorcentajeAciertos?: number;
  tiempoRespuestaPromedioMsActual?: number;
  tiempoRespuestaPromedioMsAnterior?: number;
  deltaTiempoRespuestaPromedioMs?: number;
  puntajeActual?: number;
  puntajeAnterior?: number;
  deltaPuntaje?: number;
  duracionSegundosActual?: number;
  duracionSegundosAnterior?: number;
  deltaDuracionSegundos?: number;
}

export interface JuegoOpcion {
  id: number;
  nombre: string;
  tipo?: string;
}

@Injectable({ providedIn: 'root' })
export class HistorialSesionesService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Selector de juegos (CA-02). Reutiliza el endpoint ya existente de catálogo. */
  getJuegos() {
    return this.http.get<JuegoOpcion[]>(`${this.api}/juegos`);
  }

  /** CA-01/CA-02/CA-03: lista paginada con filtros combinables. */
  obtenerHistorial(perfilId: number, filtros: HistorialFiltros) {
    let params = new HttpParams();
    if (filtros.page != null)      params = params.set('page', filtros.page.toString());
    if (filtros.juegoId != null)   params = params.set('juegoId', filtros.juegoId.toString());
    if (filtros.nivel)             params = params.set('nivel', filtros.nivel);
    if (filtros.fechaDesde)        params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta)        params = params.set('fechaHasta', filtros.fechaHasta);
    return this.http.get<HistorialPage>(`${this.api}/reportes/perfil/${perfilId}/historial`, { params });
  }

  /** CA-04: comparación contra la sesión anterior del mismo juego. */
  obtenerComparacion(perfilId: number, sesionId: number) {
    return this.http.get<ComparacionSesion>(
      `${this.api}/reportes/perfil/${perfilId}/historial/${sesionId}/comparacion`
    );
  }

  /** CA-05: exporta a PDF el historial con los filtros actualmente aplicados. */
  exportarPdf(perfilId: number, filtros: Omit<HistorialFiltros, 'page'>) {
    let params = new HttpParams();
    if (filtros.juegoId != null) params = params.set('juegoId', filtros.juegoId.toString());
    if (filtros.nivel)           params = params.set('nivel', filtros.nivel);
    if (filtros.fechaDesde)      params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta)      params = params.set('fechaHasta', filtros.fechaHasta);
    return this.http.get(`${this.api}/reportes/perfil/${perfilId}/historial/exportar-pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
