import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ChildProfileService } from '../perfiles/child-profile.service';
import { ChildProfile, ChildProfileRequest, AVATAR_EMOJIS } from '../perfiles/child-profile.model';
import { PadreService, SesionJuego, Metrica, AlertaRegresion, Notificacion } from '../padre.service';

const AVATAR_MAP: Record<string, string> = {
  fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
  unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
  bear:'🐻', mouse:'🐭'
};

const JUEGO_ICO: Record<string, string> = {
  'Espejo Mental':'🪞', 'Historia Viva':'📖', 'Palabras Ocultas':'📝',
  'Piezas en Tiempo':'🧩', 'Foco Extremo':'🎯', 'Cascada Numérica':'🔢',
  'Laberinto Cognitivo':'🌀', 'Maratón Mental':'🏃', 'Ritmo y Patrón':'🎵',
  'Reacción Controlada':'⚡', 'Mapa Aventura':'🗺️', 'Lab de Ciencias':'🔬',
};
const JUEGO_COLOR: Record<string, string> = {
  'Espejo Mental':'#7C3AED', 'Historia Viva':'#D97706', 'Palabras Ocultas':'#EA580C',
  'Piezas en Tiempo':'#0891B2', 'Foco Extremo':'#4F46E5', 'Cascada Numérica':'#059669',
  'Laberinto Cognitivo':'#7C3AED', 'Maratón Mental':'#059669', 'Ritmo y Patrón':'#9333EA',
  'Reacción Controlada':'#2563EB', 'Mapa Aventura':'#65A30D', 'Lab de Ciencias':'#DB2777',
};

interface JuegoRendimiento { nombre: string; icono: string; pct: number; color: string; sesiones: number; }
interface UltimaActividad  { hora: string; juego: string; icono: string; puntaje: number; completada: boolean; }
interface DiaActividad     { dia: string; valor: number; }

@Component({
  selector: 'app-padre-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      <button class="nav-item" [class.active]="tab==='actividad'" (click)="tab='actividad'"> <span>📅</span>Actividad</button>
      <p class="nav-section">GESTIÓN</p>
      <button class="nav-item" [class.active]="tab==='hijos'"  (click)="tab='hijos'">  <span>👨‍👧‍👦</span>Mis hijos</button>
      <button class="nav-item" [class.active]="tab==='notif'"  (click)="setNotif()">
        <span>🔔</span>Notificaciones
        @if (notifNoLeidas > 0) { <span class="notif-dot">{{ notifNoLeidas }}</span> }
      </button>
      <button class="nav-item" [class.active]="tab==='config'" (click)="tab='config'"> <span>⚙️</span>Configuración</button>
    </nav>
    <div class="sidebar-user">
      <div class="su-avatar">{{ parentInitial }}</div>
      <div class="su-info">
        <div class="su-name">{{ parentName }}</div>
        <div class="su-role">Padre / Tutor</div>
      </div>
    </div>
  </aside>

  <!-- ══ MAIN ══ -->
  <div class="main">
    <header class="topbar">
      <h1 class="topbar-title">{{ topbarTitle }}</h1>
      <div class="topbar-right">
        @if ((tab === 'inicio' || tab === 'progreso' || tab === 'actividad') && selectedPerfil) {
          <div class="child-chip" (click)="showMenu=!showMenu">
            {{ avatarFn(selectedPerfil.avatar) }} {{ selectedPerfil.nombre }}, {{ selectedPerfil.edad }} años
            @if (perfiles.length > 1) { <span>▾</span> }
            @if (showMenu && perfiles.length > 1) {
              <div class="child-menu">
                @for (p of perfiles; track p.id) {
                  <button (click)="selectPerfil(p);$event.stopPropagation()">{{ avatarFn(p.avatar) }} {{ p.nombre }}</button>
                }
              </div>
            }
          </div>
        }
        @if (tab === 'hijos') {
          <button class="btn-new-perfil" (click)="openCreate()">+ Nuevo perfil</button>
        }
        <button class="icon-btn" title="Notificaciones" (click)="setNotif()">🔔</button>
        <button class="icon-btn" title="Cerrar sesión" (click)="auth.logout()">⎋</button>
      </div>
    </header>

    <div class="content">

      @if (loading) {
        <div class="loader"><div class="spinner"></div></div>
      }

      <!-- ── INICIO ── -->
      @if (!loading && tab === 'inicio') {
        @if (perfiles.length === 0) {
          <div class="empty">
            <div style="font-size:64px">👨‍👧</div>
            <h2>Aún no has agregado ningún hijo</h2>
            <p>Crea el primer perfil para ver su progreso aquí</p>
            <button class="btn-primary" (click)="tab='hijos'">+ Crear perfil</button>
          </div>
        }
        @if (selectedPerfil) {
          @if (loadingDatos) {
            <div class="loader"><div class="spinner"></div></div>
          } @else {
            <!-- Profile card -->
            <div class="profile-card">
              <div class="pc-avatar">{{ avatarFn(selectedPerfil.avatar) }}</div>
              <div class="pc-info">
                <div class="pc-name">{{ selectedPerfil.nombre }}</div>
                <div class="pc-meta">{{ selectedPerfil.edad }} años{{ selectedPerfil.diagnostico ? ' · ' + selectedPerfil.diagnostico : '' }}</div>
                <div class="pc-xp-lbl">XP: {{ xpActual }} / {{ xpMax }} (Nivel {{ nivel }})</div>
                <div class="pc-xp-track"><div class="pc-xp-fill" [style.width.%]="xpPct"></div></div>
              </div>
              <div class="pc-chips">
                <div class="pc-chip"><div class="pc-chip-val">{{ racha }}</div><div class="pc-chip-lbl">Racha días</div></div>
                <div class="pc-chip"><div class="pc-chip-val">{{ logros }}</div><div class="pc-chip-lbl">Logros</div></div>
                <div class="pc-chip"><div class="pc-chip-val">{{ precisionMedia }}%</div><div class="pc-chip-lbl">Precisión</div></div>
              </div>
            </div>

            <!-- Stats row -->
            <div class="stats-row">
              <div class="stat-card"><div class="stat-ico">🎮</div><div class="stat-num">{{ partidas }}</div><div class="stat-lbl">Partidas esta semana</div></div>
              <div class="stat-card"><div class="stat-ico">⏱️</div><div class="stat-num">{{ tiempoJuego }}</div><div class="stat-lbl">Tiempo de juego</div></div>
              <div class="stat-card"><div class="stat-ico">✅</div><div class="stat-num">{{ sesionesCompletadas }}</div><div class="stat-lbl">Sesiones completadas</div></div>
              <div class="stat-card"><div class="stat-ico">⭐</div><div class="stat-num">{{ puntosTotales | number }}</div><div class="stat-lbl">Puntos totales</div></div>
            </div>

            @if (sesiones.length === 0) {
              <div class="no-data-card">
                <span style="font-size:40px">🎮</span>
                <p><strong>{{ selectedPerfil.nombre }}</strong> aún no ha jugado ninguna sesión.</p>
                <button class="btn-primary" style="margin-top:4px" (click)="jugarDesdeInicio(selectedPerfil)">▶ ¡Empezar a jugar!</button>
              </div>
            } @else {
              <div class="bottom-row">
                <!-- Gráfica actividad -->
                <div class="chart-card">
                  <h3 class="card-title">Actividad de la semana</h3>
                  <div class="chart-body">
                    <div class="chart-bars">
                      @for (d of actividadSemana; track d.dia) {
                        <div class="bar-col">
                          <div class="bar-outer"><div class="bar-inner" [style.height.%]="maxAct > 0 ? (d.valor/maxAct)*100 : 0"></div></div>
                          <div class="bar-label">{{ d.dia }}</div>
                          <div class="bar-num">{{ d.valor }}</div>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <div class="right-col">
                  <!-- Juegos por rendimiento -->
                  <div class="panel-card">
                    <h3 class="card-title">Juegos jugados</h3>
                    @for (j of juegosPorRendimiento; track j.nombre) {
                      <div class="jr-row">
                        <div class="jr-ico" [style.background]="j.color+'1a'">{{ j.icono }}</div>
                        <div class="jr-data">
                          <div class="jr-name">{{ j.nombre }} <span class="jr-sesiones">{{ j.sesiones }} ses.</span></div>
                          <div class="jr-track"><div class="jr-fill" [style.width.%]="j.pct" [style.background]="j.color"></div></div>
                        </div>
                        <div class="jr-pct" [style.color]="j.color">{{ j.pct }}%</div>
                      </div>
                    }
                  </div>

                  <!-- Alerta -->
                  @if (alertaActual) {
                    <div class="alert-card">
                      <div class="alert-title">⚠️ Alerta de regresión</div>
                      <div class="alert-body">{{ alertaActual }}</div>
                    </div>
                  }

                  <!-- Última actividad -->
                  <div class="panel-card">
                    <h3 class="card-title">Última actividad</h3>
                    @for (a of ultimaActividad; track a.hora) {
                      <div class="ua-row">
                        <span class="ua-ico">{{ a.icono }}</span>
                        <div class="ua-info">
                          <span class="ua-juego">{{ a.juego }}</span>
                          <span class="ua-hora">{{ a.hora }}</span>
                        </div>
                        <span class="ua-pts" [class.ua-ok]="a.completada">{{ a.completada ? '✓' : '✗' }} {{ a.puntaje }} pts</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          }
        }
      }

      <!-- ── MI PROGRESO ── -->
      @if (!loading && tab === 'progreso') {
        @if (selectedPerfil) {
          @if (loadingDatos) {
            <div class="loader"><div class="spinner"></div></div>
          } @else if (sesiones.length === 0) {
            <div class="no-data-card">
              <span style="font-size:40px">📊</span>
              <p>No hay datos de progreso aún para <strong>{{ selectedPerfil.nombre }}</strong>.</p>
            </div>
          } @else {
            <div class="progreso-grid">

              <!-- Stats resumen -->
              <div class="prog-stat-row">
                <div class="prog-stat-card">
                  <div class="psc-ico">🎮</div>
                  <div class="psc-val">{{ sesiones.length }}</div>
                  <div class="psc-lbl">Total sesiones</div>
                </div>
                <div class="prog-stat-card">
                  <div class="psc-ico">🎯</div>
                  <div class="psc-val">{{ precisionMedia }}%</div>
                  <div class="psc-lbl">Precisión media</div>
                </div>
                <div class="prog-stat-card">
                  <div class="psc-ico">✅</div>
                  <div class="psc-val">{{ sesionesCompletadas }}</div>
                  <div class="psc-lbl">Completadas</div>
                </div>
                <div class="prog-stat-card">
                  <div class="psc-ico">⭐</div>
                  <div class="psc-val">{{ puntosTotales | number }}</div>
                  <div class="psc-lbl">Puntos acumulados</div>
                </div>
              </div>

              <!-- Rendimiento por juego -->
              <div class="prog-card">
                <h3 class="prog-card-title">Rendimiento por juego</h3>
                @for (j of juegosPorRendimiento; track j.nombre) {
                  <div class="prog-jr-row">
                    <div class="prog-jr-ico" [style.background]="j.color+'15'">{{ j.icono }}</div>
                    <div class="prog-jr-data">
                      <div class="prog-jr-header">
                        <span class="prog-jr-name">{{ j.nombre }}</span>
                        <span class="prog-jr-badge" [style.background]="j.color+'20'" [style.color]="j.color">{{ j.sesiones }} sesiones</span>
                      </div>
                      <div class="prog-jr-track">
                        <div class="prog-jr-fill" [style.width.%]="j.pct" [style.background]="j.color"></div>
                      </div>
                      <div class="prog-jr-pct" [style.color]="j.color">{{ j.pct }}% completado</div>
                    </div>
                  </div>
                }
              </div>

              <!-- Alertas -->
              @if (alertas.length > 0) {
                <div class="prog-card alertas-card">
                  <h3 class="prog-card-title">⚠️ Alertas de regresión</h3>
                  @for (a of alertas; track a.id) {
                    <div class="alerta-row" [class.alerta-vista]="a.vista">
                      <div class="alerta-dot" [class.alerta-dot-nueva]="!a.vista"></div>
                      <div class="alerta-body">
                        <div class="alerta-desc">{{ a.descripcion }}</div>
                        <div class="alerta-fecha">{{ formatFecha(a.fecha) }}</div>
                      </div>
                    </div>
                  }
                </div>
              }

            </div>
          }
        } @else {
          <div class="empty"><p>Selecciona un hijo para ver su progreso.</p></div>
        }
      }

      <!-- ── ACTIVIDAD ── -->
      @if (!loading && tab === 'actividad') {
        @if (selectedPerfil) {
          @if (loadingDatos) {
            <div class="loader"><div class="spinner"></div></div>
          } @else if (sesiones.length === 0) {
            <div class="no-data-card">
              <span style="font-size:40px">📅</span>
              <p><strong>{{ selectedPerfil.nombre }}</strong> aún no tiene sesiones registradas.</p>
            </div>
          } @else {
            <div class="actividad-wrap">
              <div class="act-header">
                <h2 class="act-title">Historial de sesiones</h2>
                <div class="act-count">{{ sesiones.length }} sesiones en total</div>
              </div>
              <div class="sesiones-list">
                @for (s of sesionesOrdenadas; track s.id) {
                  <div class="sesion-row" [class.sesion-ok]="s.completada" [class.sesion-inc]="!s.completada">
                    <div class="sr-ico">{{ juegoIco(s.juego.nombre) }}</div>
                    <div class="sr-info">
                      <div class="sr-juego">{{ s.juego.nombre }}</div>
                      <div class="sr-nivel">Nivel: {{ s.nivel?.nivel ?? '—' }}</div>
                    </div>
                    <div class="sr-fecha">{{ formatFechaCorta(s.inicio) }}</div>
                    <div class="sr-pts">⭐ {{ s.puntaje ?? 0 }} pts</div>
                    <div class="sr-estado" [class.ok]="s.completada" [class.inc]="!s.completada">
                      {{ s.completada ? '✓ Completada' : '✗ Incompleta' }}
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        } @else {
          <div class="empty"><p>Selecciona un hijo para ver su actividad.</p></div>
        }
      }

      <!-- ── MIS HIJOS ── -->
      @if (!loading && tab === 'hijos') {
        @if (errorMsg) {
          <div class="alert-error">{{ errorMsg }} <button (click)="errorMsg=''">×</button></div>
        }
        <div class="hijos-grid">
          @for (p of perfiles; track p.id) {
            <div class="hijo-card" [class.inactivo]="!p.activo">
              @if (!p.activo) { <span class="badge-inactivo">Desactivado</span> }
              <div class="hijo-avatar">{{ avatarFn(p.avatar) }}</div>
              <div class="hijo-nombre">{{ p.nombre }}</div>
              <div class="hijo-edad">{{ p.edad }} años</div>
              @if (p.diagnostico) { <div class="hijo-diag">{{ p.diagnostico }}</div> }
              <div class="hijo-actions">
                <button class="hbtn hbtn-jugar" (click)="jugar(p)" [disabled]="!p.activo">▶ Jugar</button>
                <button class="hbtn hbtn-edit" (click)="openEdit(p)">✏️</button>
                <button class="hbtn hbtn-tog"  (click)="toggleActivo(p)">{{ p.activo ? '⏸' : '▶' }}</button>
                <button class="hbtn hbtn-del"  (click)="pedirEliminar(p)">🗑</button>
              </div>
            </div>
          }
          <div class="hijo-card hijo-add" (click)="openCreate()">
            <div class="hijo-avatar add-ico">＋</div>
            <div class="hijo-nombre">Nuevo perfil</div>
            <div class="hijo-edad">Agregar hijo</div>
          </div>
        </div>
      }

      <!-- ── NOTIFICACIONES ── -->
      @if (!loading && tab === 'notif') {
        <div class="notif-wrap">
          <div class="notif-header">
            <h2 class="notif-title">Notificaciones</h2>
            @if (notifNoLeidas > 0) {
              <button class="btn-marcar-todas" (click)="marcarTodasLeidas()">✓ Marcar todas como leídas</button>
            }
          </div>
          @if (notificaciones.length === 0) {
            <div class="no-data-card">
              <span style="font-size:40px">🔔</span>
              <p>No tienes notificaciones por el momento.</p>
            </div>
          } @else {
            <div class="notif-list">
              @for (n of notificaciones; track n.id) {
                <div class="notif-item" [class.notif-leida]="n.leida" (click)="marcarLeida(n)">
                  <div class="notif-ico">{{ tipoIco(n.tipo) }}</div>
                  <div class="notif-body">
                    <div class="notif-tipo">{{ n.tipo }}</div>
                    <div class="notif-msg">{{ n.mensaje }}</div>
                    <div class="notif-fecha">{{ formatFecha(n.fecha) }}</div>
                  </div>
                  @if (!n.leida) { <div class="notif-new-dot"></div> }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ── CONFIGURACIÓN ── -->
      @if (!loading && tab === 'config') {
        <div class="config-wrap">
          <div class="config-card">
            <h3 class="config-title">👤 Mi cuenta</h3>
            <div class="config-field"><label>Nombre</label><div class="config-val">{{ parentName }}</div></div>
            <div class="config-field"><label>Rol</label><div class="config-val">Padre / Tutor</div></div>
            <p class="config-note">Para cambiar contraseña o correo, contacta al administrador.</p>
          </div>
          <div class="config-card">
            <h3 class="config-title">👨‍👧‍👦 Hijos registrados</h3>
            <div class="config-hijos">
              @for (p of perfiles; track p.id) {
                <div class="config-hijo">
                  <span>{{ avatarFn(p.avatar) }}</span>
                  <span class="ch-nombre">{{ p.nombre }}</span>
                  <span class="ch-edad">{{ p.edad }} años</span>
                  <span class="ch-est" [class.est-ok]="p.activo" [class.est-no]="!p.activo">{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  </div>

  <!-- ══ MODAL PERFIL ══ -->
  @if (showModal) {
    <div class="overlay" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ isEditing ? 'Editar perfil' : 'Nuevo perfil' }}</h2>
        @if (formError) { <div class="form-error">{{ formError }}</div> }
        <div class="form-group">
          <label>Nombre del niño *</label>
          <input class="form-input" type="text" [(ngModel)]="form.nombre" placeholder="Ej: Mateo" maxlength="100"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Edad</label>
            <input class="form-input" type="number" [(ngModel)]="form.edad" placeholder="Ej: 7" min="1" max="18"/>
          </div>
          <div class="form-group">
            <label>Condición (opcional)</label>
            <input class="form-input" type="text" [(ngModel)]="form.diagnostico" placeholder="Ej: TDAH leve"/>
          </div>
        </div>
        <div class="form-group">
          <label>Avatar</label>
          <div class="avatar-grid">
            @for (av of avatars; track av) {
              <button type="button" class="av-opt" [class.av-sel]="form.avatar === av" (click)="form.avatar = av">{{ avatarFn(av) }}</button>
            }
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeModal()">Cancelar</button>
          <button class="btn-save"   (click)="guardar()">{{ isEditing ? 'Guardar cambios' : 'Crear perfil' }}</button>
        </div>
      </div>
    </div>
  }

  <!-- ══ MODAL ELIMINAR ══ -->
  @if (showDeleteModal) {
    <div class="overlay">
      <div class="modal modal-sm">
        <div style="font-size:48px;text-align:center;margin-bottom:12px">⚠️</div>
        <h2 class="modal-title">Eliminar perfil</h2>
        <p class="delete-msg">Se eliminarán todos los datos de <strong>{{ perfilAEliminar?.nombre }}</strong>. Esta acción no se puede deshacer.</p>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="cancelarEliminar()">Cancelar</button>
          <button class="btn-danger" (click)="confirmarEliminar()">Sí, eliminar</button>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .root { display:flex; height:100vh; overflow:hidden; font-family:'Inter',-apple-system,sans-serif; background:#EEE9FF; }

    /* ── Sidebar ── */
    .sidebar { width:170px; flex-shrink:0; background:#1E1A6E; display:flex; flex-direction:column; padding:22px 0 16px; overflow-y:auto; }
    .brand { display:flex; align-items:center; gap:8px; padding:0 16px 20px; border-bottom:1px solid rgba(255,255,255,.07); }
    .brand-ico { font-size:20px; }
    .brand-txt { font-size:15px; font-weight:800; color:white; }
    .nav { flex:1; padding:12px 10px; }
    .nav-section { font-size:9px; font-weight:700; letter-spacing:1.4px; color:rgba(255,255,255,.28); padding:14px 8px 6px; text-transform:uppercase; }
    .nav-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,.48); font-size:12.5px; font-weight:600; cursor:pointer; text-align:left; transition:all .15s; margin-bottom:2px; position:relative; }
    .nav-item span { font-size:15px; flex-shrink:0; }
    .nav-item:hover { background:rgba(255,255,255,.07); color:rgba(255,255,255,.85); }
    .nav-item.active { background:rgba(139,92,246,.35); color:white; }
    .notif-dot { background:#EF4444; color:white; font-size:10px; font-weight:800; border-radius:100px; padding:1px 6px; margin-left:auto; }
    .sidebar-user { margin-top:auto; padding:14px 12px 0; border-top:1px solid rgba(255,255,255,.07); display:flex; align-items:center; gap:9px; }
    .su-avatar { width:34px; height:34px; border-radius:50%; flex-shrink:0; background:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:white; }
    .su-name { font-size:11.5px; font-weight:700; color:white; }
    .su-role { font-size:10px; color:rgba(255,255,255,.38); }

    /* ── Main ── */
    .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .topbar { background:white; padding:14px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E4DEFF; flex-shrink:0; }
    .topbar-title { font-size:18px; font-weight:800; color:#1E1B4B; }
    .topbar-right  { display:flex; align-items:center; gap:10px; }
    .child-chip { display:flex; align-items:center; gap:6px; background:#F3F0FF; border:1.5px solid #C4B5FD; border-radius:20px; padding:6px 14px; font-size:12.5px; font-weight:700; color:#5B21B6; cursor:pointer; position:relative; white-space:nowrap; }
    .child-menu { position:absolute; top:calc(100% + 6px); right:0; background:white; border:1px solid #E4DEFF; border-radius:12px; padding:6px; min-width:150px; box-shadow:0 8px 24px rgba(0,0,0,.1); z-index:300; }
    .child-menu button { display:block; width:100%; padding:8px 12px; text-align:left; background:none; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; color:#334155; }
    .child-menu button:hover { background:#F3F0FF; }
    .btn-new-perfil { background:#5B21B6; color:white; border:none; border-radius:12px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; }
    .btn-new-perfil:hover { background:#4C1D95; }
    .icon-btn { background:#F3F0FF; border:1.5px solid #DDD6FE; border-radius:10px; width:36px; height:36px; font-size:16px; cursor:pointer; }
    .content { flex:1; overflow-y:auto; padding:20px 22px 32px; display:flex; flex-direction:column; gap:16px; }

    /* Loader / Empty */
    .loader { display:flex; justify-content:center; align-items:center; flex:1; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #DDD6FE; border-top-color:#7C3AED; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty { display:flex; flex-direction:column; align-items:center; gap:14px; padding:60px; text-align:center; }
    .empty h2 { font-size:20px; font-weight:800; color:#1E1B4B; }
    .empty p  { color:#64748B; }
    .btn-primary { background:#5B21B6; color:white; border:none; border-radius:12px; padding:12px 28px; font-size:14px; font-weight:700; cursor:pointer; }

    /* No data card */
    .no-data-card { background:white; border-radius:16px; padding:32px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .no-data-card p { color:#64748B; font-size:14px; }

    /* ── INICIO ── */
    .profile-card { background:white; border-radius:18px; padding:18px 20px; display:flex; align-items:center; gap:16px; box-shadow:0 2px 14px rgba(91,33,182,.07); }
    .pc-avatar { width:62px; height:62px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#818CF8,#4F46E5); display:flex; align-items:center; justify-content:center; font-size:34px; }
    .pc-info { flex:1; min-width:0; }
    .pc-name  { font-size:17px; font-weight:800; color:#1E1B4B; }
    .pc-meta  { font-size:12px; color:#64748B; margin:3px 0 8px; }
    .pc-xp-lbl { font-size:10.5px; color:#94A3B8; margin-bottom:5px; }
    .pc-xp-track { height:7px; background:#EEE9FF; border-radius:100px; overflow:hidden; max-width:240px; }
    .pc-xp-fill  { height:100%; background:linear-gradient(90deg,#6366F1,#C4B5FD); border-radius:100px; }
    .pc-chips { display:flex; gap:8px; flex-shrink:0; }
    .pc-chip  { background:#F5F3FF; border:1.5px solid #DDD6FE; border-radius:12px; padding:10px 14px; text-align:center; min-width:70px; }
    .pc-chip-val { font-size:20px; font-weight:900; color:#4F46E5; line-height:1; }
    .pc-chip-lbl { font-size:10px; color:#94A3B8; margin-top:3px; white-space:nowrap; }

    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .stat-card { background:white; border-radius:16px; padding:18px 16px; text-align:center; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .stat-ico { font-size:26px; margin-bottom:8px; }
    .stat-num { font-size:24px; font-weight:900; color:#1E1B4B; margin-bottom:4px; }
    .stat-lbl { font-size:10.5px; color:#94A3B8; }

    .bottom-row { display:flex; gap:14px; align-items:flex-start; }
    .chart-card { flex:1; background:white; border-radius:18px; padding:18px 20px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .card-title { font-size:13px; font-weight:800; color:#1E1B4B; margin-bottom:16px; }
    .chart-body { padding-top:4px; }
    .chart-bars { display:flex; align-items:flex-end; justify-content:space-between; height:160px; gap:6px; padding-bottom:36px; position:relative; }
    .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; }
    .bar-outer { flex:1; width:100%; background:#F3F0FF; border-radius:8px 8px 0 0; display:flex; align-items:flex-end; overflow:hidden; margin-bottom:4px; }
    .bar-inner { width:100%; background:linear-gradient(to top,#6366F1,#A5B4FC); border-radius:8px 8px 0 0; transition:height .8s ease; min-height:4px; }
    .bar-label { font-size:10px; color:#94A3B8; font-weight:600; position:absolute; bottom:16px; }
    .bar-num   { font-size:10px; color:#6366F1; font-weight:700; position:absolute; bottom:0; }

    .right-col { width:250px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }
    .panel-card { background:white; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .jr-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid #F3F0FF; }
    .jr-row:last-child { border-bottom:none; }
    .jr-ico { width:32px; height:32px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:17px; }
    .jr-data { flex:1; min-width:0; }
    .jr-name { font-size:11.5px; font-weight:700; color:#334155; margin-bottom:5px; display:flex; align-items:center; justify-content:space-between; }
    .jr-sesiones { font-size:10px; color:#94A3B8; font-weight:600; }
    .jr-track { height:5px; background:#F3F0FF; border-radius:100px; overflow:hidden; }
    .jr-fill  { height:100%; border-radius:100px; }
    .jr-pct   { font-size:12.5px; font-weight:800; flex-shrink:0; min-width:32px; text-align:right; }
    .alert-card { background:#FFFBEB; border:1.5px solid #FCD34D; border-radius:14px; padding:14px; }
    .alert-title { font-size:11.5px; font-weight:800; color:#92400E; margin-bottom:6px; }
    .alert-body  { font-size:11.5px; color:#78350F; line-height:1.55; }
    .ua-row  { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #F3F0FF; }
    .ua-row:last-child { border-bottom:none; }
    .ua-ico  { font-size:20px; flex-shrink:0; }
    .ua-info { flex:1; min-width:0; }
    .ua-juego{ font-size:12px; font-weight:700; color:#4F46E5; }
    .ua-hora { font-size:10px; color:#94A3B8; }
    .ua-pts  { font-size:11px; font-weight:700; color:#94A3B8; }
    .ua-ok   { color:#16A34A; }

    /* ── PROGRESO ── */
    .progreso-grid { display:flex; flex-direction:column; gap:16px; }
    .prog-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .prog-stat-card { background:white; border-radius:16px; padding:18px; text-align:center; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .psc-ico { font-size:26px; margin-bottom:8px; }
    .psc-val { font-size:26px; font-weight:900; color:#1E1B4B; }
    .psc-lbl { font-size:10.5px; color:#94A3B8; margin-top:4px; }
    .prog-card { background:white; border-radius:16px; padding:20px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .prog-card-title { font-size:14px; font-weight:800; color:#1E1B4B; margin-bottom:16px; }
    .prog-jr-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #F3F0FF; }
    .prog-jr-row:last-child { border-bottom:none; }
    .prog-jr-ico { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
    .prog-jr-data { flex:1; min-width:0; }
    .prog-jr-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .prog-jr-name  { font-size:13px; font-weight:700; color:#1E1B4B; }
    .prog-jr-badge { font-size:10px; font-weight:700; border-radius:20px; padding:2px 8px; }
    .prog-jr-track { height:6px; background:#F3F0FF; border-radius:100px; overflow:hidden; margin-bottom:4px; }
    .prog-jr-fill  { height:100%; border-radius:100px; transition:width .8s ease; }
    .prog-jr-pct   { font-size:11px; font-weight:700; }
    .alertas-card { background:#FFFBEB; }
    .alerta-row { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid rgba(253,211,77,.2); }
    .alerta-row:last-child { border-bottom:none; }
    .alerta-row.alerta-vista { opacity:.6; }
    .alerta-dot { width:10px; height:10px; border-radius:50%; background:#94A3B8; flex-shrink:0; margin-top:4px; }
    .alerta-dot-nueva { background:#EF4444; }
    .alerta-desc { font-size:12.5px; color:#78350F; line-height:1.5; }
    .alerta-fecha { font-size:10.5px; color:#92400E; margin-top:3px; opacity:.7; }

    /* ── ACTIVIDAD ── */
    .actividad-wrap { display:flex; flex-direction:column; gap:12px; }
    .act-header { display:flex; align-items:center; justify-content:space-between; }
    .act-title { font-size:16px; font-weight:800; color:#1E1B4B; }
    .act-count { font-size:12px; color:#94A3B8; font-weight:600; }
    .sesiones-list { display:flex; flex-direction:column; gap:8px; }
    .sesion-row { background:white; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 6px rgba(91,33,182,.05); border-left:4px solid #E4DEFF; transition:transform .15s; }
    .sesion-row:hover { transform:translateX(3px); }
    .sesion-ok  { border-left-color:#16A34A; }
    .sesion-inc { border-left-color:#94A3B8; }
    .sr-ico   { font-size:26px; flex-shrink:0; }
    .sr-info  { flex:1; min-width:0; }
    .sr-juego { font-size:13px; font-weight:700; color:#1E1B4B; }
    .sr-nivel { font-size:11px; color:#94A3B8; margin-top:2px; }
    .sr-fecha { font-size:11.5px; color:#64748B; flex-shrink:0; }
    .sr-pts   { font-size:12px; font-weight:700; color:#F59E0B; flex-shrink:0; }
    .sr-estado { font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; flex-shrink:0; }
    .sr-estado.ok  { background:#F0FDF4; color:#16A34A; }
    .sr-estado.inc { background:#F8FAFC; color:#94A3B8; }

    /* ── NOTIFICACIONES ── */
    .notif-wrap   { display:flex; flex-direction:column; gap:14px; }
    .notif-header { display:flex; align-items:center; justify-content:space-between; }
    .notif-title  { font-size:16px; font-weight:800; color:#1E1B4B; }
    .btn-marcar-todas { background:#EDE9FE; color:#5B21B6; border:none; border-radius:10px; padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer; }
    .notif-list { display:flex; flex-direction:column; gap:8px; }
    .notif-item { background:white; border-radius:14px; padding:14px 16px; display:flex; align-items:flex-start; gap:12px; box-shadow:0 1px 6px rgba(91,33,182,.05); cursor:pointer; border-left:4px solid #7C3AED; transition:opacity .2s; position:relative; }
    .notif-item:hover { opacity:.85; }
    .notif-leida  { border-left-color:#E2E8F0; opacity:.7; }
    .notif-ico    { font-size:24px; flex-shrink:0; }
    .notif-body   { flex:1; min-width:0; }
    .notif-tipo   { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.8px; color:#7C3AED; margin-bottom:3px; }
    .notif-leida .notif-tipo { color:#94A3B8; }
    .notif-msg    { font-size:13px; color:#334155; line-height:1.5; }
    .notif-fecha  { font-size:10.5px; color:#94A3B8; margin-top:4px; }
    .notif-new-dot { position:absolute; top:14px; right:14px; width:10px; height:10px; border-radius:50%; background:#7C3AED; }

    /* ── CONFIGURACIÓN ── */
    .config-wrap { display:flex; flex-direction:column; gap:16px; max-width:560px; }
    .config-card  { background:white; border-radius:16px; padding:20px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .config-title { font-size:14px; font-weight:800; color:#1E1B4B; margin-bottom:16px; }
    .config-field { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
    .config-field label { font-size:12px; font-weight:700; color:#64748B; }
    .config-val { background:#F3F0FF; border-radius:10px; padding:10px 14px; font-size:14px; font-weight:600; color:#1E1B4B; }
    .config-note { font-size:12px; color:#94A3B8; }
    .config-hijos { display:flex; flex-direction:column; gap:10px; }
    .config-hijo { display:flex; align-items:center; gap:10px; padding:10px; background:#F8F7FF; border-radius:12px; font-size:14px; }
    .ch-nombre { font-weight:700; color:#1E1B4B; flex:1; }
    .ch-edad   { font-size:12px; color:#64748B; }
    .ch-est    { font-size:10px; font-weight:800; padding:3px 10px; border-radius:20px; }
    .est-ok    { background:#F0FDF4; color:#16A34A; }
    .est-no    { background:#FEF2F2; color:#DC2626; }

    /* ── MIS HIJOS ── */
    .alert-error { background:#fde8e8; color:#c0524a; border-left:4px solid #c0524a; border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:13px; }
    .alert-error button { background:none; border:none; color:#c0524a; font-size:18px; cursor:pointer; }
    .hijos-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:20px; }
    .hijo-card { background:white; border-radius:20px; padding:24px 16px 18px; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 4px 18px rgba(91,33,182,.08); position:relative; transition:transform .2s, box-shadow .2s; border:2px solid transparent; }
    .hijo-card:not(.hijo-add):not(.inactivo):hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(91,33,182,.14); border-color:#C4B5FD; }
    .hijo-card.inactivo { opacity:.55; filter:grayscale(30%); }
    .hijo-card.hijo-add { border:2.5px dashed #C4B5FD; background:rgba(243,240,255,.5); cursor:pointer; }
    .hijo-card.hijo-add:hover { background:#F3F0FF; transform:translateY(-3px); }
    .badge-inactivo { position:absolute; top:12px; right:12px; background:#7C3AED; color:white; font-size:10px; font-weight:800; padding:3px 9px; border-radius:20px; text-transform:uppercase; }
    .hijo-avatar { width:80px; height:80px; background:linear-gradient(135deg,#A78BFA,#7C3AED); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:44px; margin-bottom:4px; }
    .hijo-add .hijo-avatar { background:#EDE9FF; color:#A78BFA; font-size:36px; }
    .hijo-nombre { font-size:17px; font-weight:800; color:#1E1B4B; text-align:center; }
    .hijo-edad   { font-size:12px; color:#64748B; font-weight:600; }
    .hijo-diag   { font-size:11px; color:#A78BFA; background:#F3F0FF; padding:3px 10px; border-radius:20px; font-weight:700; }
    .hijo-actions { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; justify-content:center; }
    .hbtn { border:none; border-radius:10px; padding:6px 12px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
    .hbtn:hover { transform:scale(1.05); }
    .hbtn-jugar { background:linear-gradient(135deg,#6366F1,#4F46E5); color:white; flex:1; }
    .hbtn-jugar:disabled { background:#E8E4F4; color:#94A3B8; cursor:not-allowed; }
    .hbtn-edit  { background:#EDE9FF; color:#5B21B6; width:34px; padding:6px; }
    .hbtn-tog   { background:#FEF9C3; color:#92400E; width:34px; padding:6px; }
    .hbtn-del   { background:#FEE2E2; color:#B91C1C; width:34px; padding:6px; }

    /* ── Modales ── */
    .overlay { position:fixed; inset:0; background:rgba(30,27,78,.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
    .modal { background:white; border-radius:24px; padding:36px 40px; width:100%; max-width:440px; box-shadow:0 20px 60px rgba(30,27,78,.2); }
    .modal-sm { max-width:360px; text-align:center; }
    .modal-title { font-size:22px; font-weight:900; color:#1E1B4B; margin-bottom:20px; text-align:center; }
    .form-error { background:#fde8e8; color:#c0524a; border-radius:10px; padding:10px 14px; font-size:13px; font-weight:700; margin-bottom:16px; }
    .form-group { margin-bottom:18px; }
    .form-group label { display:block; font-size:13px; font-weight:800; color:#1E1B4B; margin-bottom:7px; }
    .form-input { width:100%; padding:12px 16px; border:2px solid #E4DEFF; border-radius:12px; font-size:15px; font-family:inherit; color:#1E1B4B; outline:none; }
    .form-input:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.12); }
    .form-row { display:flex; gap:14px; }
    .form-row .form-group { flex:1; }
    .avatar-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
    .av-opt { font-size:28px; width:48px; height:48px; border:2.5px solid transparent; border-radius:12px; background:#F3F0FF; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; line-height:1; }
    .av-opt:hover { transform:scale(1.1); }
    .av-opt.av-sel { border-color:#7C3AED; background:#EDE9FF; }
    .modal-footer { display:flex; gap:10px; margin-top:24px; justify-content:flex-end; }
    .btn-cancel { background:#F3F0FF; color:#5B21B6; border:2px solid #DDD6FE; border-radius:12px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-save   { background:linear-gradient(135deg,#7C3AED,#4F46E5); color:white; border:none; border-radius:12px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-save:hover { box-shadow:0 6px 20px rgba(124,58,237,.4); }
    .btn-danger { background:#B91C1C; color:white; border:none; border-radius:12px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .delete-msg { font-size:14px; color:#64748B; line-height:1.6; margin-bottom:4px; }
    .delete-msg strong { color:#1E1B4B; }
  `]
})
export class PadreDashboardComponent implements OnInit {

  parentName = '';
  tab        = 'inicio';
  showMenu   = false;
  loading    = true;
  loadingDatos = false;
  errorMsg   = '';

  // Perfiles
  perfiles:       ChildProfile[] = [];
  selectedPerfil: ChildProfile | null = null;

  // Modal perfil
  showModal  = false;
  isEditing  = false;
  editingId: number | null = null;
  form: ChildProfileRequest = { nombre:'', avatar:'fox', edad:null, diagnostico:null };
  formError  = '';
  avatars    = AVATAR_EMOJIS;

  // Modal eliminar
  showDeleteModal = false;
  perfilAEliminar: ChildProfile | null = null;

  // Datos reales
  sesiones:       SesionJuego[]    = [];
  metricas:       Metrica[]         = [];
  alertas:        AlertaRegresion[] = [];
  notificaciones: Notificacion[]    = [];

  // Stats derivados
  precisionMedia      = 0;
  puntosTotales       = 0;
  sesionesCompletadas = 0;
  partidas            = 0;
  tiempoJuego         = '0m';
  actividadSemana: DiaActividad[]      = [];
  juegosPorRendimiento: JuegoRendimiento[] = [];
  ultimaActividad: UltimaActividad[]   = [];
  alertaActual = '';

  // Mock que no tenemos en el backend todavía
  racha  = 0;
  logros = 0;
  xpActual = 0;
  xpMax    = 1000;
  nivel    = 1;

  constructor(
    public  auth:                AuthService,
    private childProfileService: ChildProfileService,
    private padreService:        PadreService,
    private router:              Router,
    private cdr:                 ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.parentName = user.nombre || user.email || 'Padre';
      this.loadPerfiles(user.usuarioId);
      this.loadNotificaciones(user.usuarioId);
    }
  }

  private loadPerfiles(uid: number): void {
    this.loading = true;
    this.childProfileService.getProfiles(uid).subscribe({
      next: data => {
        this.perfiles       = data;
        this.selectedPerfil = data.find(p => p.activo) ?? data[0] ?? null;
        this.loading = false;
        if (this.selectedPerfil) this.loadDatosPerfil(this.selectedPerfil.id);
        else this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private loadDatosPerfil(perfilId: number): void {
    this.loadingDatos = true;
    this.cdr.detectChanges();

    forkJoin({
      sesiones: this.padreService.getSesiones(perfilId).pipe(catchError(() => of([]))),
      metricas: this.padreService.getMetricas(perfilId).pipe(catchError(() => of([]))),
      alertas:  this.padreService.getAlertasPendientes(perfilId).pipe(catchError(() => of([]))),
    }).subscribe(({ sesiones, metricas, alertas }) => {
      this.sesiones = sesiones;
      this.metricas = metricas;
      this.alertas  = alertas;
      this.calcularStats();
      this.loadingDatos = false;
      this.cdr.detectChanges();
    });
  }

  private loadNotificaciones(uid: number): void {
    this.padreService.getNotificaciones(uid).pipe(catchError(() => of([]))).subscribe(data => {
      this.notificaciones = data;
      this.cdr.detectChanges();
    });
  }

  private calcularStats(): void {
    const s = this.sesiones;

    // Puntos totales
    this.puntosTotales = s.reduce((sum, x) => sum + (x.puntaje ?? 0), 0);

    // Sesiones completadas
    this.sesionesCompletadas = s.filter(x => x.completada).length;

    // Precisión media desde métricas
    const precs = this.metricas.filter(m => m.precisionPct != null).map(m => m.precisionPct!);
    this.precisionMedia = precs.length ? Math.round(precs.reduce((a, b) => a + b, 0) / precs.length) : 0;

    // XP y nivel (derivado de puntos)
    this.xpActual = this.puntosTotales % 1000;
    this.nivel     = Math.floor(this.puntosTotales / 1000) + 1;

    // Partidas esta semana
    const ahora   = new Date();
    const lunes   = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1); lunes.setHours(0,0,0,0);
    const semana  = s.filter(x => new Date(x.inicio) >= lunes);
    this.partidas = semana.length;

    // Tiempo de juego aproximado (sesiones con fin)
    const minutos = s.filter(x => x.fin).reduce((sum, x) => {
      const d = (new Date(x.fin!).getTime() - new Date(x.inicio).getTime()) / 60000;
      return sum + (d > 0 ? d : 0);
    }, 0);
    this.tiempoJuego = minutos < 60 ? `${Math.round(minutos)}m` : `${(minutos/60).toFixed(1)}h`;

    // Actividad semanal (sesiones por día)
    const dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    this.actividadSemana = dias.map((dia, i) => {
      const dayOfWeek = (i + 1) % 7; // 1=Lun...0=Dom
      const count = semana.filter(x => {
        const d = new Date(x.inicio).getDay();
        return d === (dayOfWeek === 0 ? 0 : dayOfWeek);
      }).length;
      return { dia, valor: count };
    });

    // Juegos por rendimiento (agrupado)
    const byJuego: Record<string, { total:number; completadas:number }> = {};
    s.forEach(x => {
      const n = x.juego?.nombre ?? 'Desconocido';
      if (!byJuego[n]) byJuego[n] = { total:0, completadas:0 };
      byJuego[n].total++;
      if (x.completada) byJuego[n].completadas++;
    });
    this.juegosPorRendimiento = Object.entries(byJuego)
      .map(([nombre, v]) => ({
        nombre,
        icono:   JUEGO_ICO[nombre]  ?? '🎮',
        color:   JUEGO_COLOR[nombre] ?? '#7C3AED',
        pct:     Math.round((v.completadas / v.total) * 100),
        sesiones: v.total,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    // Última actividad (últimas 3 sesiones)
    this.ultimaActividad = [...s]
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
      .slice(0, 3)
      .map(x => ({
        hora:       this.formatFechaRelativa(x.inicio),
        juego:      x.juego?.nombre ?? 'Juego',
        icono:      JUEGO_ICO[x.juego?.nombre ?? ''] ?? '🎮',
        puntaje:    x.puntaje ?? 0,
        completada: x.completada ?? false,
      }));

    // Racha (días consecutivos con al menos una sesión)
    this.racha = this.calcularRacha(s);

    // Alerta actual (primera alerta pendiente)
    this.alertaActual = this.alertas.find(a => !a.vista)?.descripcion ?? '';
  }

  private calcularRacha(sesiones: SesionJuego[]): number {
    if (!sesiones.length) return 0;
    const dias = new Set(sesiones.map(s => new Date(s.inicio).toDateString()));
    let racha = 0; const hoy = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(hoy); d.setDate(hoy.getDate() - i);
      if (dias.has(d.toDateString())) racha++;
      else if (i > 0) break;
    }
    return racha;
  }

  selectPerfil(p: ChildProfile): void {
    this.selectedPerfil = p; this.showMenu = false;
    this.loadDatosPerfil(p.id);
  }

  setNotif(): void {
    this.tab = 'notif';
    const uid = this.auth.user()?.usuarioId;
    if (uid) this.loadNotificaciones(uid);
  }

  marcarLeida(n: Notificacion): void {
    if (n.leida) return;
    this.padreService.marcarLeida(n.id).subscribe(() => {
      n.leida = true; this.cdr.detectChanges();
    });
  }

  marcarTodasLeidas(): void {
    const uid = this.auth.user()?.usuarioId;
    if (!uid) return;
    this.padreService.marcarTodasLeidas(uid).subscribe(() => {
      this.notificaciones.forEach(n => n.leida = true);
      this.cdr.detectChanges();
    });
  }

  // ── Perfil CRUD ──
  openCreate(): void {
    this.isEditing = false; this.editingId = null;
    this.form = { nombre:'', avatar:'fox', edad:null, diagnostico:null };
    this.formError = ''; this.showModal = true; this.cdr.detectChanges();
  }

  openEdit(p: ChildProfile): void {
    this.isEditing = true; this.editingId = p.id;
    this.form = { nombre:p.nombre, avatar:p.avatar, edad:p.edad, diagnostico:p.diagnostico };
    this.formError = ''; this.showModal = true; this.cdr.detectChanges();
  }

  guardar(): void {
    if (!this.form.nombre.trim()) { this.formError = 'El nombre es obligatorio.'; return; }
    const uid = this.auth.user()!.usuarioId;
    const req: ChildProfileRequest = {
      nombre: this.form.nombre.trim(), avatar: this.form.avatar,
      edad: this.form.edad, diagnostico: this.form.diagnostico?.trim() || null
    };
    if (this.isEditing && this.editingId) {
      this.childProfileService.updateProfile(this.editingId, req, uid).subscribe({
        next: () => { this.showModal = false; this.loadPerfiles(uid); },
        error: e  => { this.formError = e.error?.message || 'Error al guardar.'; this.cdr.detectChanges(); }
      });
    } else {
      this.childProfileService.createProfile(req, uid).subscribe({
        next: () => { this.showModal = false; this.loadPerfiles(uid); },
        error: e  => { this.formError = e.error?.message || 'Error al crear.'; this.cdr.detectChanges(); }
      });
    }
  }

  toggleActivo(p: ChildProfile): void {
    const uid = this.auth.user()!.usuarioId;
    this.childProfileService.toggleStatus(p.id, uid).subscribe({
      next: () => this.loadPerfiles(uid),
      error: () => { this.errorMsg = 'Error al cambiar estado.'; this.cdr.detectChanges(); }
    });
  }

  pedirEliminar(p: ChildProfile): void { this.perfilAEliminar = p; this.showDeleteModal = true; this.cdr.detectChanges(); }

  confirmarEliminar(): void {
    if (!this.perfilAEliminar) return;
    const uid = this.auth.user()!.usuarioId;
    this.childProfileService.deleteProfile(this.perfilAEliminar.id, uid).subscribe({
      next: () => { this.showDeleteModal = false; this.perfilAEliminar = null; this.loadPerfiles(uid); },
      error: () => { this.errorMsg = 'Error al eliminar.'; this.showDeleteModal = false; this.cdr.detectChanges(); }
    });
  }

  cancelarEliminar(): void { this.showDeleteModal = false; this.perfilAEliminar = null; this.cdr.detectChanges(); }
  closeModal():       void { this.showModal = false; this.cdr.detectChanges(); }

  jugar(p: ChildProfile): void {
    const uid = this.auth.user()!.usuarioId;
    this.childProfileService.switchProfile(p.id, uid).subscribe({
      next: () => this.router.navigate(['/nino/juegos']),
      error: () => { this.errorMsg = 'No se pudo cambiar el perfil.'; this.cdr.detectChanges(); }
    });
  }

  jugarDesdeInicio(p: ChildProfile): void { this.jugar(p); }

  // ── Helpers ──
  avatarFn(key?: string | null): string { return AVATAR_MAP[key ?? 'fox'] ?? '🦊'; }
  juegoIco(nombre: string):      string { return JUEGO_ICO[nombre] ?? '🎮'; }

  tipoIco(tipo: string): string {
    const m: Record<string,string> = { ALERTA:'⚠️', LOGRO:'🏆', PROGRESO:'📊', INFO:'ℹ️', SISTEMA:'🔧' };
    return m[tipo?.toUpperCase()] ?? '🔔';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-CR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  formatFechaCorta(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-CR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }

  formatFechaRelativa(fecha: string): string {
    const d = new Date(fecha); const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - d.getTime()) / 60000);
    if (diff < 1)   return 'Ahora mismo';
    if (diff < 60)  return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff/60)}h`;
    if (diff < 2880) return 'Ayer, ' + d.toLocaleTimeString('es-CR', { hour:'2-digit', minute:'2-digit' });
    return d.toLocaleDateString('es-CR', { day:'2-digit', month:'short' });
  }

  get sesionesOrdenadas(): SesionJuego[] {
    return [...this.sesiones].sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
  }
  get notifNoLeidas(): number { return this.notificaciones.filter(n => !n.leida).length; }
  get xpPct():         number { return Math.round((this.xpActual / this.xpMax) * 100); }
  get maxAct():        number { return Math.max(...this.actividadSemana.map(a => a.valor), 1); }
  get parentInitial(): string { return this.parentName.charAt(0).toUpperCase() || 'P'; }
  get topbarTitle():   string {
    const map: Record<string,string> = {
      inicio:   'Dashboard de ' + (this.selectedPerfil?.nombre ?? '…'),
      hijos:    'Mis hijos',
      progreso: 'Progreso de ' + (this.selectedPerfil?.nombre ?? '…'),
      actividad:'Actividad de ' + (this.selectedPerfil?.nombre ?? '…'),
      notif:    'Notificaciones',
      config:   'Configuración'
    };
    return map[this.tab] ?? 'FocusKids';
  }
}
