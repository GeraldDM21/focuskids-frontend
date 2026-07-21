import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChildProfileService } from '../../padre/perfiles/child-profile.service';
import { DocenteService, AsignacionPerfil } from '../../docente/docente.service';
import { SesionJuego, Metrica } from '../../padre/padre.service';

interface Juego       { nombre: string; tipo: string; icono: string; personaje: string; color: string; nivelTxt: string; progreso: number; ruta: string; }
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
      <button class="nav-item" [class.active]="activeTab==='inicio'"   (click)="activeTab='inicio'"><span class="nav-ico">🏠</span> Inicio</button>
      <button class="nav-item" [class.active]="activeTab==='juegos'"   (click)="activeTab='juegos'"><span class="nav-ico">🎮</span> Mis juegos</button>
      <button class="nav-item" [class.active]="activeTab==='progreso'" (click)="activeTab='progreso'"><span class="nav-ico">📊</span> Mi progreso</button>
      <button class="nav-item" [class.active]="activeTab==='logros'"   (click)="activeTab='logros'"><span class="nav-ico">🏆</span> Logros</button>
      <button class="nav-item" [class.active]="activeTab==='tareas'"   (click)="activeTab='tareas'"><span class="nav-ico">📋</span> Mis tareas</button>
      <button class="nav-item" [class.active]="activeTab==='config'"   (click)="activeTab='config'"><span class="nav-ico">⚙️</span> Configuración</button>
    </nav>
    <button class="btn-cerrar" (click)="cerrarSesion()"><span>🚪</span> Cerrar sesión</button>
  </aside>

  <!-- ══ MAIN ══ -->
  <main class="main">

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
        <div class="stat-card"><div class="stat-icon stat-orange">🔥</div><div class="stat-info"><div class="stat-val">{{ streak }}</div><div class="stat-lbl">Días seguidos</div></div></div>
        <div class="stat-card"><div class="stat-icon stat-yellow">⭐</div><div class="stat-info"><div class="stat-val">{{ puntosTotales | number }}</div><div class="stat-lbl">Puntos totales</div></div></div>
        <div class="stat-card"><div class="stat-icon stat-teal">🎯</div><div class="stat-info"><div class="stat-val">{{ precision }}%</div><div class="stat-lbl">Precisión</div></div></div>
        <div class="stat-card"><div class="stat-icon stat-mint">🏆</div><div class="stat-info"><div class="stat-val">{{ logrosGanados }}</div><div class="stat-lbl">Logros</div></div></div>
      </div>
      <div class="content-area">
        <section class="games-section">
          <div class="section-header"><h2>Elige tu juego</h2></div>
          <div class="games-grid">
            @for (juego of juegos; track juego.nombre) {
              <div class="game-card" [style.--accent]="juego.color"
                   [class.locked]="!estaImplementado(juego.ruta)" (click)="irAJuego(juego)">
                <div class="card-hero" [style.background]="juego.color + '18'">
                  <span class="card-personaje">{{ juego.personaje }}</span>
                  <span class="card-icon-sm">{{ juego.icono }}</span>
                  <button class="play-btn" [style.background]="estaImplementado(juego.ruta) ? juego.color : '#cbd5e1'">{{ estaImplementado(juego.ruta) ? '▶' : '🔒' }}</button>
                </div>
                <div class="card-body">
                  <div class="card-tipo"   [style.color]="juego.color">{{ juego.tipo }}</div>
                  <div class="card-nombre">{{ juego.nombre }}</div>
                  <div class="card-nivel"  [style.color]="juego.color">{{ juego.nivelTxt }}</div>
                </div>
                <div class="card-footer">
                  <div class="prog-bar"><div class="prog-fill" [style.width.%]="juego.progreso" [style.background]="juego.color"></div></div>
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
                  <div class="prog-avatar" [style.background]="p.color+'22'" [style.border-color]="p.color+'44'">{{ p.icono }}</div>
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
                  <div class="logro-info"><div class="logro-nombre">{{ l.nombre }}</div><div class="logro-desc">{{ l.desc }}</div></div>
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
        <div class="progreso-stats-row">
          <div class="pstat-card"><div class="pstat-icon">🎮</div><div class="pstat-val">{{ totalSesiones }}</div><div class="pstat-lbl">Sesiones jugadas</div></div>
          <div class="pstat-card"><div class="pstat-icon">⏱️</div><div class="pstat-val">{{ tiempoPromedio }}m</div><div class="pstat-lbl">Tiempo promedio</div></div>
          <div class="pstat-card"><div class="pstat-icon">🎯</div><div class="pstat-val">{{ precision }}%</div><div class="pstat-lbl">Precisión global</div></div>
          <div class="pstat-card"><div class="pstat-icon">🔥</div><div class="pstat-val">{{ mejorRacha }}</div><div class="pstat-lbl">Mejor racha</div></div>
        </div>
        <div class="progreso-body">
          <div class="prog-card">
            <h3 class="prog-card-title">Progreso por categoría</h3>
            <div class="cat-list">
              @for (p of progresos; track p.nombre) {
                <div class="cat-row">
                  <div class="cat-label"><span class="cat-ico">{{ p.icono }}</span><span class="cat-name">{{ p.nombre }}</span></div>
                  <div class="cat-bar-wrap">
                    <div class="cat-bar"><div class="cat-fill" [style.width.%]="p.valor" [style.background]="p.color"></div></div>
                    <span class="cat-pct" [style.color]="p.color">{{ p.valor }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="prog-card">
            <h3 class="prog-card-title">Últimas sesiones</h3>
            <div class="sesiones-list">
              @for (s of ultimasSesiones; track s.hace) {
                <div class="sesion-row">
                  <div class="sesion-ico">{{ s.icono }}</div>
                  <div class="sesion-info"><div class="sesion-nombre">{{ s.juego }}</div><div class="sesion-hace">{{ s.hace }}</div></div>
                  <div class="sesion-right"><div class="sesion-precision">🎯 {{ s.precision }}%</div><div class="sesion-pts">+{{ s.pts }} pts</div></div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ── LOGROS 3D ── -->
    @if (activeTab === 'logros') {
      <div class="tab-content">

        <!-- Hero banner -->
        <div class="logros-hero">
          <div class="hero-orbs">
            <div class="h-orb h-orb1"></div>
            <div class="h-orb h-orb2"></div>
          </div>
          <div class="hero-left">
            <div class="hero-trophy">🏆</div>
            <div class="hero-text">
              <div class="hero-count">
                <span class="hero-num">{{ logrosGanados }}</span>
                <span class="hero-denom"> / {{ logrosCompletos.length }}</span>
              </div>
              <div class="hero-label">logros desbloqueados</div>
              <div class="hero-bar-wrap">
                <div class="hero-bar">
                  <div class="hero-fill" [style.width.%]="(logrosGanados / logrosCompletos.length) * 100"></div>
                </div>
              </div>
              <div class="hero-stars">
                @for (l of logrosCompletos; track l.nombre) {
                  <span class="hero-star" [class.on]="l.ganado">{{ l.ganado ? '⭐' : '○' }}</span>
                }
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div class="pts-orb">
              <div class="pts-shine"></div>
              <div class="pts-val">{{ puntosLogros }}</div>
              <div class="pts-lbl">puntos<br>ganados</div>
            </div>
          </div>
        </div>

        <!-- Category filter -->
        <div class="logros-filter">
          @for (c of categorias; track c) {
            <button class="lf-btn" [class.lf-btn-active]="filtroCategoria===c" (click)="filtroCategoria=c">
              <span>{{ catIco(c) }}</span> {{ c }}
            </button>
          }
        </div>

        <!-- 3D Grid -->
        <div class="logros-3d-grid">
          @for (l of logrosFiltrados; track l.nombre) {
            <div class="l3d" [class.l3d-on]="l.ganado" [class.l3d-off]="!l.ganado"
                 [style.--c1]="catColor(l.cat)" [style.--c2]="catColor2(l.cat)">

              @if (l.ganado) {
                <div class="l3d-shine"></div>
                <div class="l3d-sp sp1">✨</div>
                <div class="l3d-sp sp2">⭐</div>
                <div class="l3d-sp sp3">💫</div>
              }

              <div class="l3d-ico-ring">
                <div class="l3d-ico">{{ l.ganado ? l.icono : '🔒' }}</div>
              </div>

              <div class="l3d-name">{{ l.ganado ? l.nombre : '???' }}</div>
              <div class="l3d-desc">{{ l.ganado ? l.desc : 'Sigue jugando para desbloquear' }}</div>

              <div class="l3d-badge" [class.l3d-badge-on]="l.ganado">
                {{ l.ganado ? '+' + l.puntos + ' pts' : l.puntos + ' pts' }}
              </div>

              <div class="l3d-cat">{{ catIco(l.cat) }} {{ l.cat }}</div>
            </div>
          }
        </div>

      </div>
    }

    <!-- ── MIS TAREAS ── -->
    @if (activeTab === 'tareas') {
      <div class="tab-content">

        @if (loadingTareas) {
          <div class="tareas-loader"><div class="t-spinner"></div><p>Cargando tareas...</p></div>
        }

        @if (!loadingTareas && tareas.length === 0) {
          <div class="tareas-empty">
            <div style="font-size:60px">📋</div>
            <h2>Sin tareas por ahora</h2>
            <p>Cuando tu maestra o maestro te asigne una tarea, aparecerá aquí. ¡Sigue jugando!</p>
          </div>
        }

        @if (!loadingTareas && tareas.length > 0) {
          <div class="tareas-grid">
            @for (t of tareas; track t.id) {
              <div class="tarea-card" [class.tarea-ok]="t.completada">

                <!-- Badge completada -->
                @if (t.completada) {
                  <div class="tarea-badge-done">✅ Completada</div>
                }

                <!-- Top row -->
                <div class="tarea-top">
                  <div class="tarea-ico-wrap" [class.tarea-ico-done]="t.completada">
                    {{ t.asignacion.juego ? juegoIcoNino(t.asignacion.juego.nombre) : '📋' }}
                  </div>
                  <div style="flex:1;min-width:0">
                    <div class="tarea-titulo">{{ t.asignacion.titulo }}</div>
                    <div class="tarea-juego">{{ t.asignacion.juego?.nombre ?? 'Sin juego específico' }}</div>
                  </div>
                </div>

                <!-- Descripción -->
                @if (t.asignacion.descripcion) {
                  <p class="tarea-desc">{{ t.asignacion.descripcion }}</p>
                }

                <!-- Progreso de sesiones -->
                <div class="tarea-prog-lbl">
                  <span>Sesiones completadas</span>
                  <span class="tarea-cnt" [class.tarea-cnt-ok]="t.completada">{{ t.sesionesCompletadas }} / {{ t.asignacion.minimoSesiones }}</span>
                </div>
                <div class="tarea-prog-bar">
                  <div class="tarea-prog-fill"
                       [style.width.%]="progresoPct(t)"
                       [class.tarea-fill-ok]="t.completada"></div>
                </div>

                <!-- Fecha límite -->
                <div class="tarea-footer">
                  <span class="tarea-fecha">📅 Límite: {{ t.asignacion.fechaLimite | date:'dd/MM/yyyy' }}</span>
                  @if (t.completada && t.fechaCompletada) {
                    <span class="tarea-completada-en">Completada {{ t.fechaCompletada | date:'dd/MM' }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }

      </div>
    }

    <!-- ── CONFIGURACIÓN ── -->
    @if (activeTab === 'config') {
      <div class="tab-content">
        <div class="config-body">
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
                  <button class="avatar-btn" [class.avatar-sel]="avatarSeleccionado===av.key" (click)="seleccionarAvatar(av.key)">{{ av.emoji }}</button>
                }
              </div>
            </div>
            <p class="config-note">Para cambiar tu nombre o contraseña, pedile a tu tutor. 👨‍👩‍👧</p>
          </div>
          <div class="config-card">
            <h3 class="config-section-title">🔊 Sonido</h3>
            <div class="config-toggle-row">
              <div class="toggle-info"><div class="toggle-label">Música y efectos del juego</div><div class="toggle-desc">Sonidos durante las partidas</div></div>
              <button class="toggle-btn" [class.toggle-on]="sonidoJuego" (click)="sonidoJuego=!sonidoJuego"><div class="toggle-knob"></div></button>
            </div>
            <div class="config-toggle-row">
              <div class="toggle-info"><div class="toggle-label">Voz de la mascota</div><div class="toggle-desc">La mascota te da tips en voz alta</div></div>
              <button class="toggle-btn" [class.toggle-on]="vozMascota" (click)="vozMascota=!vozMascota"><div class="toggle-knob"></div></button>
            </div>
          </div>
          <div class="config-card">
            <h3 class="config-section-title">🎮 Preferencias de juego</h3>
            <div class="config-field">
              <label class="config-label">Nivel inicial preferido</label>
              <div class="nivel-selector">
                @for (n of nivelesConfig; track n.val) {
                  <button class="nivel-opt" [class.nivel-opt-sel]="nivelInicial===n.val" (click)="nivelInicial=n.val">
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
    .dashboard { display: flex; min-height: 100vh; background: #EEF0F9; font-family: 'Inter', -apple-system, sans-serif; }

    /* ══ SIDEBAR ══ */
    .sidebar { width: 220px; min-height: 100vh; background: #1C1145; display: flex; flex-direction: column; padding: 24px 0 20px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .brand-icon { font-size: 24px; }
    .brand-name { font-size: 18px; font-weight: 800; color: white; }
    .profile-block { padding: 20px; border-bottom: 1px solid rgba(255,255,255,.08); text-align: center; }
    .profile-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#4F46E5); display: flex; align-items: center; justify-content: center; font-size: 38px; margin: 0 auto 10px; border: 3px solid rgba(255,255,255,.15); }
    .profile-name  { font-size: 16px; font-weight: 800; color: white; margin-bottom: 2px; }
    .profile-level { font-size: 12px; color: #A78BFA; margin-bottom: 12px; }
    .xp-wrap  { display: flex; flex-direction: column; gap: 4px; }
    .xp-bar   { height: 6px; background: rgba(255,255,255,.1); border-radius: 100px; overflow: hidden; }
    .xp-fill  { height: 100%; background: linear-gradient(90deg,#A78BFA,#60A5FA); border-radius: 100px; }
    .xp-label { font-size: 10px; color: #64748B; text-align: right; }
    .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: none; background: transparent; color: rgba(255,255,255,.55); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; text-align: left; width: 100%; }
    .nav-item:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); }
    .nav-item.active { background: rgba(167,139,250,.2); color: white; }
    .nav-ico { font-size: 16px; }
    .btn-cerrar { display: flex; align-items: center; gap: 8px; margin: 0 12px; padding: 10px 12px; background: transparent; border: none; border-radius: 12px; color: rgba(255,255,255,.4); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
    .btn-cerrar:hover { background: rgba(239,68,68,.15); color: #f87171; }

    /* ══ MAIN ══ */
    .main { flex: 1; display: flex; flex-direction: column; overflow: auto; }
    .main-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px; background: white; border-bottom: 1px solid #E8E4F4; position: sticky; top: 0; z-index: 10; }
    .header-greeting h1 { font-size: 22px; font-weight: 800; color: #1E293B; }
    .header-greeting p  { font-size: 13px; color: #64748B; margin-top: 2px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .streak-badge { display: flex; align-items: center; gap: 6px; background: #FFF7ED; border: 1.5px solid #FDBA74; color: #C2410C; border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 700; }
    .notif-btn { background: #F8F7FF; border: 1.5px solid #E8E4F4; border-radius: 10px; width: 36px; height: 36px; font-size: 16px; cursor: pointer; }
    .header-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#4F46E5); display: flex; align-items: center; justify-content: center; font-size: 20px; }

    /* Stats row */
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; padding: 20px 28px 0; }
    .stat-card { background: white; border-radius: 16px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
    .stat-icon { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .stat-orange { background: #FFF4ED; }
    .stat-yellow { background: #FEFCE8; }
    .stat-teal   { background: #F0FDFA; }
    .stat-mint   { background: #F0FDF4; }
    .stat-val { font-size: 22px; font-weight: 900; color: #1E293B; line-height: 1; }
    .stat-lbl { font-size: 11px; color: #94A3B8; margin-top: 3px; }

    /* Content area */
    .content-area { display: flex; gap: 20px; padding: 20px 28px 32px; flex: 1; align-items: flex-start; }
    .games-section { flex: 1; min-width: 0; }
    .section-header { margin-bottom: 14px; }
    .section-header h2 { font-size: 18px; font-weight: 800; color: #1E293B; }
    .games-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
    .game-card { background: white; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.06); transition: all .22s cubic-bezier(.34,1.56,.64,1); border: 1.5px solid transparent; display: flex; flex-direction: column; }
    .game-card:hover { transform: translateY(-4px) scale(1.02); border-color: var(--accent); box-shadow: 0 8px 28px rgba(0,0,0,.1); }
    .game-card.locked { opacity: .7; }
    .game-card.locked:hover { transform: translateY(-2px) scale(1.01); }
    .card-hero { position: relative; height: 90px; display: flex; align-items: center; justify-content: center; border-radius: 0; }
    .card-personaje { font-size: 52px; line-height: 1; filter: drop-shadow(0 4px 8px rgba(0,0,0,.15)); transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
    .game-card:hover .card-personaje { transform: scale(1.18) rotate(-5deg); }
    .card-icon-sm { position: absolute; bottom: 6px; left: 10px; font-size: 18px; opacity: .7; }
    .play-btn { position: absolute; top: 8px; right: 10px; width: 28px; height: 28px; border-radius: 50%; border: none; color: white; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform .2s; }
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
    .prog-avatar { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 1.5px solid; }
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
    .progreso-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
    .pstat-card { background: white; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
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
    .sesion-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: #F8F7FF; border-radius: 12px; }
    .sesion-ico  { font-size: 28px; flex-shrink: 0; }
    .sesion-info { flex: 1; min-width: 0; }
    .sesion-nombre { font-size: 13px; font-weight: 700; color: #1E293B; }
    .sesion-hace   { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .sesion-right  { text-align: right; }
    .sesion-precision { font-size: 13px; font-weight: 700; color: #0F766E; }
    .sesion-pts       { font-size: 11px; color: #16A34A; font-weight: 700; margin-top: 2px; }

    /* ══ LOGROS 3D ══ */

    /* Hero banner */
    .logros-hero {
      background: linear-gradient(135deg, #0F0A2E 0%, #1C1145 40%, #2D1272 70%, #1a0f3a 100%);
      border-radius: 24px; padding: 28px 32px;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 22px;
      box-shadow: 0 8px 40px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.08);
      position: relative; overflow: hidden;
    }
    .hero-orbs { position: absolute; inset: 0; pointer-events: none; }
    .h-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .4; }
    .h-orb1 { width: 200px; height: 200px; background: #7C3AED; top: -60px; left: 80px; }
    .h-orb2 { width: 160px; height: 160px; background: #4F46E5; bottom: -40px; right: 160px; }

    .hero-left { display: flex; align-items: center; gap: 24px; position: relative; z-index: 1; }
    .hero-trophy {
      font-size: 72px; line-height: 1;
      filter: drop-shadow(0 6px 20px rgba(251,191,36,.6));
      animation: trophyFloat 3s ease-in-out infinite;
    }
    @keyframes trophyFloat {
      0%,100% { transform: translateY(0) rotate(-4deg); }
      50%      { transform: translateY(-10px) rotate(4deg); }
    }
    .hero-count { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
    .hero-num   { font-size: 56px; font-weight: 900; color: #A78BFA; line-height: 1; }
    .hero-denom { font-size: 24px; font-weight: 700; color: rgba(255,255,255,.35); }
    .hero-label { font-size: 14px; color: rgba(255,255,255,.55); margin-bottom: 14px; }
    .hero-bar-wrap { margin-bottom: 10px; }
    .hero-bar  { height: 12px; background: rgba(255,255,255,.1); border-radius: 100px; overflow: hidden; width: 300px; }
    .hero-fill {
      height: 100%; border-radius: 100px;
      background: linear-gradient(90deg, #A78BFA, #FCD34D, #F97316);
      transition: width 1.4s cubic-bezier(.23,1,.32,1);
      box-shadow: 0 0 16px rgba(167,139,250,.6);
    }
    .hero-stars { display: flex; gap: 3px; flex-wrap: wrap; max-width: 300px; }
    .hero-star  { font-size: 15px; color: rgba(255,255,255,.2); transition: all .3s; }
    .hero-star.on { color: #FCD34D; filter: drop-shadow(0 0 5px #FCD34D); }

    .hero-right { position: relative; z-index: 1; }
    .pts-orb {
      width: 130px; height: 130px; border-radius: 50%;
      background: conic-gradient(from 0deg, #FCD34D, #F59E0B, #D97706, #FCD34D);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow:
        0 0 0 8px rgba(252,211,77,.15),
        0 0 0 16px rgba(252,211,77,.07),
        0 12px 40px rgba(217,119,6,.5);
      position: relative; overflow: hidden;
      animation: orbSpin 8s linear infinite;
    }
    @keyframes orbSpin {
      0%   { box-shadow: 0 0 0 8px rgba(252,211,77,.15), 0 0 0 16px rgba(252,211,77,.07), 0 12px 40px rgba(217,119,6,.5); }
      50%  { box-shadow: 0 0 0 12px rgba(252,211,77,.25), 0 0 0 20px rgba(252,211,77,.1), 0 12px 48px rgba(217,119,6,.6); }
      100% { box-shadow: 0 0 0 8px rgba(252,211,77,.15), 0 0 0 16px rgba(252,211,77,.07), 0 12px 40px rgba(217,119,6,.5); }
    }
    .pts-shine {
      position: absolute; inset: 0; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.4), transparent 60%);
    }
    .pts-val { font-size: 30px; font-weight: 900; color: white; line-height: 1; position: relative; text-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .pts-lbl { font-size: 11px; color: rgba(255,255,255,.85); font-weight: 700; text-align: center; margin-top: 3px; position: relative; }

    /* Filter pills */
    .logros-filter { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .lf-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 24px;
      border: 2px solid #E2E8F0; background: white;
      color: #64748B; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all .2s;
    }
    .lf-btn:hover { border-color: #A78BFA; color: #7C3AED; transform: translateY(-1px); }
    .lf-btn-active {
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      border-color: transparent; color: white;
      box-shadow: 0 4px 14px rgba(124,58,237,.35);
    }

    /* 3D Grid */
    .logros-3d-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
      gap: 18px;
    }

    .l3d {
      border-radius: 22px; padding: 22px 16px 18px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      position: relative; overflow: hidden; cursor: pointer;
      transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s;
    }

    /* Earned card */
    .l3d-on {
      background: linear-gradient(150deg, var(--c1), var(--c2));
      box-shadow:
        0 6px 0 rgba(0,0,0,.22),
        0 10px 30px rgba(0,0,0,.18),
        inset 0 1px 0 rgba(255,255,255,.25),
        inset 0 -2px 0 rgba(0,0,0,.1);
    }
    .l3d-on:hover {
      transform: translateY(-10px) rotateX(6deg) scale(1.02);
      box-shadow:
        0 16px 0 rgba(0,0,0,.15),
        0 24px 50px rgba(0,0,0,.22),
        inset 0 1px 0 rgba(255,255,255,.25);
    }

    /* Locked card */
    .l3d-off {
      background: linear-gradient(150deg, #1E293B, #2D3A4A);
      box-shadow: 0 4px 0 rgba(0,0,0,.3), 0 8px 20px rgba(0,0,0,.2);
      opacity: .8;
    }
    .l3d-off:hover { transform: translateY(-4px); opacity: .9; }

    /* Shine sweep on earned */
    .l3d-shine {
      position: absolute; top: 0; left: -120%;
      width: 70%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
      animation: shine 3.5s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes shine {
      0%   { left: -120%; }
      45%  { left: 160%; }
      100% { left: 160%; }
    }

    /* Sparkles */
    .l3d-sp { position: absolute; pointer-events: none; animation: spFloat 2.8s ease-in-out infinite; }
    .sp1 { top: 8px; right: 12px; font-size: 14px; animation-delay: 0s; }
    .sp2 { top: 14px; left: 10px; font-size: 10px; animation-delay: .9s; }
    .sp3 { bottom: 36px; right: 8px; font-size: 12px; animation-delay: 1.8s; }
    @keyframes spFloat {
      0%,100% { opacity: 0; transform: scale(.5) translateY(3px); }
      50%      { opacity: 1; transform: scale(1) translateY(-3px); }
    }

    /* Icon ring */
    .l3d-ico-ring {
      width: 76px; height: 76px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      border: 2.5px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.3);
      flex-shrink: 0; position: relative;
    }
    .l3d-off .l3d-ico-ring { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); }
    .l3d-ico { font-size: 42px; line-height: 1; filter: drop-shadow(0 3px 10px rgba(0,0,0,.25)); }

    /* Text */
    .l3d-name { font-size: 13px; font-weight: 800; line-height: 1.3; text-align: center; }
    .l3d-on   .l3d-name { color: white; text-shadow: 0 1px 6px rgba(0,0,0,.2); }
    .l3d-off  .l3d-name { color: rgba(255,255,255,.35); }

    .l3d-desc { font-size: 11px; line-height: 1.45; text-align: center; }
    .l3d-on   .l3d-desc { color: rgba(255,255,255,.8); }
    .l3d-off  .l3d-desc { color: rgba(255,255,255,.22); }

    /* Badge */
    .l3d-badge {
      padding: 5px 14px; border-radius: 24px;
      font-size: 12px; font-weight: 800; letter-spacing: .3px;
    }
    .l3d-badge-on {
      background: rgba(255,255,255,.22);
      color: white;
      border: 1.5px solid rgba(255,255,255,.35);
      box-shadow: 0 2px 10px rgba(0,0,0,.12);
    }
    .l3d-off .l3d-badge { background: rgba(255,255,255,.04); color: rgba(255,255,255,.25); border: 1.5px solid rgba(255,255,255,.08); }

    /* Category tag */
    .l3d-cat { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .9px; }
    .l3d-on  .l3d-cat { color: rgba(255,255,255,.55); }
    .l3d-off .l3d-cat { color: rgba(255,255,255,.18); }

    /* ── MIS TAREAS ── */
    .tareas-loader { display:flex; flex-direction:column; align-items:center; gap:16px; padding:60px; color:#64748B; font-size:14px; }
    .t-spinner { width:36px; height:36px; border:3px solid #E8E4F4; border-top-color:#7C3AED; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .tareas-empty { display:flex; flex-direction:column; align-items:center; gap:14px; padding:60px; text-align:center; }
    .tareas-empty h2 { font-size:20px; font-weight:800; color:#1E293B; }
    .tareas-empty p  { font-size:14px; color:#64748B; line-height:1.7; max-width:380px; }
    .tareas-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:18px; }
    .tarea-card { background:white; border-radius:18px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,.06); border:2px solid transparent; transition:border-color .2s; position:relative; display:flex; flex-direction:column; gap:12px; }
    .tarea-card.tarea-ok { border-color:#BBF7D0; background:#F0FDF4; }
    .tarea-badge-done { position:absolute; top:14px; right:14px; background:#DCFCE7; color:#15803D; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; }
    .tarea-top { display:flex; align-items:center; gap:12px; }
    .tarea-ico-wrap { width:46px; height:46px; border-radius:14px; background:#EDE9FE; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    .tarea-ico-done { background:#DCFCE7; }
    .tarea-titulo { font-size:14px; font-weight:800; color:#1E293B; line-height:1.3; }
    .tarea-juego  { font-size:11.5px; color:#94A3B8; margin-top:2px; }
    .tarea-desc   { font-size:12.5px; color:#475569; line-height:1.55; }
    .tarea-prog-lbl { display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; color:#64748B; }
    .tarea-cnt { color:#7C3AED; }
    .tarea-cnt-ok { color:#15803D; }
    .tarea-prog-bar { height:10px; background:#F1F0F9; border-radius:100px; overflow:hidden; }
    .tarea-prog-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#7C3AED,#A78BFA); transition:width .8s ease; }
    .tarea-fill-ok { background:linear-gradient(90deg,#16A34A,#4ADE80); }
    .tarea-footer { display:flex; align-items:center; justify-content:space-between; padding-top:4px; }
    .tarea-fecha { font-size:11px; color:#9CA3AF; }
    .tarea-completada-en { font-size:11px; color:#15803D; font-weight:700; }

    /* ── CONFIGURACIÓN ── */
    .config-body { max-width: 640px; display: flex; flex-direction: column; gap: 20px; }
    .config-card { background: white; border-radius: 16px; padding: 22px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
    .config-section-title { font-size: 16px; font-weight: 800; color: #1E293B; margin-bottom: 18px; }
    .config-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
    .config-label { font-size: 13px; font-weight: 700; color: #475569; }
    .config-value-ro { background: #F8F7FF; border: 1.5px solid #E8E4F4; border-radius: 10px; padding: 10px 14px; font-size: 14px; font-weight: 600; color: #334155; }
    .config-note { font-size: 12px; color: #94A3B8; margin-top: 4px; }
    .avatar-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .avatar-btn { width: 52px; height: 52px; border-radius: 12px; border: 2px solid #E2E8F0; background: #F8F7FF; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
    .avatar-btn:hover { border-color: #A78BFA; transform: scale(1.1); }
    .avatar-sel { border-color: #7C3AED; background: #EDE9FE; box-shadow: 0 0 0 3px rgba(124,58,237,.2); }
    .config-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #F1F0F9; }
    .config-toggle-row:last-child { border-bottom: none; }
    .toggle-info { flex: 1; }
    .toggle-label { font-size: 14px; font-weight: 700; color: #334155; }
    .toggle-desc  { font-size: 12px; color: #94A3B8; margin-top: 2px; }
    .toggle-btn { width: 46px; height: 26px; border-radius: 100px; border: none; cursor: pointer; background: #E2E8F0; position: relative; transition: background .25s; flex-shrink: 0; }
    .toggle-btn.toggle-on { background: #7C3AED; }
    .toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: left .25s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
    .toggle-btn.toggle-on .toggle-knob { left: 23px; }
    .nivel-selector { display: flex; gap: 8px; flex-wrap: wrap; }
    .nivel-opt { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 12px; border: 2px solid #E2E8F0; background: white; font-size: 13px; font-weight: 700; cursor: pointer; color: #475569; transition: all .2s; }
    .nivel-opt:hover { border-color: #A78BFA; color: #7C3AED; }
    .nivel-opt-sel { border-color: #7C3AED; background: #EDE9FE; color: #7C3AED; }
  `]
})
export class NinoJuegosComponent implements OnInit {

  profileName   = '';
  profileAvatar = '🦊';
  perfilId: number | null = null;

  streak        = 0;
  puntosTotales = 0;
  precision     = 0;
  xpActual      = 0;
  xpMax         = 1000;
  nivelNum      = 1;
  nivelNombre   = 'Principiante';
  activeTab     = 'inicio';
  loadingStats  = false;

  // Tareas
  tareas:        AsignacionPerfil[] = [];
  loadingTareas  = false;

  totalSesiones  = 0;
  tiempoPromedio = 0;
  mejorRacha     = 0;

  sonidoJuego      = true;
  vozMascota       = true;
  avatarSeleccionado = 'fox';
  nivelInicial     = 'FACIL';
  filtroCategoria  = 'Todos';

  readonly categorias   = ['Todos', 'Constancia', 'Maestría', 'Velocidad', 'Social'];
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
    { nombre:'Espejo Mental',       tipo:'Atención',   icono:'🪞', personaje:'🦊', color:'#7C3AED', nivelTxt:'Nivel 3 · Avanzado',   progreso:75, ruta:'/nino/juego/espejo-mental' },
    { nombre:'Historia Viva',       tipo:'Lectura',    icono:'📖', personaje:'🐰', color:'#D97706', nivelTxt:'Nivel 1 · Básico',      progreso:10, ruta:'/nino/juego/historia-viva' },
    { nombre:'Foco Extremo',        tipo:'Atención',   icono:'🎯', personaje:'🦄', color:'#4F46E5', nivelTxt:'Nivel 4 · Experto',     progreso:90, ruta:'/nino/juego/foco-extremo' },
    { nombre:'Reacción Controlada', tipo:'Atención',   icono:'⚡', personaje:'🐸', color:'#2563EB', nivelTxt:'Nivel 2 · Intermedio',  progreso:45, ruta:'/nino/juego/reaccion-controlada' },
    { nombre:'Cascada Numérica',    tipo:'Cálculo',    icono:'🔢', personaje:'🦉', color:'#059669', nivelTxt:'Nivel 2 · Intermedio',  progreso:30, ruta:'/nino/juego/cascada-numerica' },
    { nombre:'Laberinto Cognitivo', tipo:'Memoria',    icono:'🌀', personaje:'🐱', color:'#7C3AED', nivelTxt:'Nivel 1 · Básico',      progreso:15, ruta:'/nino/juego/laberinto' },
    { nombre:'Maratón Mental',      tipo:'Cálculo',    icono:'🏃', personaje:'🐨', color:'#059669', nivelTxt:'Nivel 1 · Básico',      progreso:10, ruta:'/nino/juego/maraton-mental' },
    { nombre:'Ritmo y Patrón',      tipo:'Memoria',    icono:'🎵', personaje:'🐭', color:'#9333EA', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/ritmo-patron' },
    { nombre:'Palabras Ocultas',    tipo:'Lenguaje',   icono:'📝', personaje:'🐼', color:'#EA580C', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/palabras-ocultas' },
    { nombre:'Piezas en Tiempo',    tipo:'Percepción', icono:'🧩', personaje:'🐯', color:'#0891B2', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/piezas-tiempo' },
    { nombre:'Mapa Aventura',       tipo:'Geografía',  icono:'🗺️', personaje:'🦁', color:'#65A30D', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/mapa-aventura' },
    { nombre:'Lab de Ciencias',     tipo:'Lógica',     icono:'🔬', personaje:'🐶', color:'#DB2777', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/lab-ciencias' },
  ];
  progresos: ProgresoItem[] = [];
  logrosRecientes: Logro[] = [];
  logrosCompletos: LogroFull[] = [
    { icono:'🌟', nombre:'Semana perfecta',    desc:'7 días seguidos jugando',                  puntos:50,  ganado:false, cat:'Constancia' },
    { icono:'🏆', nombre:'1000 puntos',         desc:'Supera 1,000 puntos en total',             puntos:30,  ganado:false, cat:'Maestría'   },
    { icono:'⚡', nombre:'Velocidad récord',    desc:'Termina un juego en menos de 45s',         puntos:25,  ganado:false, cat:'Velocidad'  },
    { icono:'🎯', nombre:'Precisión perfecta',  desc:'Logra 100% de aciertos en una sesión',    puntos:40,  ganado:false, cat:'Maestría'   },
    { icono:'🔥', nombre:'En llamas',           desc:'10 días seguidos jugando',                 puntos:75,  ganado:false, cat:'Constancia' },
    { icono:'🧠', nombre:'Maestro cognitivo',   desc:'Completa sesiones en 6 juegos distintos', puntos:100, ganado:false, cat:'Maestría'   },
    { icono:'🚀', nombre:'Despegue',            desc:'Alcanza 3,000 puntos totales',             puntos:50,  ganado:false, cat:'Velocidad'  },
    { icono:'🌈', nombre:'Explorador',          desc:'Juega al menos 3 categorías distintas',    puntos:35,  ganado:false, cat:'Maestría'   },
    { icono:'💎', nombre:'Diamante',            desc:'Acumula 5,000 puntos en total',            puntos:150, ganado:false, cat:'Maestría'   },
    { icono:'🎪', nombre:'Jugador incansable',  desc:'Completa 50 sesiones de juego',            puntos:60,  ganado:false, cat:'Constancia' },
    { icono:'🤝', nombre:'Compañero',           desc:'Completa tu primera sesión',               puntos:15,  ganado:false, cat:'Social'     },
    { icono:'🥇', nombre:'Top del día',         desc:'Supera los 200 puntos en una sesión',      puntos:20,  ganado:false, cat:'Social'     },
  ];
  ultimasSesiones: Sesion[] = [];

  private readonly implementados = [
    '/nino/juego/espejo-mental', '/nino/juego/palabras-ocultas',
    '/nino/juego/historia-viva', '/nino/juego/piezas-tiempo',
    '/nino/juego/cascada-numerica', '/nino/juego/foco-extremo'
  ];

  private readonly CAT_COLORS: Record<string, [string, string]> = {
    Constancia: ['#F97316', '#DC2626'],
    Maestría:   ['#7C3AED', '#4338CA'],
    Velocidad:  ['#0EA5E9', '#6366F1'],
    Social:     ['#10B981', '#059669'],
  };
  private readonly CAT_ICOS: Record<string, string> = {
    Todos: '🎮', Constancia: '🔥', Maestría: '🧠', Velocidad: '⚡', Social: '🤝'
  };

  catColor (cat: string): string { return this.CAT_COLORS[cat]?.[0] ?? '#7C3AED'; }
  catColor2(cat: string): string { return this.CAT_COLORS[cat]?.[1] ?? '#4338CA'; }
  catIco   (cat: string): string { return this.CAT_ICOS[cat] ?? '🏅'; }

  constructor(
    private profileService: ChildProfileService,
    private router: Router,
    private docSvc: DocenteService,
  ) {}

  ngOnInit(): void {
    this.profileService.activeProfile$.subscribe(state => {
      if (!state.profileId) { this.router.navigate(['/padre/dashboard']); return; }
      this.profileName        = state.profileName   || 'Niño';
      this.profileAvatar      = this.avatarEmoji(state.profileAvatar || 'fox');
      this.avatarSeleccionado = state.profileAvatar || 'fox';
      this.perfilId           = state.profileId;
      this.loadTareas(state.profileId);
      this.loadDatos(state.profileId);
    });
  }

  private loadDatos(perfilId: number): void {
    this.loadingStats = true;
    forkJoin({
      sesiones: this.docSvc.getSesiones(perfilId).pipe(catchError(() => of([]))),
      metricas: this.docSvc.getMetricas(perfilId).pipe(catchError(() => of([]))),
    }).subscribe(({ sesiones, metricas }) => {
      const sess = sesiones as SesionJuego[];
      const mets = metricas as Metrica[];

      // ── Stats globales ──────────────────────────────────────────────────
      this.totalSesiones  = sess.filter(s => s.completada).length;
      this.puntosTotales  = sess.reduce((s, x) => s + (x.puntaje ?? 0), 0);
      this.xpActual       = this.puntosTotales % 1000;
      this.nivelNum       = Math.max(1, Math.floor(this.puntosTotales / 1000) + 1);
      this.nivelNombre    = this.calcNivel(this.nivelNum);

      const precs = mets.filter(m => m.precisionPct != null).map(m => m.precisionPct!);
      this.precision = precs.length ? Math.round(precs.reduce((s, v) => s + v, 0) / precs.length) : 0;

      const tiempos = mets.filter(m => m.tiempoReaccionProm != null).map(m => m.tiempoReaccionProm! / 1000);
      this.tiempoPromedio = tiempos.length ? Math.round(tiempos.reduce((s, v) => s + v, 0) / tiempos.length) : 0;

      this.streak    = this.calcStreak(sess);
      this.mejorRacha = this.streak;

      // ── Últimas 5 sesiones ─────────────────────────────────────────────
      const metMap = new Map<number, number>(); // sesionId → precisionPct
      mets.forEach(m => { if (m.sesion?.id && m.precisionPct != null) metMap.set(m.sesion.id, m.precisionPct); });

      this.ultimasSesiones = [...sess]
        .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
        .slice(0, 5)
        .map(s => ({
          juego:     s.juego.nombre,
          icono:     this.juegoIcoNino(s.juego.nombre),
          hace:      this.haceCuanto(s.inicio),
          precision: metMap.has(s.id) ? Math.round(metMap.get(s.id)!) : 0,
          pts:       s.puntaje ?? 0,
        }));

      // ── Progreso por categoría ──────────────────────────────────────────
      const catData: Record<string, { total: number; prec: number[] }> = {};
      sess.forEach(s => {
        const cat = this.JUEGO_CAT[s.juego.nombre] ?? s.juego.tipo ?? 'Otros';
        if (!catData[cat]) catData[cat] = { total: 0, prec: [] };
        catData[cat].total++;
        const p = metMap.get(s.id);
        if (p != null) catData[cat].prec.push(p);
      });

      this.progresos = Object.entries(catData)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 4)
        .map(([cat, data]) => {
          const avg = data.prec.length
            ? Math.round(data.prec.reduce((s, v) => s + v, 0) / data.prec.length) : 0;
          return { nombre: cat, valor: avg, color: this.CAT_COLOR_MAP[cat] ?? '#7C3AED', icono: this.CAT_ICO_MAP[cat] ?? '🎮' };
        });

      // ── Evaluar logros con datos reales ────────────────────────────────
      const juegosPorSesion = new Map<number, number>(); // juegoId → mejor puntaje
      const categoriaSet = new Set<string>();
      sess.forEach(s => {
        const best = juegosPorSesion.get(s.juego.id) ?? 0;
        juegosPorSesion.set(s.juego.id, Math.max(best, s.puntaje ?? 0));
        categoriaSet.add(this.JUEGO_CAT[s.juego.nombre] ?? 'Otros');
      });
      const mejorSesionPts = Math.max(0, ...sess.map(s => s.puntaje ?? 0));

      this.logrosCompletos = this.logrosCompletos.map(l => ({
        ...l,
        ganado: this.evaluarLogro(l.nombre, { pts: this.puntosTotales, streak: this.streak,
          sesiones: this.totalSesiones, precision: this.precision,
          categorias: categoriaSet.size, juegoCount: juegosPorSesion.size,
          mejorSesionPts })
      }));

      this.logrosRecientes = this.logrosCompletos.filter(l => l.ganado).slice(0, 4)
        .map(l => ({ icono: l.icono, nombre: l.nombre, desc: l.desc, puntos: l.puntos }));

      this.loadingStats = false;
    });
  }

  private calcStreak(sess: SesionJuego[]): number {
    if (!sess.length) return 0;
    const days = new Set(sess.map(s => s.inicio.slice(0, 10)));
    const sorted = [...days].sort();
    const today = new Date().toISOString().slice(0, 10);
    const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (sorted[sorted.length - 1] !== today && sorted[sorted.length - 1] !== yest) return 0;
    let streak = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      const diff = (new Date(sorted[i+1]).getTime() - new Date(sorted[i]).getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  private calcNivel(n: number): string {
    return (['Principiante','Aprendiz','Explorador','Aventurero','Maestro','Leyenda'])[Math.min(n - 1, 5)];
  }

  private haceCuanto(fecha: string): string {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (diff < 60)  return `Hace ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Hace ${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'Ayer' : `Hace ${d} días`;
  }

  private evaluarLogro(nombre: string, d: {
    pts: number; streak: number; sesiones: number; precision: number;
    categorias: number; juegoCount: number; mejorSesionPts: number;
  }): boolean {
    switch (nombre) {
      case 'Semana perfecta':    return d.streak >= 7;
      case '1000 puntos':        return d.pts >= 1000;
      case 'Velocidad récord':   return d.mejorSesionPts >= 100;   // proxy: buena sesión
      case 'Precisión perfecta': return d.precision >= 95;
      case 'En llamas':          return d.streak >= 10;
      case 'Maestro cognitivo':  return d.juegoCount >= 6;
      case 'Despegue':           return d.pts >= 3000;
      case 'Explorador':         return d.categorias >= 3;
      case 'Diamante':           return d.pts >= 5000;
      case 'Jugador incansable': return d.sesiones >= 50;
      case 'Compañero':          return d.sesiones >= 1;
      case 'Top del día':        return d.mejorSesionPts >= 200;
      default: return false;
    }
  }

  private readonly JUEGO_CAT: Record<string, string> = {
    'Espejo Mental':'Atención', 'Foco Extremo':'Atención', 'Reacción Controlada':'Atención',
    'Historia Viva':'Lectura',  'Palabras Ocultas':'Lenguaje',
    'Cascada Numérica':'Cálculo', 'Maratón Mental':'Cálculo',
    'Laberinto Cognitivo':'Memoria', 'Ritmo y Patrón':'Memoria',
    'Piezas en Tiempo':'Percepción',
  };
  private readonly CAT_COLOR_MAP: Record<string, string> = {
    'Atención':'#7C3AED','Lectura':'#D97706','Lenguaje':'#EA580C',
    'Cálculo':'#059669','Memoria':'#4F46E5','Percepción':'#0891B2',
  };
  private readonly CAT_ICO_MAP: Record<string, string> = {
    'Atención':'🪞','Lectura':'📖','Lenguaje':'📝',
    'Cálculo':'🔢','Memoria':'🌀','Percepción':'🧩',
  };

  private loadTareas(perfilId: number): void {
    this.loadingTareas = true;
    this.docSvc.getAsignacionesPerfil(perfilId).pipe(catchError(() => of([]))).subscribe(t => {
      this.tareas        = t;
      this.loadingTareas = false;
    });
  }

  progresoPct(t: AsignacionPerfil): number {
    if (!t.asignacion.minimoSesiones) return 0;
    return Math.min(100, Math.round((t.sesionesCompletadas / t.asignacion.minimoSesiones) * 100));
  }

  private readonly JUEGO_ICO_NINO: Record<string, string> = {
    'Espejo Mental':'🪞', 'Historia Viva':'📖', 'Palabras Ocultas':'📝',
    'Piezas en Tiempo':'🧩', 'Foco Extremo':'🎯', 'Cascada Numérica':'🔢',
  };
  juegoIcoNino(nombre: string): string { return this.JUEGO_ICO_NINO[nombre] ?? '📋'; }

  get headerTitle(): string {
    const m: Record<string, string> = {
      progreso:'📊 Mi progreso', logros:'🏆 Mis logros',
      tareas:`📋 Mis tareas`, config:'⚙️ Configuración'
    };
    return m[this.activeTab] ?? `¡Hola, ${this.profileName}! 👋`;
  }
  get headerSub(): string {
    const m: Record<string, string> = {
      progreso: 'Así vas evolucionando cada día',
      logros:   `${this.logrosGanados} de ${this.logrosCompletos.length} logros desbloqueados`,
      tareas:   `${this.tareas.filter(t=>t.completada).length} de ${this.tareas.length} completadas`,
      config:   'Personaliza tu experiencia',
    };
    return m[this.activeTab] ?? 'Listo para un nuevo reto hoy?';
  }
  get logrosGanados(): number { return this.logrosCompletos.filter(l => l.ganado).length; }
  get puntosLogros():  number { return this.logrosCompletos.filter(l => l.ganado).reduce((s, l) => s + l.puntos, 0); }
  get logrosFiltrados(): LogroFull[] {
    return this.filtroCategoria === 'Todos'
      ? this.logrosCompletos
      : this.logrosCompletos.filter(l => l.cat === this.filtroCategoria);
  }

  private avatarEmoji(av: string): string {
    const m: Record<string, string> = {
      fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
      unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯', bear:'🐻', mouse:'🐭'
    };
    return m[av] ?? '🦊';
  }
  seleccionarAvatar(key: string): void { this.avatarSeleccionado = key; this.profileAvatar = this.avatarEmoji(key); }
  estaImplementado(ruta: string): boolean { return this.implementados.includes(ruta); }
  irAJuego(juego: Juego): void {
    if (this.implementados.includes(juego.ruta)) this.router.navigate([juego.ruta]);
    else alert(`¡${juego.nombre} próximamente! 🎮`);
  }
  cerrarSesion(): void { this.router.navigate(['/padre/dashboard']); }
  get xpPorcentaje(): number { return Math.round((this.xpActual / this.xpMax) * 100); }
}
