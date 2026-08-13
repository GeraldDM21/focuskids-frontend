import {
  Component, Input, OnChanges, OnDestroy, SimpleChanges,
  ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import Chart from 'chart.js/auto';

import { PadreService, SesionJuego } from '../../../features/padre/padre.service';
import { puntosDeTendencia } from '../../utils/regresion-lineal.util';
import { environment } from '../../../../environments/environment';

type RangoTiempo = 'semana' | 'mes' | '3meses' | 'todo';

interface JuegoOpcion { id: number; nombre: string; }

const MIN_SESIONES = 3;

const COLORES_NIVEL: Record<string, string> = {
  FACIL:   '#16A34A',
  MEDIO:   '#D97706',
  DIFICIL: '#DC2626',
};
const COLOR_DEFAULT = '#6366F1';

/**
 * Historia: gráficas de evolución de % aciertos y tiempo de respuesta.
 *
 * CA-01: línea de % aciertos, una serie por nivel, tooltip fecha/nivel/valor.
 * CA-02: línea de tiempo de respuesta promedio + tendencia de regresión lineal.
 * CA-03: selector de juego + selector de rango.
 * CA-04: Chart.js, responsivo, mensaje si hay menos de 3 sesiones.
 * CA-05: botón de descarga PNG por gráfica.
 */
@Component({
  selector: 'app-evolucion-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="evo-wrap">

  @if (loading) {
    <div class="evo-loader"><div class="evo-spinner"></div></div>
  } @else if (juegosDisponibles.length === 0) {
    <div class="evo-empty">
      <span style="font-size:36px">📊</span>
      <p>No se pudo cargar la lista de juegos. Intenta recargar la página.</p>
    </div>
  } @else {

    <!-- ── CA-03: selectores ── -->
    <div class="evo-controls">
      <div class="evo-field">
        <label>Juego</label>
        <select class="evo-select" [(ngModel)]="juegoSeleccionadoId" (ngModelChange)="onFiltroChange()">
          @for (j of juegosDisponibles; track j.id) {
            <option [ngValue]="j.id">{{ j.nombre }}</option>
          }
        </select>
      </div>
      <div class="evo-field">
        <label>Rango</label>
        <select class="evo-select" [(ngModel)]="rangoSeleccionado" (ngModelChange)="onFiltroChange()">
          <option value="semana">Última semana</option>
          <option value="mes">Último mes</option>
          <option value="3meses">Últimos 3 meses</option>
          <option value="todo">Todo el historial</option>
        </select>
      </div>
    </div>

    <!-- ── CA-04: barra de progreso hacia el mínimo de sesiones ── -->
    @if (sesionesFiltradas.length < MIN_SESIONES) {
      <div class="evo-progreso">
        <span style="font-size:32px">📈</span>
        <p class="evo-progreso-titulo">
          {{ sesionesFiltradas.length }} de {{ MIN_SESIONES }} sesiones de <strong>{{ nombreJuegoSeleccionado }}</strong>
          @if (rangoSeleccionado !== 'todo') { en el rango seleccionado }
        </p>
        <div class="evo-progreso-track">
          <div class="evo-progreso-fill" [style.width.%]="(sesionesFiltradas.length / MIN_SESIONES) * 100"></div>
        </div>
        <p class="evo-progreso-sub">
          @if (sesionesFiltradas.length === 0) {
            Aún no hay sesiones de este juego {{ rangoSeleccionado !== 'todo' ? 'en este rango' : '' }}.
          } @else {
            Faltan {{ MIN_SESIONES - sesionesFiltradas.length }} sesión{{ (MIN_SESIONES - sesionesFiltradas.length) !== 1 ? 'es' : '' }} para desbloquear la gráfica.
          }
        </p>
      </div>
    } @else {

      <!-- ── CA-01: % aciertos ── -->
      <div class="evo-card">
        <div class="evo-card-header">
          <h3 class="evo-card-title">Evolución de % de aciertos</h3>
          <button class="evo-btn-download" (click)="descargarPng('aciertos')">⬇ Descargar PNG</button>
        </div>
        <div class="evo-canvas-wrap">
          <canvas #canvasAciertos></canvas>
        </div>
      </div>

      <!-- ── CA-02: tiempo de respuesta ── -->
      <div class="evo-card">
        <div class="evo-card-header">
          <h3 class="evo-card-title">Evolución de tiempo de respuesta (ms)</h3>
          @if (conDatosTiempo.length >= MIN_SESIONES) {
            <button class="evo-btn-download" (click)="descargarPng('tiempo')">⬇ Descargar PNG</button>
          }
        </div>
        @if (conDatosTiempo.length >= MIN_SESIONES) {
          <div class="evo-canvas-wrap">
            <canvas #canvasTiempo></canvas>
          </div>
        } @else {
          <p class="evo-sin-tiempo">No hay suficientes sesiones con tiempo de respuesta registrado para esta gráfica.</p>
        }
      </div>

    }
  }

</div>
  `,
  styles: [`
    .evo-wrap { display:flex; flex-direction:column; gap:16px; width:100%; }
    .evo-loader { display:flex; justify-content:center; padding:40px; }
    .evo-spinner { width:32px; height:32px; border:3px solid #DDD6FE; border-top-color:#7C3AED; border-radius:50%; animation:evo-spin .8s linear infinite; }
    @keyframes evo-spin { to { transform:rotate(360deg); } }
    .evo-empty { background:white; border-radius:16px; padding:28px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .evo-empty p { color:#64748B; font-size:13.5px; }

    .evo-progreso { background:white; border-radius:16px; padding:28px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .evo-progreso-titulo { color:#334155; font-size:13.5px; font-weight:600; }
    .evo-progreso-titulo strong { color:#1E1B4B; }
    .evo-progreso-track { width:100%; max-width:320px; height:10px; background:#F3F0FF; border-radius:100px; overflow:hidden; margin-top:4px; }
    .evo-progreso-fill { height:100%; background:linear-gradient(90deg,#7C3AED,#A78BFA); border-radius:100px; transition:width .5s ease; }
    .evo-progreso-sub { color:#94A3B8; font-size:12.5px; }

    .evo-controls { display:flex; gap:14px; flex-wrap:wrap; }
    .evo-field { display:flex; flex-direction:column; gap:5px; min-width:180px; }
    .evo-field label { font-size:12px; font-weight:700; color:#64748B; }
    .evo-select { padding:9px 12px; border:1.5px solid #E4DEFF; border-radius:10px; font-size:13.5px; font-family:inherit; color:#1E1B4B; background:white; outline:none; }
    .evo-select:focus { border-color:#7C3AED; }

    .evo-card { background:white; border-radius:16px; padding:18px 20px; box-shadow:0 2px 10px rgba(91,33,182,.06); width:100%; box-sizing:border-box; }
    .evo-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
    .evo-card-title { font-size:13.5px; font-weight:800; color:#1E1B4B; }
    .evo-btn-download { background:#F3F0FF; color:#5B21B6; border:1.5px solid #DDD6FE; border-radius:10px; padding:6px 12px; font-size:12px; font-weight:700; cursor:pointer; }
    .evo-btn-download:hover { background:#EDE9FF; }
    .evo-canvas-wrap { position:relative; width:100%; height:280px; }
    .evo-sin-tiempo { color:#94A3B8; font-size:13px; text-align:center; padding:24px 0; }
  `]
})
export class EvolucionChartComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input({ required: true }) perfilId!: number;

  @ViewChild('canvasAciertos') canvasAciertosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasTiempo')   canvasTiempoRef?:   ElementRef<HTMLCanvasElement>;

  readonly MIN_SESIONES = MIN_SESIONES;

  loading = true;
  todasLasSesiones: SesionJuego[] = [];

  /** Catálogo completo de juegos (GET /api/juegos) — se carga una sola vez, no depende del perfil. */
  private catalogoJuegos: JuegoOpcion[] = [];

  juegoSeleccionadoId: number | null = null;
  rangoSeleccionado: RangoTiempo = 'todo';

  sesionesFiltradas: SesionJuego[] = [];

  /** Lista para el selector: el catálogo completo (12 juegos); si por algún motivo no cargó,
   *  cae de vuelta a derivar la lista solo de los juegos que el niño ya jugó. */
  get juegosDisponibles(): JuegoOpcion[] {
    if (this.catalogoJuegos.length > 0) return this.catalogoJuegos;
    const mapaJuegos = new Map<number, string>();
    for (const s of this.todasLasSesiones) mapaJuegos.set(s.juego.id, s.juego.nombre);
    return Array.from(mapaJuegos.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get nombreJuegoSeleccionado(): string {
    return this.juegosDisponibles.find(j => j.id === this.juegoSeleccionadoId)?.nombre ?? '';
  }

  get conDatosTiempo(): SesionJuego[] {
    return this.sesionesFiltradas.filter(s => s.tiempoRespuestaPromedioMs != null);
  }

  private chartAciertos?: Chart;
  private chartTiempo?: Chart;
  private vistaLista = false;

  constructor(
    private padreService: PadreService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.http.get<{ id: number; nombre: string }[]>(`${environment.apiUrl}/juegos`).pipe(
      catchError(() => of([] as { id: number; nombre: string }[]))
    ).subscribe(lista => {
      this.catalogoJuegos = lista
        .map(j => ({ id: j.id, nombre: j.nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      this.seleccionarJuegoPorDefecto();
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['perfilId'] && this.perfilId) {
      this.cargarSesiones();
    }
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;
    this.renderizarSiCorresponde();
  }

  ngOnDestroy(): void {
    this.chartAciertos?.destroy();
    this.chartTiempo?.destroy();
  }

  private seleccionarJuegoPorDefecto(): void {
    if (this.juegoSeleccionadoId == null && this.juegosDisponibles.length > 0) {
      this.juegoSeleccionadoId = this.juegosDisponibles[0].id;
      this.aplicarFiltros();
    }
  }

  private cargarSesiones(): void {
    this.loading = true;
    // Nuevo perfil: reiniciamos la selección para que se recalcule con los juegos de este niño.
    this.juegoSeleccionadoId = null;
    this.cdr.detectChanges();

    this.padreService.getSesiones(this.perfilId).pipe(
      catchError(() => of([] as SesionJuego[]))
    ).subscribe(sesiones => {
      // Solo sesiones completas y con métricas utilizables (ver nota de diseño:
      // sesionValida puede venir null en sesiones anteriores al campo, así que
      // no se exige estrictamente sesionValida === true).
      this.todasLasSesiones = sesiones.filter(s =>
        s.completada === true && s.porcentajeAciertos != null
      );

      this.seleccionarJuegoPorDefecto();

      this.loading = false;
      this.aplicarFiltros();
      this.cdr.detectChanges();
      this.renderizarSiCorresponde();
    });
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
    this.cdr.detectChanges();
    this.renderizarSiCorresponde();
  }

  // ── CA-03: filtrado por juego + rango ─────────────────────────────────
  private aplicarFiltros(): void {
    if (this.juegoSeleccionadoId == null) {
      this.sesionesFiltradas = [];
      return;
    }

    const desde = this.calcularFechaDesde(this.rangoSeleccionado);

    this.sesionesFiltradas = this.todasLasSesiones
      .filter(s => s.juego.id === this.juegoSeleccionadoId)
      .filter(s => !desde || new Date(s.fin ?? s.inicio) >= desde)
      .sort((a, b) => new Date(a.fin ?? a.inicio).getTime() - new Date(b.fin ?? b.inicio).getTime());
  }

  private calcularFechaDesde(rango: RangoTiempo): Date | null {
    const ahora = new Date();
    switch (rango) {
      case 'semana':  return new Date(ahora.getTime() - 7  * 24 * 60 * 60 * 1000);
      case 'mes':      { const d = new Date(ahora); d.setMonth(d.getMonth() - 1); return d; }
      case '3meses':   { const d = new Date(ahora); d.setMonth(d.getMonth() - 3); return d; }
      case 'todo':
      default:         return null;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  private renderizarSiCorresponde(): void {
    if (!this.vistaLista || this.loading) return;

    // Los <canvas> solo existen en el DOM cuando sesionesFiltradas.length >= MIN_SESIONES
    // (el @if los oculta). Esperamos al siguiente tick para que Angular los pinte.
    setTimeout(() => {
      this.chartAciertos?.destroy();
      this.chartTiempo?.destroy();
      this.chartAciertos = undefined;
      this.chartTiempo   = undefined;

      if (this.sesionesFiltradas.length < MIN_SESIONES) return;

      this.renderGraficaAciertos();
      this.renderGraficaTiempo();
    });
  }

  // ── CA-01 ───────────────────────────────────────────────────────────
  private renderGraficaAciertos(): void {
    const canvas = this.canvasAciertosRef?.nativeElement;
    if (!canvas) return;

    const niveles = Array.from(new Set(this.sesionesFiltradas.map(s => s.nivel.nivel)));
    const etiquetas = this.sesionesFiltradas.map(s => this.formatFecha(s.fin ?? s.inicio));

    const datasets = niveles.map(nivel => {
      const color = COLORES_NIVEL[nivel] ?? COLOR_DEFAULT;
      const datos = this.sesionesFiltradas.map(s =>
        s.nivel.nivel === nivel ? (s.porcentajeAciertos ?? null) : null
      );
      return {
        label: nivel,
        data: datos,
        borderColor: color,
        backgroundColor: color,
        spanGaps: true,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    this.chartAciertos = new Chart(canvas, {
      type: 'line',
      data: { labels: etiquetas, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: { title: { display: true, text: 'Fecha' } },
          y: {
            title: { display: true, text: '% de aciertos' },
            min: 0, max: 100
          }
        },
        plugins: {
          legend: { display: niveles.length > 1 },
          tooltip: {
            callbacks: {
              title: (items: any[]) => `Fecha: ${items[0]?.label ?? ''}`,
              label: (item: any) => `Nivel: ${item.dataset.label} — ${item.formattedValue}% aciertos`
            }
          }
        }
      }
    });
  }

  // ── CA-02 ───────────────────────────────────────────────────────────
  private renderGraficaTiempo(): void {
    const canvas = this.canvasTiempoRef?.nativeElement;
    if (!canvas) return;

    const conTiempo = this.sesionesFiltradas.filter(s => s.tiempoRespuestaPromedioMs != null);
    if (conTiempo.length < MIN_SESIONES) return;

    const etiquetas = conTiempo.map(s => this.formatFecha(s.fin ?? s.inicio));
    const valores = conTiempo.map(s => s.tiempoRespuestaPromedioMs as number);
    const tendencia = puntosDeTendencia(valores);

    this.chartTiempo = new Chart(canvas, {
      type: 'line',
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: 'Tiempo de respuesta (ms)',
            data: valores,
            borderColor: '#2563EB',
            backgroundColor: '#2563EB',
            tension: 0.25,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Tendencia (regresión lineal)',
            data: tendencia,
            borderColor: '#94A3B8',
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 2,
            tension: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: { title: { display: true, text: 'Fecha' } },
          y: { title: { display: true, text: 'Tiempo de respuesta (ms)' } }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              title: (items: any[]) => `Fecha: ${items[0]?.label ?? ''}`,
            }
          }
        }
      }
    });
  }

  // ── CA-05 ───────────────────────────────────────────────────────────
  descargarPng(cual: 'aciertos' | 'tiempo'): void {
    const chart = cual === 'aciertos' ? this.chartAciertos : this.chartTiempo;
    if (!chart) return;

    const link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = `evolucion-${cual}-perfil${this.perfilId}.png`;
    link.click();
  }

  private formatFecha(fechaIso: string): string {
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
