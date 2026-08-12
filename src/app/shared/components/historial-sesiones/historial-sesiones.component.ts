import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  HistorialSesionesService,
  SesionHistorial,
  HistorialFiltros,
  ComparacionSesion,
  JuegoOpcion,
} from '../../historial-sesiones.service';

const NIVELES = [
  { val: 'FACIL', lbl: 'Fácil' },
  { val: 'MEDIO', lbl: 'Medio' },
  { val: 'DIFICIL', lbl: 'Difícil' },
  { val: 'EXPERTO', lbl: 'Experto' },
];

@Component({
  selector: 'app-historial-sesiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hs-root">
      <!-- ══ CABECERA ══ -->
      <div class="hs-header">
        <div class="hs-header-left">
          <button class="btn-back" (click)="volver()">← Volver</button>
          <div>
            <h1 class="hs-title">📅 Historial detallado de sesiones</h1>
            <p class="hs-sub">
              {{ nombrePerfil ? nombrePerfil : 'Historial completo por juego y nivel' }}
            </p>
          </div>
        </div>
        <button class="btn-export" [disabled]="exportando" (click)="exportarPdf()">
          {{ exportando ? '⏳ Generando…' : '⬇ Exportar a PDF' }}
        </button>
      </div>

      <!-- ══ FILTROS (CA-02) ══ -->
      <div class="filtros-card">
        <div class="filtros-row">
          <div class="filtro-group">
            <label class="filtro-label">Juego</label>
            <select class="filtro-input" [(ngModel)]="filtroJuegoId" (change)="buscar()">
              <option [ngValue]="null">— Todos —</option>
              @for (j of juegos; track j.id) {
                <option [ngValue]="j.id">{{ j.nombre }}</option>
              }
            </select>
      <div class="filtro-group">
        <label class="filtro-label">Nivel</label>
        <select class="filtro-input" [(ngModel)]="filtroNivel" (change)="buscar()">
          <option value="">— Todos —</option>
          @for (n of niveles; track n.val) {
            <option [value]="n.val">{{ n.lbl }}</option>
          }
        </select>
      </div>

      <div class="filtro-group">
        <label class="filtro-label">Desde</label>
        <input class="filtro-input" type="text" placeholder="DD/MM/AAAA" maxlength="10"
               [(ngModel)]="filtroFechaDesde" (input)="onFechaInput()"/>
      </div>

      <div class="filtro-group">
        <label class="filtro-label">Hasta</label>
        <input class="filtro-input" type="text" placeholder="DD/MM/AAAA" maxlength="10"
               [(ngModel)]="filtroFechaHasta" (input)="onFechaInput()"/>
      </div>

      <div class="filtro-group">
        <label class="filtro-label">Estado</label>
        <button class="btn-toggle" [class.activo]="soloCompletadas" (click)="toggleCompletadas()">
          {{ soloCompletadas ? '✓ Solo completadas' : 'Todas las sesiones' }}
        </button>
      </div>

      <div class="filtro-group filtro-group-btn">
        <button class="btn-limpiar" (click)="limpiarFiltros()">✕ Limpiar</button>
      </div>
    </div>

    @if (totalElements > 0) {
      <div class="filtro-meta">
        {{ totalElements }} sesion{{ totalElements !== 1 ? 'es' : '' }} encontrada{{ totalElements !== 1 ? 's' : '' }}
        · Página {{ paginaActual + 1 }} de {{ totalPaginas }}
      </div>
    }
  </div>

  <!-- ══ LISTA (CA-01 / CA-04) ══ -->
  @if (loading) {
    <div class="loader-wrap"><div class="spinner"></div></div>
  } @else if (sesiones.length === 0) {
    <div class="empty-state">
      <span class="empty-ico">🔍</span>
      <p>No se encontraron sesiones con los filtros actuales.</p>
      @if (hayFiltrosActivos) {
        <button class="btn-limpiar-empty" (click)="limpiarFiltros()">Limpiar filtros</button>
      }
    </div>
  } @else {
    <div class="sesiones-list">
      @for (s of sesiones; track s.id) {
        <div class="sesion-card" [class.expandida]="expandidaId === s.id">
          <div class="sesion-row" (click)="toggleExpandir(s)">
            <div class="sr-fecha">
              <div class="sr-fecha-dia">{{ formatFecha(s.inicio) }}</div>
              <div class="sr-juego">{{ s.juego?.nombre ?? '—' }}</div>
            </div>
            <div class="sr-nivel">
              <span class="nivel-badge" [class]="'nivel-' + (s.nivel?.nivel || '').toLowerCase()">
                {{ s.nivel?.nivel ?? '—' }}
              </span>
            </div>
            <div class="sr-metric">
              <div class="sr-metric-val">{{ s.porcentajeAciertos != null ? (s.porcentajeAciertos + '%') : '—' }}</div>
              <div class="sr-metric-lbl">Aciertos</div>
            </div>
            <div class="sr-metric">
              <div class="sr-metric-val">{{ formatMs(s.tiempoRespuestaPromedioMs) }}</div>
              <div class="sr-metric-lbl">T. respuesta</div>
            </div>
            <div class="sr-metric">
              <div class="sr-metric-val">{{ formatDuracion(s.duracionSesionSegundos) }}</div>
              <div class="sr-metric-lbl">Duración</div>
            </div>
            <div class="sr-estado" [class.ok]="s.completada" [class.inc]="!s.completada">
              {{ s.completada ? '✓ Completa' : '✗ Incompleta' }}
            </div>
            <div class="sr-chevron">{{ expandidaId === s.id ? '▲' : '▼' }}</div>
          </div>

          <div class="filtro-group">
            <label class="filtro-label">Nivel</label>
            <select class="filtro-input" [(ngModel)]="filtroNivel" (change)="buscar()">
              <option value="">— Todos —</option>
              @for (n of niveles; track n.val) {
                <option [value]="n.val">{{ n.lbl }}</option>
              }
            </select>
          </div>

          <div class="filtro-group">
            <label class="filtro-label">Desde</label>
            <input
              class="filtro-input"
              type="text"
              placeholder="DD/MM/AAAA"
              maxlength="10"
              [(ngModel)]="filtroFechaDesde"
              (input)="onFechaInput()"
            />
          </div>

          <div class="filtro-group">
            <label class="filtro-label">Hasta</label>
            <input
              class="filtro-input"
              type="text"
              placeholder="DD/MM/AAAA"
              maxlength="10"
              [(ngModel)]="filtroFechaHasta"
              (input)="onFechaInput()"
            />
          </div>

          <div class="filtro-group filtro-group-btn">
            <button class="btn-limpiar" (click)="limpiarFiltros()">✕ Limpiar</button>
          </div>
        </div>

        @if (totalElements > 0) {
          <div class="filtro-meta">
            {{ totalElements }} sesion{{ totalElements !== 1 ? 'es' : '' }} encontrada{{
              totalElements !== 1 ? 's' : ''
            }}
            · Página {{ paginaActual + 1 }} de {{ totalPaginas }}
          </div>
        }
      </div>

      <!-- ══ LISTA (CA-01 / CA-04) ══ -->
      @if (loading) {
        <div class="loader-wrap"><div class="spinner"></div></div>
      } @else if (sesiones.length === 0) {
        <div class="empty-state">
          <span class="empty-ico">🔍</span>
          <p>No se encontraron sesiones con los filtros actuales.</p>
          @if (hayFiltrosActivos) {
            <button class="btn-limpiar-empty" (click)="limpiarFiltros()">Limpiar filtros</button>
          }
        </div>
      } @else {
        <div class="sesiones-list">
          @for (s of sesiones; track s.id) {
            <div
              class="sesion-card"
              [class.expandida]="expandidaId === s.id"
              [class.sesion-resaltada]="esResaltada(s.id)"
            >
              @if (esResaltada(s.id)) {
                <div class="sr-resaltada-tag">⚠️ Sesión parte de la alerta de regresión</div>
              }
              <div class="sesion-row" (click)="toggleExpandir(s)">
                <div class="sr-fecha">
                  <div class="sr-fecha-dia">{{ formatFecha(s.inicio) }}</div>
                  <div class="sr-juego">{{ s.juego?.nombre ?? '—' }}</div>
                </div>
                <div class="sr-nivel">
                  <span
                    class="nivel-badge"
                    [class]="'nivel-' + (s.nivel?.nivel || '').toLowerCase()"
                  >
                    {{ s.nivel?.nivel ?? '—' }}
                  </span>
                </div>
                <div class="sr-metric">
                  <div class="sr-metric-val">
                    {{ s.porcentajeAciertos != null ? s.porcentajeAciertos + '%' : '—' }}
                  </div>
                  <div class="sr-metric-lbl">Aciertos</div>
                </div>
                <div class="sr-metric">
                  <div class="sr-metric-val">{{ formatMs(s.tiempoRespuestaPromedioMs) }}</div>
                  <div class="sr-metric-lbl">T. respuesta</div>
                </div>
                <div class="sr-metric">
                  <div class="sr-metric-val">{{ formatDuracion(s.duracionSesionSegundos) }}</div>
                  <div class="sr-metric-lbl">Duración</div>
                </div>
                <div class="sr-estado" [class.ok]="s.completada" [class.inc]="!s.completada">
                  {{ s.completada ? '✓ Completa' : '✗ Incompleta' }}
                </div>
                <div class="sr-chevron">{{ expandidaId === s.id ? '▲' : '▼' }}</div>
              </div>

              <!-- ══ EXPANSIÓN (CA-04) ══ -->
              @if (expandidaId === s.id) {
                <div class="sesion-detalle">
                  @if (cargandoComparacion) {
                    <div class="detalle-loading"><div class="spinner spinner-sm"></div></div>
                  } @else {
                    <div class="detalle-grid">
                      <div class="detalle-chip">
                        <div class="dc-lbl">Racha máxima de aciertos</div>
                        <div class="dc-val">{{ s.rachaMaxAciertos ?? '—' }}</div>
                      </div>
                      <div class="detalle-chip" [class.chip-warn]="s.sesionConcentracionBaja">
                        <div class="dc-lbl">Concentración baja</div>
                        <div class="dc-val">{{ s.sesionConcentracionBaja ? '⚠️ Sí' : 'No' }}</div>
                      </div>
                    </div>

                    <div class="comparacion-wrap">
                      <h4 class="comp-title">Comparación con la sesión anterior</h4>
                      @if (!comparacion || !comparacion.haySesionAnterior) {
                        <p class="comp-empty">
                          Esta es la primera sesión registrada de este juego para este perfil.
                        </p>
                      } @else {
                        <div class="comp-grid">
                          <div class="comp-item">
                            <div class="comp-lbl">% Aciertos</div>
                            <div class="comp-vals">
                              <span>{{ comparacion.porcentajeAciertosAnterior ?? '—' }}%</span>
                              <span class="comp-arrow">→</span>
                              <span>{{ comparacion.porcentajeAciertosActual ?? '—' }}%</span>
                              <span
                                class="comp-delta"
                                [class.up]="(comparacion.deltaPorcentajeAciertos ?? 0) > 0"
                                [class.down]="(comparacion.deltaPorcentajeAciertos ?? 0) < 0"
                              >
                                {{ formatDelta(comparacion.deltaPorcentajeAciertos, '%') }}
                              </span>
                            </div>
                          </div>
                          <div class="comp-item">
                            <div class="comp-lbl">Tiempo de respuesta prom.</div>
                            <div class="comp-vals">
                              <span>{{
                                formatMs(comparacion.tiempoRespuestaPromedioMsAnterior)
                              }}</span>
                              <span class="comp-arrow">→</span>
                              <span>{{
                                formatMs(comparacion.tiempoRespuestaPromedioMsActual)
                              }}</span>
                              <span
                                class="comp-delta"
                                [class.up]="(comparacion.deltaTiempoRespuestaPromedioMs ?? 0) < 0"
                                [class.down]="(comparacion.deltaTiempoRespuestaPromedioMs ?? 0) > 0"
                              >
                                {{ formatDelta(comparacion.deltaTiempoRespuestaPromedioMs, ' ms') }}
                              </span>
                            </div>
                          </div>
                          <div class="comp-item">
                            <div class="comp-lbl">Puntaje</div>
                            <div class="comp-vals">
                              <span>{{ comparacion.puntajeAnterior ?? '—' }}</span>
                              <span class="comp-arrow">→</span>
                              <span>{{ comparacion.puntajeActual ?? '—' }}</span>
                              <span
                                class="comp-delta"
                                [class.up]="(comparacion.deltaPuntaje ?? 0) > 0"
                                [class.down]="(comparacion.deltaPuntaje ?? 0) < 0"
                              >
                                {{ formatDelta(comparacion.deltaPuntaje, '') }}
                              </span>
                            </div>
                          </div>
                          <div class="comp-item">
                            <div class="comp-lbl">Duración de sesión</div>
                            <div class="comp-vals">
                              <span>{{
                                formatDuracion(comparacion.duracionSegundosAnterior)
                              }}</span>
                              <span class="comp-arrow">→</span>
                              <span>{{ formatDuracion(comparacion.duracionSegundosActual) }}</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- ══ PAGINACIÓN (CA-03) ══ -->
        <div class="paginacion">
          <button class="pag-btn" [disabled]="paginaActual === 0" (click)="irPagina(0)">«</button>
          <button
            class="pag-btn"
            [disabled]="paginaActual === 0"
            (click)="irPagina(paginaActual - 1)"
          >
            ‹
          </button>

          @for (p of paginas; track p) {
            <button class="pag-btn" [class.pag-activa]="p === paginaActual" (click)="irPagina(p)">
              {{ p + 1 }}
            </button>
          }

          <button
            class="pag-btn"
            [disabled]="paginaActual >= totalPaginas - 1"
            (click)="irPagina(paginaActual + 1)"
          >
            ›
          </button>
          <button
            class="pag-btn"
            [disabled]="paginaActual >= totalPaginas - 1"
            (click)="irPagina(totalPaginas - 1)"
          >
            »
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      .hs-root {
        font-family:
          'Inter',
          -apple-system,
          sans-serif;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 24px 28px 48px;
        max-width: 1100px;
        margin: 0 auto;
      }

      /* ── Cabecera ── */
      .hs-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .hs-header-left {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }
      .btn-back {
        background: #f3f0ff;
        color: #5b21b6;
        border: none;
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        margin-top: 2px;
      }
      .btn-back:hover {
        background: #ede9fe;
      }
      .hs-title {
        font-size: 20px;
        font-weight: 900;
        color: #1e1b4b;
      }
      .hs-sub {
        font-size: 12.5px;
        color: #94a3b8;
        margin-top: 4px;
      }
      .btn-export {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
      }
      .btn-export:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .btn-export:not(:disabled):hover {
        box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
      }

      /* ── Filtros ── */
      .filtros-card {
        background: white;
        border-radius: 16px;
        padding: 18px 20px;
        box-shadow: 0 2px 10px rgba(91, 33, 182, 0.06);
      }
      .filtros-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: flex-end;
      }
      .filtro-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 150px;
      }
      .filtro-group-btn {
        justify-content: flex-end;
      }
      .filtro-label {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      .filtro-input {
        padding: 9px 12px;
        border: 2px solid #e4deff;
        border-radius: 10px;
        font-size: 13px;
        font-family: inherit;
        color: #1e293b;
        outline: none;
        background: white;
      }
      .filtro-input:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
      }
      .btn-limpiar {
        padding: 9px 16px;
        background: #f3f0ff;
        color: #5b21b6;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
      }
      .btn-limpiar:hover {
        background: #ede9fe;
      }
      .filtro-meta {
        margin-top: 10px;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #f1f5f9;
        padding-top: 10px;
      }

      /* ── Loader / Empty ── */
      .loader-wrap {
        display: flex;
        justify-content: center;
        padding: 60px;
      }
      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #ddd6fe;
        border-top-color: #7c3aed;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .spinner-sm {
        width: 22px;
        height: 22px;
        border-width: 2.5px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 48px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 2px 10px rgba(91, 33, 182, 0.06);
      }
      .empty-ico {
        font-size: 48px;
      }
      .empty-state p {
        color: #64748b;
        font-size: 14px;
      }
      .btn-limpiar-empty {
        background: #ede9fe;
        color: #5b21b6;
        border: none;
        border-radius: 10px;
        padding: 8px 20px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      /* ── Lista de sesiones ── */
      .sesiones-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .sesion-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 2px 10px rgba(91, 33, 182, 0.06);
        overflow: hidden;
        border: 2px solid transparent;
        transition: border-color 0.15s;
      }
      .sesion-card.expandida {
        border-color: #c4b5fd;
      }
      .sesion-card.sesion-resaltada {
        border-color: #ef4444;
      }
      .sr-resaltada-tag {
        background: #fef2f2;
        color: #b91c1c;
        font-size: 11px;
        font-weight: 700;
        padding: 6px 18px;
      }
      .sesion-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 18px;
        cursor: pointer;
      }
      .sesion-row:hover {
        background: #fafafe;
      }
      .sr-fecha {
        min-width: 150px;
      }
      .sr-fecha-dia {
        font-size: 12.5px;
        font-weight: 700;
        color: #334155;
      }
      .sr-juego {
        font-size: 11.5px;
        color: #7c3aed;
        font-weight: 700;
        margin-top: 2px;
      }
      .sr-nivel {
        min-width: 80px;
      }
      .nivel-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 10.5px;
        font-weight: 800;
      }
      .nivel-facil {
        background: #dcfce7;
        color: #166534;
      }
      .nivel-medio {
        background: #fef9c3;
        color: #854d0e;
      }
      .nivel-dificil {
        background: #fee2e2;
        color: #991b1b;
      }
      .nivel-experto {
        background: #ede9fe;
        color: #5b21b6;
      }
      .sr-metric {
        min-width: 90px;
        text-align: center;
      }
      .sr-metric-val {
        font-size: 14px;
        font-weight: 800;
        color: #1e1b4b;
      }
      .sr-metric-lbl {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .sr-estado {
        font-size: 11px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 20px;
        flex-shrink: 0;
        white-space: nowrap;
        margin-left: auto;
      }
      .sr-estado.ok {
        background: #f0fdf4;
        color: #16a34a;
      }
      .sr-estado.inc {
        background: #f8fafc;
        color: #94a3b8;
      }
      .sr-chevron {
        font-size: 11px;
        color: #94a3b8;
        flex-shrink: 0;
        width: 16px;
        text-align: center;
      }

      /* ── Detalle expandido (CA-04) ── */
      .sesion-detalle {
        padding: 0 18px 18px;
        border-top: 1px solid #f1f5f9;
      }
      .detalle-loading {
        display: flex;
        justify-content: center;
        padding: 20px;
      }
      .detalle-grid {
        display: flex;
        gap: 12px;
        margin-top: 14px;
        flex-wrap: wrap;
      }
      .detalle-chip {
        background: #f8f7ff;
        border-radius: 12px;
        padding: 10px 16px;
        min-width: 160px;
      }
      .detalle-chip.chip-warn {
        background: #fffbeb;
      }
      .dc-lbl {
        font-size: 10.5px;
        color: #94a3b8;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .dc-val {
        font-size: 15px;
        font-weight: 800;
        color: #1e1b4b;
        margin-top: 3px;
      }
      .comparacion-wrap {
        margin-top: 16px;
      }
      .comp-title {
        font-size: 12.5px;
        font-weight: 800;
        color: #1e1b4b;
        margin-bottom: 10px;
      }
      .comp-empty {
        font-size: 12.5px;
        color: #94a3b8;
      }
      .comp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
      }
      .comp-item {
        background: #f8f7ff;
        border-radius: 12px;
        padding: 10px 14px;
      }
      .comp-lbl {
        font-size: 10.5px;
        color: #94a3b8;
        font-weight: 700;
        margin-bottom: 5px;
      }
      .comp-vals {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        font-weight: 700;
        color: #334155;
        flex-wrap: wrap;
      }
      .comp-arrow {
        color: #cbd5e1;
      }
      .comp-delta {
        font-size: 11px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 20px;
        background: #f1f5f9;
        color: #64748b;
      }
      .comp-delta.up {
        background: #dcfce7;
        color: #16a34a;
      }
      .comp-delta.down {
        background: #fee2e2;
        color: #dc2626;
      }

      /* ── Paginación ── */
      .paginacion {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .pag-btn {
        width: 36px;
        height: 36px;
        border: 2px solid #e4deff;
        border-radius: 10px;
        background: white;
        color: #5b21b6;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        font-family: inherit;
      }
      .pag-btn:hover:not(:disabled) {
        background: #ede9fe;
        border-color: #a78bfa;
      }
      .pag-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .pag-activa {
        background: #4f46e5 !important;
        border-color: #4f46e5 !important;
        color: white !important;
      }
    `,
  ],
})
export class HistorialSesionesComponent implements OnInit {
  perfilId!: number;
  nombrePerfil = '';
  backUrl = '/';

  juegos: JuegoOpcion[] = [];
  niveles = NIVELES;

  sesiones: SesionHistorial[] = [];
  loading = true;
  exportando = false;

  // Filtros (CA-02)
  filtroJuegoId: number | null = null;
  filtroNivel: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  soloCompletadas:  boolean = true;  // por defecto solo sesiones con datos reales

  // Paginación (CA-03)
  paginaActual = 0;
  totalPaginas = 0;
  totalElements = 0;

  // Expansión (CA-04)
  expandidaId: number | null = null;
  comparacion: ComparacionSesion | null = null;
  cargandoComparacion = false;

  // CA-03 (Notificaciones in-app): sesiones a resaltar cuando se llega
  // desde "Ver detalle" de una alerta de regresión.
  sesionesResaltadas = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private historialService: HistorialSesionesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.perfilId = Number(this.route.snapshot.paramMap.get('perfilId'));
    this.nombrePerfil = this.route.snapshot.queryParamMap.get('nombre') || '';
    this.backUrl = (this.route.snapshot.data?.['back'] as string) || '/';

    // CA-03 (Notificaciones in-app): si se llega desde "Ver detalle" de una
    // alerta, preseleccionar el juego y marcar las sesiones a resaltar.
    const juegoParam = this.route.snapshot.queryParamMap.get('juego');
    if (juegoParam) this.filtroJuegoId = Number(juegoParam);

    const resaltarParam = this.route.snapshot.queryParamMap.get('resaltar');
    if (resaltarParam) {
      this.sesionesResaltadas = new Set(
        resaltarParam
          .split(',')
          .map((v) => Number(v))
          .filter((n) => !isNaN(n)),
      );
    }

    this.historialService
      .getJuegos()
      .pipe(catchError(() => of([])))
      .subscribe((j) => {
        this.juegos = j;
        this.cdr.detectChanges();
      });

    this.buscar();
  }

  buscar(reset = true): void {
    if (reset) this.paginaActual = 0;
    this.loading = true;
    this.expandidaId = null;
    this.cdr.detectChanges();

    const filtros: HistorialFiltros = {
      page: this.paginaActual,
      juegoId: this.filtroJuegoId,
      nivel: this.filtroNivel || undefined,
      fechaDesde: this.parseFecha(this.filtroFechaDesde)
        ? this.parseFecha(this.filtroFechaDesde) + 'T00:00:00'
        : undefined,
      fechaHasta: this.parseFecha(this.filtroFechaHasta)
        ? this.parseFecha(this.filtroFechaHasta) + 'T23:59:59'
        : undefined,
      soloCompletadas: this.soloCompletadas ? true : undefined,
    };

    this.historialService
      .obtenerHistorial(this.perfilId, filtros)
      .pipe(catchError(() => of(null)))
      .subscribe((page) => {
        if (page) {
          this.sesiones = page.content;
          this.totalPaginas = page.totalPages;
          this.totalElements = page.totalElements;
          this.paginaActual = page.number;
        } else {
          this.sesiones = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  irPagina(p: number): void {
    if (p < 0 || p >= this.totalPaginas) return;
    this.paginaActual = p;
    this.buscar(false);
  }

  toggleCompletadas(): void {
    this.soloCompletadas = !this.soloCompletadas;
    this.buscar();
  }

  limpiarFiltros(): void {
    this.filtroJuegoId = null;
    this.filtroNivel = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.soloCompletadas  = true;
    this.buscar();
  }

  toggleExpandir(s: SesionHistorial): void {
    if (this.expandidaId === s.id) {
      this.expandidaId = null;
      this.comparacion = null;
      this.cdr.detectChanges();
      return;
    }
    this.expandidaId = s.id;
    this.comparacion = null;
    this.cargandoComparacion = true;
    this.cdr.detectChanges();

    this.historialService
      .obtenerComparacion(this.perfilId, s.id)
      .pipe(catchError(() => of(null)))
      .subscribe((comp) => {
        this.comparacion = comp;
        this.cargandoComparacion = false;
        this.cdr.detectChanges();
      });
  }

  exportarPdf(): void {
    this.exportando = true;
    this.cdr.detectChanges();

    const filtros = {
      juegoId: this.filtroJuegoId,
      nivel: this.filtroNivel || undefined,
      fechaDesde: this.parseFecha(this.filtroFechaDesde)
        ? this.parseFecha(this.filtroFechaDesde) + 'T00:00:00'
        : undefined,
      fechaHasta: this.parseFecha(this.filtroFechaHasta)
        ? this.parseFecha(this.filtroFechaHasta) + 'T23:59:59'
        : undefined,
    };

    this.historialService.exportarPdf(this.perfilId, filtros).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial-sesiones-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exportando = false;
        this.cdr.detectChanges();
      },
    });
  }

  volver(): void {
    this.router.navigateByUrl(this.backUrl);
  }

  // CA-03 (Notificaciones in-app): ¿esta sesión es parte de la alerta que
  // trajo al usuario desde la campana?
  esResaltada(sesionId: number): boolean {
    return this.sesionesResaltadas.has(sesionId);
  }

  // ── Helpers de formato ──
  formatFecha(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatMs(ms?: number): string {
    if (ms == null) return '—';
    return `${Math.round(ms)} ms`;
  }

  formatDuracion(segundos?: number): string {
    if (segundos == null) return '—';
    const min = Math.floor(segundos / 60);
    const seg = Math.round(segundos % 60);
    return `${min}:${seg.toString().padStart(2, '0')}`;
  }

  formatDelta(delta: number | undefined, suffix: string): string {
    if (delta == null) return '—';
    const signo = delta > 0 ? '+' : '';
    return `${signo}${delta}${suffix}`;
  }

  get hayFiltrosActivos(): boolean {
    return !!(
      this.filtroJuegoId ||
      this.filtroNivel ||
      this.filtroFechaDesde ||
      this.filtroFechaHasta
    );
  }

  /** Convierte DD/MM/AAAA → YYYY-MM-DD para el backend. Devuelve '' si el formato no es válido. */
  private parseFecha(s: string): string {
    if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return '';
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Dispara buscar() solo cuando la fecha está vacía o completa (DD/MM/AAAA). */
  onFechaInput(): void {
    const ok = (v: string) => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v);
    if (ok(this.filtroFechaDesde) && ok(this.filtroFechaHasta)) this.buscar();
  }

  /** Genera el array de páginas visibles (máx 7 botones alrededor de la actual). */
  get paginas(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const inicio = Math.max(0, Math.min(actual - 3, total - 7));
    return Array.from({ length: Math.min(7, total) }, (_, i) => inicio + i);
  }
}
