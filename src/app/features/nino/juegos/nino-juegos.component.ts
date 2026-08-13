import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChildProfileService } from '../../padre/perfiles/child-profile.service';
import { DocenteService, AsignacionPerfil } from '../../docente/docente.service';
import { SesionJuego, Metrica } from '../../padre/padre.service';
import { MisionService, MisionReclamada } from '../../../core/services/mision.service';
import { MatIconModule } from '@angular/material/icon';

interface Juego       { nombre: string; tipo: string; icono: string; personaje: string; color: string; nivelTxt: string; progreso: number; ruta: string; mascotaImg: string; tip: string; portraitScale?: number; }
interface ProgresoItem{ nombre: string; valor: number | null; color: string; icono: string; }
interface Logro       { icono: string; nombre: string; desc: string; puntos: number; }
interface LogroFull   { icono: string; nombre: string; desc: string; puntos: number; ganado: boolean; cat: string; }
interface Sesion      { juego: string; icono: string; hace: string; precision: number | null; pts: number; }
interface Avatar      { key: string; emoji: string; }

@Component({
  selector: 'app-nino-juegos',
  standalone: true,
  imports: [CommonModule, MatIconModule],
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
    <div class="sidebar-footer">
      <button class="sb-logout" (click)="cerrarSesion()" title="Cerrar sesión"><mat-icon>logout</mat-icon></button>
    </div>
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

    <!-- ── INICIO ── -->
    @if (activeTab === 'inicio') {
      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon stat-orange">🔥</div><div class="stat-info"><div class="stat-val">{{ streak }}</div><div class="stat-lbl">Días seguidos</div></div></div>
        <div class="stat-card"><div class="stat-icon stat-yellow">⭐</div><div class="stat-info"><div class="stat-val">{{ puntosTotales | number }}</div><div class="stat-lbl">Puntos totales</div></div></div>
        <div class="stat-card"><div class="stat-icon stat-teal">🎯</div><div class="stat-info"><div class="stat-val">{{ precision }}%</div><div class="stat-lbl">Precisión</div></div></div>
        <div class="stat-card"><div class="stat-icon stat-mint">🏆</div><div class="stat-info"><div class="stat-val">{{ logrosGanados }}</div><div class="stat-lbl">Logros</div></div></div>
      </div>
      <div class="content-area">
        <section class="games-section">
          <div class="section-header">
            <h2>Juegos destacados</h2>
            <button class="see-all-btn" (click)="activeTab='juegos'">Ver todos →</button>
          </div>
          <!-- ── Cover Flow 3D ── -->
          <div class="coverflow-container">
            <button class="cf-arrow cf-arrow-left" (click)="prevJuego()">&#8249;</button>

            <div class="coverflow-stage">
              @for (juego of juegos; track juego.nombre; let i = $index) {
                <div class="cf-card" [ngClass]="getCarouselPosition(i)"
                     (click)="onCarouselCardClick(i, juego)">
                  <div class="cf-card-inner"
                       [style.border-color]="getCarouselPosition(i) === 'cf-center' ? juego.color : 'transparent'">
                    <div class="cf-card-hero"
                         [style.background]="'linear-gradient(135deg,' + juego.color + '28,' + juego.color + '08)'">
                      <span class="cf-personaje">{{ juego.personaje }}</span>
                      <span class="cf-icono-sm">{{ juego.icono }}</span>
                      @if (!estaImplementado(juego.ruta)) {
                        <span class="cf-lock">🔒</span>
                      }
                    </div>
                    <div class="cf-card-body">
                      <div class="cf-tipo" [style.color]="juego.color">{{ juego.tipo }}</div>
                      <div class="cf-nombre">{{ juego.nombre }}</div>
                      <div class="cf-nivel">{{ juego.nivelTxt }}</div>
                      <div class="cf-prog-bar">
                        <div class="cf-prog-fill" [style.width.%]="juego.progreso" [style.background]="juego.color"></div>
                      </div>
                      <div class="cf-prog-txt">{{ juego.progreso }}% completado</div>
                    </div>
                    @if (getCarouselPosition(i) === 'cf-center') {
                      <div class="cf-play-row">
                        <button class="cf-play-btn"
                                [style.background]="estaImplementado(juego.ruta) ? juego.color : '#94A3B8'"
                                (click)="$event.stopPropagation(); irAJuego(juego)">
                          {{ estaImplementado(juego.ruta) ? '▶ Jugar ahora' : '🔒 Próximamente' }}
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <button class="cf-arrow cf-arrow-right" (click)="nextJuego()">&#8250;</button>
          </div>

          <!-- Indicadores de posición -->
          <div class="cf-dots">
            @for (juego of juegos; track juego.nombre; let i = $index) {
              <button class="cf-dot"
                      [class.cf-dot-active]="i === activeJuegoIndex"
                      [style.background]="i === activeJuegoIndex ? juegos[i].color : '#CBD5E1'"
                      (click)="setJuegoActivo(i)">
              </button>
            }
          </div>

          <!-- ── Mascota activa dando indicaciones ── -->
          <div class="cf-coach-section" [style.--coach-color]="juegos[activeJuegoIndex].color">
            <div class="cf-coach-avatar">
              @if (!mascotaImgErrors.has(juegos[activeJuegoIndex].nombre)) {
                <img class="cf-coach-portrait"
                     [src]="juegos[activeJuegoIndex].mascotaImg"
                     [alt]="juegos[activeJuegoIndex].nombre"
                     [style.transform]="'scale(' + (juegos[activeJuegoIndex].portraitScale ?? 1) + ')'"
                     (error)="onMascotaImgError(juegos[activeJuegoIndex].nombre)">
              } @else {
                <span class="cf-coach-emoji">{{ juegos[activeJuegoIndex].personaje }}</span>
              }
            </div>
            <div class="cf-coach-bubble">
              <p class="cf-coach-text">{{ juegos[activeJuegoIndex].tip }}</p>
              <span class="cf-coach-tag" [style.color]="juegos[activeJuegoIndex].color">
                {{ juegos[activeJuegoIndex].icono }} {{ juegos[activeJuegoIndex].nombre }}
              </span>
            </div>
          </div>

          <!-- ── Misión del día ── -->
          <div class="mision-card" [class.mision-done]="misionCompletada">

            @if (!misionCompletada) {
              <!-- Estado normal -->
              <div class="mision-icon-wrap">
                <span class="mision-icono">{{ misionDelDia.icono }}</span>
              </div>
              <div class="mision-body">
                <div class="mision-top-row">
                  <span class="mision-titulo">{{ misionDelDia.titulo }}</span>
                  <span class="mision-recompensa">{{ misionDelDia.recompensa }}</span>
                </div>
                <p class="mision-desc" [innerHTML]="misionDelDia.desc + ' para desbloquear tu recompensa.'"></p>
                <div class="mision-prog-wrap">
                  <div class="mision-prog-bar">
                    <div class="mision-prog-fill"
                         [style.width.%]="(misionProgreso / misionMeta) * 100"></div>
                  </div>
                  <span class="mision-prog-txt">{{ misionProgreso }}/{{ misionMeta }}</span>
                </div>
              </div>

            } @else {
              <!-- Estado completado -->
              <div class="mision-icon-wrap mision-icon-done">
                <span class="mision-icono">🎁</span>
              </div>
              <div class="mision-body">
                <div class="mision-top-row">
                  <span class="mision-titulo mision-titulo-done">¡Misión completada! 🎉</span>
                  <span class="mision-badge-done">✅ {{ misionProgreso }}/{{ misionMeta }}</span>
                </div>
                @if (!premioReclamado) {
                  <p class="mision-desc mision-desc-done">
                    ¡Increíble, {{ profileName }}! Completaste el reto de hoy.
                    Tu <strong>{{ misionDelDia.recompensa }}</strong> está listo.
                  </p>
                  <button class="mision-btn-premio" (click)="reclamarPremio()">
                    {{ misionDelDia.recompensa }} ¡Reclamar!
                  </button>
                } @else {
                  <p class="mision-desc mision-desc-done">
                    ¡Premio reclamado! 🌟 Revisa tus logros para ver tu recompensa.
                  </p>
                }
              </div>
            }

          </div>

        </section>
        <aside class="right-panel">
          <div class="panel-card">
            <h3 class="panel-title">Actividad reciente</h3>
            <div class="sesiones-list">
              @if (ultimasSesiones.length === 0) {
                <p class="empty-msg">Aún no has jugado. ¡Elige un juego!</p>
              }
              @for (s of ultimasSesiones.slice(0, 5); track s.hace) {
                <div class="sesion-row">
                  <div class="sesion-ico">{{ s.icono }}</div>
                  <div class="sesion-info"><div class="sesion-nombre">{{ s.juego }}</div><div class="sesion-hace">{{ s.hace }}</div></div>
                  <div class="sesion-right"><div class="sesion-precision" [class.sin-datos]="s.precision === null">🎯 {{ s.precision === null ? 'Sin datos' : s.precision + '%' }}</div><div class="sesion-pts">+{{ s.pts }} pts</div></div>
                </div>
              }
            </div>
          </div>
          <div class="panel-card">
            <h3 class="panel-title">Logros recientes</h3>
            <div class="logros-list">
              @if (logrosRecientes.length === 0) {
                <p class="empty-msg">¡Juega para desbloquear logros!</p>
              }
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

    <!-- ── MIS JUEGOS ── -->
    @if (activeTab === 'juegos') {
      <div class="biblioteca-wrapper">

        <!-- Encabezado -->
        <div class="bib-header">
          <div>
            <h2 class="bib-titulo">Biblioteca de Juegos</h2>
            <p class="bib-sub">{{ juegosFiltrados.length }} juego{{ juegosFiltrados.length !== 1 ? 's' : '' }} disponible{{ juegosFiltrados.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Filtros por categoría -->
        <div class="bib-filtros">
          <button class="bib-filtro" [class.bib-filtro-activo]="filtroLib === 'Todos'"
                  (click)="filtroLib = 'Todos'">
            <span class="bib-filtro-ico" style="background:#EDE9FE">🎮</span>
            <span>Todos</span>
          </button>
          @for (cat of categoriasUnicas; track cat) {
            <button class="bib-filtro" [class.bib-filtro-activo]="filtroLib === cat"
                    [style.--cat-color]="catColorLib(cat)"
                    (click)="filtroLib = cat">
              <span class="bib-filtro-ico" [style.background]="catColorLib(cat) + '22'">{{ catIcoLib(cat) }}</span>
              <span>{{ cat }}</span>
            </button>
          }
        </div>

        <!-- Grid de tarjetas -->
        <div class="bib-grid">
          @for (juego of juegosFiltrados; track juego.nombre) {
            <div class="bib-card" [style.--accent]="juego.color"
                 [class.bib-locked]="!estaImplementado(juego.ruta)">
              <div class="bib-card-hero"
                   [style.background]="'linear-gradient(135deg,' + juego.color + '20,' + juego.color + '06)'">
                <span class="bib-personaje">{{ juego.personaje }}</span>
                <span class="bib-icono-sm">{{ juego.icono }}</span>
                <!-- Overlay con botón Jugar aparece en hover -->
                <div class="bib-play-overlay">
                  <button class="bib-jugar-btn"
                          [style.background]="estaImplementado(juego.ruta) ? juego.color : '#94A3B8'"
                          (click)="irAJuego(juego)">
                    {{ estaImplementado(juego.ruta) ? '▶ Jugar' : '🔒 Pronto' }}
                  </button>
                </div>
              </div>
              <div class="bib-card-body">
                <div class="bib-tipo" [style.color]="juego.color">{{ juego.tipo }}</div>
                <div class="bib-nombre">{{ juego.nombre }}</div>
                <div class="bib-nivel">{{ juego.nivelTxt }}</div>
                <div class="bib-prog-wrap">
                  <div class="bib-prog-bar">
                    <div class="bib-prog-fill" [style.width.%]="juego.progreso" [style.background]="juego.color"></div>
                  </div>
                  <span class="bib-prog-txt">{{ juego.progreso }}%</span>
                </div>
              </div>
            </div>
          }
          @if (juegosFiltrados.length === 0) {
            <div class="bib-empty">
              <span class="bib-empty-ico">🎮</span>
              <p>No hay juegos en esta categoría aún.</p>
            </div>
          }
        </div>
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
                    <div class="cat-bar"><div class="cat-fill" [style.width.%]="p.valor ?? 0" [style.background]="p.valor === null ? '#CBD5E1' : p.color"></div></div>
                    <span class="cat-pct" [style.color]="p.valor === null ? '#94A3B8' : p.color">{{ p.valor === null ? 'Sin datos' : p.valor + '%' }}</span>
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
                  <div class="sesion-right"><div class="sesion-precision" [class.sin-datos]="s.precision === null">🎯 {{ s.precision === null ? 'Sin datos' : s.precision + '%' }}</div><div class="sesion-pts">+{{ s.pts }} pts</div></div>
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

        <!-- ── Historial de Misiones ── -->
        <div class="misiones-historial-section">
          <div class="mh-header">
            <span class="mh-titulo">🎯 Misiones completadas</span>
            <span class="mh-count">{{ misionesHistorial.length }} en total</span>
          </div>

          @if (misionesHistorial.length === 0) {
            <div class="mh-empty">
              <span class="mh-empty-ico">🚀</span>
              <p>¡Completa tu primera misión del día y aparecerá aquí!</p>
            </div>
          }

          <div class="mh-list">
            @for (m of misionesHistorial; track m.id) {
              <div class="mh-row">
                <div class="mh-ico-wrap">
                  <span class="mh-ico">{{ MISIONES[m.misionIndex]?.icono ?? '🎯' }}</span>
                </div>
                <div class="mh-info">
                  <div class="mh-nombre">{{ MISIONES[m.misionIndex]?.titulo ?? 'Misión completada' }}</div>
                  <div class="mh-fecha">{{ m.fecha | date:'dd MMM yyyy' }}</div>
                </div>
                <div class="mh-premio">
                  <span class="mh-recompensa">{{ m.recompensa }}</span>
                  <span class="mh-check">✅</span>
                </div>
              </div>
            }
          </div>
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
    .sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.08); display: flex; justify-content: center; }
    .sb-logout { background: none; border: none; cursor: pointer; color: rgba(255,255,255,.4); padding: 6px; border-radius: 8px; display: flex; transition: all .2s; }
    .sb-logout:hover { color: white; background: rgba(255,255,255,.1); }

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
    .section-header { margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
    .section-header h2 { font-size: 18px; font-weight: 800; color: #1E293B; }
    .see-all-btn { background: none; border: none; color: #7C3AED; font-size: 13px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: background .2s; }
    .see-all-btn:hover { background: #F5F3FF; }
    .featured-grid { grid-template-columns: repeat(2, 1fr); }
    .empty-msg { font-size: 13px; color: #94A3B8; text-align: center; padding: 12px 0; }

    /* ── Cover Flow 3D ────────────────────────────────────── */
    .coverflow-container {
      position: relative; display: flex; align-items: center;
      justify-content: center; padding: 16px 0 24px;
      perspective: 1200px;
    }
    .coverflow-stage {
      position: relative; width: 100%; height: 310px;
      transform-style: preserve-3d;
    }
    /* ── CF hover animations ── */
    @keyframes cf-wiggle {
      0%   { transform: rotate(0deg)  scale(1);    }
      20%  { transform: rotate(-13deg) scale(1.13); }
      40%  { transform: rotate(10deg)  scale(1.17); }
      60%  { transform: rotate(-6deg)  scale(1.14); }
      80%  { transform: rotate(3deg)   scale(1.1);  }
      100% { transform: rotate(0deg)  scale(1.1);   }
    }
    @keyframes cf-shimmer {
      0%   { transform: translateX(-130%) skewX(-15deg); }
      100% { transform: translateX(270%)  skewX(-15deg); }
    }
    @keyframes cf-coach-fade {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes cf-coach-bounce {
      from { transform: scale(.65) translateY(12px); opacity: 0; }
      to   { transform: scale(1)   translateY(0);    opacity: 1; }
    }

    .cf-card {
      position: absolute; left: 50%; top: 50%;
      width: 230px; height: 290px;
      transform-origin: center center;
      transition: all .45s cubic-bezier(.25,.8,.25,1);
      cursor: pointer; user-select: none;
    }
    .cf-card-inner {
      position: relative; width: 100%; height: 100%;
      background: white; border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
      border: 2.5px solid transparent;
      display: flex; flex-direction: column; overflow: hidden;
      transition: border-color .3s ease, box-shadow .25s ease;
    }
    /* barrido de luz en hover */
    .cf-card-inner::after {
      content: '';
      position: absolute; inset: 0; pointer-events: none; z-index: 20;
      background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.65) 50%, transparent 80%);
      transform: translateX(-130%) skewX(-15deg);
      border-radius: 18px;
    }
    .cf-card:hover .cf-card-inner::after {
      animation: cf-shimmer .5s ease forwards;
    }
    .cf-card:hover .cf-card-inner {
      box-shadow: 0 8px 32px rgba(0,0,0,.16);
    }

    .cf-card-hero {
      position: relative; height: 110px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 17px 17px 0 0;
    }
    /* portrait image */
    .cf-mascota-portrait {
      width: 74px; height: 74px; object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,.18));
      display: inline-block;
      transition: transform .3s cubic-bezier(.34,1.56,.64,1);
    }
    .cf-center .cf-mascota-portrait { transform: scale(1.14) translateY(-4px); }
    .cf-card:hover .cf-mascota-portrait,
    .cf-card:hover .cf-personaje {
      animation: cf-wiggle .52s cubic-bezier(.36,.07,.19,.97) both;
    }

    .cf-personaje { font-size: 58px; line-height: 1; filter: drop-shadow(0 4px 10px rgba(0,0,0,.18)); display: inline-block; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
    .cf-center .cf-personaje { transform: scale(1.12) translateY(-4px); }
    .cf-icono-sm { position: absolute; bottom: 6px; left: 10px; font-size: 18px; opacity: .6; }
    .cf-lock { position: absolute; top: 8px; right: 10px; font-size: 18px; }
    .cf-card-body { padding: 10px 14px 8px; flex: 1; }
    .cf-tipo  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 2px; }
    .cf-nombre { font-size: 14px; font-weight: 800; color: #1E293B; margin-bottom: 2px; line-height: 1.3; }
    .cf-nivel  { font-size: 11px; font-weight: 600; color: #64748B; margin-bottom: 8px; }
    .cf-prog-bar  { height: 5px; background: #F1F0F9; border-radius: 100px; overflow: hidden; margin-bottom: 4px; }
    .cf-prog-fill { height: 100%; border-radius: 100px; }
    .cf-prog-txt  { font-size: 10px; color: #94A3B8; font-weight: 600; }
    .cf-play-row  { padding: 8px 14px 14px; }
    .cf-play-btn  {
      width: 100%; padding: 9px 0; border: none; border-radius: 12px;
      color: white; font-size: 13px; font-weight: 800; cursor: pointer;
      transition: opacity .2s, transform .15s;
    }
    .cf-play-btn:hover { opacity: .88; transform: translateY(-1px); }

    /* ── positions ── */
    .cf-center {
      transform: translateX(-50%) translateY(-50%) rotateY(0deg) scale(1);
      z-index: 10; filter: none;
    }
    .cf-left {
      transform: translateX(calc(-50% - 195px)) translateY(-46%) rotateY(38deg) scale(.76);
      z-index: 5; filter: brightness(.82);
    }
    .cf-right {
      transform: translateX(calc(-50% + 195px)) translateY(-46%) rotateY(-38deg) scale(.76);
      z-index: 5; filter: brightness(.82);
    }
    .cf-far-left {
      transform: translateX(calc(-50% - 330px)) translateY(-42%) rotateY(52deg) scale(.56);
      z-index: 2; filter: brightness(.55);
    }
    .cf-far-right {
      transform: translateX(calc(-50% + 330px)) translateY(-42%) rotateY(-52deg) scale(.56);
      z-index: 2; filter: brightness(.55);
    }
    .cf-hidden {
      transform: translateX(-50%) translateY(-50%) scale(0);
      z-index: 0; opacity: 0; pointer-events: none;
    }

    /* ── arrows ── */
    .cf-arrow {
      position: absolute; top: 50%; z-index: 20;
      width: 40px; height: 40px; border-radius: 50%;
      border: 1.5px solid #E2E8F0; background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,.10);
      font-size: 22px; line-height: 1; color: #334155;
      cursor: pointer; transform: translateY(-50%);
      transition: background .2s, box-shadow .2s;
      display: flex; align-items: center; justify-content: center;
    }
    .cf-arrow:hover { background: #F5F3FF; box-shadow: 0 4px 16px rgba(124,58,237,.18); color: #7C3AED; }
    .cf-arrow-left  { left: 0; }
    .cf-arrow-right { right: 0; }

    /* ── dots ── */
    .cf-dots {
      display: flex; justify-content: center; gap: 6px;
      padding-bottom: 4px; flex-wrap: wrap;
    }
    .cf-dot {
      width: 8px; height: 8px; border-radius: 50%; border: none;
      cursor: pointer; transition: all .25s ease; padding: 0;
      opacity: .45;
    }
    .cf-dot.cf-dot-active { width: 22px; border-radius: 4px; opacity: 1; }

    /* ── sección coach ── */
    .cf-coach-section {
      display: flex; align-items: center; gap: 16px;
      background: white; border-radius: 20px;
      padding: 14px 18px; margin-top: 12px;
      box-shadow: 0 2px 14px rgba(0,0,0,.07);
      border: 1.5px solid rgba(0,0,0,.05);
      animation: cf-coach-fade .35s ease both;
    }
    .cf-coach-avatar {
      flex-shrink: 0; width: 120px; height: 120px;
      display: flex; align-items: center; justify-content: center;
    }
    .cf-coach-portrait {
      width: 120px; height: 120px; object-fit: contain;
      filter: drop-shadow(0 6px 16px rgba(0,0,0,.20));
      animation: cf-coach-bounce .5s cubic-bezier(.34,1.56,.64,1) .1s both;
    }
    .cf-coach-emoji {
      font-size: 88px; line-height: 1;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,.15));
      animation: cf-coach-bounce .5s cubic-bezier(.34,1.56,.64,1) .1s both;
    }
    .cf-coach-bubble {
      flex: 1; position: relative;
      background: #F8F7FF; border-radius: 16px; padding: 12px 16px;
    }
    .cf-coach-bubble::before {
      content: ''; position: absolute; left: -10px; top: 50%;
      transform: translateY(-50%);
      border: 7px solid transparent; border-right-color: #F8F7FF;
    }
    .cf-coach-text {
      font-size: 14px; font-weight: 700; color: #334155;
      margin: 0 0 6px; line-height: 1.45;
    }
    .cf-coach-tag {
      font-size: 11px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .5px;
    }
    /* ── fin Cover Flow ─────────────────────────────────────── */

    /* ══ BIBLIOTECA ══════════════════════════════════════════ */
    .biblioteca-wrapper {
      padding: 24px 28px 32px;
      display: flex; flex-direction: column; gap: 20px;
    }
    .bib-header { display: flex; align-items: center; justify-content: space-between; }
    .bib-titulo { font-size: 22px; font-weight: 900; color: #1E293B; }
    .bib-sub    { font-size: 13px; color: #94A3B8; margin-top: 3px; font-weight: 600; }

    /* ── filtros ── */
    .bib-filtros {
      display: flex; gap: 10px; flex-wrap: wrap;
    }
    .bib-filtro {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 100px;
      border: 1.5px solid #E2E8F0; background: white;
      font-size: 13px; font-weight: 700; color: #475569;
      cursor: pointer; transition: all .2s ease;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .bib-filtro:hover {
      border-color: var(--cat-color, #7C3AED);
      color: var(--cat-color, #7C3AED);
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(0,0,0,.08);
    }
    .bib-filtro-activo {
      background: var(--cat-color, #7C3AED) !important;
      border-color: var(--cat-color, #7C3AED) !important;
      color: white !important;
      box-shadow: 0 4px 14px rgba(0,0,0,.15) !important;
    }
    .bib-filtro-activo .bib-filtro-ico { background: rgba(255,255,255,.25) !important; }
    .bib-filtro-ico {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0;
    }

    /* ── grid ── */
    .bib-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 1100px) { .bib-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 780px)  { .bib-grid { grid-template-columns: repeat(2, 1fr); } }

    /* ── animaciones hover ── */
    @keyframes bib-wiggle {
      0%   { transform: rotate(0deg)   scale(1);    }
      15%  { transform: rotate(-14deg) scale(1.14); }
      30%  { transform: rotate(11deg)  scale(1.18); }
      45%  { transform: rotate(-8deg)  scale(1.2);  }
      60%  { transform: rotate(6deg)   scale(1.17); }
      75%  { transform: rotate(-3deg)  scale(1.13); }
      90%  { transform: rotate(2deg)   scale(1.1);  }
      100% { transform: rotate(0deg)   scale(1.1);  }
    }
    @keyframes bib-shimmer {
      0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0;   }
      15%  { opacity: 1; }
      85%  { opacity: 1; }
      100% { transform: translateX(260%)  skewX(-18deg); opacity: 0;   }
    }
    @keyframes bib-glow {
      0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,.10), 0 0 0 2px var(--accent), 0 0 16px color-mix(in srgb, var(--accent) 45%, transparent); }
      50%       { box-shadow: 0 12px 36px rgba(0,0,0,.15), 0 0 0 3px var(--accent), 0 0 28px color-mix(in srgb, var(--accent) 60%, transparent); }
    }
    @keyframes bib-badge-pop {
      0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
      60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
      100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
    }

    /* ── tarjeta ── */
    .bib-card {
      background: white; border-radius: 18px; overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
      border: 1.5px solid transparent;
      transition: transform .28s cubic-bezier(.34,1.56,.64,1), border-color .2s ease;
      display: flex; flex-direction: column; position: relative;
    }
    .bib-card:hover {
      transform: translateY(-6px) scale(1.025);
      border-color: var(--accent);
      animation: bib-glow 1.4s ease infinite;
    }
    .bib-locked { opacity: .72; }

    /* badge "¡Juega!" que aparece en hover */
    .bib-card::before {
      content: '⭐ ¡Juega!';
      position: absolute; top: 8px; right: 8px; z-index: 5;
      background: var(--accent); color: white;
      font-size: 10px; font-weight: 800; padding: 3px 8px;
      border-radius: 100px; pointer-events: none;
      opacity: 0; transform: scale(0) rotate(-15deg);
      transition: none;
    }
    .bib-locked::before { content: '🔒 Pronto'; }
    .bib-card:hover::before {
      animation: bib-badge-pop .35s cubic-bezier(.34,1.56,.64,1) .05s both;
    }

    .bib-card-hero {
      position: relative; height: 100px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    /* barrido de luz */
    .bib-card-hero::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.7) 50%, transparent 80%);
      transform: translateX(-120%) skewX(-18deg);
      pointer-events: none;
    }
    .bib-card:hover .bib-card-hero::after {
      animation: bib-shimmer .55s ease .08s forwards;
    }

    .bib-personaje {
      font-size: 54px; line-height: 1;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,.15));
      display: inline-block;
    }
    .bib-card:hover .bib-personaje {
      animation: bib-wiggle .55s cubic-bezier(.36,.07,.19,.97) both;
    }
    .bib-icono-sm { position: absolute; bottom: 6px; left: 10px; font-size: 16px; opacity: .6; }

    /* overlay "Jugar" */
    .bib-play-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.32);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .2s ease;
    }
    .bib-card:hover .bib-play-overlay { opacity: 1; }
    .bib-jugar-btn {
      padding: 9px 22px; border: none; border-radius: 100px;
      color: white; font-size: 14px; font-weight: 800;
      cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.28);
      transition: transform .15s ease;
    }
    .bib-jugar-btn:hover { transform: scale(1.08); }

    .bib-card-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .bib-tipo  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; }
    .bib-nombre { font-size: 13px; font-weight: 800; color: #1E293B; line-height: 1.3; }
    .bib-nivel  { font-size: 11px; color: #94A3B8; font-weight: 600; }
    .bib-prog-wrap { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .bib-prog-bar  { flex: 1; height: 5px; background: #F1F0F9; border-radius: 100px; overflow: hidden; }
    .bib-prog-fill { height: 100%; border-radius: 100px; }
    .bib-prog-txt  { font-size: 10px; color: #94A3B8; font-weight: 700; flex-shrink: 0; }

    .bib-empty {
      grid-column: 1 / -1; text-align: center; padding: 40px 0;
      color: #94A3B8; font-size: 14px; font-weight: 600;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .bib-empty-ico { font-size: 36px; opacity: .4; }
    /* ══ MISIÓN DEL DÍA ══════════════════════════════════════ */
    .mision-card {
      display: flex; align-items: center; gap: 18px;
      background: linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 60%, #FAFAFF 100%);
      border-radius: 20px; padding: 18px 22px; margin-top: 14px;
      border: 1.5px solid rgba(124,58,237,.14);
      box-shadow: 0 3px 18px rgba(124,58,237,.08);
    }
    .mision-icon-wrap {
      width: 68px; height: 68px; border-radius: 18px; flex-shrink: 0;
      background: white; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(124,58,237,.14);
    }
    .mision-icono { font-size: 38px; line-height: 1; }
    .mision-body  { flex: 1; min-width: 0; }
    .mision-top-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 6px; flex-wrap: wrap; gap: 6px;
    }
    .mision-titulo    { font-size: 15px; font-weight: 900; color: #5B21B6; }
    .mision-recompensa {
      font-size: 12px; font-weight: 700; color: #7C3AED;
      background: rgba(124,58,237,.12); padding: 3px 12px;
      border-radius: 100px; white-space: nowrap;
    }
    .mision-desc {
      font-size: 13px; color: #475569; font-weight: 600;
      margin: 0 0 10px; line-height: 1.5;
    }
    .mision-desc strong { color: #5B21B6; }
    .mision-prog-wrap  { display: flex; align-items: center; gap: 10px; }
    .mision-prog-bar   {
      flex: 1; height: 9px; background: rgba(124,58,237,.15);
      border-radius: 100px; overflow: hidden;
    }
    .mision-prog-fill  {
      height: 100%;
      background: linear-gradient(90deg, #7C3AED, #A78BFA);
      border-radius: 100px; transition: width 1s ease;
      min-width: 0;
    }
    .mision-prog-txt   { font-size: 13px; font-weight: 800; color: #7C3AED; flex-shrink: 0; }

    /* estado completado */
    @keyframes mision-glow {
      0%, 100% { box-shadow: 0 3px 18px rgba(5,150,105,.12); }
      50%       { box-shadow: 0 6px 30px rgba(5,150,105,.28); }
    }
    .mision-done {
      background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 60%, #F0FDF4 100%);
      border-color: rgba(5,150,105,.2);
      animation: mision-glow 2s ease infinite;
    }
    .mision-icon-done { box-shadow: 0 4px 16px rgba(5,150,105,.2); }
    .mision-titulo-done { color: #065F46; }
    .mision-badge-done {
      font-size: 12px; font-weight: 700; color: #059669;
      background: rgba(5,150,105,.12); padding: 3px 12px; border-radius: 100px;
    }
    .mision-desc-done { color: #065F46; }
    .mision-btn-premio {
      margin-top: 10px; padding: 9px 22px; border: none;
      border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 800;
      background: linear-gradient(90deg, #059669, #10B981);
      color: white; box-shadow: 0 4px 14px rgba(5,150,105,.3);
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .mision-btn-premio:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(5,150,105,.4); }
    /* ══ fin MISIÓN DEL DÍA ══════════════════════════════════ */

    /* ══ HISTORIAL DE MISIONES (tab Logros) ══════════════════ */
    .misiones-historial-section {
      margin-top: 32px;
      background: white;
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 2px 16px rgba(0,0,0,.06);
      border: 1.5px solid #EDE9FE;
    }
    .mh-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .mh-titulo { font-size: 17px; font-weight: 800; color: #1E293B; }
    .mh-count  { font-size: 13px; font-weight: 600; color: #7C3AED; background: #EDE9FE; padding: 3px 12px; border-radius: 999px; }
    .mh-empty  { text-align: center; padding: 32px 0; color: #94A3B8; }
    .mh-empty-ico { font-size: 40px; display: block; margin-bottom: 10px; }
    .mh-empty p   { font-size: 14px; }
    .mh-list { display: flex; flex-direction: column; gap: 10px; }
    .mh-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: #FAFAFA;
      border-radius: 14px;
      border: 1px solid #F1F5F9;
      transition: background .15s;
    }
    .mh-row:hover { background: #F5F3FF; }
    .mh-ico-wrap {
      width: 44px; height: 44px;
      background: linear-gradient(135deg,#EDE9FE,#DDD6FE);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .mh-ico    { font-size: 22px; }
    .mh-info   { flex: 1; min-width: 0; }
    .mh-nombre { font-size: 14px; font-weight: 700; color: #1E293B; }
    .mh-fecha  { font-size: 12px; color: #94A3B8; margin-top: 2px; }
    .mh-premio { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .mh-recompensa { font-size: 13px; font-weight: 700; color: #059669; }
    .mh-check      { font-size: 16px; }
    /* ══ fin HISTORIAL DE MISIONES ═══════════════════════════ */

    /* ══ fin BIBLIOTECA ══════════════════════════════════════ */
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
    .sesion-precision.sin-datos { color: #94A3B8; font-weight: 600; }
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

  // ── Misión del día ───────────────────────────────────────
  readonly MISIONES = [
    { icono:'🚀', titulo:'¡Misión de Atención!',  categoria:'Atención',   meta:2, desc:'Completa <strong>2 juegos</strong> de la categoría <strong>Atención</strong>.',           recompensa:'🎁 Cofre sorpresa'    },
    { icono:'🔢', titulo:'¡Reto de Cálculo!',      categoria:'Cálculo',    meta:2, desc:'Completa <strong>2 juegos</strong> de la categoría <strong>Cálculo</strong>.',             recompensa:'⭐ Estrella dorada'   },
    { icono:'🧠', titulo:'¡Desafío de Memoria!',   categoria:'Memoria',    meta:2, desc:'Completa <strong>2 juegos</strong> de la categoría <strong>Memoria</strong>.',             recompensa:'🏆 Trofeo mental'     },
    { icono:'📖', titulo:'¡Día de Lectura!',        categoria:'Lectura',    meta:1, desc:'Completa <strong>1 juego</strong> de la categoría <strong>Lectura</strong>.',             recompensa:'📚 Insignia lectora'  },
    { icono:'📝', titulo:'¡Reto de Lenguaje!',      categoria:'Lenguaje',   meta:1, desc:'Completa <strong>1 juego</strong> de la categoría <strong>Lenguaje</strong>.',            recompensa:'✏️ Pluma de oro'     },
    { icono:'⚡', titulo:'¡Maratón del día!',       categoria:'Atención',   meta:3, desc:'Completa <strong>3 juegos</strong> de <strong>cualquier categoría</strong> hoy.',         recompensa:'💎 Gema especial'     },
    { icono:'🧩', titulo:'¡Reto de Percepción!',   categoria:'Percepción', meta:1, desc:'Completa <strong>1 juego</strong> de la categoría <strong>Percepción</strong>.',           recompensa:'🔮 Cristal mágico'    },
  ];

  get misionDelDia() {
    const inicio   = new Date(new Date().getFullYear(), 0, 0).getTime();
    const diaAnio  = Math.floor((Date.now() - inicio) / 86_400_000);
    return this.MISIONES[diaAnio % this.MISIONES.length];
  }

  get misionMeta():      number { return this.misionDelDia.meta; }
  get misionCategoria(): string { return this.misionDelDia.categoria; }

  misionProgreso    = 0;
  premioReclamado   = false;
  misionesHistorial: MisionReclamada[] = [];

  get misionCompletada(): boolean { return this.misionProgreso >= this.misionMeta; }

  reclamarPremio(): void {
    if (this.premioReclamado || !this.perfilId) return;
    const mision = this.misionDelDia;
    const idx = this.MISIONES.indexOf(mision);
    this.misionSvc.reclamar(this.perfilId, idx, mision.recompensa).subscribe({
      next: (rec) => {
        this.premioReclamado = true;
        this.misionesHistorial = [rec, ...this.misionesHistorial];
        setTimeout(() => this.activeTab = 'logros', 1800);
      },
      error: () => {
        // best-effort: marca como reclamado localmente de todas formas
        this.premioReclamado = true;
        setTimeout(() => this.activeTab = 'logros', 1800);
      }
    });
  }

  // ── Portraits (fallback a emoji si la imagen no existe) ──
  mascotaImgErrors = new Set<string>();
  onMascotaImgError(nombre: string): void { this.mascotaImgErrors.add(nombre); }

  // ── Biblioteca ───────────────────────────────────────────
  filtroLib = 'Todos';

  get categoriasUnicas(): string[] {
    return [...new Set(this.juegos.map(j => j.tipo))];
  }

  get juegosFiltrados(): Juego[] {
    if (this.filtroLib === 'Todos') return this.juegos;
    return this.juegos.filter(j => j.tipo === this.filtroLib);
  }

  catColorLib(cat: string): string {
    const map: Record<string, string> = {
      Atención:   '#7C3AED', Cálculo:    '#059669',
      Memoria:    '#9333EA', Lectura:    '#D97706',
      Lenguaje:   '#EA580C', Percepción: '#0891B2',
      Geografía:  '#65A30D', Lógica:     '#DB2777',
    };
    return map[cat] ?? '#64748B';
  }

  catIcoLib(cat: string): string {
    const map: Record<string, string> = {
      Atención:   '👁️', Cálculo:    '🔢',
      Memoria:    '🧠', Lectura:    '📖',
      Lenguaje:   '📝', Percepción: '🧩',
      Geografía:  '🗺️', Lógica:    '🔬',
    };
    return map[cat] ?? '🎮';
  }
  // ── fin Biblioteca ───────────────────────────────────────

  // ── Cover Flow ───────────────────────────────────────────
  activeJuegoIndex = 0;

  getCarouselPosition(index: number): string {
    const total = this.juegos.length;
    let rel = index - this.activeJuegoIndex;
    if (rel >  total / 2) rel -= total;
    if (rel < -total / 2) rel += total;
    const map: Record<number, string> = {
      [-2]: 'cf-far-left',
      [-1]: 'cf-left',
      [0]:  'cf-center',
      [1]:  'cf-right',
      [2]:  'cf-far-right',
    };
    return map[rel] ?? 'cf-hidden';
  }

  prevJuego(): void {
    this.activeJuegoIndex = (this.activeJuegoIndex - 1 + this.juegos.length) % this.juegos.length;
  }

  nextJuego(): void {
    this.activeJuegoIndex = (this.activeJuegoIndex + 1) % this.juegos.length;
  }

  setJuegoActivo(index: number): void {
    this.activeJuegoIndex = index;
  }

  onCarouselCardClick(index: number, juego: Juego): void {
    if (index !== this.activeJuegoIndex) {
      this.setJuegoActivo(index);
    } else {
      this.irAJuego(juego);
    }
  }
  // ── fin Cover Flow ───────────────────────────────────────

  // Tareas
  tareas:        AsignacionPerfil[] = [];
  loadingTareas  = false;

  totalSesiones  = 0;
  tiempoPromedio = 0;
  mejorRacha     = 0;

  avatarSeleccionado = 'fox';
  filtroCategoria  = 'Todos';

  readonly categorias = ['Todos', 'Constancia', 'Maestría', 'Velocidad', 'Social'];
  readonly avatares: Avatar[] = [
    { key:'fox',     emoji:'🦊' }, { key:'frog',    emoji:'🐸' },
    { key:'lion',    emoji:'🦁' }, { key:'panda',   emoji:'🐼' },
    { key:'koala',   emoji:'🐨' }, { key:'unicorn', emoji:'🦄' },
    { key:'dog',     emoji:'🐶' }, { key:'cat',     emoji:'🐱' },
    { key:'rabbit',  emoji:'🐰' }, { key:'tiger',   emoji:'🐯' },
    { key:'bear',    emoji:'🐻' }, { key:'mouse',   emoji:'🐭' },
  ];
  readonly juegos: Juego[] = [
    { nombre:'Espejo Mental',       tipo:'Atención',   icono:'🪞', personaje:'🦊', color:'#7C3AED', nivelTxt:'Nivel 3 · Avanzado',   progreso:75, ruta:'/nino/juego/espejo-mental',       mascotaImg:'/mascotas/foxy-portrait.png',  tip:'¡Memoriza los colores en orden y repítelos igual que yo!', portraitScale:1.45 },
    { nombre:'Historia Viva',       tipo:'Lectura',    icono:'📖', personaje:'🐰', color:'#D97706', nivelTxt:'Nivel 1 · Básico',      progreso:10, ruta:'/nino/juego/historia-viva',       mascotaImg:'/mascotas/benny-portrait.png', tip:'¡Lee el cuento con calma y responde mis preguntas!',       portraitScale:1.4  },
    { nombre:'Foco Extremo',        tipo:'Atención',   icono:'🎯', personaje:'🦁', color:'#4F46E5', nivelTxt:'Nivel 4 · Experto',     progreso:90, ruta:'/nino/juego/foco-extremo',        mascotaImg:'/mascotas/leo-portrait.png',   tip:'¡Concéntrate en el objetivo y reacciona a tiempo!' },
    { nombre:'Reacción Controlada', tipo:'Atención',   icono:'⚡', personaje:'🐻', color:'#2563EB', nivelTxt:'Nivel 2 · Intermedio',  progreso:45, ruta:'/nino/juego/reaccion-controlada', mascotaImg:'/mascotas/bruno-portrait.png', tip:'¡Espera el momento exacto y toca en el instante preciso!' },
    { nombre:'Cascada Numérica',    tipo:'Cálculo',    icono:'🔢', personaje:'🦉', color:'#059669', nivelTxt:'Nivel 2 · Intermedio',  progreso:30, ruta:'/nino/juego/cascada-numerica',    mascotaImg:'/mascotas/ollie-portrait.png', tip:'¡Mira la operación y atrapa el número correcto!' },
    { nombre:'Laberinto Cognitivo', tipo:'Memoria',    icono:'🌀', personaje:'🐱', color:'#7C3AED', nivelTxt:'Nivel 1 · Básico',      progreso:15, ruta:'/nino/juego/laberinto',           mascotaImg:'/mascotas/michi-portrait.png', tip:'¡Usa tu memoria para encontrar la salida del laberinto!' },
    { nombre:'Maratón Mental',      tipo:'Cálculo',    icono:'🏃', personaje:'🐨', color:'#059669', nivelTxt:'Nivel 1 · Básico',      progreso:10, ruta:'/nino/juego/maraton-mental',      mascotaImg:'/mascotas/koby-portrait.png',  tip:'¡Responde rápido y sigue avanzando sin parar!' },
    { nombre:'Ritmo y Patrón',      tipo:'Memoria',    icono:'🎵', personaje:'🐵', color:'#9333EA', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/ritmo-patron',        mascotaImg:'/mascotas/bongo-portrait.png', tip:'¡Escucha el ritmo y repite el patrón exacto!' },
    { nombre:'Palabras Ocultas',    tipo:'Lenguaje',   icono:'📝', personaje:'🐼', color:'#EA580C', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/palabras-ocultas',    mascotaImg:'/mascotas/pandi-portrait.png', tip:'¡Busca las palabras escondidas entre las letras!' },
    { nombre:'Piezas en Tiempo',    tipo:'Percepción', icono:'🧩', personaje:'🐯', color:'#0891B2', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/piezas-tiempo',       mascotaImg:'/mascotas/tigre-portrait.png', tip:'¡Coloca cada pieza en su lugar antes de que se acabe el tiempo!' },
    { nombre:'Mapa Aventura',       tipo:'Geografía',  icono:'🗺️', personaje:'🐶', color:'#65A30D', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/mapa-aventura',       mascotaImg:'/mascotas/buddy-portrait.png', tip:'¡Explora el mapa y encuentra el camino correcto!' },
    { nombre:'Lab de Ciencias',     tipo:'Lógica',     icono:'🔬', personaje:'🦄', color:'#DB2777', nivelTxt:'Nivel 1 · Básico',      progreso:0,  ruta:'/nino/juego/lab-ciencias',        mascotaImg:'/mascotas/uni-portrait.png',   tip:'¡Experimenta con las pociones y descubre la ciencia mágica!' },
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
    '/nino/juego/cascada-numerica', '/nino/juego/foco-extremo',
    '/nino/juego/ritmo-patron', '/nino/juego/reaccion-controlada',
    '/nino/juego/laberinto', '/nino/juego/maraton-mental',
    '/nino/juego/mapa-aventura', '/nino/juego/lab-ciencias',
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
    private misionSvc: MisionService,
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
    // Load mission claimed state + historial (best-effort, don't block main data)
    this.misionSvc.getEstado(perfilId).pipe(catchError(() => of({ reclamado: false }))).subscribe(estado => {
      if (estado.reclamado) this.premioReclamado = true;
    });
    this.misionSvc.getHistorial(perfilId).pipe(catchError(() => of([]))).subscribe(h => {
      this.misionesHistorial = h as MisionReclamada[];
    });

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
          precision: metMap.has(s.id) ? Math.round(metMap.get(s.id)!) : null,
          pts:       s.puntaje ?? 0,
        }));

      // ── Misión del día: sesiones de Atención completadas hoy ───────────
      const hoy = new Date().toDateString();
      const nombresAtencion = this.juegos
        .filter(j => j.tipo === this.misionCategoria)
        .map(j => j.nombre.toLowerCase());
      this.misionProgreso = Math.min(
        this.misionMeta,
        sess.filter(s =>
          new Date(s.inicio).toDateString() === hoy &&
          s.completada &&
          nombresAtencion.some(n => s.juego.nombre.toLowerCase().includes(n))
        ).length
      );

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
            ? Math.round(data.prec.reduce((s, v) => s + v, 0) / data.prec.length) : null;
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
      unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯', bear:'🐻', monkey:'🐵'
    };
    return m[av] ?? '🦊';
  }
  seleccionarAvatar(key: string): void { this.avatarSeleccionado = key; this.profileAvatar = this.avatarEmoji(key); }
  estaImplementado(ruta: string): boolean { return this.implementados.includes(ruta); }
  irAJuego(juego: Juego): void {
    if (!this.implementados.includes(juego.ruta)) {
      alert(`¡${juego.nombre} próximamente! 🎮`);
      return;
    }
    // Si es Palabras Ocultas, pasar el tema de la tarea activa como query param
    if (juego.nombre === 'Palabras Ocultas') {
      const tareaActiva = this.tareas.find(
        t => !t.completada && t.asignacion.juego?.nombre === 'Palabras Ocultas' && t.asignacion.tema
      );
      if (tareaActiva?.asignacion.tema) {
        this.router.navigate([juego.ruta], { queryParams: { tema: tareaActiva.asignacion.tema } });
        return;
      }
    }
    this.router.navigate([juego.ruta]);
  }
  cerrarSesion(): void { this.router.navigate(['/padre/dashboard']); }
  get xpPorcentaje(): number { return Math.round((this.xpActual / this.xpMax) * 100); }
}
