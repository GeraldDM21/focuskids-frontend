import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Juego, NivelDificultad, SesionJuego } from '../models/juego.model';

export interface IaRecomendacion {
  id: number;
  nivelRecomendado: NivelDificultad;
  nivelAnterior: NivelDificultad | null;
  tendencia: 'MEJORA' | 'ESTANCAMIENTO' | 'REGRESION' | 'SOBRESCRITO';
  confianza: number;
  motivo: string;
  fechaRecomendacion: string;
  sesionesOrigen: string;  // JSON array string
}

// ── Interfaces públicas ───────────────────────────────────────────────────────

export interface SessionClickEvent {
  id?: number;
  clickX?: number;
  clickY?: number;
  elementoId?: string;
  timestampMs?: number;
  fueAcierto?: boolean;
  tiempoReaccionElementoMs?: number;  // CA-08
}

export interface IniciarSesionRequest {
  perfilId: number;
  juegoId: number;
  nivelId: number;
}

export interface FinalizarSesionRequest {
  puntaje: number;
  totalIntentos: number;
  totalAciertos: number;
  porcentajeAciertos: number;
  tiempoRespuestaPromedioMs: number | null;  // null si CA-05 aplica
  rachaMaxAciertos: number;
  configVersion: string;
  sesionConcentracionBaja: boolean;
  intentosFallidosPorZona: string;           // JSON string CA-09
}

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ZonaFallos {
  superiorIzquierdo: number;
  superiorDerecho: number;
  inferiorIzquierdo: number;
  inferiorDerecho: number;
}

const STORAGE_KEY              = 'focuskids_sesion_pendiente';
const HEARTBEAT_MS             = 30_000;
const MAX_TIEMPO_RESPUESTA_MS  = 8000;
const MIN_TIEMPO_RESPUESTA_MS  = 1000;  // CA-05: excluir primeros 1000ms
const ELEMENT_REACTION_EXCLUDE = 500;   // CA-08: excluir primeros 500ms

// Servicio genérico para catálogo de juegos y ciclo de vida de sesiones con
// tracking completo de métricas (CA-01 a CA-09).
@Injectable({ providedIn: 'root' })
export class SesionJuegoService implements OnDestroy {

  private readonly juegosUrl   = `${environment.apiUrl}/juegos`;
  private readonly sesionesUrl = `${environment.apiUrl}/sesiones`;

  // ── Estado activo ─────────────────────────────────────────────────────────
  private sesionId: number | null = null;

  // Métricas acumuladas durante el juego
  private tiemposRespuestaMs: number[] = [];
  private rachaActual = 0;
  private rachaMax    = 0;
  private zonaFallos: ZonaFallos = {
    superiorIzquierdo: 0, superiorDerecho: 0,
    inferiorIzquierdo: 0, inferiorDerecho: 0
  };

  // Tiempo en que el elemento activo apareció en pantalla (CA-08)
  private elementoApareceMs: number | null = null;

  // Heartbeat y beforeunload (CA-04)
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly boundBeforeUnload = this.onBeforeUnload.bind(this);

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.detenerHeartbeat();
    window.removeEventListener('beforeunload', this.boundBeforeUnload);
  }

  // ══ Catálogo ═════════════════════════════════════════════════════════════

  listarJuegosActivos(): Observable<Juego[]> {
    return this.http.get<Juego[]>(this.juegosUrl);
  }

  obtenerNiveles(juegoId: number): Observable<NivelDificultad[]> {
    return this.http.get<NivelDificultad[]>(`${this.juegosUrl}/${juegoId}/niveles`);
  }

  // ══ Ciclo de vida ════════════════════════════════════════════════════════

  iniciarSesion(req: IniciarSesionRequest): Observable<SesionJuego> {
    return this.http.post<SesionJuego>(`${this.sesionesUrl}/iniciar`, req);
  }

  /**
   * Llamar tras iniciarSesion() exitoso.
   * Arranca heartbeat y beforeunload (CA-04).
   */
  comenzarTracking(sesionId: number): void {
    this.sesionId       = sesionId;
    this.tiemposRespuestaMs = [];
    this.rachaActual    = 0;
    this.rachaMax       = 0;
    this.zonaFallos     = { superiorIzquierdo: 0, superiorDerecho: 0, inferiorIzquierdo: 0, inferiorDerecho: 0 };
    this.elementoApareceMs = null;

    window.addEventListener('beforeunload', this.boundBeforeUnload);
    this.iniciarHeartbeat();
  }

  // ══ Tracking durante el juego ════════════════════════════════════════════

  /**
   * CA-07 / CA-08 / CA-09:
   * Registra cada interacción del niño con un elemento del juego.
   * - Calcula tiempo de reacción si marcarElementoAparece() fue llamado antes.
   * - Agrupa fallos por cuadrante de pantalla.
   * - Envía el evento al backend (best-effort, no bloquea UI).
   */
  trackClick(clickX: number, clickY: number, elementoId: string, fueAcierto: boolean): void {
    const ahora = Date.now();

    // CA-08: tiempo de reacción al elemento
    let tiempoReaccion: number | undefined;
    if (this.elementoApareceMs !== null) {
      const delta = ahora - this.elementoApareceMs;
      if (delta >= ELEMENT_REACTION_EXCLUDE) {
        tiempoReaccion = delta;
      }
      this.elementoApareceMs = null;
    }

    // CA-09: fallos por cuadrante
    if (!fueAcierto) {
      this.zonaFallos[this.calcularZona(clickX, clickY)]++;
    }

    // Racha de aciertos
    if (fueAcierto) {
      this.rachaActual++;
      if (this.rachaActual > this.rachaMax) this.rachaMax = this.rachaActual;
    } else {
      this.rachaActual = 0;
    }

    // Enviar al backend best-effort
    if (this.sesionId !== null) {
      const evento: SessionClickEvent = {
        clickX, clickY, elementoId,
        timestampMs: ahora,
        fueAcierto,
        tiempoReaccionElementoMs: tiempoReaccion,
      };
      this.registrarEvento(this.sesionId, evento).subscribe({ error: () => {} });
    }
  }

  /**
   * CA-08: marcar cuándo apareció el elemento interactivo en pantalla.
   * Llamar inmediatamente al mostrarlo (antes de que el niño pueda hacer click).
   */
  marcarElementoAparece(): void {
    this.elementoApareceMs = Date.now();
  }

  /**
   * CA-05: registrar tiempo de respuesta de una ronda.
   * Se excluyen los primeros 1000ms (tiempo de orientación inicial).
   */
  trackRespuestaMs(ms: number): void {
    if (ms >= MIN_TIEMPO_RESPUESTA_MS) {
      this.tiemposRespuestaMs.push(ms);
    }
  }

  // ══ Finalizar sesión ═════════════════════════════════════════════════════

  /**
   * CA-03: guardado asíncrono — pantalla de resultados visible de inmediato.
   * 3 reintentos con delay creciente. Si todos fallan → localStorage.
   */
  finalizarSesion(
    sesionId: number,
    puntaje: number,
    totalIntentos: number,
    totalAciertos: number,
    configVersion = '1.0'
  ): void {
    this.detenerHeartbeat();
    window.removeEventListener('beforeunload', this.boundBeforeUnload);

    const req = this.construirRequest(puntaje, totalIntentos, totalAciertos, configVersion);

    this.http.put<SesionJuego>(`${this.sesionesUrl}/${sesionId}/finalizar`, req)
      .pipe(
        // CA-03: 3 reintentos, delay de 3s entre cada uno
        retry({
          count: 3,
          delay: (_err, attempt) => timer(attempt * 3000)
        }),
        catchError(err => {
          // CA-03: fallback a localStorage si todos los reintentos fallan
          this.guardarEnLocalStorage(sesionId, req);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => localStorage.removeItem(STORAGE_KEY),
        error: () => {}  // ya persistido en localStorage
      });

    this.resetTracking();
  }

  // ══ Registro directo de eventos ══════════════════════════════════════════

  registrarEvento(sesionId: number, evento: SessionClickEvent): Observable<SessionClickEvent> {
    return this.http.post<SessionClickEvent>(`${this.sesionesUrl}/${sesionId}/eventos`, evento);
  }

  // ══ Recomendación de nivel IA ═════════════════════════════════════════════

  /**
   * Devuelve la recomendación de nivel vigente para un niño + juego.
   * Si el backend devuelve 204 (no hay recomendación aún), emite null.
   */
  obtenerRecomendacion(perfilId: number, juegoId: number): Observable<IaRecomendacion | null> {
    return this.http
      .get<IaRecomendacion>(`${environment.apiUrl}/ia/recomendacion/${perfilId}/${juegoId}`, {
        observe: 'response',
      })
      .pipe(
        map(resp => (resp.status === 204 ? null : resp.body)),
        catchError(() => of(null)),
      );
  }

  // ══ Heartbeat CA-04 ══════════════════════════════════════════════════════

  private iniciarHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.sesionId === null) return;
      const parcial = this.construirRequest(0, 0, 0, '1.0');
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sesionId: this.sesionId, ...parcial, parcial: true })
      );
    }, HEARTBEAT_MS);
  }

  private detenerHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ══ beforeunload CA-04 ═══════════════════════════════════════════════════

  private onBeforeUnload(): void {
    if (this.sesionId === null) return;
    const parcial = this.construirRequest(0, 0, 0, '1.0');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sesionId: this.sesionId, ...parcial, parcial: true })
    );
  }

  // ══ Helpers privados ═════════════════════════════════════════════════════

  /**
   * CA-05: promedio excluyendo tiempos > 8000ms.
   * Si todos superan el límite → null + concentracionBaja = true.
   */
  private calcularPromedioTiempo(): { promedio: number | null; concentracionBaja: boolean } {
    const validos = this.tiemposRespuestaMs.filter(t => t <= MAX_TIEMPO_RESPUESTA_MS);
    if (validos.length === 0) {
      return { promedio: null, concentracionBaja: this.tiemposRespuestaMs.length > 0 };
    }
    const suma = validos.reduce((a, b) => a + b, 0);
    return {
      promedio: Math.round((suma / validos.length) * 100) / 100,
      concentracionBaja: false
    };
  }

  /** CA-09: cuadrante de la pantalla según coordenadas del click. */
  private calcularZona(x: number, y: number): keyof ZonaFallos {
    const mitadX = window.innerWidth  / 2;
    const mitadY = window.innerHeight / 2;
    if (x < mitadX && y < mitadY)  return 'superiorIzquierdo';
    if (x >= mitadX && y < mitadY) return 'superiorDerecho';
    if (x < mitadX && y >= mitadY) return 'inferiorIzquierdo';
    return 'inferiorDerecho';
  }

  private construirRequest(
    puntaje: number,
    totalIntentos: number,
    totalAciertos: number,
    configVersion: string
  ): FinalizarSesionRequest {
    const { promedio, concentracionBaja } = this.calcularPromedioTiempo();
    const porcentaje = totalIntentos > 0
      ? Math.round((totalAciertos / totalIntentos) * 10000) / 100
      : 0;

    return {
      puntaje,
      totalIntentos,
      totalAciertos,
      porcentajeAciertos: porcentaje,
      tiempoRespuestaPromedioMs: promedio,
      rachaMaxAciertos: this.rachaMax,
      configVersion,
      sesionConcentracionBaja: concentracionBaja,
      intentosFallidosPorZona: JSON.stringify(this.zonaFallos),
    };
  }

  private guardarEnLocalStorage(sesionId: number, req: FinalizarSesionRequest): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sesionId, ...req }));
  }

  private resetTracking(): void {
    this.sesionId          = null;
    this.tiemposRespuestaMs = [];
    this.rachaActual       = 0;
    this.rachaMax          = 0;
    this.zonaFallos        = { superiorIzquierdo: 0, superiorDerecho: 0, inferiorIzquierdo: 0, inferiorDerecho: 0 };
    this.elementoApareceMs = null;
  }
}
