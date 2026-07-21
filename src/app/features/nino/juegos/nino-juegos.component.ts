import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChildProfileService } from '../../padre/perfiles/child-profile.service';

interface Juego {
  nombre:   string;
  tipo:     string;
  icono:    string;
  color:    string;
  nivelTxt: string;
  progreso: number;
  ruta:     string;
}

interface ProgresoItem { nombre: string; valor: number; color: string; icono: string; }
interface Logro        { icono: string; nombre: string; desc: string; puntos: number; }

@Component({
  selector: 'app-nino-juegos',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="dashboard">

  <!-- ══ SIDEBAR ══════════════════════════════════════════════════════════ -->
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-icon">🎮</span>
      <span class="brand-name">FocusKids</span>
    </div>

    <div class="profile-block">
      <div class="profile-avatar">{{ profileAvatar }}</div>
      <div class="profile-name">{{ profileName }}</div>
      <div class="profile-level">Nivel {{ nivelNum }} · {{ nivelNombre }}</div>
      <div class="xp-wrap">
        <div class="xp-bar"><div class="xp-fill" [style.width.%]="xpPorcentaje"></div></div>
        <div class="xp-label">{{ xpActual }} / {{ xpMax }} XP</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <button class="nav-item" [class.active]="activeTab === 'inicio'"    (click)="activeTab = 'inicio'">
        <span class="nav-ico">🏠</span> Inicio
      </button>
      <button class="nav-item" [class.active]="activeTab === 'juegos'"    (click)="activeTab = 'juegos'">
        <span class="nav-ico">🎮</span> Mis juegos
      </button>
      <button class="nav-item" [class.active]="activeTab === 'progreso'"  (click)="activeTab = 'progreso'">
        <span class="nav-ico">📊</span> Mi progreso
      </button>
      <button class="nav-item" [class.active]="activeTab === 'logros'"    (click)="activeTab = 'logros'">
        <span class="nav-ico">🏆</span> Logros
      </button>
      <button class="nav-item" [class.active]="activeTab === 'config'"    (click)="activeTab = 'config'">
        <span class="nav-ico">⚙️</span> Configuración
      </button>
    </nav>

    <button class="btn-cerrar" (click)="cerrarSesion()">
      <span>🚪</span> Cerrar sesión
    </button>
  </aside>

  <!-- ══ MAIN ══════════════════════════════════════════════════════════════ -->
  <main class="main">

    <!-- Header -->
    <header class="main-header">
      <div class="header-greeting">
        <h1>¡Hola, {{ profileName }}! 👋</h1>
        <p>Listo para un nuevo reto hoy?</p>
      </div>
      <div class="header-right">
        <div class="streak-badge"><span>🔥</span> {{ streak }} días seguidos</div>
        <button class="notif-btn">🔔</button>
        <div class="header-avatar">{{ profileAvatar }}</div>
      </div>
    </header>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-orange">🔥</div>
        <div class="stat-info">
          <div class="stat-val">{{ streak }}</div>
          <div class="stat-lbl">Días seguidos</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-yellow">⭐</div>
        <div class="stat-info">
          <div class="stat-val">{{ puntosTotales | number }}</div>
          <div class="stat-lbl">Puntos totales</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-teal">🎯</div>
        <div class="stat-info">
          <div class="stat-val">{{ precision }}%</div>
          <div class="stat-lbl">Precisión</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-mint">🏆</div>
        <div class="stat-info">
          <div class="stat-val">{{ logrosCount }}</div>
          <div class="stat-lbl">Logros</div>
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="content-area">

      <!-- Games grid -->
      <section class="games-section">
        <div class="section-header">
          <h2>Elige tu juego</h2>
        </div>
        <div class="games-grid">
          @for (juego of juegos; track juego.nombre) {
            <div class="game-card" [style.--accent]="juego.color"
                 [class.locked]="!estaImplementado(juego.ruta)"
                 (click)="irAJuego(juego)">
              <div class="card-top-bar" [style.background]="juego.color"></div>

              <div class="card-header">
                <div class="card-icon">{{ juego.icono }}</div>
                <button class="play-btn"
                  [style.background]="estaImplementado(juego.ruta) ? juego.color : '#cbd5e1'">
                  {{ estaImplementado(juego.ruta) ? '▶' : '🔒' }}
                </button>
              </div>

              <div class="card-body">
                <div class="card-tipo" [style.color]="juego.color">{{ juego.tipo }}</div>
                <div class="card-nombre">{{ juego.nombre }}</div>
                <div class="card-nivel" [style.color]="juego.color">{{ juego.nivelTxt }}</div>
              </div>

              <div class="card-footer">
                <div class="prog-bar">
                  <div class="prog-fill"
                    [style.width.%]="juego.progreso"
                    [style.background]="juego.color"></div>
                </div>
                <div class="prog-txt">{{ juego.progreso }}% completado</div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Right panel -->
      <aside class="right-panel">

        <!-- Mi progreso -->
        <div class="panel-card">
          <h3 class="panel-title">Mi progreso</h3>
          <div class="progreso-list">
            @for (p of progresos; track p.nombre) {
              <div class="progreso-row">
                <div class="prog-avatar" [style.background]="p.color + '22'" [style.border-color]="p.color + '44'">
                  {{ p.icono }}
                </div>
                <div class="prog-data">
                  <div class="prog-name">{{ p.nombre }}</div>
                  <div class="prog-track">
                    <div class="prog-bar-sm">
                      <div class="prog-fill-sm" [style.width.%]="p.valor" [style.background]="p.color"></div>
                    </div>
                    <span class="prog-pct">{{ p.valor }}%</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Logros recientes -->
        <div class="panel-card">
          <h3 class="panel-title">Logros recientes</h3>
          <div class="logros-list">
            @for (l of logros; track l.nombre) {
              <div class="logro-row">
                <div class="logro-ico">{{ l.icono }}</div>
                <div class="logro-info">
                  <div class="logro-nombre">{{ l.nombre }}</div>
                  <div class="logro-desc">{{ l.desc }}</div>
                </div>
                <div class="logro-pts">+{{ l.puntos }}</div>
              </div>
            }
          </div>
        </div>

      </aside>
    </div>
  </main>
</div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .dashboard {
      display: flex;
      min-height: 100vh;
      background: #EEF0F9;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    /* ══ SIDEBAR ══ */
    .sidebar {
      width: 220px;
      min-height: 100vh;
      background: #1C1145;
      display: flex;
      flex-direction: column;
      padding: 24px 0 20px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      padding: 0 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .brand-icon { font-size: 24px; }
    .brand-name { font-size: 18px; font-weight: 800; color: white; }

    .profile-block {
      padding: 20px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      text-align: center;
    }
    .profile-avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      display: flex; align-items: center; justify-content: center;
      font-size: 38px; margin: 0 auto 10px;
      border: 3px solid rgba(255,255,255,.15);
    }
    .profile-name  { font-size: 16px; font-weight: 800; color: white; margin-bottom: 2px; }
    .profile-level { font-size: 12px; color: #A78BFA; margin-bottom: 12px; }
    .xp-wrap { display: flex; flex-direction: column; gap: 4px; }
    .xp-bar  { height: 6px; background: rgba(255,255,255,.1); border-radius: 100px; overflow: hidden; }
    .xp-fill { height: 100%; background: linear-gradient(90deg,#A78BFA,#60A5FA); border-radius: 100px; }
    .xp-label { font-size: 10px; color: #64748B; text-align: right; }

    .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 12px; border: none;
      background: transparent; color: rgba(255,255,255,.55);
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all .2s; text-align: left; width: 100%;
    }
    .nav-item:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); }
    .nav-item.active { background: rgba(167,139,250,.2); color: white; }
    .nav-ico { font-size: 16px; }

    .btn-cerrar {
      display: flex; align-items: center; gap: 8px;
      margin: 0 12px; padding: 10px 12px;
      background: transparent; border: none; border-radius: 12px;
      color: rgba(255,255,255,.4); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .2s;
    }
    .btn-cerrar:hover { background: rgba(239,68,68,.15); color: #f87171; }

    /* ══ MAIN ══ */
    .main { flex: 1; display: flex; flex-direction: column; overflow: auto; }

    /* Header */
    .main-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 28px; background: white;
      border-bottom: 1px solid #E8E4F4;
      position: sticky; top: 0; z-index: 10;
    }
    .header-greeting h1 { font-size: 22px; font-weight: 800; color: #1E293B; }
    .header-greeting p  { font-size: 13px; color: #64748B; margin-top: 2px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .streak-badge {
      display: flex; align-items: center; gap: 6px;
      background: #FFF7ED; border: 1.5px solid #FDBA74;
      color: #C2410C; border-radius: 20px; padding: 6px 14px;
      font-size: 13px; font-weight: 700;
    }
    .notif-btn {
      background: #F8F7FF; border: 1.5px solid #E8E4F4;
      border-radius: 10px; width: 36px; height: 36px;
      font-size: 16px; cursor: pointer;
    }
    .header-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#7C3AED,#4F46E5);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }

    /* Stats row */
    .stats-row {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: 16px; padding: 20px 28px 0;
    }
    .stat-card {
      background: white; border-radius: 16px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 1px 8px rgba(0,0,0,.05);
    }
    .stat-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 22px;
    }
    .stat-orange { background: #FFF4ED; }
    .stat-yellow { background: #FEFCE8; }
    .stat-teal   { background: #F0FDFA; }
    .stat-mint   { background: #F0FDF4; }
    .stat-val { font-size: 22px; font-weight: 900; color: #1E293B; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #94A3B8; margin-top: 3px; }

    /* Content area */
    .content-area {
      display: flex; gap: 20px; padding: 20px 28px 32px; flex: 1; align-items: flex-start;
    }

    /* Games section */
    .games-section { flex: 1; min-width: 0; }
    .section-header { margin-bottom: 14px; }
    .section-header h2 { font-size: 18px; font-weight: 800; color: #1E293B; }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    .game-card {
      background: white; border-radius: 16px;
      overflow: hidden; cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
      transition: all .22s cubic-bezier(.34,1.56,.64,1);
      border: 1.5px solid transparent;
      display: flex; flex-direction: column;
    }
    .game-card:hover {
      transform: translateY(-4px) scale(1.02);
      border-color: var(--accent);
      box-shadow: 0 8px 28px rgba(0,0,0,.1);
    }
    .game-card.locked { opacity: .7; }
    .game-card.locked:hover { transform: translateY(-2px) scale(1.01); }

    .card-top-bar { height: 4px; width: 100%; }

    .card-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 14px 14px 6px;
    }
    .card-icon { font-size: 36px; line-height: 1; }
    .play-btn {
      width: 28px; height: 28px; border-radius: 50%; border: none;
      color: white; font-size: 11px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: transform .2s;
    }
    .game-card:hover .play-btn { transform: scale(1.15); }

    .card-body { padding: 0 14px 10px; flex: 1; }
    .card-tipo  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 2px; }
    .card-nombre{ font-size: 14px; font-weight: 800; color: #1E293B; margin-bottom: 2px; line-height: 1.3; }
    .card-nivel { font-size: 11px; font-weight: 600; }

    .card-footer { padding: 0 14px 14px; }
    .prog-bar { height: 6px; background: #F1F0F9; border-radius: 100px; overflow: hidden; margin-bottom: 5px; }
    .prog-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }
    .prog-txt { font-size: 10px; color: #94A3B8; font-weight: 600; }

    /* Right panel */
    .right-panel { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
    .panel-card { background: white; border-radius: 16px; padding: 18px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
    .panel-title { font-size: 15px; font-weight: 800; color: #1E293B; margin-bottom: 14px; }

    /* Progreso */
    .progreso-list { display: flex; flex-direction: column; gap: 12px; }
    .progreso-row  { display: flex; align-items: center; gap: 10px; }
    .prog-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; border: 1.5px solid;
    }
    .prog-data { flex: 1; min-width: 0; }
    .prog-name   { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px; }
    .prog-track  { display: flex; align-items: center; gap: 8px; }
    .prog-bar-sm { flex: 1; height: 6px; background: #F1F0F9; border-radius: 100px; overflow: hidden; }
    .prog-fill-sm{ height: 100%; border-radius: 100px; transition: width .8s ease; }
    .prog-pct    { font-size: 11px; font-weight: 700; color: #64748B; flex-shrink: 0; }

    /* Logros */
    .logros-list { display: flex; flex-direction: column; gap: 12px; }
    .logro-row   { display: flex; align-items: center; gap: 10px; }
    .logro-ico   { font-size: 26px; flex-shrink: 0; }
    .logro-info  { flex: 1; min-width: 0; }
    .logro-nombre{ font-size: 12px; font-weight: 800; color: #1E293B; }
    .logro-desc  { font-size: 11px; color: #64748B; margin-top: 1px; }
    .logro-pts   {
      background: #F0FDF4; color: #16A34A; border: 1.5px solid #BBF7D0;
      border-radius: 20px; padding: 3px 9px;
      font-size: 12px; font-weight: 800; flex-shrink: 0;
    }
  `]
})
export class NinoJuegosComponent implements OnInit {

  profileName   = '';
  profileAvatar = '🦊';

  // Stats mock — se conectan al backend cuando esté disponible
  streak        = 7;
  puntosTotales = 1240;
  precision     = 85;
  logrosCount   = 12;
  xpActual      = 680;
  xpMax         = 1000;
  nivelNum      = 4;
  nivelNombre   = 'Explorador';
  activeTab     = 'inicio';

  juegos: Juego[] = [
    { nombre:'Espejo Mental',       tipo:'Atención',   icono:'🪞', color:'#7C3AED', nivelTxt:'Nivel 3 · Avanzado',   progreso:75, ruta:'/nino/juego/espejo-mental' },
    { nombre:'Historia Viva',       tipo:'Lectura',    icono:'📖', color:'#D97706', nivelTxt:'Nivel 1 · Básico',      progreso:10, ruta:'/nino/juego/historia-viva' },
    { nombre:'Foco Extremo',        tipo:'Atención',   icono:'🎯', color:'#4F46E5', nivelTxt:'Nivel 4 · Experto',     progreso:90, ruta:'/nino/juego/foco-extremo' },
    { nombre:'Reacción Controlada', tipo:'Atención',   icono:'⚡', color:'#2563EB', nivelTxt:'Nivel 2 · Intermedio',  progreso:45, ruta:'/nino/juego/reaccion-controlada' },
    { nombre:'Cascada Numérica',    tipo:'Cálculo',    icono:'🔢', color:'#059669', nivelTxt:'Nivel 2 · Intermedio',  progreso:30, ruta:'/nino/juego/cascada-numerica' },
    { nombre:'Laberinto Cognitivo', tipo:'Memoria',    icono:'🌀', color:'#7C3AED', nivelTxt:'Nivel 1 · Básico',      progreso:15, ruta:'/nino/juego/laberinto' },
    { nombre:'Maratón Mental',      tipo:'Cálculo',    icono:'🏃', color:'#059669', nivelTxt:'Nivel 1 · Básico',      progreso:10, ruta:'/nino/juego/maraton-mental' },
    { nombre:'Ritmo y Patrón',      tipo:'Memoria',    icono:'🎵', color:'#9333EA', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/ritmo-patron' },
    { nombre:'Palabras Ocultas',    tipo:'Lenguaje',   icono:'📝', color:'#EA580C', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/palabras-ocultas' },
    { nombre:'Piezas en Tiempo',    tipo:'Percepción', icono:'🧩', color:'#0891B2', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/piezas-tiempo' },
    { nombre:'Mapa Aventura',       tipo:'Geografía',  icono:'🗺️', color:'#65A30D', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/mapa-aventura' },
    { nombre:'Lab de Ciencias',     tipo:'Lógica',     icono:'🔬', color:'#DB2777', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/lab-ciencias' },
  ];

  progresos: ProgresoItem[] = [
    { nombre:'Atención', valor:75, color:'#7C3AED', icono:'🪞' },
    { nombre:'Lectura',  valor:45, color:'#D97706', icono:'📖' },
    { nombre:'Cálculo',  valor:90, color:'#059669', icono:'🔢' },
    { nombre:'Memoria',  valor:30, color:'#EA580C', icono:'🌀' },
  ];

  logros: Logro[] = [
    { icono:'🌟', nombre:'Semana perfecta!',  desc:'7 días seguidos jugando',    puntos:50 },
    { icono:'🏆', nombre:'1000 puntos',        desc:'Superaste los 1,000 puntos', puntos:30 },
    { icono:'⚡', nombre:'Velocidad récord',    desc:'Completaste Espejo en 45s',  puntos:25 },
  ];

  private implementados = ['/nino/juego/espejo-mental', '/nino/juego/historia-viva', '/nino/juego/ritmo-patron'];

  constructor(private profileService: ChildProfileService, private router: Router) {}

  ngOnInit(): void {
    this.profileService.activeProfile$.subscribe(state => {
      if (!state.profileId) {
        this.router.navigate(['/padre/dashboard']);
        return;
      }
      this.profileName   = state.profileName   || 'Niño';
      this.profileAvatar = this.avatarEmoji(state.profileAvatar || 'fox');
    });
  }

  private avatarEmoji(avatar: string): string {
    const map: Record<string, string> = {
      fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
      unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
      bear:'🐻', mouse:'🐭'
    };
    return map[avatar] ?? '🦊';
  }

  estaImplementado(ruta: string): boolean {
    return this.implementados.includes(ruta);
  }

  irAJuego(juego: Juego): void {
    if (this.implementados.includes(juego.ruta)) {
      this.router.navigate([juego.ruta]);
    } else {
      alert(`¡${juego.nombre} próximamente! 🎮`);
    }
  }

  cerrarSesion(): void {
    this.router.navigate(['/padre/dashboard']);
  }

  get xpPorcentaje(): number {
    return Math.round((this.xpActual / this.xpMax) * 100);
  }
}
