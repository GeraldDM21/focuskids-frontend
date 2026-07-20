import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

interface Estudiante {
  nombre: string; avatar: string; partidas: number;
  precision: number; xp: number;
  estado: 'Excelente' | 'Muy bien' | 'Necesita ayuda';
}
interface Alerta {
  nombre: string; avatar: string; mensaje: string; tipo: 'warn' | 'danger';
}

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dash-page">

      <!-- ══ SIDEBAR ══ -->
      <aside class="sidebar">
        <div class="sb-logo">
          <span class="sb-logo-ico">🧠</span>
          <span class="sb-logo-txt">FocusKids</span>
        </div>

        <nav class="sb-nav">
          <p class="sb-section">PRINCIPAL</p>
          <a class="sb-item" [class.active]="tab==='clase'" (click)="tab='clase'">
            <mat-icon>grid_view</mat-icon> Mi clase
          </a>
          <a class="sb-item" [class.active]="tab==='reportes'" (click)="tab='reportes'">
            <mat-icon>bar_chart</mat-icon> Reportes
          </a>
          <a class="sb-item" [class.active]="tab==='asignaciones'" (click)="tab='asignaciones'">
            <mat-icon>assignment</mat-icon> Asignaciones
          </a>
          <a class="sb-item" [class.active]="tab==='logros'" (click)="tab='logros'">
            <mat-icon>emoji_events</mat-icon> Logros
          </a>

          <p class="sb-section">HERRAMIENTAS</p>
          <a class="sb-item" [class.active]="tab==='calendario'" (click)="tab='calendario'">
            <mat-icon>calendar_today</mat-icon> Calendario
          </a>
          <a class="sb-item" [class.active]="tab==='mensajes'" (click)="tab='mensajes'">
            <mat-icon>chat</mat-icon> Mensajes
          </a>
          <a class="sb-item" [class.active]="tab==='config'" (click)="tab='config'">
            <mat-icon>settings</mat-icon> Configuración
          </a>
        </nav>

        <div class="sb-user">
          <div class="sb-avatar">{{ iniciales }}</div>
          <div class="sb-user-info">
            <span class="sb-user-name">{{ auth.userName() }}</span>
            <span class="sb-user-role">Docente</span>
          </div>
          <button class="sb-logout" (click)="cerrarSesion()" title="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- ══ CONTENIDO PRINCIPAL ══ -->
      <main class="main">

        <!-- Top bar -->
        <div class="top-bar">
          <div>
            <h1 class="page-title">Mi Clase — 3° Grado B</h1>
            <p class="page-sub">{{ estudiantes.length }} estudiantes · Semana del 23-27 junio 2026</p>
          </div>
          <div class="top-actions">
            <button class="btn-week">Esta semana</button>
            <button class="btn-assign">
              <mat-icon>add</mat-icon> Asignar tarea
            </button>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-ico" style="background:#EDE9FE">🎮</span>
            <div>
              <p class="stat-val">{{ estudiantes.length }}</p>
              <p class="stat-lbl">Estudiantes activos</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#DCFCE7">📈</span>
            <div>
              <p class="stat-val">{{ avgPrecision }}%</p>
              <p class="stat-lbl">Promedio de precisión</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#FEF9C3">🕹️</span>
            <div>
              <p class="stat-val">{{ totalPartidas }}</p>
              <p class="stat-lbl">Partidas esta semana</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#FEF3C7">⚠️</span>
            <div>
              <p class="stat-val">{{ alertas.length }}</p>
              <p class="stat-lbl">Alertas de atención</p>
            </div>
          </div>
        </div>

        <!-- Panel principal -->
        <div class="content-grid">

          <!-- Tabla de progreso -->
          <div class="card table-card">
            <h2 class="card-title">Progreso individual de estudiantes</h2>
            <table class="prog-table">
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
                <tr *ngFor="let e of estudiantes">
                  <td class="td-name">
                    <span class="stu-avatar">{{ e.avatar }}</span>
                    {{ e.nombre }}
                  </td>
                  <td>{{ e.partidas }}</td>
                  <td [class.precision-low]="e.precision < 70"
                      [class.precision-warn]="e.precision >= 70 && e.precision < 80"
                      [class.precision-ok]="e.precision >= 80">
                    {{ e.precision }}%
                  </td>
                  <td>{{ e.xp }}</td>
                  <td>
                    <span class="badge" [ngClass]="badgeClass(e.estado)">{{ e.estado }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Panel derecho -->
          <div class="right-col">

            <!-- Top estudiantes -->
            <div class="card">
              <h2 class="card-title">Top estudiantes</h2>
              <div class="top-list">
                <div class="top-item" *ngFor="let e of topEstudiantes; let i = index">
                  <span class="medal">{{ ['🥇','🥈','🥉'][i] }}</span>
                  <span class="top-name">{{ e.nombre }}</span>
                  <span class="top-pct" [class.pct-gold]="i===0">{{ e.precision }}%</span>
                </div>
              </div>
            </div>

            <!-- Alertas -->
            <div class="card">
              <h2 class="card-title">Alertas</h2>
              <div class="alert-list">
                <div class="alert-item" *ngFor="let a of alertas" [class.alert-danger]="a.tipo==='danger'">
                  <span class="alert-avatar">{{ a.avatar }}</span>
                  <div>
                    <p class="alert-name">{{ a.nombre }}</p>
                    <p class="alert-msg">{{ a.mensaje }}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; height:100vh; }

    /* ══ LAYOUT ══ */
    .dash-page {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: 'Quicksand', sans-serif;
    }

    /* ══ SIDEBAR ══ */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: linear-gradient(180deg, #14532D 0%, #166534 60%, #15803D 100%);
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .sb-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sb-logo-ico { font-size: 22px; }
    .sb-logo-txt {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 17px; font-weight: 800; color: white;
    }

    .sb-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
    .sb-section {
      font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
      color: rgba(255,255,255,0.4); margin: 16px 8px 6px; padding: 0;
    }
    .sb-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 600;
      cursor: pointer; text-decoration: none;
      transition: all .18s; margin-bottom: 2px;
    }
    .sb-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sb-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .sb-item.active { background: rgba(255,255,255,0.15); color: white; }

    .sb-user {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .sb-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; color: white; flex-shrink: 0;
    }
    .sb-user-info { flex: 1; min-width: 0; }
    .sb-user-name {
      display: block; font-size: 13px; font-weight: 700;
      color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-user-role { font-size: 11px; color: rgba(255,255,255,0.5); }
    .sb-logout {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.4); padding: 4px;
      border-radius: 6px; transition: all .2s; display: flex;
    }
    .sb-logout:hover { color: white; background: rgba(255,255,255,0.1); }
    .sb-logout mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ══ MAIN ══ */
    .main {
      flex: 1;
      background: #F0EEFF;
      overflow-y: auto;
      padding: 28px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Top bar */
    .top-bar {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
    }
    .page-title {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 22px; font-weight: 800; color: #1E1B4B; margin: 0 0 2px;
    }
    .page-sub { font-size: 13px; color: #94A3B8; margin: 0; }
    .top-actions { display: flex; gap: 10px; align-items: center; }
    .btn-week {
      padding: 9px 18px; border-radius: 10px;
      border: 1.5px solid #C4B5FD; background: white;
      font-family: 'Quicksand',sans-serif; font-size: 13px; font-weight: 700;
      color: #4F46E5; cursor: pointer; transition: all .2s;
    }
    .btn-week:hover { background: #F5F3FF; }
    .btn-assign {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #166534, #15803D);
      font-family: 'Quicksand',sans-serif; font-size: 13px; font-weight: 700;
      color: white; cursor: pointer; transition: all .2s;
    }
    .btn-assign:hover { box-shadow: 0 4px 14px rgba(22,101,52,0.35); }
    .btn-assign mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Stats */
    .stats-grid {
      display: grid; grid-template-columns: repeat(4,1fr); gap: 14px;
    }
    .stat-card {
      background: white; border-radius: 16px;
      padding: 18px 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 2px 12px rgba(79,70,229,0.07);
    }
    .stat-ico {
      width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 22px;
    }
    .stat-val {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 24px; font-weight: 800; color: #1E1B4B; margin: 0;
    }
    .stat-lbl { font-size: 12px; color: #94A3B8; margin: 0; font-weight: 600; }

    /* Content grid */
    .content-grid {
      display: grid; grid-template-columns: 1fr 300px; gap: 18px;
      flex: 1;
    }

    /* Cards */
    .card {
      background: white; border-radius: 18px;
      padding: 22px 24px;
      box-shadow: 0 2px 12px rgba(79,70,229,0.07);
    }
    .card-title {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 15px; font-weight: 800; color: #1E1B4B;
      margin: 0 0 16px;
    }

    /* Tabla */
    .table-card { overflow: hidden; }
    .prog-table { width: 100%; border-collapse: collapse; }
    .prog-table thead tr {
      border-bottom: 1.5px solid #F1F5F9;
    }
    .prog-table th {
      font-size: 11px; font-weight: 700; letter-spacing: .8px;
      color: #94A3B8; padding: 0 12px 12px; text-align: left;
    }
    .prog-table tbody tr {
      border-bottom: 1px solid #F8FAFC;
      transition: background .15s;
    }
    .prog-table tbody tr:hover { background: #F8F7FF; }
    .prog-table tbody tr:last-child { border-bottom: none; }
    .prog-table td { padding: 12px; font-size: 14px; color: #334155; font-weight: 600; }
    .td-name { display: flex; align-items: center; gap: 10px; }
    .stu-avatar {
      width: 32px; height: 32px; border-radius: 10px;
      background: #F1F5F9;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }

    .precision-ok   { color: #16A34A; }
    .precision-warn { color: #D97706; }
    .precision-low  { color: #DC2626; }

    .badge {
      display: inline-block; padding: 4px 12px;
      border-radius: 20px; font-size: 12px; font-weight: 700;
    }
    .badge-excelente  { background: #DCFCE7; color: #15803D; }
    .badge-muybien    { background: #FEF9C3; color: #A16207; }
    .badge-necesita   { background: #FEE2E2; color: #B91C1C; }

    /* Panel derecho */
    .right-col { display: flex; flex-direction: column; gap: 16px; }

    /* Top list */
    .top-list { display: flex; flex-direction: column; gap: 12px; }
    .top-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 12px; background: #F8F7FF;
    }
    .medal { font-size: 20px; }
    .top-name { flex: 1; font-size: 14px; font-weight: 700; color: #334155; }
    .top-pct { font-size: 14px; font-weight: 800; color: #4F46E5; }
    .pct-gold { color: #D97706; }

    /* Alertas */
    .alert-list { display: flex; flex-direction: column; gap: 10px; }
    .alert-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; border-radius: 12px;
      background: #FFFBEB; border-left: 3px solid #F59E0B;
    }
    .alert-item.alert-danger {
      background: #FFF5F5; border-left-color: #EF4444;
    }
    .alert-avatar { font-size: 20px; margin-top: 2px; }
    .alert-name { font-size: 13px; font-weight: 800; color: #334155; margin: 0 0 2px; }
    .alert-msg  { font-size: 12px; color: #64748B; margin: 0; }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DocenteDashboardComponent {
  tab = 'clase';

  estudiantes: Estudiante[] = [
    { nombre: 'Mateo López',   avatar: '🐯', partidas: 47, precision: 92, xp: 680, estado: 'Excelente'     },
    { nombre: 'Sofía Pérez',   avatar: '🐰', partidas: 38, precision: 85, xp: 520, estado: 'Muy bien'      },
    { nombre: 'Carlos Ruiz',   avatar: '🦊', partidas: 22, precision: 61, xp: 290, estado: 'Necesita ayuda' },
    { nombre: 'Lucía Torres',  avatar: '🐼', partidas: 44, precision: 88, xp: 610, estado: 'Excelente'     },
    { nombre: 'Diego Mora',    avatar: '🐸', partidas: 15, precision: 54, xp: 180, estado: 'Necesita ayuda' },
  ];

  alertas: Alerta[] = [
    { nombre: 'Carlos Ruiz', avatar: '🦊', mensaje: 'Bajo rendimiento en Laberinto (3 días)', tipo: 'warn'   },
    { nombre: 'Diego Mora',  avatar: '🐸', mensaje: 'Sin actividad en los últimos 4 días',    tipo: 'danger' },
  ];

  get topEstudiantes() {
    return [...this.estudiantes].sort((a, b) => b.precision - a.precision).slice(0, 3);
  }
  get avgPrecision() {
    return Math.round(this.estudiantes.reduce((s, e) => s + e.precision, 0) / this.estudiantes.length);
  }
  get totalPartidas() {
    return this.estudiantes.reduce((s, e) => s + e.partidas, 0);
  }
  get iniciales() {
    const n = this.auth.userName();
    return n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'D';
  }

  badgeClass(estado: string) {
    if (estado === 'Excelente')     return 'badge-excelente';
    if (estado === 'Muy bien')      return 'badge-muybien';
    return 'badge-necesita';
  }

  cerrarSesion() { this.auth.logout(); }

  constructor(public auth: AuthService, private router: Router) {}
}
