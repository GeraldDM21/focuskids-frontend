import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface NivelPorJuego    { juegoNombre:string; nivel:string; sesiones:number; pctSesiones:number; }
interface UltimaActividad  { juegoNombre:string; nivel:string; fecha:string; puntaje:number|null; completada:boolean; }
interface ProgresoDashboard {
  perfilId:number; nombre:string; avatar:string; edad:number;
  ultimaSesion:string|null; juegoMasJugadoSemana:string|null;
  nivelesPorJuego:NivelPorJuego[]; tendencia:string; actividadSemanal:boolean[];
  totalSesiones:number; tiempoTotalMinutos:number; precisionMedia:number; rachaActual:number;
  minutosSemanales:number[]; ultimasActividades:UltimaActividad[];
}

const AVATAR: Record<string,string> = {
  fox:'🦊',frog:'🐸',lion:'🦁',panda:'🐼',koala:'🐨',
  unicorn:'🦄',dog:'🐶',cat:'🐱',rabbit:'🐰',tiger:'🐯',bear:'🐻',mouse:'🐭'
};
const NIVEL_CFG: Record<string,{color:string,bg:string,label:string}> = {
  FACIL:   {color:'#22c55e',bg:'#dcfce7',label:'Fácil'},
  MEDIO:   {color:'#f59e0b',bg:'#fef3c7',label:'Medio'},
  DIFICIL: {color:'#ef4444',bg:'#fee2e2',label:'Difícil'},
};
const TEND_CFG: Record<string,{ico:string,label:string,color:string,bg:string}> = {
  SUBIENDO: {ico:'↑',label:'Mejorando', color:'#22c55e',bg:'#dcfce7'},
  ESTABLE:  {ico:'→',label:'Estable',   color:'#f59e0b',bg:'#fef3c7'},
  BAJANDO:  {ico:'↓',label:'Bajando',   color:'#ef4444',bg:'#fee2e2'},
  SIN_DATOS:{ico:'–',label:'Sin datos', color:'#94a3b8',bg:'#f1f5f9'},
};
const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const JUEGO_ICO: Record<string,string> = {
  'Espejo Mental':'🪞','Historia Viva':'📖','Palabras Ocultas':'📝',
  'Piezas en Tiempo':'🧩','Foco Extremo':'🎯','Cascada Numérica':'🔢',
  'Laberinto Cognitivo':'🌀','Maratón Mental':'🏃','Ritmo y Patrón':'🎵',
  'Reacción Controlada':'⚡','Mapa Aventura':'🗺️','Lab de Ciencias':'🔬',
};
const JUEGO_COLOR: Record<string,string> = {
  'Espejo Mental':'#7C3AED','Historia Viva':'#D97706','Palabras Ocultas':'#EA580C',
  'Piezas en Tiempo':'#0891B2','Foco Extremo':'#4F46E5','Cascada Numérica':'#059669',
  'Laberinto Cognitivo':'#7C3AED','Maratón Mental':'#059669','Ritmo y Patrón':'#9333EA',
  'Reacción Controlada':'#2563EB','Mapa Aventura':'#65A30D','Lab de Ciencias':'#DB2777',
};
const MOTIVACION = [
  '¡Sigue así, vas genial!','¡Cada día aprende más!',
  '¡El esfuerzo da frutos!','¡Orgulloso de su progreso!'
];

@Component({
  selector: 'app-progreso-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="root">

  <!-- ══ SIDEBAR ══ -->
  <aside class="sidebar">
    <div class="brand"><span>🎮</span><span class="brand-txt">FocusKids</span></div>

    <!-- Perfil activo en sidebar -->
    @if (!loading && seleccionado) {
      <div class="sb-profile">
        <div class="sb-av">{{ av(seleccionado.avatar) }}</div>
        <div>
          <p class="sb-name">{{ seleccionado.nombre }}</p>
          <p class="sb-age">{{ seleccionado.edad }} años</p>
        </div>
      </div>
    }

    <nav class="nav">
      <p class="nav-sec">MENÚ</p>
      <button class="nav-btn" (click)="irAlDashboard()"><span>🏠</span>Inicio</button>
      <button class="nav-btn active"><span>📊</span>Progreso</button>
      <p class="nav-sec">CUENTA</p>
      <button class="nav-btn" (click)="auth.logout(); router.navigate(['/auth/login'])"><span>🚪</span>Salir</button>
    </nav>

    <!-- Mascota Foxy con mensaje motivacional -->
    <div class="mascot-wrap">
      <div class="mascot-bubble">{{ motivacion }}</div>
      <img src="/mascotas/foxy-escena.png" alt="Foxy" class="mascot-img"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"/>
      <div class="mascot-fallback" style="display:none">🦊</div>
    </div>
  </aside>

  <!-- ══ MAIN ══ -->
  <main class="main">

    @if (loading) {
      <div class="center-box"><div class="spinner"></div><p>Cargando progreso…</p></div>
    }
    @if (!loading && error) {
      <div class="center-box error">
        <span style="font-size:2rem">⚠️</span><p>{{ error }}</p>
        <button class="btn-retry" (click)="cargar()">Reintentar</button>
      </div>
    }
    @if (!loading && !error && perfiles.length === 0) {
      <div class="center-box"><span style="font-size:3rem">👧</span><p>Sin perfiles registrados.</p></div>
    }

    @if (!loading && !error && seleccionado) {

      <!-- ── HEADER ─────────────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <p class="page-greeting">¡Hola, {{ parentName }}! 👋</p>
          <h1 class="page-title">
            Progreso de <span class="page-child">{{ seleccionado.nombre }}</span>
          </h1>
        </div>
        <div class="header-right">
          <!-- CA-03: selector si hay más de un perfil -->
          @if (perfiles.length > 1) {
            <div class="pill-row">
              @for (p of perfiles; track p.perfilId) {
                <button class="pill" [class.pill-on]="seleccionado.perfilId===p.perfilId"
                        (click)="seleccionado=p; motivacion=aleatorio(); cdr.detectChanges()">
                  {{ av(p.avatar) }} {{ p.nombre }}
                </button>
              }
            </div>
          }
          <div class="tend-chip"
               [style.background]="tc(seleccionado.tendencia).bg"
               [style.color]="tc(seleccionado.tendencia).color">
            {{ tc(seleccionado.tendencia).ico }} {{ tc(seleccionado.tendencia).label }}
          </div>
        </div>
      </div>

      <!-- ── STAT CARDS ─────────────────────────────────────────────── -->
      <div class="stats-grid">
        <div class="stat-card c-purple">
          <div class="sc-top">
            <span class="sc-ico">🎮</span>
            <span class="sc-trend">+últimas 4 sem.</span>
          </div>
          <p class="sc-num">{{ seleccionado.totalSesiones }}</p>
          <p class="sc-lbl">Sesiones totales</p>
        </div>
        <div class="stat-card c-blue">
          <div class="sc-top"><span class="sc-ico">⏱️</span></div>
          <p class="sc-num">{{ formatMin(seleccionado.tiempoTotalMinutos) }}</p>
          <p class="sc-lbl">Tiempo de juego</p>
        </div>
        <div class="stat-card c-green">
          <div class="sc-top"><span class="sc-ico">🎯</span></div>
          <p class="sc-num">{{ seleccionado.precisionMedia }}<span class="sc-unit">%</span></p>
          <p class="sc-lbl">Precisión media</p>
        </div>
        <div class="stat-card c-orange">
          <div class="sc-top"><span class="sc-ico">🔥</span></div>
          <p class="sc-num">{{ seleccionado.rachaActual }}</p>
          <p class="sc-lbl">Racha de días</p>
        </div>
      </div>

      <!-- ── MIDDLE GRID ────────────────────────────────────────────── -->
      <div class="mid-grid">

        <!-- Learning Progress -->
        <div class="card">
          <div class="card-hdr">
            <h3 class="card-title">Progreso por juego</h3>
            <span class="card-tag">{{ seleccionado.nivelesPorJuego.length }} juegos</span>
          </div>
          @if (seleccionado.nivelesPorJuego.length === 0) {
            <div class="empty-msg">Sin sesiones en las últimas 4 semanas.</div>
          }
          <div class="prog-list">
            @for (n of seleccionado.nivelesPorJuego; track n.juegoNombre) {
              <div class="prog-row">
                <div class="prog-icon" [style.background]="jcol(n.juegoNombre)+'18'">
                  {{ jico(n.juegoNombre) }}
                </div>
                <div class="prog-info">
                  <div class="prog-top">
                    <span class="prog-name">{{ n.juegoNombre }}</span>
                    <div class="prog-right">
                      <span class="prog-pct" [style.color]="jcol(n.juegoNombre)">{{ n.pctSesiones }}%</span>
                      <span class="nivel-chip"
                            [style.background]="nc(n.nivel).bg"
                            [style.color]="nc(n.nivel).color">{{ nc(n.nivel).label }}</span>
                    </div>
                  </div>
                  <div class="prog-bar">
                    <div class="prog-fill"
                         [style.width]="n.pctSesiones+'%'"
                         [style.background]="jcol(n.juegoNombre)"></div>
                  </div>
                  <span class="prog-ses">{{ n.sesiones }} sesión{{ n.sesiones!==1?'es':'' }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Weekly Activity -->
        <div class="card">
          <div class="card-hdr">
            <h3 class="card-title">Actividad semanal</h3>
            <span class="card-tag">Esta semana</span>
          </div>
          <!-- Gráfico de barras CSS -->
          <div class="bar-chart">
            @for (min of seleccionado.minutosSemanales; track $index) {
              <div class="bar-col">
                <span class="bar-val">{{ min > 0 ? min+'m' : '' }}</span>
                <div class="bar-wrap">
                  <div class="bar-fill"
                       [style.height]="barH(min, seleccionado.minutosSemanales)+'%'"
                       [class.bar-active]="seleccionado.actividadSemanal[$index]"></div>
                </div>
                <span class="bar-day" [class.bar-day-on]="seleccionado.actividadSemanal[$index]">
                  {{ DIAS[$index] }}
                </span>
              </div>
            }
          </div>
          <!-- Indicador de minutos totales esta semana -->
          <div class="chart-footer">
            <span class="cf-label">Total esta semana</span>
            <span class="cf-val">{{ sumaMin(seleccionado.minutosSemanales) }} minutos</span>
          </div>
          <!-- CA-04: círculos de actividad -->
          <div class="dot-row">
            @for (dia of seleccionado.actividadSemanal; track $index) {
              <div class="dot" [class.dot-on]="dia" [title]="DIAS[$index]"></div>
            }
          </div>
        </div>

      </div>

      <!-- ── RECENT ACTIVITY ────────────────────────────────────────── -->
      <div class="card">
        <div class="card-hdr">
          <h3 class="card-title">Últimas actividades</h3>
          <!-- CA-05 -->
          <button class="btn-historial" (click)="verHistorial(seleccionado.perfilId)">
            Ver historial completo →
          </button>
        </div>
        @if (seleccionado.ultimasActividades.length === 0) {
          <div class="empty-msg">Sin sesiones recientes.</div>
        }
        <div class="activity-list">
          @for (a of seleccionado.ultimasActividades; track $index) {
            <div class="act-row">
              <div class="act-ico" [style.background]="jcol(a.juegoNombre)+'20'">
                {{ jico(a.juegoNombre) }}
              </div>
              <div class="act-info">
                <p class="act-name">{{ a.juegoNombre }}</p>
                <p class="act-sub">
                  <span class="nivel-chip sm"
                        [style.background]="nc(a.nivel).bg"
                        [style.color]="nc(a.nivel).color">{{ nc(a.nivel).label }}</span>
                  {{ formatFechaRel(a.fecha) }}
                </p>
              </div>
              <div class="act-right">
                @if (a.completada) {
                  <span class="act-done">✓ Completada</span>
                }
                @if (a.puntaje != null) {
                  <span class="act-pts">{{ a.puntaje }} pts</span>
                }
              </div>
            </div>
          }
        </div>
      </div>

    }
  </main>
</div>
  `,
  styles: [`
    :host { display:block; }
    *{ box-sizing:border-box; margin:0; padding:0; }
    .root{ display:flex; min-height:100vh; background:#f0f2ff; font-family:'Inter',sans-serif; }

    /* ── SIDEBAR ─────────────────── */
    .sidebar{
      width:230px; min-width:230px;
      background:linear-gradient(180deg,#1e1b4b 0%,#312e81 100%);
      display:flex; flex-direction:column; padding:24px 0 0;
      position:sticky; top:0; height:100vh; overflow:hidden;
    }
    .brand{ display:flex; align-items:center; gap:10px; padding:0 20px 20px; color:#fff; font-size:1.05rem; font-weight:800; }
    .sb-profile{ display:flex; align-items:center; gap:10px; padding:14px 16px; margin:0 12px 8px;
                 background:rgba(255,255,255,.1); border-radius:14px; }
    .sb-av{ font-size:2rem; width:44px; height:44px; background:rgba(255,255,255,.15); border-radius:50%;
            display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .sb-name{ color:#fff; font-size:.88rem; font-weight:700; }
    .sb-age{ color:#a5b4fc; font-size:.72rem; }
    .nav{ padding:0 12px; display:flex; flex-direction:column; gap:2px; }
    .nav-sec{ color:#818cf8; font-size:.6rem; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; padding:14px 8px 4px; }
    .nav-btn{ display:flex; align-items:center; gap:10px; width:100%; background:none; border:none;
              color:rgba(255,255,255,.5); font-size:.84rem; font-weight:500; padding:10px 12px;
              border-radius:10px; text-align:left; cursor:pointer; transition:all .15s; }
    .nav-btn:hover{ background:rgba(255,255,255,.08); color:rgba(255,255,255,.9); }
    .nav-btn.active{ background:rgba(99,102,241,.45); color:#fff; font-weight:700; }
    .mascot-wrap{ margin-top:auto; position:relative; padding:0 12px 0; text-align:center; }
    .mascot-bubble{
      background:rgba(255,255,255,.12); color:#e0e7ff; font-size:.75rem; font-weight:600;
      border-radius:14px 14px 14px 4px; padding:8px 12px; margin:0 8px 10px; line-height:1.4;
      backdrop-filter:blur(4px);
    }
    .mascot-img{ width:100%; max-height:170px; object-fit:contain; display:block; filter:drop-shadow(0 4px 12px rgba(0,0,0,.3)); }
    .mascot-fallback{ font-size:5rem; }

    /* ── MAIN ─────────────────────── */
    .main{ flex:1; padding:28px 32px; overflow-y:auto; display:flex; flex-direction:column; gap:22px; }
    .center-box{ display:flex; flex-direction:column; align-items:center; gap:14px; padding:80px 20px; color:#64748b; }
    .error{ color:#dc2626; }
    .spinner{ width:36px; height:36px; border:3px solid #e0e7ff; border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin{ to{ transform:rotate(360deg); } }
    .btn-retry{ background:#6366f1; color:#fff; border:none; border-radius:8px; padding:8px 20px; cursor:pointer; font-weight:600; }

    /* header */
    .page-header{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    .page-greeting{ color:#64748b; font-size:.9rem; margin-bottom:4px; }
    .page-title{ font-size:1.65rem; font-weight:800; color:#1e1b4b; }
    .page-child{ color:#6366f1; }
    .header-right{ display:flex; flex-direction:column; align-items:flex-end; gap:10px; }
    .pill-row{ display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .pill{ background:#fff; border:2px solid #e2e8f0; color:#374151; border-radius:20px; padding:5px 14px; cursor:pointer; font-size:.8rem; transition:all .15s; font-weight:600; }
    .pill:hover{ border-color:#6366f1; color:#6366f1; }
    .pill-on{ background:#6366f1; border-color:#6366f1; color:#fff; }
    .tend-chip{ border-radius:20px; padding:6px 16px; font-size:.82rem; font-weight:700; }

    /* stat cards */
    .stats-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    @media(max-width:900px){ .stats-grid{ grid-template-columns:repeat(2,1fr); } }
    .stat-card{
      background:#fff; border-radius:18px; padding:20px 18px;
      box-shadow:0 2px 12px rgba(0,0,0,.05); position:relative; overflow:hidden;
    }
    .stat-card::before{ content:''; position:absolute; top:0; left:0; right:0; height:4px; }
    .c-purple::before{ background:linear-gradient(90deg,#6366f1,#8b5cf6); }
    .c-blue::before  { background:linear-gradient(90deg,#0ea5e9,#38bdf8); }
    .c-green::before { background:linear-gradient(90deg,#22c55e,#4ade80); }
    .c-orange::before{ background:linear-gradient(90deg,#f59e0b,#fbbf24); }
    .sc-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .sc-ico{ font-size:1.4rem; }
    .sc-trend{ font-size:.65rem; color:#94a3b8; font-weight:600; background:#f8fafc; border-radius:8px; padding:2px 8px; }
    .sc-num{ font-size:1.8rem; font-weight:800; color:#1e1b4b; line-height:1; margin-bottom:4px; }
    .sc-unit{ font-size:1rem; color:#94a3b8; font-weight:500; }
    .sc-lbl{ font-size:.72rem; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }

    /* card base */
    .card{ background:#fff; border-radius:20px; padding:22px 24px; box-shadow:0 2px 14px rgba(0,0,0,.05); }
    .card-hdr{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    .card-title{ font-size:1rem; font-weight:700; color:#1e1b4b; }
    .card-tag{ background:#f0f2ff; color:#6366f1; font-size:.72rem; font-weight:700; border-radius:20px; padding:4px 12px; }
    .empty-msg{ color:#94a3b8; font-size:.85rem; text-align:center; padding:20px 0; }

    /* mid grid */
    .mid-grid{ display:grid; grid-template-columns:1.1fr 1fr; gap:20px; }
    @media(max-width:920px){ .mid-grid{ grid-template-columns:1fr; } }

    /* learning progress */
    .prog-list{ display:flex; flex-direction:column; gap:14px; }
    .prog-row{ display:flex; align-items:center; gap:12px; }
    .prog-icon{ width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
    .prog-info{ flex:1; min-width:0; }
    .prog-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
    .prog-name{ font-size:.82rem; font-weight:600; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px; }
    .prog-right{ display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .prog-pct{ font-size:.8rem; font-weight:800; }
    .nivel-chip{ font-size:.68rem; font-weight:700; border-radius:10px; padding:2px 8px; }
    .nivel-chip.sm{ font-size:.65rem; padding:2px 7px; }
    .prog-bar{ height:6px; background:#f1f5f9; border-radius:999px; overflow:hidden; margin-bottom:3px; }
    .prog-fill{ height:100%; border-radius:999px; transition:width .5s ease; }
    .prog-ses{ font-size:.68rem; color:#94a3b8; }

    /* bar chart */
    .bar-chart{ display:flex; align-items:flex-end; justify-content:space-between; gap:8px; height:120px; margin-bottom:10px; }
    .bar-col{ display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; height:100%; }
    .bar-val{ font-size:.65rem; color:#94a3b8; font-weight:600; height:14px; display:flex; align-items:center; }
    .bar-wrap{ flex:1; width:100%; display:flex; align-items:flex-end; }
    .bar-fill{ width:100%; min-height:4px; background:#e2e8f0; border-radius:6px 6px 0 0; transition:height .4s ease; }
    .bar-active{ background:linear-gradient(180deg,#6366f1,#8b5cf6) !important; }
    .bar-day{ font-size:.68rem; color:#94a3b8; font-weight:500; }
    .bar-day-on{ color:#6366f1; font-weight:700; }
    .chart-footer{ display:flex; justify-content:space-between; align-items:center; padding:8px 0 10px; border-top:1px solid #f1f5f9; margin-bottom:10px; }
    .cf-label{ font-size:.72rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:.4px; }
    .cf-val{ font-size:.82rem; color:#6366f1; font-weight:700; }
    /* CA-04 dots */
    .dot-row{ display:flex; gap:6px; justify-content:center; }
    .dot{ width:10px; height:10px; border-radius:50%; background:#e2e8f0; transition:background .2s; }
    .dot-on{ background:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.2); }

    /* recent activity */
    .activity-list{ display:flex; flex-direction:column; gap:12px; }
    .act-row{ display:flex; align-items:center; gap:14px; padding:10px 12px; background:#f8fafc; border-radius:12px; }
    .act-ico{ width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
    .act-info{ flex:1; min-width:0; }
    .act-name{ font-size:.88rem; font-weight:700; color:#1e293b; }
    .act-sub{ font-size:.75rem; color:#94a3b8; display:flex; align-items:center; gap:6px; margin-top:3px; }
    .act-right{ display:flex; flex-direction:column; align-items:flex-end; gap:3px; flex-shrink:0; }
    .act-done{ font-size:.72rem; color:#22c55e; font-weight:700; }
    .act-pts{ font-size:.8rem; color:#6366f1; font-weight:800; }
    .btn-historial{ background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none;
                    border-radius:10px; padding:8px 18px; font-size:.82rem; font-weight:700;
                    cursor:pointer; transition:all .2s; box-shadow:0 2px 10px rgba(99,102,241,.3); }
    .btn-historial:hover{ transform:translateY(-1px); box-shadow:0 4px 16px rgba(99,102,241,.4); }
  `]
})
export class ProgresoDashboardComponent implements OnInit {
  readonly API  = environment.apiUrl;
  readonly DIAS = DIAS;

  perfiles: ProgresoDashboard[] = [];
  seleccionado: ProgresoDashboard | null = null;
  parentName = '';
  motivacion  = MOTIVACION[0];
  loading = true;
  error   = '';

  constructor(
    public  auth:   AuthService,
    public  router: Router,
    private http:   HttpClient,
    public  cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.parentName = this.auth.user()?.nombre?.split(' ')[0] ?? '';
    this.cargar();
  }

  cargar(): void {
    this.loading = true; this.error = ''; this.cdr.detectChanges();
    const u = this.auth.user();
    if (!u) { this.error = 'Sin sesión.'; this.loading = false; this.cdr.detectChanges(); return; }
    const rol = u.rol ?? '';
    const url = rol === 'PADRE'   ? `${this.API}/progreso/padre/${u.usuarioId}`
              : rol === 'DOCENTE' ? `${this.API}/progreso/docente/${u.usuarioId}`
              : null;
    if (!url) { this.error = 'Rol no autorizado.'; this.loading = false; this.cdr.detectChanges(); return; }
    this.http.get<ProgresoDashboard[]>(url).subscribe({
      next: data => {
        this.perfiles = data;
        this.seleccionado = data.reduce<ProgresoDashboard|null>((p, c) => {
          if (!p?.ultimaSesion) return c;
          if (!c.ultimaSesion)  return p;
          return c.ultimaSesion > p.ultimaSesion ? c : p;
        }, null);
        this.motivacion = this.aleatorio();
        this.loading = false; this.cdr.detectChanges();
      },
      error: err => {
        this.error = 'Error ' + (err.status ?? '') + ': ' + (err.error?.message ?? err.statusText);
        this.loading = false; this.cdr.detectChanges();
      }
    });
  }

  verHistorial(perfilId: number): void {
    const rol = this.auth.user()?.rol ?? '';
    const base = rol === 'DOCENTE' ? '/docente' : '/padre';
    this.router.navigate([`${base}/historial/${perfilId}`]);
  }
  irAlDashboard(): void {
    const rol = this.auth.user()?.rol ?? '';
    this.router.navigate([rol === 'DOCENTE' ? '/docente/dashboard' : '/padre/dashboard']);
  }

  av(k:string)   { return AVATAR[k]    ?? '👤'; }
  tc(t:string)   { return TEND_CFG[t]  ?? TEND_CFG['SIN_DATOS']; }
  nc(n:string)   { return NIVEL_CFG[n] ?? {color:'#94a3b8',bg:'#f1f5f9',label:n}; }
  jico(n:string) { return JUEGO_ICO[n]   ?? '🎮'; }
  jcol(n:string) { return JUEGO_COLOR[n] ?? '#6366f1'; }
  aleatorio()    { return MOTIVACION[Math.floor(Math.random()*MOTIVACION.length)]; }
  sumaMin(arr:number[]) { return arr.reduce((a,b)=>a+b,0); }
  barH(val:number, arr:number[]) {
    const mx = Math.max(...arr, 1); return Math.round(val/mx*100);
  }
  formatMin(m:number) {
    if (m < 60) return m + 'm';
    return Math.floor(m/60) + 'h ' + (m%60) + 'm';
  }
  formatFechaRel(iso:string): string {
    if (!iso) return '';
    const d = new Date(iso), hoy = new Date();
    const diff = Math.floor((hoy.getTime()-d.getTime())/86400000);
    if (diff===0) return 'Hoy · ' + d.toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'});
    if (diff===1) return 'Ayer';
    if (diff<7)   return 'Hace '+diff+' días';
    return d.toLocaleDateString('es-CR',{day:'2-digit',month:'short'});
  }
}
