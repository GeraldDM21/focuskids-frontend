import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChildProfileService } from '../perfiles/child-profile.service';
import { ChildProfile } from '../perfiles/child-profile.model';

const AVATAR_MAP: Record<string, string> = {
  fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
  unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
  bear:'🐻', mouse:'🐭'
};

@Component({
  selector: 'app-padre-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="root">

  <!-- ══ SIDEBAR ══ -->
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-ico">🎮</span>
      <span class="brand-txt">FocusKids</span>
    </div>

    <nav class="nav">
      <p class="nav-section">PRINCIPAL</p>
      <button class="nav-item" [class.active]="tab==='inicio'"    (click)="tab='inicio'">    <span>🏠</span>Inicio</button>
      <button class="nav-item" [class.active]="tab==='progreso'"  (click)="tab='progreso'">  <span>📊</span>Progreso</button>
      <button class="nav-item" [class.active]="tab==='logros'"    (click)="tab='logros'">    <span>🏆</span>Logros</button>
      <button class="nav-item" [class.active]="tab==='actividad'" (click)="tab='actividad'"> <span>📅</span>Actividad</button>

      <p class="nav-section">GESTIÓN</p>
      <button class="nav-item" (click)="irAPerfiles()">                                       <span>👨‍👧‍👦</span>Mis hijos</button>
      <button class="nav-item" [class.active]="tab==='notif'"  (click)="tab='notif'">        <span>🔔</span>Notificaciones</button>
      <button class="nav-item" [class.active]="tab==='config'" (click)="tab='config'">       <span>⚙️</span>Configuración</button>
    </nav>

    <div class="sidebar-user">
      <div class="su-avatar">{{ parentInitial }}</div>
      <div class="su-info">
        <div class="su-name">{{ parentName }}</div>
        <div class="su-role">Madre / Tutora</div>
      </div>
    </div>
  </aside>

  <!-- ══ MAIN ══ -->
  <div class="main">

    <!-- Topbar -->
    <header class="topbar">
      <h1 class="topbar-title">Dashboard de {{ selectedPerfil?.nombre ?? '…' }}</h1>
      <div class="topbar-right">
        @if (selectedPerfil) {
          <div class="child-chip" (click)="showMenu=!showMenu">
            {{ avatarFn(selectedPerfil.avatar) }} {{ selectedPerfil.nombre }}, {{ selectedPerfil.edad }} años
            @if (perfiles.length > 1) { <span>▾</span> }
            @if (showMenu && perfiles.length > 1) {
              <div class="child-menu">
                @for (p of perfiles; track p.id) {
                  <button (click)="selectPerfil(p);$event.stopPropagation()">
                    {{ avatarFn(p.avatar) }} {{ p.nombre }}
                  </button>
                }
              </div>
            }
          </div>
        }
        <button class="icon-btn" title="Notificaciones">🔔</button>
        <button class="icon-btn" title="Cerrar sesión" (click)="auth.logout()">⎋</button>
      </div>
    </header>

    <!-- Content -->
    <div class="content">

      @if (loading) {
        <div class="loader"><div class="spinner"></div></div>
      }

      @if (!loading && perfiles.length === 0) {
        <div class="empty">
          <div style="font-size:64px">👨‍👧</div>
          <h2>Aún no has agregado ningún hijo</h2>
          <button class="btn-primary" (click)="irAPerfiles()">+ Crear perfil</button>
        </div>
      }

      @if (!loading && selectedPerfil) {

        <!-- Profile card -->
        <div class="profile-card">
          <div class="pc-avatar">{{ avatarFn(selectedPerfil.avatar) }}</div>
          <div class="pc-info">
            <div class="pc-name">{{ selectedPerfil.nombre }}</div>
            <div class="pc-meta">
              {{ selectedPerfil.edad }} años{{ selectedPerfil.diagnostico ? ' - ' + selectedPerfil.diagnostico : '' }}
            </div>
            <div class="pc-xp-lbl">XP: {{ xpActual }} / {{ xpMax }} (Nivel {{ nivel }})</div>
            <div class="pc-xp-track"><div class="pc-xp-fill" [style.width.%]="xpPct"></div></div>
          </div>
          <div class="pc-chips">
            <div class="pc-chip">
              <div class="pc-chip-val">{{ racha }}</div>
              <div class="pc-chip-lbl">Racha días</div>
            </div>
            <div class="pc-chip">
              <div class="pc-chip-val">{{ logros }}</div>
              <div class="pc-chip-lbl">Logros</div>
            </div>
            <div class="pc-chip">
              <div class="pc-chip-val">{{ precision }}%</div>
              <div class="pc-chip-lbl">Precisión</div>
            </div>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-ico">🎮</div>
            <div class="stat-num">{{ partidas }}</div>
            <div class="stat-lbl">Partidas esta semana</div>
          </div>
          <div class="stat-card">
            <div class="stat-ico">⏱️</div>
            <div class="stat-num">{{ tiempoJuego }}</div>
            <div class="stat-lbl">Tiempo de juego</div>
          </div>
          <div class="stat-card">
            <div class="stat-ico">📈</div>
            <div class="stat-num green">{{ mejora }}</div>
            <div class="stat-lbl">Mejora esta semana</div>
          </div>
          <div class="stat-card">
            <div class="stat-ico">⭐</div>
            <div class="stat-num">{{ puntos | number }}</div>
            <div class="stat-lbl">Puntos totales</div>
          </div>
        </div>

        <!-- Chart + right panel -->
        <div class="bottom-row">

          <!-- Activity chart -->
          <div class="chart-card">
            <h3 class="card-title">Actividad de la semana</h3>
            <div class="chart-body">
              <div class="chart-bars">
                @for (d of actividad; track d.dia) {
                  <div class="bar-col">
                    <div class="bar-outer">
                      <div class="bar-inner" [style.height.%]="(d.valor / maxAct) * 100"></div>
                    </div>
                    <div class="bar-label">{{ d.dia }}</div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right panel -->
          <div class="right-col">

            <!-- Juegos por rendimiento -->
            <div class="panel-card">
              <h3 class="card-title">Juegos por rendimiento</h3>
              @for (j of juegosPorRendimiento; track j.nombre) {
                <div class="jr-row">
                  <div class="jr-ico" [style.background]="j.color+'1a'">{{ j.icono }}</div>
                  <div class="jr-data">
                    <div class="jr-name">{{ j.nombre }}</div>
                    <div class="jr-track">
                      <div class="jr-fill" [style.width.%]="j.pct" [style.background]="j.color"></div>
                    </div>
                  </div>
                  <div class="jr-pct" [style.color]="j.color">{{ j.pct }}%</div>
                </div>
              }
            </div>

            <!-- Área de atención -->
            <div class="alert-card">
              <div class="alert-title">⚠️ Área de atención</div>
              <div class="alert-body">{{ areaAtencion }}</div>
            </div>

            <!-- Última actividad -->
            <div class="panel-card">
              <h3 class="card-title">Última actividad</h3>
              @for (a of ultimaActividad; track a.hora) {
                <div class="ua-row">
                  <span class="ua-ico">🕐</span>
                  <span class="ua-hora">{{ a.hora }}</span>
                  <span class="ua-juego">{{ a.juego }}</span>
                </div>
              }
            </div>

          </div>
        </div>

      }
    </div>
  </div>
</div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .root {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      background: #EEE9FF;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 162px; flex-shrink: 0;
      background: #1E1A6E;
      display: flex; flex-direction: column;
      padding: 22px 0 16px;
      overflow-y: auto;
    }
    .brand {
      display: flex; align-items: center; gap: 8px;
      padding: 0 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,.07);
    }
    .brand-ico { font-size: 20px; }
    .brand-txt { font-size: 15px; font-weight: 800; color: white; }

    .nav { flex: 1; padding: 12px 10px; }
    .nav-section {
      font-size: 9px; font-weight: 700; letter-spacing: 1.4px;
      color: rgba(255,255,255,.28); padding: 14px 8px 6px;
      text-transform: uppercase;
    }
    .nav-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 9px 10px; border-radius: 10px; border: none;
      background: transparent; color: rgba(255,255,255,.48);
      font-size: 12.5px; font-weight: 600; cursor: pointer; text-align: left;
      transition: all .15s; margin-bottom: 2px;
    }
    .nav-item span { font-size: 15px; flex-shrink: 0; }
    .nav-item:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.85); }
    .nav-item.active { background: rgba(139,92,246,.35); color: white; }

    .sidebar-user {
      margin-top: auto; padding: 14px 12px 0;
      border-top: 1px solid rgba(255,255,255,.07);
      display: flex; align-items: center; gap: 9px;
    }
    .su-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: #F59E0B;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .su-name { font-size: 11.5px; font-weight: 700; color: white; }
    .su-role { font-size: 10px; color: rgba(255,255,255,.38); }

    /* ── Main ── */
    .main {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
      background: #EEE9FF;
    }

    /* Topbar */
    .topbar {
      background: white; padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #E4DEFF; flex-shrink: 0;
    }
    .topbar-title { font-size: 18px; font-weight: 800; color: #1E1B4B; }
    .topbar-right  { display: flex; align-items: center; gap: 10px; }

    .child-chip {
      display: flex; align-items: center; gap: 6px;
      background: #F3F0FF; border: 1.5px solid #C4B5FD;
      border-radius: 20px; padding: 6px 14px;
      font-size: 12.5px; font-weight: 700; color: #5B21B6; cursor: pointer;
      position: relative; white-space: nowrap;
    }
    .child-menu {
      position: absolute; top: calc(100% + 6px); right: 0;
      background: white; border: 1px solid #E4DEFF; border-radius: 12px;
      padding: 6px; min-width: 150px; box-shadow: 0 8px 24px rgba(0,0,0,.1); z-index: 300;
    }
    .child-menu button {
      display: block; width: 100%; padding: 8px 12px; text-align: left;
      background: none; border: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer; color: #334155;
    }
    .child-menu button:hover { background: #F3F0FF; }

    .icon-btn {
      background: #F3F0FF; border: 1.5px solid #DDD6FE; border-radius: 10px;
      width: 36px; height: 36px; font-size: 16px; cursor: pointer; transition: all .2s;
    }
    .icon-btn:hover { background: #EDE9FE; }

    /* Content area */
    .content { flex: 1; overflow-y: auto; padding: 20px 22px 32px; display: flex; flex-direction: column; gap: 16px; }

    /* Loader / Empty */
    .loader { display:flex; justify-content:center; align-items:center; flex:1; padding:60px; }
    .spinner { width:36px;height:36px;border:3px solid #DDD6FE;border-top-color:#7C3AED;border-radius:50%;animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty { display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px;text-align:center; }
    .empty h2 { font-size:20px;font-weight:800;color:#1E1B4B; }
    .btn-primary { background:#5B21B6;color:white;border:none;border-radius:12px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer; }
    .btn-primary:hover { background:#4C1D95; }

    /* Profile card */
    .profile-card {
      background: white; border-radius: 18px; padding: 18px 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 2px 14px rgba(91,33,182,.07);
    }
    .pc-avatar {
      width: 62px; height: 62px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg,#818CF8,#4F46E5);
      display: flex; align-items: center; justify-content: center; font-size: 34px;
    }
    .pc-info { flex: 1; min-width: 0; }
    .pc-name  { font-size: 17px; font-weight: 800; color: #1E1B4B; }
    .pc-meta  { font-size: 12px; color: #64748B; margin: 3px 0 8px; }
    .pc-xp-lbl{ font-size: 10.5px; color: #94A3B8; margin-bottom: 5px; }
    .pc-xp-track { height: 7px; background: #EEE9FF; border-radius: 100px; overflow: hidden; max-width: 240px; }
    .pc-xp-fill  { height: 100%; background: linear-gradient(90deg,#6366F1,#C4B5FD); border-radius: 100px; }

    .pc-chips { display: flex; gap: 8px; flex-shrink: 0; }
    .pc-chip {
      background: #F5F3FF; border: 1.5px solid #DDD6FE; border-radius: 12px;
      padding: 10px 14px; text-align: center; min-width: 70px;
    }
    .pc-chip-val { font-size: 20px; font-weight: 900; color: #4F46E5; line-height: 1; }
    .pc-chip-lbl { font-size: 10px; color: #94A3B8; margin-top: 3px; white-space: nowrap; }

    /* Stats row */
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .stat-card {
      background: white; border-radius: 16px; padding: 18px 16px;
      text-align: center; box-shadow: 0 2px 10px rgba(91,33,182,.06);
    }
    .stat-ico { font-size: 26px; margin-bottom: 8px; }
    .stat-num { font-size: 24px; font-weight: 900; color: #1E1B4B; margin-bottom: 4px; }
    .stat-lbl { font-size: 10.5px; color: #94A3B8; }
    .green    { color: #16A34A; }

    /* Bottom row */
    .bottom-row { display: flex; gap: 14px; align-items: flex-start; }

    /* Activity chart */
    .chart-card {
      flex: 1; background: white; border-radius: 18px; padding: 18px 20px;
      box-shadow: 0 2px 10px rgba(91,33,182,.06);
    }
    .card-title { font-size: 13px; font-weight: 800; color: #1E1B4B; margin-bottom: 16px; }
    .chart-body { padding-top: 4px; }
    .chart-bars {
      display: flex; align-items: flex-end; justify-content: space-between;
      height: 160px; gap: 6px; padding-bottom: 28px; position: relative;
    }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .bar-outer {
      flex: 1; width: 100%; background: #F3F0FF; border-radius: 8px 8px 0 0;
      display: flex; align-items: flex-end; overflow: hidden; margin-bottom: 8px;
    }
    .bar-inner { width: 100%; background: linear-gradient(to top,#6366F1,#A5B4FC); border-radius: 8px 8px 0 0; transition: height .8s ease; }
    .bar-label { font-size: 10.5px; color: #94A3B8; font-weight: 600; position: absolute; bottom: 0; }

    /* Right column */
    .right-col { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
    .panel-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 10px rgba(91,33,182,.06); }

    /* Juegos rendimiento */
    .jr-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #F3F0FF; }
    .jr-row:last-child { border-bottom: none; }
    .jr-ico { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; }
    .jr-data { flex: 1; min-width: 0; }
    .jr-name { font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 5px; }
    .jr-track { height: 5px; background: #F3F0FF; border-radius: 100px; overflow: hidden; }
    .jr-fill  { height: 100%; border-radius: 100px; transition: width .8s ease; }
    .jr-pct   { font-size: 12.5px; font-weight: 800; flex-shrink: 0; min-width: 32px; text-align: right; }

    /* Alert */
    .alert-card {
      background: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: 14px; padding: 14px;
    }
    .alert-title { font-size: 11.5px; font-weight: 800; color: #92400E; margin-bottom: 6px; }
    .alert-body  { font-size: 11.5px; color: #78350F; line-height: 1.55; }

    /* Ultima actividad */
    .ua-row  { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #F3F0FF; }
    .ua-row:last-child { border-bottom: none; }
    .ua-ico  { font-size: 14px; flex-shrink: 0; }
    .ua-hora { font-size: 10.5px; color: #94A3B8; flex-shrink: 0; min-width: 72px; }
    .ua-juego{ font-size: 12px; font-weight: 700; color: #4F46E5; }
  `]
})
export class PadreDashboardComponent implements OnInit {

  parentName = '';
  tab        = 'inicio';
  showMenu   = false;
  loading    = true;

  perfiles:       ChildProfile[] = [];
  selectedPerfil: ChildProfile | null = null;

  // Stats — conectar al backend cuando esté listo
  racha       = 7;
  logros      = 12;
  precision   = 85;
  xpActual    = 680;
  xpMax       = 1000;
  nivel       = 7;
  partidas    = 47;
  tiempoJuego = '3.2h';
  mejora      = '+12%';
  puntos      = 1240;
  areaAtencion = 'Mateo muestra dificultad en Laberinto. Se recomienda más práctica esta semana.';

  actividad = [
    { dia:'Lun', valor:65 }, { dia:'Mar', valor:80 }, { dia:'Mié', valor:45 },
    { dia:'Jue', valor:90 }, { dia:'Vie', valor:70 }, { dia:'Sáb', valor:55 },
    { dia:'Dom', valor:30 },
  ];

  juegosPorRendimiento = [
    { nombre:'Espejo Mental',  icono:'🪞', pct:92, color:'#7C3AED' },
    { nombre:'Historia Viva',  icono:'📖', pct:78, color:'#D97706' },
    { nombre:'Cascada Núm.',   icono:'🔢', pct:65, color:'#059669' },
    { nombre:'Laberinto',      icono:'🌀', pct:55, color:'#2563EB' },
  ];

  ultimaActividad = [
    { hora:'Hoy, 15:30',   juego:'Espejo Mental' },
    { hora:'Hoy, 14:12',   juego:'Historia Viva' },
    { hora:'Ayer, 16:00',  juego:'Cascada Numérica' },
  ];

  constructor(
    public  auth:               AuthService,
    private childProfileService: ChildProfileService,
    private router:              Router,
    private cdr:                 ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.parentName = user.nombre || user.email || 'Padre';
      this.childProfileService.getProfiles(user.usuarioId).subscribe({
        next: data => {
          this.perfiles      = data.filter(p => p.activo);
          this.selectedPerfil = this.perfiles[0] ?? null;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    }
  }

  selectPerfil(p: ChildProfile): void {
    this.selectedPerfil = p;
    this.showMenu       = false;
    this.areaAtencion   = `${p.nombre} muestra dificultad en Laberinto. Se recomienda más práctica esta semana.`;
    this.cdr.detectChanges();
  }

  irAPerfiles(): void { this.router.navigate(['/padre/perfiles/selector']); }

  avatarFn(key?: string | null): string { return AVATAR_MAP[key ?? 'fox'] ?? '🦊'; }

  get xpPct():      number { return Math.round((this.xpActual / this.xpMax) * 100); }
  get maxAct():     number { return Math.max(...this.actividad.map(a => a.valor)); }
  get parentInitial(): string { return this.parentName.charAt(0).toUpperCase() || 'P'; }
}
