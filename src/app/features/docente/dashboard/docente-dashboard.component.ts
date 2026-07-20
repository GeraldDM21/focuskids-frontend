import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocenteService, AlumnoDocente } from '../docente.service';
import { SesionJuego, Metrica } from '../../padre/padre.service';

interface Estudiante {
  id: number; nombre: string; avatar: string; edad: number;
  partidas: number; precision: number; xp: number;
  estado: 'Excelente' | 'Muy bien' | 'Necesita ayuda';
  activo: boolean;
  sesiones: SesionJuego[];
}
interface Alerta {
  nombre: string; avatar: string; mensaje: string; tipo: 'warn' | 'danger'; hace: string;
}
interface LogroClase {
  icono: string; nombre: string; desc: string; alumno: string; avatarAlu: string; fecha: string;
}
interface EventoCal {
  dia: number; titulo: string; tipo: 'asig' | 'reporte' | 'reunion'; hora: string;
}

const AVATAR_MAP: Record<string, string> = {
  fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
  unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
  bear:'🐻', mouse:'🐭',
};

const JUEGO_ICO: Record<string, string> = {
  'Espejo Mental': '🪞', 'Historia Viva': '📖', 'Palabras Ocultas': '📝',
  'Piezas en Tiempo': '🧩', 'Foco Extremo': '🎯', 'Cascada Numérica': '🔢',
};

@Component({
  selector: 'app-docente-dashboard',
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
      <p class="nav-sec">PRINCIPAL</p>
      <button class="nav-item" [class.active]="tab==='clase'"       (click)="tab='clase'">       <span>🏫</span> Mi clase</button>
      <button class="nav-item" [class.active]="tab==='reportes'"    (click)="tab='reportes'">    <span>📊</span> Reportes</button>
      <button class="nav-item" [class.active]="tab==='asignaciones'"(click)="tab='asignaciones'"><span>📋</span> Asignaciones</button>
      <button class="nav-item" [class.active]="tab==='logros'"      (click)="tab='logros'">      <span>🏆</span> Logros</button>
      <p class="nav-sec">HERRAMIENTAS</p>
      <button class="nav-item" [class.active]="tab==='calendario'"  (click)="tab='calendario'">  <span>📅</span> Calendario</button>
      <button class="nav-item" [class.active]="tab==='config'"      (click)="tab='config'">      <span>⚙️</span> Configuración</button>
    </nav>
    <div class="sb-user">
      <div class="sb-avatar">{{ inicial }}</div>
      <div class="sb-info">
        <div class="sb-name">{{ docenteName }}</div>
        <div class="sb-role">Docente</div>
      </div>
      <button class="sb-logout" (click)="auth.logout()" title="Salir">⎋</button>
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
          <button class="btn-add" (click)="nuevaAsig = true">+ Nueva asignación</button>
        }
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
            <p>Para ver datos aquí, un padre debe asignar el perfil de su hijo a tu cuenta de docente.<br>El campo <strong>docente_id</strong> en <code>perfil_nino</code> debe apuntar a tu usuario.</p>
          </div>
        }

        @if (estudiantes.length > 0) {
        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card"><div class="stat-ico">👨‍🎓</div><div class="stat-num">{{ activos }}</div><div class="stat-lbl">Estudiantes activos</div></div>
          <div class="stat-card"><div class="stat-ico">📈</div><div class="stat-num">{{ avgPrec }}%</div><div class="stat-lbl">Precisión promedio</div></div>
          <div class="stat-card"><div class="stat-ico">🕹️</div><div class="stat-num">{{ totalPartidas }}</div><div class="stat-lbl">Partidas esta semana</div></div>
          <div class="stat-card"><div class="stat-ico">⚠️</div><div class="stat-num">{{ alertas.length }}</div><div class="stat-lbl">Alertas activas</div></div>
        </div>

        <div class="bottom-grid">
          <!-- Tabla -->
          <div class="table-card">
            <div class="tc-header">
              <h3 class="card-title">Progreso individual</h3>
              <div class="filter-row">
                <button class="f-btn" [class.f-act]="filtro==='todos'"    (click)="filtro='todos'">Todos</button>
                <button class="f-btn" [class.f-act]="filtro==='atencion'" (click)="filtro='atencion'">⚠️ Atención</button>
                <button class="f-btn" [class.f-act]="filtro==='top'"      (click)="filtro='top'">⭐ Top</button>
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
                </tr>
              </thead>
              <tbody>
                @for (e of estudiantesFiltrados; track e.id) {
                  <tr [class.fila-inactiva]="!e.activo">
                    <td class="td-name">
                      <span class="stu-av">{{ e.avatar }}</span>
                      <span>{{ e.nombre }}<br><small>{{ e.edad }} años</small></span>
                    </td>
                    <td>{{ e.partidas }}</td>
                    <td [class.prec-ok]="e.precision>=80" [class.prec-warn]="e.precision>=70&&e.precision<80" [class.prec-low]="e.precision<70">
                      <div class="prec-wrap">
                        {{ e.precision }}%
                        <div class="prec-bar"><div class="prec-fill" [style.width.%]="e.precision" [class.fill-ok]="e.precision>=80" [class.fill-warn]="e.precision>=70&&e.precision<80" [class.fill-low]="e.precision<70"></div></div>
                      </div>
                    </td>
                    <td class="td-xp">⭐ {{ e.xp }}</td>
                    <td><span class="badge" [class]="badgeClass(e.estado)">{{ e.estado }}</span></td>
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
                  <span class="medal">{{ ['🥇','🥈','🥉'][i] }}</span>
                  <span class="top-av">{{ e.avatar }}</span>
                  <span class="top-name">{{ e.nombre }}</span>
                  <span class="top-pct" [class.gold]="i===0">{{ e.precision }}%</span>
                </div>
              }
            </div>

            <!-- Alertas -->
            <div class="panel">
              <h3 class="card-title">🚨 Alertas</h3>
              @for (a of alertas; track a.nombre) {
                <div class="alerta-item" [class.alerta-danger]="a.tipo==='danger'">
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
        } <!-- /estudiantes.length > 0 -->
      }

      <!-- ══ REPORTES ══ -->
      @if (!loading && tab === 'reportes') {
        <div class="rep-wrap">
          <div class="rep-intro">
            <div class="rep-stat"><span class="rs-val">{{ avgPrec }}%</span><span class="rs-lbl">Precisión promedio de la clase</span></div>
            <div class="rep-stat"><span class="rs-val">{{ totalPartidas }}</span><span class="rs-lbl">Partidas totales</span></div>
            <div class="rep-stat"><span class="rs-val">{{ activos }}</span><span class="rs-lbl">Alumnos activos</span></div>
            <div class="rep-stat"><span class="rs-val">{{ xpClase | number }}</span><span class="rs-lbl">XP acumulado</span></div>
          </div>

          <div class="rep-card">
            <h3 class="card-title">Rendimiento por estudiante</h3>
            @for (e of estudiantesOrdenados; track e.id) {
              <div class="rep-row">
                <span class="rep-av">{{ e.avatar }}</span>
                <span class="rep-nombre">{{ e.nombre }}</span>
                <div class="rep-bar-wrap">
                  <div class="rep-bar-outer">
                    <div class="rep-bar-fill" [style.width.%]="e.precision" [class.fill-ok]="e.precision>=80" [class.fill-warn]="e.precision>=70&&e.precision<80" [class.fill-low]="e.precision<70"></div>
                  </div>
                  <span class="rep-pct" [class.prec-ok]="e.precision>=80" [class.prec-warn]="e.precision>=70&&e.precision<80" [class.prec-low]="e.precision<70">{{ e.precision }}%</span>
                </div>
                <span class="badge sm" [class]="badgeClass(e.estado)">{{ e.estado }}</span>
              </div>
            }
          </div>

          <div class="rep-card">
            <h3 class="card-title">Distribución de estados</h3>
            <div class="dist-row">
              <div class="dist-item dist-ex">
                <div class="dist-num">{{ cuentaEstado('Excelente') }}</div>
                <div class="dist-lbl">🌟 Excelente</div>
                <div class="dist-bar"><div class="dist-fill" [style.width.%]="(cuentaEstado('Excelente')/estudiantes.length)*100" style="background:#16A34A"></div></div>
              </div>
              <div class="dist-item dist-mb">
                <div class="dist-num">{{ cuentaEstado('Muy bien') }}</div>
                <div class="dist-lbl">😊 Muy bien</div>
                <div class="dist-bar"><div class="dist-fill" [style.width.%]="(cuentaEstado('Muy bien')/estudiantes.length)*100" style="background:#D97706"></div></div>
              </div>
              <div class="dist-item dist-na">
                <div class="dist-num">{{ cuentaEstado('Necesita ayuda') }}</div>
                <div class="dist-lbl">🆘 Necesita ayuda</div>
                <div class="dist-bar"><div class="dist-fill" [style.width.%]="(cuentaEstado('Necesita ayuda')/estudiantes.length)*100" style="background:#DC2626"></div></div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ══ ASIGNACIONES ══ -->
      @if (!loading && tab === 'asignaciones') {
        <div class="coming-soon-card">
          <div style="font-size:52px">📋</div>
          <h2>Asignaciones — próximamente</h2>
          <p>Esta funcionalidad requiere un módulo de asignaciones en el backend que aún no está implementado. Se habilitará en la siguiente iteración del proyecto.</p>
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
              @for (d of ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']; track d) {
                <div class="dia-hdr">{{ d }}</div>
              }
            </div>
            <div class="dias-grid">
              @for (dia of diasMes; track dia) {
                <div class="dia-cel" [class.dia-hoy]="dia===20" [class.dia-vacio]="dia===0">
                  @if (dia > 0) {
                    <span class="dia-num">{{ dia }}</span>
                    @for (ev of eventosDelDia(dia); track ev.titulo) {
                      <div class="ev-chip" [class.ev-asig]="ev.tipo==='asig'" [class.ev-rep]="ev.tipo==='reporte'" [class.ev-reu]="ev.tipo==='reunion'">
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
            <div class="cfg-field"><label>Nombre</label><div class="cfg-val">{{ docenteName }}</div></div>
            <div class="cfg-field"><label>Institución</label><div class="cfg-val">{{ institucion }}</div></div>
            <div class="cfg-field"><label>Grado / Grupo</label><div class="cfg-val">{{ gradoGrupo }}</div></div>
            <div class="cfg-field"><label>Rol</label><div class="cfg-val">Docente</div></div>
            <p class="cfg-note">Para actualizar tu información, contacta al administrador del sistema.</p>
          </div>
          <div class="cfg-card">
            <h3 class="cfg-title">👨‍🎓 Mi clase</h3>
            <div class="cfg-alumnos">
              @for (e of estudiantes; track e.id) {
                <div class="cfg-alumno">
                  <span>{{ e.avatar }}</span>
                  <span class="ca-nombre">{{ e.nombre }}</span>
                  <span class="ca-edad">{{ e.edad }} años</span>
                  <span class="ca-est" [class.est-ok]="e.activo" [class.est-no]="!e.activo">{{ e.activo ? 'Activo' : 'Inactivo' }}</span>
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
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    .root { display:flex; height:100vh; overflow:hidden; font-family:'Inter',-apple-system,sans-serif; background:#ECFDF5; }

    /* ── Sidebar ── */
    .sidebar { width:172px; flex-shrink:0; background:linear-gradient(180deg,#14532D 0%,#166534 60%,#15803D 100%); display:flex; flex-direction:column; padding:22px 0 16px; overflow-y:auto; }
    .brand { display:flex; align-items:center; gap:8px; padding:0 16px 20px; border-bottom:1px solid rgba(255,255,255,.08); }
    .brand-ico { font-size:20px; }
    .brand-txt { font-size:15px; font-weight:800; color:white; }
    .nav { flex:1; padding:12px 10px; }
    .nav-sec { font-size:9px; font-weight:700; letter-spacing:1.4px; color:rgba(255,255,255,.3); padding:14px 8px 6px; text-transform:uppercase; }
    .nav-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,.5); font-size:12.5px; font-weight:600; cursor:pointer; text-align:left; margin-bottom:2px; transition:all .15s; }
    .nav-item span { font-size:15px; flex-shrink:0; }
    .nav-item:hover { background:rgba(255,255,255,.09); color:rgba(255,255,255,.9); }
    .nav-item.active { background:rgba(255,255,255,.15); color:white; }
    .sb-user { margin-top:auto; padding:14px 12px 0; border-top:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:8px; }
    .sb-avatar { width:34px; height:34px; border-radius:50%; background:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:white; flex-shrink:0; }
    .sb-info { flex:1; min-width:0; }
    .sb-name { font-size:11.5px; font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sb-role { font-size:10px; color:rgba(255,255,255,.4); }
    .sb-logout { background:none; border:none; color:rgba(255,255,255,.4); font-size:17px; cursor:pointer; padding:4px; border-radius:6px; }
    .sb-logout:hover { color:white; background:rgba(255,255,255,.1); }

    /* ── Main ── */
    .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .topbar { background:white; padding:14px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #D1FAE5; flex-shrink:0; }
    .tb-title { font-size:18px; font-weight:800; color:#14532D; }
    .tb-sub { font-size:12px; color:#6B7280; margin-top:2px; }
    .tb-right { display:flex; align-items:center; gap:10px; }
    .inst-chip { background:#F0FDF4; border:1.5px solid #86EFAC; border-radius:20px; padding:6px 14px; font-size:12px; font-weight:700; color:#15803D; }
    .btn-add { background:#15803D; color:white; border:none; border-radius:12px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; }
    .btn-add:hover { background:#14532D; }
    .content { flex:1; overflow-y:auto; padding:20px 22px 32px; display:flex; flex-direction:column; gap:16px; }

    /* ── Stats ── */
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .stat-card { background:white; border-radius:16px; padding:18px 16px; text-align:center; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .stat-ico { font-size:26px; margin-bottom:8px; }
    .stat-num { font-size:24px; font-weight:900; color:#14532D; }
    .stat-lbl { font-size:10.5px; color:#94A3B8; margin-top:4px; }

    /* ── Mi Clase ── */
    .bottom-grid { display:grid; grid-template-columns:1fr 248px; gap:14px; }
    .table-card { background:white; border-radius:18px; padding:20px; box-shadow:0 2px 10px rgba(21,128,61,.07); overflow:hidden; }
    .tc-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .card-title { font-size:14px; font-weight:800; color:#14532D; }
    .filter-row { display:flex; gap:6px; }
    .f-btn { border:1.5px solid #D1FAE5; background:white; border-radius:8px; padding:5px 10px; font-size:11.5px; font-weight:700; color:#6B7280; cursor:pointer; }
    .f-btn.f-act { background:#F0FDF4; border-color:#86EFAC; color:#15803D; }
    .tabla { width:100%; border-collapse:collapse; }
    .tabla thead tr { border-bottom:1.5px solid #F1F5F9; }
    .tabla th { font-size:10px; font-weight:700; letter-spacing:.8px; color:#94A3B8; padding:0 10px 10px; text-align:left; }
    .tabla tbody tr { border-bottom:1px solid #F8FAFC; transition:background .15s; }
    .tabla tbody tr:hover { background:#F0FDF4; }
    .tabla tbody tr:last-child { border-bottom:none; }
    .tabla td { padding:10px; font-size:13.5px; color:#334155; font-weight:600; }
    .fila-inactiva { opacity:.5; }
    .td-name { display:flex; align-items:center; gap:10px; }
    .stu-av { width:34px; height:34px; border-radius:10px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .td-name small { font-size:10.5px; color:#94A3B8; font-weight:600; }
    .td-xp { color:#F59E0B; font-weight:800; }
    .prec-ok   { color:#16A34A; }
    .prec-warn { color:#D97706; }
    .prec-low  { color:#DC2626; }
    .prec-wrap { display:flex; flex-direction:column; gap:4px; }
    .prec-bar { height:5px; background:#F3F4F6; border-radius:100px; overflow:hidden; width:80px; }
    .prec-fill { height:100%; border-radius:100px; }
    .fill-ok   { background:#16A34A; }
    .fill-warn { background:#D97706; }
    .fill-low  { background:#DC2626; }
    .badge { display:inline-block; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; }
    .badge.sm { font-size:10px; padding:3px 8px; }
    .badge-ex  { background:#DCFCE7; color:#15803D; }
    .badge-mb  { background:#FEF9C3; color:#A16207; }
    .badge-na  { background:#FEE2E2; color:#B91C1C; }
    .right-col { display:flex; flex-direction:column; gap:12px; }
    .panel { background:white; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .top-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #F0FDF4; }
    .top-row:last-child { border-bottom:none; }
    .medal { font-size:20px; flex-shrink:0; }
    .top-av { font-size:18px; flex-shrink:0; }
    .top-name { flex:1; font-size:12.5px; font-weight:700; color:#334155; }
    .top-pct { font-size:13px; font-weight:800; color:#15803D; }
    .top-pct.gold { color:#D97706; }
    .alerta-item { display:flex; align-items:flex-start; gap:8px; padding:10px; border-radius:12px; background:#FFFBEB; border-left:3px solid #F59E0B; margin-bottom:8px; }
    .alerta-item:last-child { margin-bottom:0; }
    .alerta-danger { background:#FFF5F5; border-left-color:#EF4444; }
    .al-av { font-size:20px; flex-shrink:0; margin-top:2px; }
    .al-nombre { font-size:12px; font-weight:800; color:#334155; }
    .al-msg    { font-size:11.5px; color:#6B7280; margin-top:2px; }
    .al-hace   { font-size:10px; color:#9CA3AF; margin-top:2px; }

    /* ── Loader / Empty ── */
    .loader { display:flex; justify-content:center; align-items:center; flex:1; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #BBF7D0; border-top-color:#15803D; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:14px; padding:60px; text-align:center; }
    .empty-state h2 { font-size:20px; font-weight:800; color:#14532D; }
    .empty-state p  { color:#6B7280; font-size:14px; line-height:1.7; }
    .empty-state code { background:#F0FDF4; padding:2px 6px; border-radius:6px; font-size:12px; color:#15803D; }

    /* ── Reportes ── */
    .rep-wrap { display:flex; flex-direction:column; gap:16px; }
    .rep-intro { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .rep-stat { background:white; border-radius:16px; padding:18px; text-align:center; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .rs-val { display:block; font-size:26px; font-weight:900; color:#14532D; }
    .rs-lbl { display:block; font-size:10.5px; color:#94A3B8; margin-top:5px; }
    .rep-card { background:white; border-radius:16px; padding:20px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .rep-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #F0FDF4; }
    .rep-row:last-child { border-bottom:none; }
    .rep-av { font-size:22px; flex-shrink:0; }
    .rep-nombre { font-size:13px; font-weight:700; color:#334155; min-width:130px; }
    .rep-bar-wrap { flex:1; display:flex; align-items:center; gap:10px; }
    .rep-bar-outer { flex:1; height:8px; background:#F3F4F6; border-radius:100px; overflow:hidden; }
    .rep-bar-fill { height:100%; border-radius:100px; transition:width .8s ease; }
    .rep-pct { font-size:12px; font-weight:800; min-width:36px; text-align:right; }
    .dist-row { display:flex; gap:16px; }
    .dist-item { flex:1; }
    .dist-num { font-size:32px; font-weight:900; color:#14532D; }
    .dist-lbl { font-size:12px; color:#6B7280; font-weight:700; margin:4px 0 8px; }
    .dist-bar { height:8px; background:#F3F4F6; border-radius:100px; overflow:hidden; }
    .dist-fill { height:100%; border-radius:100px; transition:width .8s ease; }

    /* ── Asignaciones ── */
    .asig-form-card { background:white; border-radius:16px; padding:20px; box-shadow:0 2px 10px rgba(21,128,61,.07); margin-bottom:4px; }
    .asig-note { font-size:13px; color:#6B7280; margin:12px 0 16px; }
    .btn-cancel { background:#F3F4F6; color:#374151; border:none; border-radius:10px; padding:8px 18px; font-size:13px; font-weight:700; cursor:pointer; }
    .asig-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
    .asig-card { background:white; border-radius:18px; padding:20px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .asig-top { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .asig-ico { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
    .asig-titulo { font-size:14px; font-weight:800; color:#1E1B4B; }
    .asig-juego { font-size:11.5px; color:#94A3B8; margin-top:2px; }
    .asig-prog-lbl { display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; color:#6B7280; margin-bottom:6px; }
    .asig-cnt { color:#15803D; }
    .asig-prog-bar { height:8px; background:#F3F4F6; border-radius:100px; overflow:hidden; margin-bottom:10px; }
    .asig-prog-fill { height:100%; border-radius:100px; transition:width .8s ease; }
    .asig-fecha { font-size:11px; color:#9CA3AF; }

    /* ── Coming soon / mini empty ── */
    .coming-soon-card { background:white; border-radius:18px; padding:48px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:14px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .coming-soon-card h2 { font-size:20px; font-weight:800; color:#14532D; }
    .coming-soon-card p  { font-size:14px; color:#6B7280; line-height:1.7; max-width:480px; }
    .mini-empty { display:flex; align-items:center; gap:12px; padding:16px; background:#F0FDF4; border-radius:12px; }
    .mini-empty p { font-size:13px; color:#6B7280; }

    /* ── Logros ── */
    .logros-wrap { display:flex; flex-direction:column; gap:16px; }
    .podio-card, .logros-card { background:white; border-radius:18px; padding:22px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .podio { display:flex; align-items:flex-end; justify-content:center; gap:20px; padding:20px 0 0; }
    .pod-col { display:flex; flex-direction:column; align-items:center; gap:6px; }
    .pod-av { font-size:38px; }
    .pod-av.large { font-size:52px; }
    .pod-name { font-size:13px; font-weight:800; color:#334155; }
    .pod-xp { font-size:12px; font-weight:700; color:#94A3B8; }
    .pod-xp.gold { color:#D97706; }
    .pod-pedestal { font-size:28px; margin-top:4px; }
    .p1 { font-size:34px; }
    .logro-list { display:flex; flex-direction:column; gap:2px; }
    .logro-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #F0FDF4; }
    .logro-row:last-child { border-bottom:none; }
    .lo-ico { font-size:26px; flex-shrink:0; }
    .lo-body { flex:1; }
    .lo-nombre { font-size:13px; font-weight:800; color:#334155; }
    .lo-desc { font-size:11.5px; color:#94A3B8; margin-top:2px; }
    .lo-quien { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .lo-av { font-size:18px; }
    .lo-alumno { font-size:12px; font-weight:700; color:#15803D; }
    .lo-fecha { font-size:11px; color:#9CA3AF; flex-shrink:0; min-width:60px; text-align:right; }

    /* ── Calendario ── */
    .cal-wrap { display:flex; flex-direction:column; gap:16px; }
    .cal-card { background:white; border-radius:18px; padding:22px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .cal-legend { display:flex; gap:14px; }
    .leg { font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:20px; }
    .asig-col { background:#EDE9FE; color:#5B21B6; }
    .rep-col  { background:#FEF9C3; color:#92400E; }
    .reu-col  { background:#DCFCE7; color:#14532D; }
    .dias-header { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:6px; }
    .dia-hdr { text-align:center; font-size:11px; font-weight:700; color:#94A3B8; padding:6px 0; }
    .dias-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
    .dia-cel { min-height:72px; background:#F9FAFB; border-radius:10px; padding:6px; display:flex; flex-direction:column; gap:3px; }
    .dia-cel.dia-hoy { background:#F0FDF4; border:1.5px solid #86EFAC; }
    .dia-cel.dia-vacio { background:transparent; }
    .dia-num { font-size:12px; font-weight:800; color:#374151; }
    .dia-hoy .dia-num { color:#15803D; }
    .ev-chip { font-size:9.5px; font-weight:700; border-radius:6px; padding:2px 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ev-asig { background:#EDE9FE; color:#5B21B6; }
    .ev-rep  { background:#FEF9C3; color:#92400E; }
    .ev-reu  { background:#DCFCE7; color:#14532D; }

    /* ── Configuración ── */
    .cfg-wrap { display:flex; flex-direction:column; gap:16px; max-width:540px; }
    .cfg-card { background:white; border-radius:16px; padding:22px; box-shadow:0 2px 10px rgba(21,128,61,.07); }
    .cfg-title { font-size:14px; font-weight:800; color:#14532D; margin-bottom:16px; }
    .cfg-avatar { width:60px; height:60px; border-radius:50%; background:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:800; color:white; margin-bottom:16px; }
    .cfg-field { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
    .cfg-field label { font-size:12px; font-weight:700; color:#6B7280; }
    .cfg-val { background:#F0FDF4; border-radius:10px; padding:10px 14px; font-size:14px; font-weight:600; color:#14532D; }
    .cfg-note { font-size:12px; color:#94A3B8; }
    .cfg-alumnos { display:flex; flex-direction:column; gap:8px; }
    .cfg-alumno { display:flex; align-items:center; gap:10px; padding:10px; background:#F0FDF4; border-radius:12px; font-size:14px; }
    .ca-nombre { flex:1; font-weight:700; color:#14532D; }
    .ca-edad { font-size:12px; color:#6B7280; }
    .ca-est { font-size:10px; font-weight:800; padding:3px 10px; border-radius:20px; }
    .est-ok { background:#DCFCE7; color:#15803D; }
    .est-no { background:#FEE2E2; color:#B91C1C; }
  `]
})
export class DocenteDashboardComponent implements OnInit {

  tab       = 'clase';
  filtro    = 'todos';
  nuevaAsig = false;
  loading   = true;

  docenteName = '';
  institucion = '';
  gradoGrupo  = '';

  estudiantes: Estudiante[] = [];
  alertas:     Alerta[]     = [];

  logrosClase: LogroClase[] = [];

  // Julio 2026 — empieza miércoles (relleno con 0s al inicio)
  readonly diasMes = [0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];

  readonly eventos: EventoCal[] = [
    { dia:22, titulo:'Asig. Atención',  tipo:'asig',    hora:'8:00'  },
    { dia:25, titulo:'Reporte semanal', tipo:'reporte', hora:'12:00' },
    { dia:27, titulo:'Reunión padres',  tipo:'reunion', hora:'16:00' },
    { dia:30, titulo:'Asig. Lectura',   tipo:'asig',    hora:'8:00'  },
  ];

  constructor(
    public  auth:    AuthService,
    private router:  Router,
    private cdr:     ChangeDetectorRef,
    private docSvc:  DocenteService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.docenteName = user.nombre || user.email || 'Docente';
    this.loadAlumnos(user.usuarioId);
  }

  private loadAlumnos(uid: number): void {
    this.loading = true;
    this.docSvc.getAlumnos(uid).pipe(catchError(() => of([]))).subscribe(alumnos => {
      if (alumnos.length === 0) {
        this.estudiantes = [];
        this.alertas     = [];
        this.loading     = false;
        this.cdr.detectChanges();
        return;
      }

      // Para cada alumno cargamos sesiones + métricas en paralelo
      const requests = alumnos.map(a =>
        forkJoin({
          sesiones: this.docSvc.getSesiones(a.id).pipe(catchError(() => of([]))),
          metricas: this.docSvc.getMetricas(a.id).pipe(catchError(() => of([]))),
          alertas:  this.docSvc.getAlertas(a.id).pipe(catchError(() => of([]))),
        })
      );

      forkJoin(requests).subscribe(resultados => {
        this.estudiantes = alumnos.map((a, i) => {
          const { sesiones, metricas } = resultados[i];
          const precs   = (metricas as Metrica[]).filter(m => m.precisionPct != null).map(m => m.precisionPct!);
          const precision = precs.length ? Math.round(precs.reduce((s, v) => s + v, 0) / precs.length) : 0;
          const xp        = (sesiones as SesionJuego[]).reduce((s, x) => s + (x.puntaje ?? 0), 0);
          const partidas  = sesiones.length;
          const estado: Estudiante['estado'] = precision >= 80 ? 'Excelente' : precision >= 65 ? 'Muy bien' : 'Necesita ayuda';
          const avatar = AVATAR_MAP[a.avatar ?? ''] ?? '👤';
          return { id: a.id, nombre: a.nombre, avatar, edad: a.edad ?? 0, partidas, precision, xp, estado, activo: a.activo, sesiones };
        });

        // Alertas: alumnos con estado "Necesita ayuda" o sin sesiones recientes
        this.alertas = [];
        alumnos.forEach((a, i) => {
          const { alertas: al, sesiones } = resultados[i];
          const alu = this.estudiantes[i];
          if (al.length > 0) {
            this.alertas.push({ nombre: a.nombre, avatar: alu.avatar, mensaje: al[0].descripcion, tipo: 'warn', hace: this.hace(al[0].fecha) });
          } else if (sesiones.length === 0) {
            this.alertas.push({ nombre: a.nombre, avatar: alu.avatar, mensaje: 'Sin sesiones registradas aún', tipo: 'danger', hace: '—' });
          }
        });

        this.logrosClase = this.derivarLogros();
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  private derivarLogros(): LogroClase[] {
    const logros: LogroClase[] = [];
    const activos = this.estudiantes.filter(e => e.activo && e.partidas > 0);
    if (!activos.length) return logros;

    // Líder de XP
    const topXp = [...activos].sort((a, b) => b.xp - a.xp)[0];
    logros.push({ icono:'🏆', nombre:'Líder de XP', desc:`${topXp.xp} puntos acumulados`, alumno: topXp.nombre, avatarAlu: topXp.avatar, fecha:'Esta semana' });

    // Mayor precisión
    const topPrec = [...activos].sort((a, b) => b.precision - a.precision)[0];
    if (topPrec.precision > 0) {
      logros.push({ icono:'🎯', nombre:'Mayor precisión', desc:`${topPrec.precision}% de precisión`, alumno: topPrec.nombre, avatarAlu: topPrec.avatar, fecha:'Esta semana' });
    }

    // Más partidas
    const topPartidas = [...activos].sort((a, b) => b.partidas - a.partidas)[0];
    if (topPartidas.partidas > 0) {
      logros.push({ icono:'⚡', nombre:'Más partidas', desc:`${topPartidas.partidas} sesiones jugadas`, alumno: topPartidas.nombre, avatarAlu: topPartidas.avatar, fecha:'Esta semana' });
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
  get activos()        { return this.estudiantes.filter(e => e.activo).length; }
  get avgPrec()        { const a = this.estudiantes.filter(e=>e.activo); return a.length ? Math.round(a.reduce((s,e)=>s+e.precision,0)/a.length) : 0; }
  get totalPartidas()  { return this.estudiantes.filter(e=>e.activo).reduce((s,e)=>s+e.partidas,0); }
  get xpClase()        { return this.estudiantes.reduce((s,e)=>s+e.xp,0); }
  get top3()           { return [...this.estudiantes].filter(e=>e.activo).sort((a,b)=>b.precision-a.precision).slice(0,3); }
  get estudiantesOrdenados() { return [...this.estudiantes].sort((a,b)=>b.precision-a.precision); }
  get inicial()        { return this.docenteName.charAt(0).toUpperCase() || 'D'; }

  get estudiantesFiltrados() {
    if (this.filtro === 'atencion') return this.estudiantes.filter(e => e.estado === 'Necesita ayuda');
    if (this.filtro === 'top')      return this.top3;
    return this.estudiantes;
  }

  get topTitle(): string {
    const m: Record<string,string> = {
      clase:'Mi clase — ' + this.gradoGrupo, reportes:'Reportes de la clase',
      asignaciones:'Asignaciones', logros:'Logros', calendario:'Calendario', config:'Configuración'
    };
    return m[this.tab] ?? 'FocusKids';
  }
  get topSub(): string {
    const m: Record<string,string> = {
      clase:`${this.activos} estudiantes activos · Semana del 20-26 jul 2026`,
      reportes:'Rendimiento general de la clase', asignaciones:'Tareas asignadas',
      logros:'Reconocimientos de la clase', calendario:'Julio 2026', config:'Perfil docente'
    };
    return m[this.tab] ?? '';
  }

  badgeClass(estado: string): string {
    if (estado === 'Excelente')     return 'badge badge-ex';
    if (estado === 'Muy bien')      return 'badge badge-mb';
    return 'badge badge-na';
  }

  cuentaEstado(estado: string): number { return this.estudiantes.filter(e => e.estado === estado).length; }

  eventosDelDia(dia: number): EventoCal[] { return this.eventos.filter(e => e.dia === dia); }
}
