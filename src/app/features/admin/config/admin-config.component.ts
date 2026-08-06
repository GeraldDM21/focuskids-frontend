import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

interface NivelConfig {
  nivelId: number;
  juegoId: number;
  juegoNombre: string;
  nivel: string;
  configVersion: string | null;
  velocidadEstimulos: number;
  cantidadElementos: number;
  tiempoLimite: number;
  numRondas: number;
}

interface JuegoGroup {
  juegoId: number;
  juegoNombre: string;
  niveles: NivelConfig[];
}

interface Incoherencia {
  parametro: string;
  nivelComparado: string;
  mensaje: string;
}

type ParamKey = 'velocidadEstimulos' | 'cantidadElementos' | 'tiempoLimite' | 'numRondas';

const RANGOS: Record<ParamKey, { min: number; max: number; label: string }> = {
  velocidadEstimulos: { min: 500,  max: 5000, label: 'Velocidad estímulos (ms)' },
  cantidadElementos:  { min: 2,    max: 12,   label: 'Cantidad elementos'       },
  tiempoLimite:       { min: 5,    max: 60,   label: 'Tiempo límite (s)'        },
  numRondas:          { min: 5,    max: 30,   label: 'Nro. de rondas'           },
};

const ORDEN_NIVELES = ['FACIL', 'MEDIO', 'DIFICIL'];
const PARAMS_COMPARABLES: ParamKey[] = ['velocidadEstimulos', 'cantidadElementos', 'tiempoLimite'];

function esMasExigente(param: ParamKey, valN: number, valAnterior: number): boolean {
  if (param === 'velocidadEstimulos') return valN < valAnterior;
  if (param === 'cantidadElementos')  return valN > valAnterior;
  if (param === 'tiempoLimite')       return valN < valAnterior;
  return true;
}

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-page">

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sb-logo">
          <span class="sb-logo-ico">🧠</span>
          <span class="sb-logo-txt">FocusKids</span>
        </div>
        <nav class="sb-nav">
          <p class="sb-section">PANEL ADMIN</p>
          <a class="sb-item" (click)="router.navigate(['/admin'])">
            <span class="sb-ico">📊</span> Dashboard
          </a>
          <a class="sb-item active">
            <span class="sb-ico">⚙️</span> Config. Juegos
          </a>
          <a class="sb-item" (click)="router.navigate(['/admin/logs'])">
            <span class="sb-ico">📋</span> Logs
          </a>
        </nav>
        <div class="sb-user">
          <div class="sb-avatar">{{ iniciales }}</div>
          <div class="sb-user-info">
            <span class="sb-user-name">{{ auth.userName() }}</span>
            <span class="sb-user-role">Administrador</span>
          </div>
          <button class="sb-logout" (click)="auth.logout()">⏏</button>
        </div>
      </aside>

      <!-- CONTENIDO -->
      <main class="main">

        <div class="top-bar">
          <div>
            <h1 class="page-title">⚙️ Configuración de Dificultad</h1>
            <p class="page-sub">Ajusta los parámetros de cada nivel sin modificar el código fuente.</p>
          </div>
          <div class="top-badges">
            <span class="badge-info">🔒 Solo ADMINISTRADOR</span>
            <span class="badge-info">✅ Cambios aplican a sesiones nuevas</span>
          </div>
        </div>

        @if (loading) {
          <div class="loading-card">
            <div class="spinner"></div>
            <span>Cargando configuraciones...</span>
          </div>
        }

        @if (errorGlobal) {
          <div class="alert-error">⚠️ {{ errorGlobal }}</div>
        }

        @if (!loading && grupos.length > 0) {
          <div class="filtro-row">
            <label class="filtro-label">Filtrar por juego:</label>
            <select class="filtro-select" [(ngModel)]="juegoFiltro" (ngModelChange)="aplicarFiltro()">
              <option value="">Todos los juegos ({{ grupos.length }})</option>
              @for (g of grupos; track g.juegoId) {
                <option [value]="g.juegoId">{{ g.juegoNombre }}</option>
              }
            </select>
          </div>

          @for (grupo of gruposFiltrados; track grupo.juegoId) {
            <div class="juego-card">

              <div class="juego-header">
                <div class="juego-title">
                  <span>🎮</span>
                  <span>{{ grupo.juegoNombre }}</span>
                </div>
                <span class="juego-badge">{{ grupo.niveles.length }} niveles</span>
              </div>

              @for (nivel of grupo.niveles; track $index) {
                <div class="nivel-section" [class.nivel-guardando]="guardando[nivel.nivelId]">

                  <div class="nivel-header">
                    <span class="nivel-badge" [ngClass]="nivelClass(nivel.nivel)">
                      {{ nivelEmoji(nivel.nivel) }} {{ nivel.nivel }}
                    </span>
                    @if (nivel.configVersion) {
                      <span class="version-tag">{{ nivel.configVersion }}</span>
                    }
                    @if (guardado[nivel.nivelId]) {
                      <span class="saved-tag">✓ Guardado</span>
                    }
                  </div>

                  <div class="params-grid">

                    <div class="param-field" [class.param-error]="getError(nivel.nivelId, 'velocidadEstimulos')">
                      <label class="param-label">
                        ⚡ Velocidad estímulos
                        <span class="param-hint">500–5000 ms · menor = más rápido</span>
                      </label>
                      <input type="number" class="param-input"
                             [ngModel]="getValor(nivel, 'velocidadEstimulos')"
                             (ngModelChange)="onChange(nivel, 'velocidadEstimulos', $event)"
                             min="500" max="5000" step="100">
                      @if (getError(nivel.nivelId, 'velocidadEstimulos')) {
                        <p class="error-msg">{{ getError(nivel.nivelId, 'velocidadEstimulos') }}</p>
                      }
                    </div>

                    <div class="param-field" [class.param-error]="getError(nivel.nivelId, 'cantidadElementos')">
                      <label class="param-label">
                        🎯 Cantidad de elementos
                        <span class="param-hint">2–12 · mayor = más difícil</span>
                      </label>
                      <input type="number" class="param-input"
                             [ngModel]="getValor(nivel, 'cantidadElementos')"
                             (ngModelChange)="onChange(nivel, 'cantidadElementos', $event)"
                             min="2" max="12" step="1">
                      @if (getError(nivel.nivelId, 'cantidadElementos')) {
                        <p class="error-msg">{{ getError(nivel.nivelId, 'cantidadElementos') }}</p>
                      }
                    </div>

                    <div class="param-field" [class.param-error]="getError(nivel.nivelId, 'tiempoLimite')">
                      <label class="param-label">
                        ⏱ Tiempo límite
                        <span class="param-hint">5–60 s · menor = más difícil</span>
                      </label>
                      <input type="number" class="param-input"
                             [ngModel]="getValor(nivel, 'tiempoLimite')"
                             (ngModelChange)="onChange(nivel, 'tiempoLimite', $event)"
                             min="5" max="60" step="5">
                      @if (getError(nivel.nivelId, 'tiempoLimite')) {
                        <p class="error-msg">{{ getError(nivel.nivelId, 'tiempoLimite') }}</p>
                      }
                    </div>

                    <div class="param-field" [class.param-error]="getError(nivel.nivelId, 'numRondas')">
                      <label class="param-label">
                        🔁 Nro. de rondas
                        <span class="param-hint">5–30</span>
                      </label>
                      <input type="number" class="param-input"
                             [ngModel]="getValor(nivel, 'numRondas')"
                             (ngModelChange)="onChange(nivel, 'numRondas', $event)"
                             min="5" max="30" step="1">
                      @if (getError(nivel.nivelId, 'numRondas')) {
                        <p class="error-msg">{{ getError(nivel.nivelId, 'numRondas') }}</p>
                      }
                    </div>

                  </div>

                  <div class="nivel-footer">
                    <button class="btn-guardar"
                            [disabled]="!tieneEdicion(nivel.nivelId) || tieneErrores(nivel.nivelId) || guardando[nivel.nivelId]"
                            (click)="guardar(grupo, nivel)">
                      @if (guardando[nivel.nivelId]) {
                        <span class="spinner-sm"></span> Guardando...
                      } @else {
                        💾 Guardar cambios
                      }
                    </button>
                    @if (tieneEdicion(nivel.nivelId) && tieneErrores(nivel.nivelId)) {
                      <span class="btn-hint-error">Corrige los errores antes de guardar</span>
                    }
                  </div>

                </div>
              }

            </div>
          }
        }

      </main>

      <!-- MODAL CA-04 -->
      @if (mostrarModal) {
        <div class="modal-overlay" (click)="cancelarGuardado()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="modal-ico">⚠️</span>
              <h2 class="modal-title">Advertencia de coherencia entre niveles</h2>
            </div>
            <p class="modal-sub">
              La configuración de <strong>{{ pendienteNivelLabel }}</strong> puede
              hacer que ese nivel sea <em>menos exigente</em> que otro:
            </p>
            <ul class="incoherencias-list">
              @for (inc of incoherenciasPendientes; track inc.parametro) {
                <li class="inc-item">
                  <span class="inc-param">{{ RANGOS_LABELS[inc.parametro] }}</span>
                  <span class="inc-desc">{{ inc.mensaje }}</span>
                </li>
              }
            </ul>
            <p class="modal-note">Podés guardar igual — es solo una advertencia.</p>
            <div class="modal-btns">
              <button class="btn-cancelar" (click)="cancelarGuardado()">✗ Revisar</button>
              <button class="btn-confirmar" (click)="confirmarGuardado()">✓ Guardar de todas formas</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }
    * { box-sizing: border-box; }

    .config-page { display: flex; height: 100vh; overflow: hidden; font-family: 'Quicksand', sans-serif; }

    /* SIDEBAR */
    .sidebar { width: 220px; min-width: 220px; background: linear-gradient(180deg,#1a0f3a 0%,#1e1b4b 60%,#2d1272 100%); display: flex; flex-direction: column; }
    .sb-logo { display: flex; align-items: center; gap: 10px; padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .sb-logo-ico { font-size: 22px; }
    .sb-logo-txt { font-family: 'Baloo 2','Quicksand',sans-serif; font-size: 17px; font-weight: 800; color: white; }
    .sb-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
    .sb-section { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; color: rgba(255,255,255,.35); margin: 16px 8px 6px; padding: 0; }
    .sb-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; color: rgba(255,255,255,.6); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; margin-bottom: 2px; }
    .sb-item:hover { background: rgba(255,255,255,.08); color: white; }
    .sb-item.active { background: rgba(139,92,246,.3); color: white; box-shadow: inset 0 0 0 1px rgba(139,92,246,.4); }
    .sb-ico { font-size: 16px; }
    .sb-user { display: flex; align-items: center; gap: 10px; padding: 16px; border-top: 1px solid rgba(255,255,255,.08); }
    .sb-avatar { width: 36px; height: 36px; border-radius: 10px; background: rgba(139,92,246,.4); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: white; flex-shrink: 0; }
    .sb-user-info { flex: 1; min-width: 0; }
    .sb-user-name { display: block; font-size: 13px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sb-user-role { font-size: 11px; color: rgba(255,255,255,.45); }
    .sb-logout { background: none; border: none; cursor: pointer; color: rgba(255,255,255,.35); padding: 4px; border-radius: 6px; font-size: 16px; }
    .sb-logout:hover { color: white; }

    /* MAIN */
    .main { flex: 1; background: #F0EEFF; overflow-y: auto; padding: 28px 32px; display: flex; flex-direction: column; gap: 16px; }

    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .page-title { font-family: 'Baloo 2','Quicksand',sans-serif; font-size: 22px; font-weight: 800; color: #1E1B4B; margin: 0 0 4px; }
    .page-sub { font-size: 13px; color: #64748B; margin: 0; }
    .top-badges { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; margin-top: 4px; }
    .badge-info { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 12px; background: #EDE9FE; color: #4F46E5; }

    .loading-card { display: flex; align-items: center; gap: 12px; padding: 32px; background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(79,70,229,.07); color: #64748B; font-size: 14px; }
    .alert-error { padding: 14px 18px; background: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 12px; color: #991B1B; font-size: 14px; font-weight: 600; }

    .filtro-row { display: flex; align-items: center; gap: 12px; }
    .filtro-label { font-size: 13px; font-weight: 700; color: #334155; }
    .filtro-select { padding: 8px 14px; border: 1.5px solid #DDD6FE; border-radius: 10px; font-size: 13px; font-weight: 600; color: #1E1B4B; background: white; font-family: 'Quicksand',sans-serif; outline: none; cursor: pointer; }

    /* JUEGO CARD */
    .juego-card { background: white; border-radius: 18px; box-shadow: 0 2px 12px rgba(79,70,229,.07); }
    .juego-card > * { display: block; }
    .juego-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 2px solid #EDE9FE; background: linear-gradient(90deg,#F5F3FF,#EDE9FE); border-radius: 18px 18px 0 0; }
    .juego-title { display: flex; align-items: center; gap: 10px; font-family: 'Baloo 2','Quicksand',sans-serif; font-size: 16px; font-weight: 800; color: #1E1B4B; }
    .juego-badge { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 10px; background: #4F46E5; color: white; }

    /* NIVEL */
    .nivel-section { padding: 20px 22px; border-bottom: 1px solid #F1F5F9; }
    .nivel-section:last-child { border-bottom: none; }
    .nivel-section.nivel-guardando { opacity: .6; pointer-events: none; }

    .nivel-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .nivel-badge { font-size: 12px; font-weight: 800; padding: 4px 14px; border-radius: 14px; }
    .nivel-facil  { background: #D1FAE5; color: #065F46; }
    .nivel-medio  { background: #FEF9C3; color: #92400E; }
    .nivel-dificil { background: #FEE2E2; color: #991B1B; }
    .version-tag { font-size: 11px; font-weight: 600; color: #94A3B8; background: #F1F5F9; padding: 2px 10px; border-radius: 8px; font-family: monospace; }
    .saved-tag { font-size: 12px; font-weight: 700; color: #059669; background: #D1FAE5; padding: 3px 12px; border-radius: 10px; }

    .params-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-bottom: 16px; }
    .param-field { display: flex; flex-direction: column; gap: 5px; }
    .param-label { font-size: 12px; font-weight: 700; color: #334155; display: flex; flex-direction: column; gap: 2px; }
    .param-hint { font-size: 11px; font-weight: 600; color: #94A3B8; }
    .param-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; font-size: 15px; font-weight: 700; color: #1E1B4B; font-family: 'Quicksand',sans-serif; outline: none; transition: border-color .2s; background: #FAFAFA; }
    .param-input:focus { border-color: #4F46E5; background: white; }
    .param-field.param-error .param-input { border-color: #EF4444; background: #FFF8F8; }
    .error-msg { font-size: 11px; color: #EF4444; font-weight: 700; margin: 0; }

    .nivel-footer { display: flex; align-items: center; gap: 12px; }
    .btn-guardar { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: 12px; border: none; background: linear-gradient(135deg,#4F46E5,#7C3AED); font-family: 'Quicksand',sans-serif; font-size: 13px; font-weight: 700; color: white; cursor: pointer; transition: all .2s; }
    .btn-guardar:disabled { background: #CBD5E1; color: #94A3B8; cursor: not-allowed; }
    .btn-guardar:not(:disabled):hover { box-shadow: 0 4px 14px rgba(79,70,229,.35); }
    .btn-hint-error { font-size: 12px; color: #EF4444; font-weight: 600; }

    .spinner { width: 18px; height: 18px; border: 2px solid #E2E8F0; border-top-color: #4F46E5; border-radius: 50%; animation: spin .8s linear infinite; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
    .modal-card { background: white; border-radius: 20px; padding: 28px 32px; max-width: 520px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
    .modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .modal-ico { font-size: 28px; }
    .modal-title { font-family: 'Baloo 2','Quicksand',sans-serif; font-size: 17px; font-weight: 800; color: #1E1B4B; margin: 0; }
    .modal-sub { font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 14px; }
    .incoherencias-list { list-style: none; padding: 0; margin: 0 0 14px; display: flex; flex-direction: column; gap: 6px; }
    .inc-item { display: flex; flex-direction: column; padding: 10px 14px; background: #FEF9C3; border: 1px solid #FDE68A; border-radius: 10px; }
    .inc-param { font-size: 12px; font-weight: 800; color: #92400E; margin-bottom: 2px; }
    .inc-desc  { font-size: 12px; color: #78350F; }
    .modal-note { font-size: 12px; color: #64748B; font-style: italic; margin-bottom: 20px; }
    .modal-btns { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancelar { padding: 10px 20px; border-radius: 12px; border: 1.5px solid #CBD5E1; background: white; font-family: 'Quicksand',sans-serif; font-size: 13px; font-weight: 700; color: #64748B; cursor: pointer; }
    .btn-cancelar:hover { background: #F1F5F9; }
    .btn-confirmar { padding: 10px 20px; border-radius: 12px; border: none; background: linear-gradient(135deg,#D97706,#B45309); font-family: 'Quicksand',sans-serif; font-size: 13px; font-weight: 700; color: white; cursor: pointer; }
    .btn-confirmar:hover { box-shadow: 0 4px 14px rgba(217,119,6,.4); }
  `]
})
export class AdminConfigComponent implements OnInit {

  private readonly API = `${environment.apiUrl}/admin/config`;

  readonly RANGOS_LABELS: Record<string, string> = {
    velocidadEstimulos: 'Velocidad estímulos (ms)',
    cantidadElementos:  'Cantidad de elementos',
    tiempoLimite:       'Tiempo límite (s)',
  };

  loading      = true;
  errorGlobal  = '';
  grupos: JuegoGroup[]        = [];
  gruposFiltrados: JuegoGroup[] = [];
  juegoFiltro  = '';

  editados:  Record<number, Record<string, number>> = {};
  errores:   Record<number, Record<string, string>> = {};
  guardando: Record<number, boolean>               = {};
  guardado:  Record<number, boolean>               = {};

  mostrarModal          = false;
  incoherenciasPendientes: Incoherencia[] = [];
  pendienteNivelLabel   = '';
  private pendienteAction: (() => void) | null = null;

  get iniciales() {
    const n = this.auth.userName();
    return n ? n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A';
  }

  constructor(
    public auth: AuthService,
    public router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<NivelConfig[]>(`${this.API}/niveles`).subscribe({
      next: data => {
        this.grupos = this.agrupar(data);
        this.gruposFiltrados = [...this.grupos];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.errorGlobal = 'Error ' + (err.status ?? '') + ': ' + (err.error?.message ?? err.statusText ?? 'Sin respuesta');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private agrupar(configs: NivelConfig[]): JuegoGroup[] {
    const map = new Map<number, JuegoGroup>();
    for (const c of configs) {
      if (!map.has(c.juegoId)) {
        map.set(c.juegoId, { juegoId: c.juegoId, juegoNombre: c.juegoNombre, niveles: [] });
      }
      map.get(c.juegoId)!.niveles.push(c);
    }
    for (const g of map.values()) {
      g.niveles.sort((a, b) => ORDEN_NIVELES.indexOf(a.nivel) - ORDEN_NIVELES.indexOf(b.nivel));
    }
    return [...map.values()].sort((a, b) => a.juegoNombre.localeCompare(b.juegoNombre));
  }

  aplicarFiltro(): void {
    this.gruposFiltrados = this.juegoFiltro
      ? this.grupos.filter(g => g.juegoId === Number(this.juegoFiltro))
      : [...this.grupos];
    this.cdr.detectChanges();
  }

  getValor(nivel: NivelConfig, param: ParamKey): number {
    return this.editados[nivel.nivelId]?.[param] ?? nivel[param];
  }

  getError(nivelId: number, param: string): string {
    return this.errores[nivelId]?.[param] ?? '';
  }

  tieneEdicion(nivelId: number): boolean {
    return !!this.editados[nivelId] && Object.keys(this.editados[nivelId]).length > 0;
  }

  tieneErrores(nivelId: number): boolean {
    return !!this.errores[nivelId] && Object.keys(this.errores[nivelId]).length > 0;
  }

  nivelClass(nivel: string): string {
    const map: Record<string, string> = {
      FACIL: 'nivel-badge nivel-facil',
      MEDIO: 'nivel-badge nivel-medio',
      DIFICIL: 'nivel-badge nivel-dificil',
    };
    return map[nivel] ?? 'nivel-badge';
  }

  nivelEmoji(nivel: string): string {
    return ({ FACIL: '🟢', MEDIO: '🟡', DIFICIL: '🔴' } as Record<string,string>)[nivel] ?? '⚫';
  }

  onChange(nivel: NivelConfig, param: ParamKey, valor: number): void {
    if (!this.editados[nivel.nivelId]) this.editados[nivel.nivelId] = {};
    this.editados[nivel.nivelId][param] = Number(valor);
    if (!this.errores[nivel.nivelId]) this.errores[nivel.nivelId] = {};
    const rango = RANGOS[param];
    const v = Number(valor);
    if (isNaN(v) || v < rango.min || v > rango.max) {
      this.errores[nivel.nivelId][param] = `Debe estar entre ${rango.min} y ${rango.max}`;
    } else {
      delete this.errores[nivel.nivelId][param];
    }
    delete this.guardado[nivel.nivelId];
  }

  guardar(grupo: JuegoGroup, nivel: NivelConfig): void {
    if (!this.tieneEdicion(nivel.nivelId) || this.tieneErrores(nivel.nivelId)) return;
    const body = {
      velocidadEstimulos: this.getValor(nivel, 'velocidadEstimulos'),
      cantidadElementos:  this.getValor(nivel, 'cantidadElementos'),
      tiempoLimite:       this.getValor(nivel, 'tiempoLimite'),
      numRondas:          this.getValor(nivel, 'numRondas'),
    };
    const incs = this.detectarIncoherencias(grupo, nivel, body);
    if (incs.length > 0) {
      this.incoherenciasPendientes = incs;
      this.pendienteNivelLabel = nivel.nivel;
      this.pendienteAction = () => this.ejecutarGuardado(nivel, body);
      this.mostrarModal = true;
      this.cdr.detectChanges();
      return;
    }
    this.ejecutarGuardado(nivel, body);
  }

  private ejecutarGuardado(nivel: NivelConfig, body: object): void {
    this.guardando[nivel.nivelId] = true;
    this.cdr.detectChanges();
    this.http.put<NivelConfig>(`${this.API}/nivel/${nivel.nivelId}`, body).subscribe({
      next: actualizado => {
        for (const g of this.grupos) {
          const idx = g.niveles.findIndex(n => n.nivelId === nivel.nivelId);
          if (idx !== -1) { g.niveles[idx] = actualizado; break; }
        }
        this.aplicarFiltro();
        delete this.editados[nivel.nivelId];
        delete this.errores[nivel.nivelId];
        this.guardado[nivel.nivelId] = true;
        this.guardando[nivel.nivelId] = false;
        this.cdr.detectChanges();
        setTimeout(() => { delete this.guardado[nivel.nivelId]; this.cdr.detectChanges(); }, 3000);
      },
      error: err => {
        this.guardando[nivel.nivelId] = false;
        this.errorGlobal = 'Error al guardar: ' + (err.error?.message ?? err.statusText);
        this.cdr.detectChanges();
        setTimeout(() => { this.errorGlobal = ''; this.cdr.detectChanges(); }, 5000);
      }
    });
  }

  private detectarIncoherencias(grupo: JuegoGroup, nivel: NivelConfig, nuevos: Record<string, number>): Incoherencia[] {
    const incs: Incoherencia[] = [];
    const idx = ORDEN_NIVELES.indexOf(nivel.nivel);
    if (idx > 0) {
      const ant = grupo.niveles.find(n => n.nivel === ORDEN_NIVELES[idx - 1]);
      if (ant) {
        for (const p of PARAMS_COMPARABLES) {
          if (!esMasExigente(p, nuevos[p], ant[p])) {
            incs.push({ parametro: p, nivelComparado: ant.nivel, mensaje: `${nivel.nivel} (${nuevos[p]}) no es más difícil que ${ant.nivel} (${ant[p]})` });
          }
        }
      }
    }
    if (idx < ORDEN_NIVELES.length - 1) {
      const sig = grupo.niveles.find(n => n.nivel === ORDEN_NIVELES[idx + 1]);
      if (sig) {
        for (const p of PARAMS_COMPARABLES) {
          if (!esMasExigente(p, sig[p], nuevos[p])) {
            incs.push({ parametro: p, nivelComparado: sig.nivel, mensaje: `${sig.nivel} (${sig[p]}) no sería más difícil que ${nivel.nivel} (${nuevos[p]})` });
          }
        }
      }
    }
    return incs;
  }

  confirmarGuardado(): void {
    this.mostrarModal = false;
    this.pendienteAction?.();
    this.pendienteAction = null;
    this.cdr.detectChanges();
  }

  cancelarGuardado(): void {
    this.mostrarModal = false;
    this.pendienteAction = null;
    this.cdr.detectChanges();
  }
}
