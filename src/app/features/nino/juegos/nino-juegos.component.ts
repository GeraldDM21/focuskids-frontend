import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChildProfileService } from '../../padre/perfiles/child-profile.service';

interface Juego       { nombre: string; tipo: string; icono: string; color: string; nivelTxt: string; progreso: number; ruta: string; }
interface ProgresoItem{ nombre: string; valor: number; color: string; icono: string; }
interface Logro       { icono: string; nombre: string; desc: string; puntos: number; }
interface LogroFull   { icono: string; nombre: string; desc: string; puntos: number; ganado: boolean; cat: string; }
interface Sesion      { juego: string; icono: string; hace: string; precision: number; pts: number; }
interface Avatar      { key: string; emoji: string; }

@Component({
  selector: 'app-nino-juegos',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="dashboard">

  <!-- ══ SIDEBAR ══ -->
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
      <button class="nav-item" [class.active]="activeTab === 'inicio'"   (click)="activeTab = 'inicio'">
        <span class="nav-ico">🏠</span> Inicio
      </button>
      <button class="nav-item" [class.active]="activeTab === 'juegos'"   (click)="activeTab = 'juegos'">
        <span class="nav-ico">🎮</span> Mis juegos
      </button>
      <button class="nav-item" [class.active]="activeTab === 'progreso'" (click)="activeTab = 'progreso'">
        <span class="nav-ico">📊</span> Mi progreso
      </button>
      <button class="nav-item" [class.active]="activeTab === 'logros'"   (click)="activeTab = 'logros'">
        <span class="nav-ico">🏆</span> Logros
      </button>
      <button class="nav-item" [class.active]="activeTab === 'config'"   (click)="activeTab = 'config'">
        <span class="nav-ico">⚙️</span> Configuración
      </button>
    </nav>

    <button class="btn-cerrar" (click)="cerrarSesion()">
      <span>🚪</span> Cerrar sesión
    </button>
  </aside>

  <!-- ══ MAIN ══ -->
  <main class="main">

    <!-- Header -->
    <header class="main-header">
      <div class="header-greeting">
        <h1>{{ headerTitle }}</h1>
        <p>{{ headerSub }}</p>
      </div>
      <div class="header-right">
        <div class="streak-badge"><span>🔥</span> {{ streak }} días seguidos</div>
        <button class="notif-btn">🔔</button>
        <div class="header-avatar">{{ profileAvatar }}</div>
      </div>
    </header>

    <!-- ── INICIO / JUEGOS ── -->
    @if (activeTab === 'inicio' || activeTab === 'juegos') {

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon stat-orange">🔥</div>
          <div class="stat-info"><div class="stat-val">{{ streak }}</div><div class="stat-lbl">Días seguidos</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-yellow">⭐</div>
          <div class="stat-info"><div class="stat-val">{{ puntosTotales | number }}</div><div class="stat-lbl">Puntos totales</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-teal">🎯</div>
          <div class="stat-info"><div class="stat-val">{{ precision }}%</div><div class="stat-lbl">Precisión</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-mint">🏆</div>
          <div class="stat-info"><div class="stat-val">{{ logrosGanados }}</div><div class="stat-lbl">Logros</div></div>
        </div>
      </div>

      <div class="content-area">
        <section class="games-section">
          <div class="section-header"><h2>Elige tu juego</h2></div>
          <div class="games-grid">
            @for (juego of juegos; track juego.nombre) {
              <div class="game-card" [style.--accent]="juego.color"
                   [class.locked]="!estaImplementado(juego.ruta)"
                   (click)="irAJuego(juego)">
                <div class="card-top-bar" [style.background]="juego.color"></div>
                <div class="card-header">
                  <div class="card-icon">{{ juego.icono }}</div>
                  <button class="play-btn" [style.background]="estaImplementado(juego.ruta) ? juego.color : '#cbd5e1'">
                    {{ estaImplementado(juego.ruta) ? '▶' : '🔒' }}
                  </button>
                </div>
                <div class="card-body">
                  <div class="card-tipo"   [style.color]="juego.color">{{ juego.tipo }}</div>
                  <div class="card-nombre">{{ juego.nombre }}</div>
                  <div class="card-nivel"  [style.color]="juego.color">{{ juego.nivelTxt }}</div>
                </div>
                <div class="card-footer">
                  <div class="prog-bar">
                    <div class="prog-fill" [style.width.%]="juego.progreso" [style.background]="juego.color"></div>
                  </div>
                  <div class="prog-txt">{{ juego.progreso }}% completado</div>
                </div>
              </div>
            }
          </div>
        </section>

        <aside class="right-panel">
          <div class="panel-card">
            <h3 class="panel-title">Mi progreso</h3>
            <div class="progreso-list">
              @for (p of progresos; track p.nombre) {
                <div class="progreso-row">
                  <div class="prog-avatar" [style.background]="p.color + '22'" [style.border-color]="p.color + '44'">{{ p.icono }}</div>
                  <div class="prog-data">
                    <div class="prog-name">{{ p.nombre }}</div>
                    <div class="prog-track">
                      <div class="prog-bar-sm"><div class="prog-fill-sm" [style.width.%]="p.valor" [style.background]="p.color"></div></div>
                      <span class="prog-pct">{{ p.valor }}%</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="panel-card">
            <h3 class="panel-title">Logros recientes</h3>
            <div class="logros-list">
              @for (l of logrosRecientes; track l.nombre) {
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
    }

    <!-- ── MI PROGRESO ── -->
    @if (activeTab === 'progreso') {
      <div class="tab-content">

        <!-- Resumen de stats grandes -->
        <div class="progreso-stats-row">
          <div class="pstat-card">
            <div class="pstat-icon">🎮</div>
            <div class="pstat-val">{{ totalSesiones }}</div>
            <div class="pstat-lbl">Sesiones jugadas</div>
          </div>
          <div class="pstat-card">
            <div class="pstat-icon">⏱️</div>
            <div class="pstat-val">{{ tiempoPromedio }}m</div>
            <div class="pstat-lbl">Tiempo promedio</div>
          </div>
          <div class="pstat-card">
            <div class="pstat-icon">🎯</div>
            <div class="pstat-val">{{ precision }}%</div>
            <div class="pstat-lbl">Precisión global</div>
          </div>
          <div class="pstat-card">
            <div class="pstat-icon">🔥</div>
            <div class="pstat-val">{{ mejorRacha }}</div>
            <div class="pstat-lbl">Mejor racha</div>
          </div>
        </div>

        <div class="progreso-body">

          <!-- Categorías detalladas -->
          <div class="prog-card">
            <h3 class="prog-card-title">Progreso por categoría</h3>
            <div class="cat-list">
              @for (p of progresos; track p.nombre) {
                <div class="cat-row">
                  <div class="cat-label">
                    <span class="cat-ico">{{ p.icono }}</span>
                    <span class="cat-name">{{ p.nombre }}</span>
                  </div>
                  <div class="cat-bar-wrap">
                    <div class="cat-bar"><div class="cat-fill" [style.width.%]="p.valor" [style.background]="p.color"></div></div>
                    <span class="cat-pct" [style.color]="p.color">{{ p.valor }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Últimas sesiones -->
          <div class="prog-card">
            <h3 class="prog-card-title">Últimas sesiones</h3>
            <div class="sesiones-list">
              @for (s of ultimasSesiones; track s.hace) {
                <div class="sesion-row">
                  <div class="sesion-ico">{{ s.icono }}</div>
                  <div class="sesion-info">
                    <div class="sesion-nombre">{{ s.juego }}</div>
                    <div class="sesion-hace">{{ s.hace }}</div>
                  </div>
                  <div class="sesion-right">
                    <div class="sesion-precision">🎯 {{ s.precision }}%</div>
                    <div class="sesion-pts">+{{ s.pts }} pts</div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    }

    <!-- ── LOGROS ── -->
    @if (activeTab === 'logros') {
      <div class="tab-content">

        <!-- Resumen -->
        <div class="logros-header">
          <div class="logros-resumen">
            <div class="lr-num">{{ logrosGanados }}</div>
            <div class="lr-lbl">de {{ logrosCompletos.length }} logros ganados</div>
            <div class="lr-bar"><div class="lr-fill" [style.width.%]="(logrosGanados / logrosCompletos.length) * 100"></div></div>
          </div>
          <div class="logros-pts-total">
            <div class="lpt-val">{{ puntosLogros }}</div>
            <div class="lpt-lbl">puntos de logros</div>
          </div>
        </div>

        <!-- Filtro por categoría -->
        <div class="cat-filter">
          @for (c of categorias; track c) {
            <button class="cat-btn" [class.cat-btn-active]="filtroCategoria === c" (click)="filtroCategoria = c">{{ c }}</button>
          }
        </div>

        <!-- Grid de logros -->
        <div class="logros-grid">
          @for (l of logrosFiltrados; track l.nombre) {
            <div class="logro-card" [class.logro-ganado]="l.ganado" [class.logro-locked]="!l.ganado">
              <div class="logro-card-ico">{{ l.ganado ? l.icono : '🔒' }}</div>
              <div class="logro-card-nombre">{{ l.ganado ? l.nombre : '???' }}</div>
              <div class="logro-card-desc">{{ l.ganado ? l.desc : 'Sigue jugando para desbloquear' }}</div>
              <div class="logro-card-pts" [class.logro-pts-ganado]="l.ganado">
                {{ l.ganado ? '+' + l.puntos + ' pts' : l.puntos + ' pts' }}
              </div>
              <div class="logro-cat-badge">{{ l.cat }}</div>
            </div>
          }
        </div>
      </div>
    }

    <!-- ── CONFIGURACIÓN ── -->
    @if (activeTab === 'config') {
      <div class="tab-content">
        <div class="config-body">

          <!-- Mi perfil -->
          <div class="config-card">
            <h3 class="config-section-title">👤 Mi perfil</h3>
            <div class="config-field">
              <label class="config-label">Nombre</label>
              <div class="config-value-ro">{{ profileName }}</div>
            </div>
            <div class="config-field">
              <label class="config-label">Nivel</label>
              <div class="config-value-ro">Nivel {{ nivelNum }} · {{ nivelNombre }}</div>
            </div>
            <div class="config-field">
              <label class="config-label">Elige tu avatar</label>
              <div class="avatar-grid">
                @for (av of avatares; track av.key) {
                  <button class="avatar-btn"
                    [class.avatar-sel]="avatarSeleccionado === av.key"
                    (click)="seleccionarAvatar(av.key)">
                    {{ av.emoji }}
                  </button>
                }
              </div>
            </div>
            <p class="config-note">Para cambiar tu nombre o contraseña, pedile a tu tutor. 👨‍👩‍👧</p>
          </div>

          <!-- Sonido -->
          <div class="config-card">
            <h3 class="config-section-title">🔊 Sonido</h3>
            <div class="config-toggle-row">
              <div class="toggle-info">
                <div class="toggle-label">Música y efectos del juego</div>
                <div class="toggle-desc">Sonidos durante las partidas</div>
              </div>
              <button class="toggle-btn" [class.toggle-on]="sonidoJuego" (click)="sonidoJuego = !sonidoJuego">
                <div class="toggle-knob"></div>
              </button>
            </div>
            <div class="config-toggle-row">
              <div class="toggle-info">
                <div class="toggle-label">Voz de la mascota</div>
                <div class="toggle-desc">La mascota te da tips en voz alta</div>
              </div>
              <button class="toggle-btn" [class.toggle-on]="vozMascota" (click)="vozMascota = !vozMascota">
                <div class="toggle-knob"></div>
              </button>
            </div>
          </div>

          <!-- Juego -->
          <div class="config-card">
            <h3 class="config-section-title">🎮 Preferencias de juego</h3>
            <div class="config-field">
              <label class="config-label">Nivel inicial preferido</label>
              <div class="nivel-selector">
                @for (n of nivelesConfig; track n.val) {
                  <button class="nivel-opt" [class.nivel-opt-sel]="nivelInicial === n.val" (click)="nivelInicial = n.val">
                    <span>{{ n.ico }}</span> {{ n.lbl }}
                  </button>
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    }

  </main>
</div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .dashboard {
      display: flex; min-height: 100vh;
      background: #EEF0F9;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    /* ══ SIDEBAR ══ */
    .sidebar {
      width: 220px; min-height: 100vh;
      background: #1C1145;
      display: flex; flex-direction: column;
      padding: 24px 0 20px; flex-shrink: 0;
      position: sticky; top: 0; height: 100vh;
    }
    .brand { display: flex; align-items: center; gap: 10px; padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .brand-icon { font-size: 24px; }
    .brand-name { font-size: 18px; font-weight: 800; color: white; }

    .profile-block { padding: 20px; border-bottom: 1px solid rgba(255,255,255,.08); text-align: center; }
    .profile-avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      display: flex; align-items: center; justify-content: center;
      font-size: 38px; margin: 0 auto 10px;
      border: 3px solid rgba(255,255,255,.15);
    }
    .profile-name  { font-size: 16px; font-weight: 800; color: white; margin-bottom: 2px; }
    .profile-level { font-size: 12px; color: #A78BFA; margin-bottom: 12px; }
    .xp-wrap  { display: flex; flex-direction: column; gap: 4px; }
    .xp-bar   { height: 6px; background: rgba(255,255,255,.1); border-radius: 100px; overflow: hidden; }
    .xp-fill  { height: 100%; background: linear-gradient(90deg,#A78BFA,#60A5FA); border-radius: 100px; }
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
    .notif-btn  { background: #F8F7FF; border: 1.5px solid #E8E4F4; border-radius: 10px; width: 36px; height: 36px; font-size: 16px; cursor: pointer; }
    .header-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#7C3AED,#4F46E5);
      display: flex; align-items: center; justify-content: center; font-size: 20px;
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
    .stat-icon { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .stat-orange { background: #FFF4ED; }
    .stat-yellow { background: #FEFCE8; }
    .stat-teal   { background: #F0FDFA; }
    .stat-mint   { background: #F0FDF4; }
    .stat-val { font-size: 22px; font-weight: 900; color: #1E293B; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #94A3B8; margin-top: 3px; }

    /* Content area (inicio/juegos) */
    .content-area { display: flex; gap: 20px; padding: 20px 28px 32px; flex: 1; align-items: flex-start; }
    .games-section { flex: 1; min-width: 0; }
    .section-header { margin-bottom: 14px; }
    .section-header h2 { font-size: 18px; font-weight: 800; color: #1E293B; }

    .games-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
    .game-card {
      background: white; border-radius: 16px; overflow: hidden; cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
      transition: all .22s cubic-bezier(.34,1.56,.64,1);
      border: 1.5px solid transparent; display: flex; flex-direction: column;
    }
    .game-card:hover { transform: translateY(-4px) scale(1.02); border-color: var(--accent); box-shadow: 0 8px 28px rgba(0,0,0,.1); }
    .game-card.locked { opacity: .7; }
    .game-card.locked:hover { transform: translateY(-2px) scale(1.01); }
    .card-top-bar { height: 4px; }
    .card-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 14px 6px; }
    .card-icon { font-size: 36px; line-height: 1; }
    .play-btn {
      width: 28px; height: 28px; border-radius: 50%; border: none; color: white;
      font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: transform .2s;
    }
    .game-card:hover .play-btn { transform: scale(1.15); }
    .card-body { padding: 0 14px 10px; flex: 1; }
    .card-tipo   { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 2px; }
    .card-nombre { font-size: 14px; font-weight: 800; color: #1E293B; margin-bottom: 2px; line-height: 1.3; }
    .card-nivel  { font-size: 11px; font-weight: 600; }
    .card-footer { padding: 0 14px 14px; }
    .prog-bar  { height: 6px; background: #F1F0F9; border-radius: 100px; overflow: hidden; margin-bottom: 5px; }
    .prog-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }
    .prog-txt  { font-size: 10px; color: #94A3B8; font-weight: 600; }

    /* Right panel */
    .right-panel { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
    .panel-card { background: white; border-radius: 16px; padding: 18px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
    .panel-title { font-size: 15px; font-weight: 800; color: #1E293B; margin-bottom: 14px; }

    .progreso-list { display: flex; flex-direction: column; gap: 12px; }
    .progreso-row  { display: flex; align-items: center; gap: 10px; }
    .prog-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; border: 1.5px solid;
    }
    .prog-data   { flex: 1; min-width: 0; }
    .prog-name   { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 5px; }
    .prog-track  { display: flex; align-items: center; gap: 8px; }
    .prog-bar-sm { flex: 1; height: 6px; background: #F1F0F9; border-radius: 100px; overflow: hidden; }
    .prog-fill-sm{ height: 100%; border-radius: 100px; }
    .prog-pct    { font-size: 11px; font-weight: 700; color: #64748B; flex-shrink: 0; }

    .logros-list  { display: flex; flex-direction: column; gap: 12px; }
    .logro-row    { display: flex; align-items: center; gap: 10px; }
    .logro-ico    { font-size: 26px; flex-shrink: 0; }
    .logro-info   { flex: 1; min-width: 0; }
    .logro-nombre { font-size: 12px; font-weight: 800; color: #1E293B; }
    .logro-desc   { font-size: 11px; color: #64748B; margin-top: 1px; }
    .logro-pts    { background: #F0FDF4; color: #16A34A; border: 1.5px solid #BBF7D0; border-radius: 20px; padding: 3px 9px; font-size: 12px; font-weight: 800; flex-shrink: 0; }

    /* ══ TAB CONTENT ══ */
    .tab-content { flex: 1; padding: 24px 28px 32px; overflow: auto; }

    /* ── MI PROGRESO ── */
    .progreso-stats-row {
      display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px;
    }
    .pstat-card {
      background: white; border-radius: 16px; padding: 20px;
      text-align: center; box-shadow: 0 1px 8px rgba(0,0,0,.05);
    }
    .pstat-icon { font-size: 28px; margin-bottom: 8px; }
    .pstat-val  { font-size: 28px; font-weight: 900; color: #1E293B; line-height: 1; }
    .pstat-lbl  { font-size: 12px; color: #94A3B8; margin-top: 4px; }

    .progreso-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .prog-card { background: white; border-radius: 16px; padding: 22px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
    .prog-card-title { font-size: 16px; font-weight: 800; color: #1E293B; margin-bottom: 20px; }

    .cat-list { display: flex; flex-direction: column; gap: 18px; }
    .cat-row  { display: flex; flex-direction: column; gap: 8px; }
    .cat-label { display: flex; align-items: center; gap: 8px; }
    .cat-ico   { font-size: 20px; }
    .cat-name  { font-size: 14px; font-weight: 700; color: #334155; }
    .cat-bar-wrap { display: flex; align-items: center; gap: 12px; }
    .cat-bar   { flex: 1; height: 10px; background: #F1F0F9; border-radius: 100px; overflow: hidden; }
    .cat-fill  { height: 100%; border-radius: 100px; transition: width 1s ease; }
    .cat-pct   { font-size: 13px; font-weight: 800; flex-shrink: 0; min-width: 38px; text-align: right; }

    .sesiones-list { display: flex; flex-direction: column; gap: 14px; }
    .sesion-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; background: #F8F7FF; border-radius: 12px;
    }
    .sesion-ico  { font-size: 28px; flex-shrink: 0; }
    .sesion-info { flex: 1; min-width: 0; }
    .sesion-nombre { font-size: 13px; font-weight: 700; color: #1E293B; }
    .sesion-hace   { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .sesion-right  { text-align: right; }
    .sesion-precision { font-size: 13px; font-weight: 700; color: #0F766E; }
    .sesion-pts       { font-size: 11px; color: #16A34A; font-weight: 700; margin-top: 2px; }

    /* ── LOGROS ── */
    .logros-header {
      display: flex; align-items: center; justify-content: space-between;
      background: white; border-radius: 16px; padding: 20px 24px;
      box-shadow: 0 1px 8px rgba(0,0,0,.05); margin-bottom: 20px;
    }
    .logros-resumen { flex: 1; }
    .lr-num  { font-size: 36px; font-weight: 900; color: #7C3AED; line-height: 1; }
    .lr-lbl  { font-size: 13px; color: #64748B; margin: 4px 0 10px; }
    .lr-bar  { height: 8px; background: #EDE9FE; border-radius: 100px; overflow: hidden; max-width: 280px; }
    .lr-fill { height: 100%; background: linear-gradient(90deg,#7C3AED,#A78BFA); border-radius: 100px; transition: width 1s ease; }
    .logros-pts-total { text-align: right; }
    .lpt-val { font-size: 32px; font-weight: 900; color: #16A34A; }
    .lpt-lbl { font-size: 12px; color: #64748B; margin-top: 2px; }

    .cat-filter { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
    .cat-btn {
      padding: 7px 16px; border-radius: 20px; border: 1.5px solid #E2E8F0;
      background: white; color: #64748B; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .2s;
    }
    .cat-btn:hover { border-color: #A78BFA; color: #7C3AED; }
    .cat-btn-active { background: #7C3AED; border-color: #7C3AED; color: white; }

    .logros-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;
    }
    .logro-card {
      border-radius: 16px; padding: 18px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      position: relative; overflow: hidden; transition: transform .2s;
    }
    .logro-card:hover { transform: translateY(-3px); }
    .logro-ganado { background: white; box-shadow: 0 2px 14px rgba(124,58,237,.12); border: 2px solid #EDE9FE; }
    .logro-locked { background: #F8FAFC; border: 2px solid #E2E8F0; opacity: .75; }
    .logro-card-ico    { font-size: 40px; line-height: 1; }
    .logro-card-nombre { font-size: 13px; font-weight: 800; color: #1E293B; }
    .logro-card-desc   { font-size: 11px; color: #64748B; line-height: 1.4; }
    .logro-card-pts    { font-size: 12px; font-weight: 700; color: #94A3B8; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 3px 10px; }
    .logro-pts-ganado  { color: #16A34A; border-color: #BBF7D0; background: #F0FDF4; }
    .logro-cat-badge   { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; }

    /* ── CONFIGURACIÓN ── */
    .config-body { max-width: 640px; display: flex; flex-direction: column; gap: 20px; }
    .config-card { background: white; border-radius: 16px; padding: 22px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
    .config-section-title { font-size: 16px; font-weight: 800; color: #1E293B; margin-bottom: 18px; }
    .config-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
    .config-label { font-size: 13px; font-weight: 700; color: #475569; }
    .config-value-ro {
      background: #F8F7FF; border: 1.5px solid #E8E4F4;
      border-radius: 10px; padding: 10px 14px;
      font-size: 14px; font-weight: 600; color: #334155;
    }
    .config-note { font-size: 12px; color: #94A3B8; margin-top: 4px; }

    .avatar-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .avatar-btn {
      width: 52px; height: 52px; border-radius: 12px; border: 2px solid #E2E8F0;
      background: #F8F7FF; font-size: 28px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .avatar-btn:hover { border-color: #A78BFA; transform: scale(1.1); }
    .avatar-sel { border-color: #7C3AED; background: #EDE9FE; box-shadow: 0 0 0 3px rgba(124,58,237,.2); }

    .config-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 0; border-bottom: 1px solid #F1F0F9;
    }
    .config-toggle-row:last-child { border-bottom: none; }
    .toggle-info { flex: 1; }
    .toggle-label { font-size: 14px; font-weight: 700; color: #334155; }
    .toggle-desc  { font-size: 12px; color: #94A3B8; margin-top: 2px; }
    .toggle-btn {
      width: 46px; height: 26px; border-radius: 100px; border: none; cursor: pointer;
      background: #E2E8F0; position: relative; transition: background .25s; flex-shrink: 0;
    }
    .toggle-btn.toggle-on { background: #7C3AED; }
    .toggle-knob {
      position: absolute; top: 3px; left: 3px;
      width: 20px; height: 20px; border-radius: 50%; background: white;
      transition: left .25s; box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .toggle-btn.toggle-on .toggle-knob { left: 23px; }

    .nivel-selector { display: flex; gap: 8px; flex-wrap: wrap; }
    .nivel-opt {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 12px; border: 2px solid #E2E8F0;
      background: white; font-size: 13px; font-weight: 700; cursor: pointer;
      color: #475569; transition: all .2s;
    }
    .nivel-opt:hover { border-color: #A78BFA; color: #7C3AED; }
    .nivel-opt-sel { border-color: #7C3AED; background: #EDE9FE; color: #7C3AED; }
  `]
})
export class NinoJuegosComponent implements OnInit {

  profileName   = '';
  profileAvatar = '🦊';

  streak        = 7;
  puntosTotales = 1240;
  precision     = 85;
  xpActual      = 680;
  xpMax         = 1000;
  nivelNum      = 4;
  nivelNombre   = 'Explorador';
  activeTab     = 'inicio';

  // Progreso tab stats
  totalSesiones = 34;
  tiempoPromedio = 8;
  mejorRacha    = 7;

  // Config state
  sonidoJuego      = true;
  vozMascota       = true;
  avatarSeleccionado = 'fox';
  nivelInicial: string = 'FACIL';

  filtroCategoria = 'Todos';
  readonly categorias = ['Todos', 'Constancia', 'Maestría', 'Velocidad', 'Social'];

  readonly nivelesConfig = [
    { val:'FACIL', lbl:'Fácil', ico:'🟢' },
    { val:'MEDIO', lbl:'Medio', ico:'🟡' },
    { val:'DIFICIL', lbl:'Difícil', ico:'🟠' },
  ];

  readonly avatares: Avatar[] = [
    { key:'fox',     emoji:'🦊' }, { key:'frog',    emoji:'🐸' },
    { key:'lion',    emoji:'🦁' }, { key:'panda',   emoji:'🐼' },
    { key:'koala',   emoji:'🐨' }, { key:'unicorn', emoji:'🦄' },
    { key:'dog',     emoji:'🐶' }, { key:'cat',     emoji:'🐱' },
    { key:'rabbit',  emoji:'🐰' }, { key:'tiger',   emoji:'🐯' },
    { key:'bear',    emoji:'🐻' }, { key:'mouse',   emoji:'🐭' },
  ];

  readonly juegos: Juego[] = [
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

  readonly progresos: ProgresoItem[] = [
    { nombre:'Atención', valor:75, color:'#7C3AED', icono:'🪞' },
    { nombre:'Lectura',  valor:45, color:'#D97706', icono:'📖' },
    { nombre:'Cálculo',  valor:90, color:'#059669', icono:'🔢' },
    { nombre:'Memoria',  valor:30, color:'#EA580C', icono:'🌀' },
  ];

  readonly logrosRecientes: Logro[] = [
    { icono:'🌟', nombre:'Semana perfecta!', desc:'7 días seguidos jugando',    puntos:50 },
    { icono:'🏆', nombre:'1000 puntos',       desc:'Superaste los 1,000 puntos', puntos:30 },
    { icono:'⚡', nombre:'Velocidad récord',   desc:'Completaste Espejo en 45s',  puntos:25 },
  ];

  readonly logrosCompletos: LogroFull[] = [
    { icono:'🌟', nombre:'Semana perfecta',    desc:'7 días seguidos jugando',               puntos:50,  ganado:true,  cat:'Constancia' },
    { icono:'🏆', nombre:'1000 puntos',         desc:'Supera 1,000 puntos en total',          puntos:30,  ganado:true,  cat:'Maestría' },
    { icono:'⚡', nombre:'Velocidad récord',    desc:'Termina un juego en menos de 45s',      puntos:25,  ganado:true,  cat:'Velocidad' },
    { icono:'🎯', nombre:'Precisión perfecta',  desc:'Logra 100% de aciertos en una sesión',  puntos:40,  ganado:false, cat:'Maestría' },
    { icono:'🔥', nombre:'En llamas',           desc:'10 días seguidos jugando',               puntos:75,  ganado:false, cat:'Constancia' },
    { icono:'🧠', nombre:'Maestro cognitivo',   desc:'Completa al menos 1 sesión en 6 juegos', puntos:100, ganado:false, cat:'Maestría' },
    { icono:'🚀', nombre:'Despegue',            desc:'Sube al nivel Experto en cualquier juego', puntos:50, ganado:false, cat:'Velocidad' },
    { icono:'🌈', nombre:'Explorador',          desc:'Juega todos los tipos de categoría',     puntos:35,  ganado:false, cat:'Maestría' },
    { icono:'💎', nombre:'Diamante',            desc:'Acumula 5,000 puntos en total',          puntos:150, ganado:false, cat:'Maestría' },
    { icono:'🎪', nombre:'Jugador incansable',  desc:'Completa 50 sesiones de juego',          puntos:60,  ganado:false, cat:'Constancia' },
    { icono:'🤝', nombre:'Compañero',           desc:'Tu tutor revisa tu progreso esta semana', puntos:15,  ganado:false, cat:'Social' },
    { icono:'🥇', nombre:'Top 1 del día',       desc:'Mayor puntaje en una sesión del día',    puntos:20,  ganado:false, cat:'Social' },
  ];

  readonly ultimasSesiones: Sesion[] = [
    { juego:'Espejo Mental',    icono:'🪞', hace:'Hace 1 hora',   precision:85, pts:120 },
    { juego:'Palabras Ocultas', icono:'📝', hace:'Ayer',          precision:72, pts:90  },
    { juego:'Piezas en Tiempo', icono:'🧩', hace:'Ayer',          precision:65, pts:75  },
    { juego:'Historia Viva',    icono:'📖', hace:'Hace 2 días',   precision:90, pts:150 },
    { juego:'Espejo Mental',    icono:'🪞', hace:'Hace 3 días',   precision:78, pts:110 },
  ];

  private readonly implementados = [
    '/nino/juego/espejo-mental', '/nino/juego/palabras-ocultas',
    '/nino/juego/historia-viva', '/nino/juego/piezas-tiempo'
  ];

  constructor(private profileService: ChildProfileService, private router: Router) {}

  ngOnInit(): void {
    this.profileService.activeProfile$.subscribe(state => {
      if (!state.profileId) { this.router.navigate(['/padre/dashboard']); return; }
      this.profileName     = state.profileName   || 'Niño';
      this.profileAvatar   = this.avatarEmoji(state.profileAvatar || 'fox');
      this.avatarSeleccionado = state.profileAvatar || 'fox';
    });
  }

  get headerTitle(): string {
    switch (this.activeTab) {
      case 'progreso': return '📊 Mi progreso';
      case 'logros':   return '🏆 Mis logros';
      case 'config':   return '⚙️ Configuración';
      default:         return `¡Hola, ${this.profileName}! 👋`;
    }
  }

  get headerSub(): string {
    switch (this.activeTab) {
      case 'progreso': return 'Así vas evolucionando cada día';
      case 'logros':   return `${this.logrosGanados} de ${this.logrosCompletos.length} logros desbloqueados`;
      case 'config':   return 'Personaliza tu experiencia';
      default:         return 'Listo para un nuevo reto hoy?';
    }
  }

  get logrosGanados(): number { return this.logrosCompletos.filter(l => l.ganado).length; }

  get puntosLogros(): number {
    return this.logrosCompletos.filter(l => l.ganado).reduce((s, l) => s + l.puntos, 0);
  }

  get logrosFiltrados(): LogroFull[] {
    return this.filtroCategoria === 'Todos'
      ? this.logrosCompletos
      : this.logrosCompletos.filter(l => l.cat === this.filtroCategoria);
  }

  private avatarEmoji(avatar: string): string {
    const map: Record<string, string> = {
      fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
      unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
      bear:'🐻', mouse:'🐭'
    };
    return map[avatar] ?? '🦊';
  }

  seleccionarAvatar(key: string): void {
    this.avatarSeleccionado = key;
    this.profileAvatar = this.avatarEmoji(key);
  }

  estaImplementado(ruta: string): boolean { return this.implementados.includes(ruta); }

  irAJuego(juego: Juego): void {
    if (this.implementados.includes(juego.ruta)) {
      this.router.navigate([juego.ruta]);
    } else {
      alert(`¡${juego.nombre} próximamente! 🎮`);
    }
  }

  cerrarSesion(): void { this.router.navigate(['/padre/dashboard']); }

  get xpPorcentaje(): number { return Math.round((this.xpActual / this.xpMax) * 100); }
}
