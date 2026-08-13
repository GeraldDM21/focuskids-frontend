import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocenteService, AlumnoDocente, Asignacion } from '../docente.service';
import { SesionJuego, Metrica } from '../../padre/padre.service';
import { MisionService, MisionReclamada } from '../../../core/services/mision.service';
import { FormsModule } from '@angular/forms';
import { EvolucionChartComponent } from '../../../shared/components/evolucion-chart/evolucion-chart.component';
import { NivelAsignadoService, JuegoResumen, NivelBloqueable } from '../../../core/services/nivel-asignado.service';
import { CampanaNotificacionesComponent } from '../../../shared/components/campana-notificaciones/campana-notificaciones.component';
import { MatIconModule } from '@angular/material/icon';

interface Estudiante {
  id: number;
  nombre: string;
  avatar: string;
  edad: number;
  partidas: number;
  precision: number;
  xp: number;
  estado: 'Excelente' | 'Muy bien' | 'Necesita ayuda';
  activo: boolean;
  sesiones: SesionJuego[];
}
interface Alerta {
  nombre: string;
  avatar: string;
  mensaje: string;
  tipo: 'warn' | 'danger';
  hace: string;
}
interface LogroClase {
  icono: string;
  nombre: string;
  desc: string;
  alumno: string;
  avatarAlu: string;
  fecha: string;
}
interface EventoCal {
  dia: number;
  titulo: string;
  tipo: 'asig' | 'reporte' | 'reunion';
  hora: string;
}

const AVATAR_MAP: Record<string, string> = {
  fox: '🦊',
  frog: '🐸',
  lion: '🦁',
  panda: '🐼',
  koala: '🐨',
  unicorn: '🦄',
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  tiger: '🐯',
  bear: '🐻',
  mouse: '🐭',
};

const JUEGO_ICO: Record<string, string> = {
  'Espejo Mental': '🪞',
  'Historia Viva': '📖',
  'Palabras Ocultas': '📝',
  'Piezas en Tiempo': '🧩',
  'Foco Extremo': '🎯',
  'Cascada Numérica': '🔢',
};

const MISIONES_DEF = [
  { icono:'🚀', titulo:'¡Misión de Atención!',  categoria:'Atención'   },
  { icono:'🔢', titulo:'¡Reto de Cálculo!',      categoria:'Cálculo'    },
  { icono:'🧠', titulo:'¡Desafío de Memoria!',   categoria:'Memoria'    },
  { icono:'📖', titulo:'¡Día de Lectura!',        categoria:'Lectura'    },
  { icono:'📝', titulo:'¡Reto de Lenguaje!',      categoria:'Lenguaje'   },
  { icono:'⚡', titulo:'¡Maratón del día!',       categoria:'Atención'   },
  { icono:'🧩', titulo:'¡Reto de Percepción!',   categoria:'Percepción' },
];

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EvolucionChartComponent, CampanaNotificacionesComponent],
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
          <p class="nav-sec">PRINCIPAL</p>
          <button class="nav-item" [class.active]="tab === 'clase'" (click)="tab = 'clase'">
            <span>🏫</span> Mi clase
          </button>
          <button class="nav-item" [class.active]="tab === 'reportes'" (click)="tab = 'reportes'">
            <span>📊</span> Reportes
          </button>
          <button
            class="nav-item"
            [class.active]="tab === 'asignaciones'"
            (click)="tab = 'asignaciones'"
          >
            <span>📋</span> Asignaciones
          </button>
          <button class="nav-item" [class.active]="tab === 'logros'" (click)="tab = 'logros'">
            <span>🏆</span> Logros
          </button>
          <button class="nav-item" (click)="irAProgreso()"><span>🧠</span> Progreso niños</button>
          <p class="nav-sec">HERRAMIENTAS</p>
          <button
            class="nav-item"
            [class.active]="tab === 'calendario'"
            (click)="tab = 'calendario'"
          >
            <span>📅</span> Calendario
          </button>
          <button class="nav-item" [class.active]="tab === 'config'" (click)="tab = 'config'">
            <span>⚙️</span> Configuración
          </button>
        </nav>
        <div class="sb-user">
          <div class="sb-avatar">{{ inicial }}</div>
          <div class="sb-info">
            <div class="sb-name">{{ docenteName }}</div>
            <div class="sb-role">Docente</div>
          </div>
          <button class="sb-logout" (click)="auth.logout()" title="Cerrar sesión"><mat-icon>logout</mat-icon></button>
        </div>
      </aside>

      <!-- ══ MAIN ══ -->
      <div class="main">
        <header class="topbar">
          <div>
            <h1 class="tb-title">{{ topTitle }}</h1>
            <p class="tb-sub">{{ topSub }}</p>
          </div>
          <div class="tb-right">
            @if (tab === 'asignaciones') {
              <button class="btn-add" (click)="showFormAsig = true">+ Nueva asignación</button>
            }
            <app-campana-notificaciones
              [usuarioId]="auth.user()?.usuarioId ?? 0"
              [notificacionesActivas]="notificacionesInAppActivas"
              historialBasePath="/docente/historial"
            />
            <div class="inst-chip">🏫 {{ institucion }}</div>
          </div>
        </header>

        <div class="content">
          @if (loading) {
            <div class="loader"><div class="spinner"></div></div>
          }

          <!-- ══ MI CLASE ══ -->
          @if (!loading && tab === 'clase') {
            @if (estudiantes.length === 0) {
              <div class="empty-state">
                <div style="font-size:56px">👨‍🎓</div>
                <h2>Aún no tenés alumnos asignados</h2>
                <p>
                  Para ver datos aquí, un padre debe asignar el perfil de su hijo a tu cuenta de
                  docente.<br />El campo <strong>docente_id</strong> en
                  <code>perfil_nino</code> debe apuntar a tu usuario.
                </p>
              </div>
            }

            @if (estudiantes.length > 0) {
              <!-- Stats -->
              <div class="stats-row">
                <div class="stat-card">
                  <div class="stat-ico">👨‍🎓</div>
                  <div class="stat-num">{{ activos }}</div>
                  <div class="stat-lbl">Estudiantes activos</div>
                </div>
                <div class="stat-card">
                  <div class="stat-ico">📈</div>
                  <div class="stat-num">{{ avgPrec }}%</div>
                  <div class="stat-lbl">Precisión promedio</div>
                </div>
                <div class="stat-card">
                  <div class="stat-ico">🕹️</div>
                  <div class="stat-num">{{ totalPartidas }}</div>
                  <div class="stat-lbl">Partidas esta semana</div>
                </div>
                <div class="stat-card">
                  <div class="stat-ico">⚠️</div>
                  <div class="stat-num">{{ alertas.length }}</div>
                  <div class="stat-lbl">Alertas activas</div>
                </div>
              </div>

              <div class="bottom-grid">
                <!-- Tabla -->
                <div class="table-card">
                  <div class="tc-header">
                    <h3 class="card-title">Progreso individual</h3>
                    <div class="filter-row">
                      <button
                        class="f-btn"
                        [class.f-act]="filtro === 'todos'"
                        (click)="filtro = 'todos'"
                      >
                        Todos
                      </button>
                      <button
                        class="f-btn"
                        [class.f-act]="filtro === 'atencion'"
                        (click)="filtro = 'atencion'"
                      >
                        ⚠️ Atención
                      </button>
                      <button
                        class="f-btn"
                        [class.f-act]="filtro === 'top'"
                        (click)="filtro = 'top'"
                      >
                        ⭐ Top
                      </button>
                    </div>
                  </div>
                  <table class="tabla">
                    <thead>
                      <tr>
                        <th>ESTUDIANTE</th>
                        <th>PARTIDAS</th>
                        <th>PRECISIÓN</th>
                        <th>XP</th>
                        <th>ESTADO</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (e of estudiantesFiltrados; track e.id) {
                        <tr [class.fila-inactiva]="!e.activo">
                          <td class="td-name">
                            <span class="stu-av">{{ e.avatar }}</span>
                            <span
                              >{{ e.nombre }}<br /><small>{{ e.edad }} años</small></span
                            >
                          </td>
                          <td>{{ e.partidas }}</td>
                          <td
                            [class.prec-ok]="e.precision >= 80"
                            [class.prec-warn]="e.precision >= 70 && e.precision < 80"
                            [class.prec-low]="e.precision < 70"
                          >
                            <div class="prec-wrap">
                              {{ e.precision }}%
                              <div class="prec-bar">
                                <div
                                  class="prec-fill"
                                  [style.width.%]="e.precision"
                                  [class.fill-ok]="e.precision >= 80"
                                  [class.fill-warn]="e.precision >= 70 && e.precision < 80"
                                  [class.fill-low]="e.precision < 70"
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td class="td-xp">⭐ {{ e.xp }}</td>
                          <td>
                            <span class="badge" [class]="badgeClass(e.estado)">{{ e.estado }}</span>
                          </td>
                          <td>
                            <button class="btn-evolucion" (click)="verEvolucion(e)">
                              📈 Ver evolución
                            </button>
                          </td>
                          <td>
                            <button class="btn-ver-historial" (click)="verHistorialDetallado(e)">
                              📅 Historial
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Panel derecho -->
                <div class="right-col">
                  <!-- Top 3 -->
                  <div class="panel">
                    <h3 class="card-title">🏆 Top estudiantes</h3>
                    @for (e of top3; track e.id; let i = $index) {
                      <div class="top-row">
                        <span class="medal">{{ ['🥇', '🥈', '🥉'][i] }}</span>
                        <span class="top-av">{{ e.avatar }}</span>
                        <span class="top-name">{{ e.nombre }}</span>
                        <span class="top-pct" [class.gold]="i === 0">{{ e.precision }}%</span>
                      </div>
                    }
                  </div>

                  <!-- Alertas -->
                  <div class="panel">
                    <h3 class="card-title">🚨 Alertas</h3>
                    @for (a of alertas; track a.nombre) {
                      <div class="alerta-item" [class.alerta-danger]="a.tipo === 'danger'">
                        <span class="al-av">{{ a.avatar }}</span>
                        <div class="al-body">
                          <div class="al-nombre">{{ a.nombre }}</div>
                          <div class="al-msg">{{ a.mensaje }}</div>
                          <div class="al-hace">{{ a.hace }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
            <!-- /estudiantes.length > 0 -->
          }

          <!-- ══ REPORTES ══ -->
          @if (!loading && tab === 'reportes') {
            <div class="rep-wrap">
              <div class="rep-intro">
                <div class="rep-stat">
                  <span class="rs-val">{{ avgPrec }}%</span
                  ><span class="rs-lbl">Precisión promedio de la clase</span>
                </div>
                <div class="rep-stat">
                  <span class="rs-val">{{ totalPartidas }}</span
                  ><span class="rs-lbl">Partidas totales</span>
                </div>
                <div class="rep-stat">
                  <span class="rs-val">{{ activos }}</span
                  ><span class="rs-lbl">Alumnos activos</span>
                </div>
                <div class="rep-stat">
                  <span class="rs-val">{{ xpClase | number }}</span
                  ><span class="rs-lbl">XP acumulado</span>
                </div>
              </div>

              <div class="rep-card">
                <h3 class="card-title">Rendimiento por estudiante</h3>
                @for (e of estudiantesOrdenados; track e.id) {
                  <div class="rep-row">
                    <span class="rep-av">{{ e.avatar }}</span>
                    <span class="rep-nombre">{{ e.nombre }}</span>
                    <div class="rep-bar-wrap">
                      <div class="rep-bar-outer">
                        <div
                          class="rep-bar-fill"
                          [style.width.%]="e.precision"
                          [class.fill-ok]="e.precision >= 80"
                          [class.fill-warn]="e.precision >= 70 && e.precision < 80"
                          [class.fill-low]="e.precision < 70"
                        ></div>
                      </div>
                      <span
                        class="rep-pct"
                        [class.prec-ok]="e.precision >= 80"
                        [class.prec-warn]="e.precision >= 70 && e.precision < 80"
                        [class.prec-low]="e.precision < 70"
                        >{{ e.precision }}%</span
                      >
                    </div>
                    <span class="badge sm" [class]="badgeClass(e.estado)">{{ e.estado }}</span>
                    <button class="btn-ver-historial" (click)="verHistorialDetallado(e)">
                      📅 Historial
                    </button>
                  </div>
                }
              </div>

              <div class="rep-card">
                <h3 class="card-title">Distribución de estados</h3>
                <div class="dist-row">
                  <div class="dist-item dist-ex">
                    <div class="dist-num">{{ cuentaEstado('Excelente') }}</div>
                    <div class="dist-lbl">🌟 Excelente</div>
                    <div class="dist-bar">
                      <div
                        class="dist-fill"
                        [style.width.%]="(cuentaEstado('Excelente') / estudiantes.length) * 100"
                        style="background:#16A34A"
                      ></div>
                    </div>
                  </div>
                  <div class="dist-item dist-mb">
                    <div class="dist-num">{{ cuentaEstado('Muy bien') }}</div>
                    <div class="dist-lbl">😊 Muy bien</div>
                    <div class="dist-bar">
                      <div
                        class="dist-fill"
                        [style.width.%]="(cuentaEstado('Muy bien') / estudiantes.length) * 100"
                        style="background:#D97706"
                      ></div>
                    </div>
                  </div>
                  <div class="dist-item dist-na">
                    <div class="dist-num">{{ cuentaEstado('Necesita ayuda') }}</div>
                    <div class="dist-lbl">🆘 Necesita ayuda</div>
                    <div class="dist-bar">
                      <div
                        class="dist-fill"
                        [style.width.%]="
                          (cuentaEstado('Necesita ayuda') / estudiantes.length) * 100
                        "
                        style="background:#DC2626"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- ══ ASIGNACIONES ══ -->
          @if (!loading && tab === 'asignaciones') {
            <div class="asig-wrap">
              <!-- Formulario de nueva asignación -->
              @if (showFormAsig) {
                <div class="asig-form-card">
                  <h3 class="card-title">Nueva asignación</h3>
                  <p class="asig-note">
                    Elige el alumno al que quieres asignarle esta tarea — cada asignación es para un
                    alumno específico, no para toda la clase.
                  </p>
                  <div class="form-grid">
                    <div class="form-field">
                      <label>Alumno *</label>
                      <select [(ngModel)]="formPerfilId">
                        <option [ngValue]="null">Selecciona un alumno...</option>
                        @for (e of estudiantes; track e.id) {
                          <option [ngValue]="e.id">{{ e.nombre }}</option>
                        }
                      </select>
                    </div>
                    <div class="form-field">
                      <label>Título *</label>
                      <input [(ngModel)]="formAsig.titulo" placeholder="Ej: Practica de memoria" />
                    </div>
                    <div class="form-field">
                      <label>Juego</label>
                      <select [(ngModel)]="formJuegoId" (ngModelChange)="setJuego($event)">
                        <option [ngValue]="null">Sin juego específico</option>
                        @for (j of JUEGOS_LISTA; track j.id) {
                          <option [ngValue]="j.id">{{ j.nombre }}</option>
                        }
                      </select>
                    </div>
                    <div class="form-field">
                      <label>Mínimo de sesiones *</label>
                      <input type="number" [(ngModel)]="formAsig.minimoSesiones" min="1" max="50" />
                    </div>
                    <div class="form-field">
                      <label>Fecha límite *</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        maxlength="10"
                        [(ngModel)]="formAsig.fechaLimite"
                      />
                    </div>
                    <div class="form-field span2">
                      <label>Descripción</label>
                      <textarea
                        [(ngModel)]="formAsig.descripcion"
                        rows="3"
                        placeholder="Instrucciones opcionales para los alumnos..."
                      ></textarea>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button class="btn-cancel" (click)="cancelarAsig()">Cancelar</button>
                    <button
                      class="btn-add"
                      [disabled]="savingAsig || !formPerfilId || !formAsig.titulo || !formAsig.fechaLimite"
                      (click)="crearAsig()"
                    >
                      {{ savingAsig ? 'Guardando...' : 'Crear asignación' }}
                    </button>
                  </div>
                </div>
              }

              <!-- Cargando asignaciones -->
              @if (loadingAsig) {
                <div class="loader"><div class="spinner"></div></div>
              }

              <!-- Estado vacío -->
              @if (!loadingAsig && asignaciones.length === 0 && !showFormAsig) {
                <div class="empty-state">
                  <div style="font-size:56px">📋</div>
                  <h2>Aún no hay asignaciones</h2>
                  <p>
                    Crea una asignación con el botón <strong>+ Nueva asignación</strong> y elige a qué
                    alumno se la dejas.
                  </p>
                </div>
              }

              <!-- Grid de asignaciones -->
              @if (!loadingAsig && asignaciones.length > 0) {
                <div class="asig-grid">
                  @for (a of asignaciones; track a.id) {
                    <div class="asig-card">
                      <div class="asig-top">
                        <div class="asig-ico" [style.background]="juegoColor(a.juego?.nombre)">
                          {{ juegoIco(a.juego?.nombre) }}
                        </div>
                        <div style="flex:1;min-width:0">
                          <div class="asig-titulo">{{ a.titulo }}</div>
                          <div class="asig-juego">
                            {{ a.juego?.nombre ?? 'Sin juego específico' }}
                          </div>
                        </div>
                        <button class="btn-del" (click)="eliminarAsig(a.id!)" title="Eliminar">
                          🗑
                        </button>
                      </div>
                      @if (a.descripcion) {
                        <p class="asig-desc">{{ a.descripcion }}</p>
                      }
                      <div class="asig-meta">
                        <span class="asig-chip">🎯 {{ a.minimoSesiones }} sesiones</span>
                        @if (a.alumnosAsignados && a.alumnosAsignados.length) {
                          <span class="asig-chip">👤 {{ a.alumnosAsignados.join(', ') }}</span>
                        } @else {
                          <span class="asig-chip">👨‍🎓 Toda la clase ({{ estudiantes.length }})</span>
                        }
                      </div>
                      <div class="asig-fecha">
                        📅 Límite: {{ a.fechaLimite | date: 'dd/MM/yyyy' }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ══ LOGROS ══ -->
          @if (!loading && tab === 'logros') {
            <div class="logros-wrap">
              <!-- Podio -->
              <div class="podio-card">
                <h3 class="card-title">🏆 Podio de la semana</h3>
                <div class="podio">
                  <div class="pod-col pod-2">
                    <div class="pod-av">{{ top3[1]?.avatar }}</div>
                    <div class="pod-name">{{ top3[1]?.nombre }}</div>
                    <div class="pod-xp">{{ top3[1]?.xp }} XP</div>
                    <div class="pod-pedestal p2">🥈</div>
                  </div>
                  <div class="pod-col pod-1">
                    <div class="pod-av large">{{ top3[0]?.avatar }}</div>
                    <div class="pod-name">{{ top3[0]?.nombre }}</div>
                    <div class="pod-xp gold">{{ top3[0]?.xp }} XP</div>
                    <div class="pod-pedestal p1">🥇</div>
                  </div>
                  <div class="pod-col pod-3">
                    <div class="pod-av">{{ top3[2]?.avatar }}</div>
                    <div class="pod-name">{{ top3[2]?.nombre }}</div>
                    <div class="pod-xp">{{ top3[2]?.xp }} XP</div>
                    <div class="pod-pedestal p3">🥉</div>
                  </div>
                </div>
              </div>

              <!-- Destacados -->
              <div class="logros-card">
                <h3 class="card-title">Destacados de la clase</h3>
                @if (logrosClase.length === 0) {
                  <div class="mini-empty">
                    <span style="font-size:32px">🏅</span>
                    <p>Los destacados aparecerán aquí cuando los alumnos comiencen a jugar.</p>
                  </div>
                } @else {
                  <div class="logro-list">
                    @for (l of logrosClase; track l.nombre) {
                      <div class="logro-row">
                        <div class="lo-ico">{{ l.icono }}</div>
                        <div class="lo-body">
                          <div class="lo-nombre">{{ l.nombre }}</div>
                          <div class="lo-desc">{{ l.desc }}</div>
                        </div>
                        <div class="lo-quien">
                          <span class="lo-av">{{ l.avatarAlu }}</span>
                          <span class="lo-alumno">{{ l.alumno }}</span>
                        </div>
                        <div class="lo-fecha">{{ l.fecha }}</div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- ══ CALENDARIO ══ -->
          @if (!loading && tab === 'calendario') {
            <div class="cal-wrap">
              <div class="cal-card">
                <div class="cal-header">
                  <h3 class="card-title">Julio 2026</h3>
                  <div class="cal-legend">
                    <span class="leg asig-col">📋 Asignación</span>
                    <span class="leg rep-col">📊 Reporte</span>
                    <span class="leg reu-col">👥 Reunión</span>
                  </div>
                </div>
                <div class="dias-header">
                  @for (d of ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']; track d) {
                    <div class="dia-hdr">{{ d }}</div>
                  }
                </div>
                <div class="dias-grid">
                  @for (dia of diasMes; track dia) {
                    <div class="dia-cel" [class.dia-hoy]="dia === 20" [class.dia-vacio]="dia === 0">
                      @if (dia > 0) {
                        <span class="dia-num">{{ dia }}</span>
                        @for (ev of eventosDelDia(dia); track ev.titulo) {
                          <div
                            class="ev-chip"
                            [class.ev-asig]="ev.tipo === 'asig'"
                            [class.ev-rep]="ev.tipo === 'reporte'"
                            [class.ev-reu]="ev.tipo === 'reunion'"
                          >
                            {{ ev.titulo }}
                          </div>
                        }
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- ══ CONFIGURACIÓN ══ -->
          @if (!loading && tab === 'config') {
            <div class="cfg-wrap">
              <div class="cfg-card">
                <h3 class="cfg-title">👤 Mi perfil docente</h3>
                <div class="cfg-avatar">{{ inicial }}</div>
                <div class="cfg-field">
                  <label>Nombre</label>
                  <div class="cfg-val">{{ docenteName }}</div>
                </div>
                <div class="cfg-field">
                  <label>Institución</label>
                  <div class="cfg-val">{{ institucion }}</div>
                </div>
                <div class="cfg-field">
                  <label>Grado / Grupo</label>
                  <div class="cfg-val">{{ gradoGrupo }}</div>
                </div>
                <div class="cfg-field">
                  <label>Rol</label>
                  <div class="cfg-val">Docente</div>
                </div>
                <p class="cfg-note">
                  Para actualizar tu información, contacta al administrador del sistema.
                </p>
              </div>
              <div class="cfg-card">
                <h3 class="cfg-title">🔔 Notificaciones</h3>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <div class="toggle-label">Notificaciones in-app</div>
                    <div class="toggle-desc">
                      Muestra el badge de la campana cuando la IA detecta una regresión en un
                      alumno. Las alertas se siguen registrando aunque esté apagado.
                    </div>
                  </div>
                  <button
                    class="toggle-btn"
                    [class.toggle-on]="notificacionesInAppActivas"
                    (click)="cambiarNotificacionesInApp()"
                    [disabled]="guardandoNotifInApp"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>
                @if (guardandoNotifInApp) {
                  <p class="cfg-note" style="margin-top:8px">Guardando...</p>
                }
              </div>
              <div class="cfg-card">
                <h3 class="cfg-title">👨‍🎓 Mi clase</h3>
                <div class="cfg-alumnos">
                  @for (e of estudiantes; track e.id) {
                    <div class="cfg-alumno">
                      <span>{{ e.avatar }}</span>
                      <span class="ca-nombre">{{ e.nombre }}</span>
                      <span class="ca-edad">{{ e.edad }} años</span>
                      <span class="ca-est" [class.est-ok]="e.activo" [class.est-no]="!e.activo">{{
                        e.activo ? 'Activo' : 'Inactivo'
                      }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ══ MODAL EVOLUCIÓN DE ALUMNO ══ -->
      @if (alumnoEnEvolucion) {
        <div class="overlay" (click)="cerrarEvolucion()">
          <div class="modal modal-evolucion" (click)="$event.stopPropagation()">
            <div class="modal-evo-header">
              <h2 class="modal-title" style="margin:0">
                📈 Evolución de {{ alumnoEnEvolucion.nombre }}
              </h2>
              <button class="modal-close" (click)="cerrarEvolucion()">×</button>
            </div>
            <app-evolucion-chart [perfilId]="alumnoEnEvolucion.id" />
          </div>
        </div>
      }
    </div>
  <!-- ══ MODAL NIVELES BLOQUEADOS ══ -->
  @if (alumnoEnNiveles) {
    <div class="overlay" (click)="cerrarNiveles()">
      <div class="modal modal-niveles" (click)="$event.stopPropagation()">
        <div class="modal-evo-header">
          <h2 class="modal-title" style="margin:0">
            🔒 Niveles de {{ alumnoEnNiveles.nombre }}
          </h2>
          <button class="modal-close" (click)="cerrarNiveles()">×</button>
        </div>
        <p class="niveles-hint">
          Fija el nivel de cada juego para que {{ alumnoEnNiveles.nombre }} solo pueda jugar
          en esa dificultad. Elegí "Sin restricción" para que vuelva a adaptarse automáticamente.
        </p>
        @if (loadingNiveles) {
          <p class="niveles-hint">Cargando…</p>
        } @else {
          <table class="tabla-niveles">
            <thead>
              <tr><th>JUEGO</th><th>NIVEL ASIGNADO</th></tr>
            </thead>
            <tbody>
              @for (j of juegosParaNiveles; track j.id) {
                <tr>
                  <td>{{ j.nombre }}</td>
                  <td>
                    <select
                      [disabled]="savingNivelJuegoId === j.id"
                      [ngModel]="nivelesAsignados[j.id] || ''"
                      (ngModelChange)="cambiarNivel(j.id, $event)">
                      <option value="">Sin restricción</option>
                      @for (n of NIVELES_BLOQUEABLES; track n) {
                        <option [value]="n">{{ n === 'FACIL' ? 'Fácil' : n === 'MEDIO' ? 'Medio' : 'Difícil' }}</option>
                      }
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }
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
      .root {
        display: flex;
        height: 100vh;
        overflow: hidden;
        font-family:
          'Inter',
          -apple-system,
          sans-serif;
        background: #ecfdf5;
      }

      /* ── Sidebar ── */
      .sidebar {
        width: 172px;
        flex-shrink: 0;
        background: linear-gradient(180deg, #14532d 0%, #166534 60%, #15803d 100%);
        display: flex;
        flex-direction: column;
        padding: 22px 0 16px;
        overflow-y: auto;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .brand-ico {
        font-size: 20px;
      }
      .brand-txt {
        font-size: 15px;
        font-weight: 800;
        color: white;
      }
      .nav {
        flex: 1;
        padding: 12px 10px;
      }
      .nav-sec {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1.4px;
        color: rgba(255, 255, 255, 0.3);
        padding: 14px 8px 6px;
        text-transform: uppercase;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 9px 10px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        margin-bottom: 2px;
        transition: all 0.15s;
      }
      .nav-item span {
        font-size: 15px;
        flex-shrink: 0;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.09);
        color: rgba(255, 255, 255, 0.9);
      }
      .nav-item.active {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }
      .sb-user {
        margin-top: auto;
        padding: 14px 12px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sb-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #f59e0b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 800;
        color: white;
        flex-shrink: 0;
      }
      .sb-info {
        flex: 1;
        min-width: 0;
      }
      .sb-name {
        font-size: 11.5px;
        font-weight: 700;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sb-role {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
      }
      .sb-logout {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        transition: all 0.2s;
      }
      .sb-logout:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }

      /* ── Main ── */
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .topbar {
        background: white;
        padding: 14px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #d1fae5;
        flex-shrink: 0;
      }
      .tb-title {
        font-size: 18px;
        font-weight: 800;
        color: #14532d;
      }
      .tb-sub {
        font-size: 12px;
        color: #6b7280;
        margin-top: 2px;
      }
      .tb-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .inst-chip {
        background: #f0fdf4;
        border: 1.5px solid #86efac;
        border-radius: 20px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        color: #15803d;
      }
      .btn-add {
        background: #15803d;
        color: white;
        border: none;
        border-radius: 12px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-add:hover {
        background: #14532d;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 20px 22px 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* ── Stats ── */
      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      .stat-card {
        background: white;
        border-radius: 16px;
        padding: 18px 16px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .stat-ico {
        font-size: 26px;
        margin-bottom: 8px;
      }
      .stat-num {
        font-size: 24px;
        font-weight: 900;
        color: #14532d;
      }
      .stat-lbl {
        font-size: 10.5px;
        color: #94a3b8;
        margin-top: 4px;
      }

      /* ── Mi Clase ── */
      .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 248px;
        gap: 14px;
      }
      .table-card {
        background: white;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
        overflow: hidden;
      }
      .tc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .card-title {
        font-size: 14px;
        font-weight: 800;
        color: #14532d;
      }
      .filter-row {
        display: flex;
        gap: 6px;
      }
      .f-btn {
        border: 1.5px solid #d1fae5;
        background: white;
        border-radius: 8px;
        padding: 5px 10px;
        font-size: 11.5px;
        font-weight: 700;
        color: #6b7280;
        cursor: pointer;
      }
      .f-btn.f-act {
        background: #f0fdf4;
        border-color: #86efac;
        color: #15803d;
      }
      .tabla {
        width: 100%;
        border-collapse: collapse;
      }
      .tabla thead tr {
        border-bottom: 1.5px solid #f1f5f9;
      }
      .tabla th {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.8px;
        color: #94a3b8;
        padding: 0 10px 10px;
        text-align: left;
      }
      .tabla tbody tr {
        border-bottom: 1px solid #f8fafc;
        transition: background 0.15s;
      }
      .tabla tbody tr:hover {
        background: #f0fdf4;
      }
      .tabla tbody tr:last-child {
        border-bottom: none;
      }
      .tabla td {
        padding: 10px;
        font-size: 13.5px;
        color: #334155;
        font-weight: 600;
      }
      .fila-inactiva {
        opacity: 0.5;
      }
      .td-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .stu-av {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .td-name small {
        font-size: 10.5px;
        color: #94a3b8;
        font-weight: 600;
      }
      .td-xp {
        color: #f59e0b;
        font-weight: 800;
      }
      .prec-ok {
        color: #16a34a;
      }
      .prec-warn {
        color: #d97706;
      }
      .prec-low {
        color: #dc2626;
      }
      .prec-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .prec-bar {
        height: 5px;
        background: #f3f4f6;
        border-radius: 100px;
        overflow: hidden;
        width: 80px;
      }
      .prec-fill {
        height: 100%;
        border-radius: 100px;
      }
      .fill-ok {
        background: #16a34a;
      }
      .fill-warn {
        background: #d97706;
      }
      .fill-low {
        background: #dc2626;
      }
      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
      }
      .badge.sm {
        font-size: 10px;
        padding: 3px 8px;
      }
      .badge-ex {
        background: #dcfce7;
        color: #15803d;
      }
      .badge-mb {
        background: #fef9c3;
        color: #a16207;
      }
      .badge-na {
        background: #fee2e2;
        color: #b91c1c;
      }
      .btn-ver-historial {
        background: #f0fdf4;
        color: #15803d;
        border: none;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
      }
      .btn-ver-historial:hover {
        background: #dcfce7;
      }
      .right-col {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .panel {
        background: white;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .top-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid #f0fdf4;
      }
      .top-row:last-child {
        border-bottom: none;
      }
      .medal {
        font-size: 20px;
        flex-shrink: 0;
      }
      .top-av {
        font-size: 18px;
        flex-shrink: 0;
      }
      .top-name {
        flex: 1;
        font-size: 12.5px;
        font-weight: 700;
        color: #334155;
      }
      .top-pct {
        font-size: 13px;
        font-weight: 800;
        color: #15803d;
      }
      .top-pct.gold {
        color: #d97706;
      }
      .alerta-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
        background: #fffbeb;
        border-left: 3px solid #f59e0b;
        margin-bottom: 8px;
      }
      .alerta-item:last-child {
        margin-bottom: 0;
      }
      .alerta-danger {
        background: #fff5f5;
        border-left-color: #ef4444;
      }
      .al-av {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .al-nombre {
        font-size: 12px;
        font-weight: 800;
        color: #334155;
      }
      .al-msg {
        font-size: 11.5px;
        color: #6b7280;
        margin-top: 2px;
      }
      .al-hace {
        font-size: 10px;
        color: #9ca3af;
        margin-top: 2px;
      }

      /* ── Loader / Empty ── */
      .loader {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
        padding: 60px;
      }
      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #bbf7d0;
        border-top-color: #15803d;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
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
        gap: 14px;
        padding: 60px;
        text-align: center;
      }
      .empty-state h2 {
        font-size: 20px;
        font-weight: 800;
        color: #14532d;
      }
      .empty-state p {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.7;
      }
      .empty-state code {
        background: #f0fdf4;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 12px;
        color: #15803d;
      }

      /* ── Reportes ── */
      .rep-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .rep-intro {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      .rep-stat {
        background: white;
        border-radius: 16px;
        padding: 18px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .rs-val {
        display: block;
        font-size: 26px;
        font-weight: 900;
        color: #14532d;
      }
      .rs-lbl {
        display: block;
        font-size: 10.5px;
        color: #94a3b8;
        margin-top: 5px;
      }
      .rep-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .rep-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #f0fdf4;
      }
      .rep-row:last-child {
        border-bottom: none;
      }
      .rep-av {
        font-size: 22px;
        flex-shrink: 0;
      }
      .rep-nombre {
        font-size: 13px;
        font-weight: 700;
        color: #334155;
        min-width: 130px;
      }
      .rep-bar-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .rep-bar-outer {
        flex: 1;
        height: 8px;
        background: #f3f4f6;
        border-radius: 100px;
        overflow: hidden;
      }
      .rep-bar-fill {
        height: 100%;
        border-radius: 100px;
        transition: width 0.8s ease;
      }
      .rep-pct {
        font-size: 12px;
        font-weight: 800;
        min-width: 36px;
        text-align: right;
      }
      .dist-row {
        display: flex;
        gap: 16px;
      }
      .dist-item {
        flex: 1;
      }
      .dist-num {
        font-size: 32px;
        font-weight: 900;
        color: #14532d;
      }
      .dist-lbl {
        font-size: 12px;
        color: #6b7280;
        font-weight: 700;
        margin: 4px 0 8px;
      }
      .dist-bar {
        height: 8px;
        background: #f3f4f6;
        border-radius: 100px;
        overflow: hidden;
      }
      .dist-fill {
        height: 100%;
        border-radius: 100px;
        transition: width 0.8s ease;
      }

      /* ── Asignaciones ── */
      .asig-form-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
        margin-bottom: 4px;
      }
      .asig-note {
        font-size: 13px;
        color: #6b7280;
        margin: 12px 0 16px;
      }
      .btn-cancel {
        background: #f3f4f6;
        color: #374151;
        border: none;
        border-radius: 10px;
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .asig-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .asig-card {
        background: white;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .asig-top {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .asig-ico {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }
      .asig-titulo {
        font-size: 14px;
        font-weight: 800;
        color: #1e1b4b;
      }
      .asig-juego {
        font-size: 11.5px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .asig-prog-lbl {
        display: flex;
        justify-content: space-between;
        font-size: 11.5px;
        font-weight: 700;
        color: #6b7280;
        margin-bottom: 6px;
      }
      .asig-cnt {
        color: #15803d;
      }
      .asig-prog-bar {
        height: 8px;
        background: #f3f4f6;
        border-radius: 100px;
        overflow: hidden;
        margin-bottom: 10px;
      }
      .asig-prog-fill {
        height: 100%;
        border-radius: 100px;
        transition: width 0.8s ease;
      }
      .asig-fecha {
        font-size: 11px;
        color: #9ca3af;
      }

      /* ── Asignaciones form ── */
      .asig-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 12px 0 16px;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .form-field.span2 {
        grid-column: span 2;
      }
      .form-field label {
        font-size: 12px;
        font-weight: 700;
        color: #6b7280;
      }
      .form-field input,
      .form-field select,
      .form-field textarea {
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        padding: 9px 12px;
        font-size: 13.5px;
        color: #1f2937;
        background: white;
        outline: none;
        font-family: inherit;
      }
      .form-field input:focus,
      .form-field select:focus,
      .form-field textarea:focus {
        border-color: #86efac;
        box-shadow: 0 0 0 3px rgba(134, 239, 172, 0.15);
      }
      .form-field textarea {
        resize: vertical;
      }
      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .asig-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .asig-chip {
        background: #f0fdf4;
        color: #15803d;
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
      }
      .asig-desc {
        font-size: 12.5px;
        color: #6b7280;
        margin-bottom: 10px;
        line-height: 1.5;
      }
      .btn-del {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 5px 8px;
        border-radius: 8px;
        opacity: 0.5;
        flex-shrink: 0;
      }
      .btn-del:hover {
        background: #fee2e2;
        opacity: 1;
      }

      /* ── mini empty ── */
      .mini-empty {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f0fdf4;
        border-radius: 12px;
      }
      .mini-empty p {
        font-size: 13px;
        color: #6b7280;
      }

      /* ── Logros ── */
      .logros-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .podio-card,
      .logros-card {
        background: white;
        border-radius: 18px;
        padding: 22px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .podio {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 20px;
        padding: 20px 0 0;
      }
      .pod-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .pod-av {
        font-size: 38px;
      }
      .pod-av.large {
        font-size: 52px;
      }
      .pod-name {
        font-size: 13px;
        font-weight: 800;
        color: #334155;
      }
      .pod-xp {
        font-size: 12px;
        font-weight: 700;
        color: #94a3b8;
      }
      .pod-xp.gold {
        color: #d97706;
      }
      .pod-pedestal {
        font-size: 28px;
        margin-top: 4px;
      }
      .p1 {
        font-size: 34px;
      }
      .logro-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .logro-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f0fdf4;
      }
      .logro-row:last-child {
        border-bottom: none;
      }
      .lo-ico {
        font-size: 26px;
        flex-shrink: 0;
      }
      .lo-body {
        flex: 1;
      }
      .lo-nombre {
        font-size: 13px;
        font-weight: 800;
        color: #334155;
      }
      .lo-desc {
        font-size: 11.5px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .lo-quien {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .lo-av {
        font-size: 18px;
      }
      .lo-alumno {
        font-size: 12px;
        font-weight: 700;
        color: #15803d;
      }
      .lo-fecha {
        font-size: 11px;
        color: #9ca3af;
        flex-shrink: 0;
        min-width: 60px;
        text-align: right;
      }

      /* ── Calendario ── */
      .cal-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .cal-card {
        background: white;
        border-radius: 18px;
        padding: 22px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .cal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .cal-legend {
        display: flex;
        gap: 14px;
      }
      .leg {
        font-size: 11.5px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
      }
      .asig-col {
        background: #ede9fe;
        color: #5b21b6;
      }
      .rep-col {
        background: #fef9c3;
        color: #92400e;
      }
      .reu-col {
        background: #dcfce7;
        color: #14532d;
      }
      .dias-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        margin-bottom: 6px;
      }
      .dia-hdr {
        text-align: center;
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        padding: 6px 0;
      }
      .dias-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }
      .dia-cel {
        min-height: 72px;
        background: #f9fafb;
        border-radius: 10px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .dia-cel.dia-hoy {
        background: #f0fdf4;
        border: 1.5px solid #86efac;
      }
      .dia-cel.dia-vacio {
        background: transparent;
      }
      .dia-num {
        font-size: 12px;
        font-weight: 800;
        color: #374151;
      }
      .dia-hoy .dia-num {
        color: #15803d;
      }
      .ev-chip {
        font-size: 9.5px;
        font-weight: 700;
        border-radius: 6px;
        padding: 2px 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ev-asig {
        background: #ede9fe;
        color: #5b21b6;
      }
      .ev-rep {
        background: #fef9c3;
        color: #92400e;
      }
      .ev-reu {
        background: #dcfce7;
        color: #14532d;
      }

      /* ── Configuración ── */
      .cfg-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 540px;
      }
      .cfg-card {
        background: white;
        border-radius: 16px;
        padding: 22px;
        box-shadow: 0 2px 10px rgba(21, 128, 61, 0.07);
      }
      .cfg-title {
        font-size: 14px;
        font-weight: 800;
        color: #14532d;
        margin-bottom: 16px;
      }
      .cfg-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #f59e0b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        font-weight: 800;
        color: white;
        margin-bottom: 16px;
      }
      .cfg-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-bottom: 14px;
      }
      .cfg-field label {
        font-size: 12px;
        font-weight: 700;
        color: #6b7280;
      }
      .cfg-val {
        background: #f0fdf4;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 14px;
        font-weight: 600;
        color: #14532d;
      }
      .cfg-note {
        font-size: 12px;
        color: #94a3b8;
      }
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .toggle-info {
        flex: 1;
      }
      .toggle-label {
        font-size: 13.5px;
        font-weight: 700;
        color: #1e1b4b;
        margin-bottom: 3px;
      }
      .toggle-desc {
        font-size: 11.5px;
        color: #64748b;
      }
      .toggle-btn {
        width: 48px;
        height: 26px;
        border-radius: 13px;
        background: #cbd5e1;
        border: none;
        cursor: pointer;
        position: relative;
        transition: background 0.2s;
        flex-shrink: 0;
        padding: 0;
      }
      .toggle-btn.toggle-on {
        background: #7c3aed;
      }
      .toggle-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .toggle-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        transition: left 0.2s;
        display: block;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      }
      .toggle-btn.toggle-on .toggle-thumb {
        left: 25px;
      }
      .cfg-alumnos {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .cfg-alumno {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: #f0fdf4;
        border-radius: 12px;
        font-size: 14px;
      }
      .ca-nombre {
        flex: 1;
        font-weight: 700;
        color: #14532d;
      }
      .ca-edad {
        font-size: 12px;
        color: #6b7280;
      }
      .ca-est {
        font-size: 10px;
        font-weight: 800;
        padding: 3px 10px;
        border-radius: 20px;
      }
      .est-ok {
        background: #dcfce7;
        color: #15803d;
      }
      .est-no {
        background: #fee2e2;
        color: #b91c1c;
      }

      /* ── Evolución (modal) ── */
      .btn-evolucion {
        background: #f0fdf4;
        color: #15803d;
        border: 1.5px solid #86efac;
        border-radius: 10px;
        padding: 6px 12px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-evolucion:hover {
        background: #dcfce7;
      }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(20, 83, 45, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      .modal {
        background: white;
        border-radius: 24px;
        padding: 28px 32px;
        box-shadow: 0 20px 60px rgba(20, 83, 45, 0.2);
      }
      .modal-evolucion {
        width: 100%;
        max-width: 760px;
        max-height: 88vh;
        overflow-y: auto;
      }
      .modal-evo-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
      }
      .modal-title {
        font-size: 19px;
        font-weight: 900;
        color: #14532d;
      }
      .modal-close {
        background: #f0fdf4;
        border: none;
        border-radius: 10px;
        width: 32px;
        height: 32px;
        font-size: 18px;
        color: #15803d;
        cursor: pointer;
        flex-shrink: 0;
      }
      .modal-close:hover {
        background: #dcfce7;
      }
    `,
  ],
})
export class DocenteDashboardComponent implements OnInit {
  tab = 'clase';
  filtro = 'todos';
  loading = true;

  docenteName = '';
  institucion = '';
  gradoGrupo = '';
  // CA-05 (Notificaciones in-app): controla si el badge de la campana se muestra.
  notificacionesInAppActivas = true;
  guardandoNotifInApp = false;

  estudiantes: Estudiante[] = [];
  alertas: Alerta[] = [];

  // Modal de evolución (gráficas)
  alumnoEnEvolucion: Estudiante | null = null;

  // Modal de niveles bloqueados (CA: el niño solo juega el nivel que le fijó
  // el docente/padre; ver NivelAsignadoService)
  alumnoEnNiveles: Estudiante | null = null;
  juegosParaNiveles: JuegoResumen[] = [];
  nivelesAsignados: Record<number, NivelBloqueable> = {};
  loadingNiveles = false;
  savingNivelJuegoId: number | null = null;
  readonly NIVELES_BLOQUEABLES: NivelBloqueable[] = ['FACIL', 'MEDIO', 'DIFICIL'];

  logrosClase: LogroClase[] = [];

  // Logros por alumno
  alumnoLogrosSeleccionado: Estudiante | null = null;
  logrosAlumno: MisionReclamada[] = [];
  loadingLogros = false;

  // Asignaciones
  asignaciones: Asignacion[] = [];
  loadingAsig = false;
  showFormAsig = false;
  savingAsig = false;
  docenteUid = 0;
  formJuegoId: number | null = null;
  /** Alumno al que se le deja la asignación — obligatorio: ya no se
   *  permiten asignaciones generales para toda la clase. */
  formPerfilId: number | null = null;
  formAsig: Asignacion = {
    titulo: '',
    descripcion: '',
    minimoSesiones: 1,
    fechaLimite: '',
    juego: null,
  };

  readonly JUEGOS_LISTA = [
    { id: 1, nombre: 'Espejo Mental' },
    { id: 2, nombre: 'Historia Viva' },
    { id: 3, nombre: 'Palabras Ocultas' },
    { id: 4, nombre: 'Piezas en Tiempo' },
    { id: 5, nombre: 'Foco Extremo' },
    { id: 6, nombre: 'Cascada Numérica' },
  ];

  // Julio 2026 — empieza miércoles (relleno con 0s al inicio)
  readonly diasMes = [
    0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31,
  ];

  readonly eventos: EventoCal[] = [
    { dia: 22, titulo: 'Asig. Atención', tipo: 'asig', hora: '8:00' },
    { dia: 25, titulo: 'Reporte semanal', tipo: 'reporte', hora: '12:00' },
    { dia: 27, titulo: 'Reunión padres', tipo: 'reunion', hora: '16:00' },
    { dia: 30, titulo: 'Asig. Lectura', tipo: 'asig', hora: '8:00' },
  ];

  constructor(
    public  auth:      AuthService,
    private router:    Router,
    private cdr:       ChangeDetectorRef,
    private docSvc:    DocenteService,
    private misionSvc: MisionService,
    private nivelSvc:  NivelAsignadoService,
  ) {}

  irAProgreso(): void {
    this.router.navigate(['/docente/progreso']);
  }

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.docenteName = user.nombre || user.email || 'Docente';
    this.docenteUid = user.usuarioId;
    this.loadAlumnos(user.usuarioId);
    this.loadAsignaciones(user.usuarioId);

    this.docSvc
      .getConfiguracionDocente(user.usuarioId)
      .pipe(catchError(() => of(null)))
      .subscribe((cfg) => {
        if (cfg) {
          this.notificacionesInAppActivas = cfg.notificacionesInAppActivas;
          this.cdr.detectChanges();
        }
      });
  }

  // CA-05 (Notificaciones in-app): las alertas se siguen registrando en BD,
  // esto solo controla si el badge de la campana se muestra.
  cambiarNotificacionesInApp(): void {
    const uid = this.auth.user()?.usuarioId;
    if (!uid) return;
    const nuevo = !this.notificacionesInAppActivas;
    this.guardandoNotifInApp = true;
    this.docSvc.toggleNotificacionesInApp(uid, nuevo).subscribe({
      next: () => {
        this.notificacionesInAppActivas = nuevo;
        this.guardandoNotifInApp = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoNotifInApp = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadAlumnos(uid: number): void {
    this.loading = true;
    this.docSvc
      .getAlumnos(uid)
      .pipe(catchError(() => of([])))
      .subscribe((alumnos) => {
        if (alumnos.length === 0) {
          this.estudiantes = [];
          this.alertas = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Para cada alumno cargamos sesiones + métricas en paralelo
        const requests = alumnos.map((a) =>
          forkJoin({
            sesiones: this.docSvc.getSesiones(a.id).pipe(catchError(() => of([]))),
            metricas: this.docSvc.getMetricas(a.id).pipe(catchError(() => of([]))),
            alertas: this.docSvc.getAlertas(a.id).pipe(catchError(() => of([]))),
          }),
        );

        forkJoin(requests).subscribe((resultados) => {
          this.estudiantes = alumnos.map((a, i) => {
            const { sesiones, metricas } = resultados[i];
            const precs = (metricas as Metrica[])
              .filter((m) => m.precisionPct != null)
              .map((m) => m.precisionPct!);
            const precision = precs.length
              ? Math.round(precs.reduce((s, v) => s + v, 0) / precs.length)
              : 0;
            const xp = (sesiones as SesionJuego[]).reduce((s, x) => s + (x.puntaje ?? 0), 0);
            const partidas = sesiones.length;
            const estado: Estudiante['estado'] =
              precision >= 80 ? 'Excelente' : precision >= 65 ? 'Muy bien' : 'Necesita ayuda';
            const avatar = AVATAR_MAP[a.avatar ?? ''] ?? '👤';
            return {
              id: a.id,
              nombre: a.nombre,
              avatar,
              edad: a.edad ?? 0,
              partidas,
              precision,
              xp,
              estado,
              activo: a.activo,
              sesiones,
            };
          });

          // Alertas: alumnos con estado "Necesita ayuda" o sin sesiones recientes
          this.alertas = [];
          alumnos.forEach((a, i) => {
            const { alertas: al, sesiones } = resultados[i];
            const alu = this.estudiantes[i];
            if (al.length > 0) {
              this.alertas.push({
                nombre: a.nombre,
                avatar: alu.avatar,
                mensaje: al[0].descripcion,
                tipo: 'warn',
                hace: this.hace(al[0].fecha),
              });
            } else if (sesiones.length === 0) {
              this.alertas.push({
                nombre: a.nombre,
                avatar: alu.avatar,
                mensaje: 'Sin sesiones registradas aún',
                tipo: 'danger',
                hace: '—',
              });
            }
          });

          this.logrosClase = this.derivarLogros();
          this.loading = false;
          this.cdr.detectChanges();
        });
      });
  }

  private loadAsignaciones(uid: number): void {
    this.loadingAsig = true;
    this.docSvc
      .getAsignacionesDocente(uid)
      .pipe(catchError(() => of([])))
      .subscribe((list) => {
        this.asignaciones = list;
        this.loadingAsig = false;
        this.cdr.detectChanges();
      });
  }

  /** Convierte DD/MM/AAAA → YYYY-MM-DD para el backend (ISO 8601). */
  private parseFechaISO(s: string): string {
    if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  crearAsig(): void {
    if (!this.formPerfilId || !this.formAsig.titulo || !this.formAsig.fechaLimite) return;
    this.savingAsig = true;
    const asigPayload = {
      ...this.formAsig,
      perfilId: this.formPerfilId,
      fechaLimite: this.parseFechaISO(this.formAsig.fechaLimite),
    };
    this.docSvc.crearAsignacion(this.docenteUid, asigPayload).subscribe({
      next: () => {
        this.cancelarAsig();
        this.loadAsignaciones(this.docenteUid);
      },
      error: () => {
        this.savingAsig = false;
        this.cdr.detectChanges();
      },
    });
  }

  eliminarAsig(id: number): void {
    if (!confirm('¿Eliminar esta asignación? Se borrará el progreso de todos los alumnos.')) return;
    this.docSvc.eliminarAsignacion(id).subscribe(() => this.loadAsignaciones(this.docenteUid));
  }

  cancelarAsig(): void {
    this.showFormAsig = false;
    this.savingAsig = false;
    this.formJuegoId = null;
    this.formPerfilId = null;
    this.formAsig = {
      titulo: '',
      descripcion: '',
      minimoSesiones: 1,
      fechaLimite: '',
      juego: null,
    };
    this.cdr.detectChanges();
  }

  setJuego(id: number | null): void {
    if (!id) {
      this.formAsig.juego = null;
      return;
    }
    const j = this.JUEGOS_LISTA.find((x) => x.id === id);
    this.formAsig.juego = j ? { id: j.id, nombre: j.nombre } : null;
  }

  juegoIco(nombre?: string): string {
    if (!nombre) return '📋';
    return JUEGO_ICO[nombre] ?? '📋';
  }

  juegoColor(nombre?: string): string {
    const colors: Record<string, string> = {
      'Espejo Mental': '#EDE9FE',
      'Historia Viva': '#FEF9C3',
      'Palabras Ocultas': '#DCFCE7',
      'Piezas en Tiempo': '#FEE2E2',
      'Foco Extremo': '#DBEAFE',
      'Cascada Numérica': '#FCE7F3',
    };
    return nombre ? (colors[nombre] ?? '#F0FDF4') : '#F0FDF4';
  }

  private derivarLogros(): LogroClase[] {
    const logros: LogroClase[] = [];
    const activos = this.estudiantes.filter((e) => e.activo && e.partidas > 0);
    if (!activos.length) return logros;

    // Líder de XP
    const topXp = [...activos].sort((a, b) => b.xp - a.xp)[0];
    logros.push({
      icono: '🏆',
      nombre: 'Líder de XP',
      desc: `${topXp.xp} puntos acumulados`,
      alumno: topXp.nombre,
      avatarAlu: topXp.avatar,
      fecha: 'Esta semana',
    });

    // Mayor precisión
    const topPrec = [...activos].sort((a, b) => b.precision - a.precision)[0];
    if (topPrec.precision > 0) {
      logros.push({
        icono: '🎯',
        nombre: 'Mayor precisión',
        desc: `${topPrec.precision}% de precisión`,
        alumno: topPrec.nombre,
        avatarAlu: topPrec.avatar,
        fecha: 'Esta semana',
      });
    }

    // Más partidas
    const topPartidas = [...activos].sort((a, b) => b.partidas - a.partidas)[0];
    if (topPartidas.partidas > 0) {
      logros.push({
        icono: '⚡',
        nombre: 'Más partidas',
        desc: `${topPartidas.partidas} sesiones jugadas`,
        alumno: topPartidas.nombre,
        avatarAlu: topPartidas.avatar,
        fecha: 'Esta semana',
      });
    }

    return logros;
  }

  private hace(fecha: string): string {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Hace 1 día';
    return `Hace ${diff} días`;
  }

  // ── Getters ──
  get activos() {
    return this.estudiantes.filter((e) => e.activo).length;
  }
  get avgPrec() {
    const a = this.estudiantes.filter((e) => e.activo);
    return a.length ? Math.round(a.reduce((s, e) => s + e.precision, 0) / a.length) : 0;
  }
  get totalPartidas() {
    return this.estudiantes.filter((e) => e.activo).reduce((s, e) => s + e.partidas, 0);
  }
  get xpClase() {
    return this.estudiantes.reduce((s, e) => s + e.xp, 0);
  }
  get top3() {
    return [...this.estudiantes]
      .filter((e) => e.activo)
      .sort((a, b) => b.precision - a.precision)
      .slice(0, 3);
  }
  get estudiantesOrdenados() {
    return [...this.estudiantes].sort((a, b) => b.precision - a.precision);
  }
  get inicial() {
    return this.docenteName.charAt(0).toUpperCase() || 'D';
  }

  get estudiantesFiltrados() {
    if (this.filtro === 'atencion')
      return this.estudiantes.filter((e) => e.estado === 'Necesita ayuda');
    if (this.filtro === 'top') return this.top3;
    return this.estudiantes;
  }

  get topTitle(): string {
    const m: Record<string, string> = {
      clase: 'Mi clase — ' + this.gradoGrupo,
      reportes: 'Reportes de la clase',
      asignaciones: 'Asignaciones',
      logros: 'Logros',
      calendario: 'Calendario',
      config: 'Configuración',
    };
    return m[this.tab] ?? 'FocusKids';
  }
  get topSub(): string {
    const m: Record<string, string> = {
      clase: `${this.activos} estudiantes activos · Semana del 20-26 jul 2026`,
      reportes: 'Rendimiento general de la clase',
      asignaciones: 'Tareas asignadas',
      logros: 'Reconocimientos de la clase',
      calendario: 'Julio 2026',
      config: 'Perfil docente',
    };
    return m[this.tab] ?? '';
  }

  badgeClass(estado: string): string {
    if (estado === 'Excelente') return 'badge badge-ex';
    if (estado === 'Muy bien') return 'badge badge-mb';
    return 'badge badge-na';
  }

  cuentaEstado(estado: string): number {
    return this.estudiantes.filter((e) => e.estado === estado).length;
  }

  eventosDelDia(dia: number): EventoCal[] {
    return this.eventos.filter((e) => e.dia === dia);
  }

  // ── Logros por alumno ──
  verLogrosAlumno(e: Estudiante): void {
    if (this.alumnoLogrosSeleccionado?.id === e.id) return;
    this.alumnoLogrosSeleccionado = e;
    this.logrosAlumno = [];
    this.loadingLogros = true;
    this.cdr.detectChanges();
    this.misionSvc.getHistorial(e.id).pipe(catchError(() => of([]))).subscribe(logros => {
      this.logrosAlumno = logros;
      this.loadingLogros = false;
      this.cdr.detectChanges();
    });
  }

  misionIco(idx: number)       { return MISIONES_DEF[idx]?.icono    ?? '🎯'; }
  misionTitulo(idx: number)    { return MISIONES_DEF[idx]?.titulo   ?? 'Misión completada'; }
  misionCategoria(idx: number) { return MISIONES_DEF[idx]?.categoria ?? ''; }

  // ── Evolución (modal) ──
  verEvolucion(e: Estudiante): void {
    this.alumnoEnEvolucion = e;
  }

  cerrarEvolucion(): void {
    this.alumnoEnEvolucion = null;
  }

  verHistorialDetallado(e: Estudiante): void {
    this.router.navigate(['/docente/historial', e.id], { queryParams: { nombre: e.nombre } });
  }

  // ── Niveles bloqueados por juego (modal) ──
  verNiveles(e: Estudiante): void {
    this.alumnoEnNiveles = e;
    this.loadingNiveles = true;
    this.nivelesAsignados = {};
    forkJoin({
      juegos: this.nivelSvc.listarJuegos().pipe(catchError(() => of([]))),
      asignados: this.nivelSvc.listarPorPerfil(e.id).pipe(catchError(() => of([]))),
    }).subscribe(({ juegos, asignados }) => {
      this.juegosParaNiveles = juegos;
      asignados.forEach(a => { this.nivelesAsignados[a.juego.id] = a.nivel; });
      this.loadingNiveles = false;
      this.cdr.detectChanges();
    });
  }

  cerrarNiveles(): void {
    this.alumnoEnNiveles = null;
  }

  cambiarNivel(juegoId: number, nivel: NivelBloqueable | ''): void {
    if (!this.alumnoEnNiveles) return;
    const perfilId = this.alumnoEnNiveles.id;
    this.savingNivelJuegoId = juegoId;

    const alTerminar = () => {
      if (nivel) {
        this.nivelesAsignados[juegoId] = nivel;
      } else {
        delete this.nivelesAsignados[juegoId];
      }
      this.savingNivelJuegoId = null;
      this.cdr.detectChanges();
    };

    if (nivel) {
      this.nivelSvc.asignar(perfilId, juegoId, nivel).pipe(catchError(() => of(null))).subscribe(alTerminar);
    } else {
      this.nivelSvc.quitar(perfilId, juegoId).pipe(catchError(() => of(null))).subscribe(alTerminar);
    }
  }
}
