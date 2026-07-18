import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, Usuario, PerfilNinoAdmin } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="admin-page">

      <!-- ══ SIDEBAR ══ -->
      <aside class="sidebar">
        <div class="sb-logo">
          <span class="sb-logo-ico">🧠</span>
          <span class="sb-logo-txt">FocusKids</span>
        </div>

        <nav class="sb-nav">
          <p class="sb-section">PANEL ADMIN</p>
          <a class="sb-item active">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a class="sb-item">
            <mat-icon>group</mat-icon> Usuarios
          </a>
          <a class="sb-item">
            <mat-icon>account_balance</mat-icon> Instituciones
          </a>
          <a class="sb-item">
            <mat-icon>sports_esports</mat-icon> Juegos
          </a>

          <p class="sb-section">SISTEMA</p>
          <a class="sb-item">
            <mat-icon>analytics</mat-icon> Analíticas
          </a>
          <a class="sb-item" [class.has-badge]="alertCount > 0">
            <mat-icon>notifications</mat-icon> Alertas
            <span class="sb-badge" *ngIf="alertCount > 0">{{ alertCount }}</span>
          </a>
          <a class="sb-item">
            <mat-icon>settings</mat-icon> Configuración
          </a>
          <a class="sb-item">
            <mat-icon>summarize</mat-icon> Reportes
          </a>
        </nav>

        <div class="sb-user">
          <div class="sb-avatar">{{ iniciales }}</div>
          <div class="sb-user-info">
            <span class="sb-user-name">{{ auth.userName() }}</span>
            <span class="sb-user-role">Administrador</span>
          </div>
          <button class="sb-logout" (click)="auth.logout()" title="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- ══ CONTENIDO PRINCIPAL ══ -->
      <main class="main">

        <!-- Top bar -->
        <div class="top-bar">
          <h1 class="page-title">Panel de Administración</h1>
          <div class="top-actions">
            <div class="search-wrap">
              <mat-icon class="search-ico">search</mat-icon>
              <input class="search-input" placeholder="Buscar usuarios..."
                     [(ngModel)]="busqueda" (ngModelChange)="filtrar()">
            </div>
            <button class="btn-new">
              <mat-icon>add</mat-icon> Nuevo usuario
            </button>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-ico" style="background:#EDE9FE">👥</span>
            <div>
              <p class="stat-val">{{ usuarios().length }}</p>
              <p class="stat-lbl">Total Usuarios</p>
              <p class="stat-trend trend-up">+48 este mes</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#DCFCE7">🎮</span>
            <div>
              <p class="stat-val">{{ ninosCount() }}</p>
              <p class="stat-lbl">Niños registrados</p>
              <p class="stat-trend trend-up">Perfiles activos</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#FEF9C3">🎓</span>
            <div>
              <p class="stat-val">{{ docentes() }}</p>
              <p class="stat-lbl">Docentes</p>
              <p class="stat-trend trend-up">+6 nuevos</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#FEE2E2">👨‍👩‍👧</span>
            <div>
              <p class="stat-val">{{ padres() }}</p>
              <p class="stat-lbl">Padres/Tutores</p>
              <p class="stat-trend trend-up">+30 nuevos</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#FEF3C7">⚠️</span>
            <div>
              <p class="stat-val">{{ alertCount }}</p>
              <p class="stat-lbl">Alertas activas</p>
              <p class="stat-trend trend-warn">Requieren acción</p>
            </div>
          </div>
        </div>

        <!-- Gestión de usuarios -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Gestión de usuarios</h2>
            <div class="filter-tabs">
              <button class="tab" [class.tab-active]="filtroRol === 'todos'"
                      (click)="setFiltro('todos')">Todos</button>
              <button class="tab" [class.tab-active]="filtroRol === 'DOCENTE'"
                      (click)="setFiltro('DOCENTE')">Docentes</button>
              <button class="tab" [class.tab-active]="filtroRol === 'PADRE'"
                      (click)="setFiltro('PADRE')">Padres</button>
              <button class="tab" [class.tab-active]="filtroRol === 'NINO'"
                      (click)="setFiltro('NINO')">Niños</button>
            </div>
          </div>

          <!-- Loading -->
          <div class="loading-row" *ngIf="loading">
            <div class="spinner"></div>
            <span>Cargando usuarios...</span>
          </div>

          <!-- Tabla -->
          <table class="users-table" *ngIf="!loading">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>ROL</th>
                <th>INSTITUCIÓN</th>
                <th>REGISTRO</th>
                <th>ÚLTIMO ACCESO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <!-- Filas para usuarios (Admin, Docente, Padre) -->
              <ng-container *ngIf="filtroRol !== 'NINO'">
                <tr *ngFor="let u of usuariosFiltrados">
                  <td class="td-user">
                    <div class="user-avatar">{{ initials(u.nombre) }}</div>
                    <div>
                      <p class="user-name">{{ u.nombre }}</p>
                      <p class="user-email">{{ u.email }}</p>
                    </div>
                  </td>
                  <td><span class="badge" [ngClass]="rolClass(u.rol)">{{ rolLabel(u.rol) }}</span></td>
                  <td class="td-gray">—</td>
                  <td class="td-gray">{{ u.fechaCreacion | date:'dd/MM/yyyy' }}</td>
                  <td class="td-gray">—</td>
                  <td>
                    <span class="badge" [ngClass]="u.activo ? 'badge-activo' : 'badge-inactivo'">
                      {{ u.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="td-actions">
                    <button class="action-btn edit-btn" title="Editar"><mat-icon>edit</mat-icon></button>
                    <button class="action-btn del-btn" title="Eliminar"><mat-icon>delete_outline</mat-icon></button>
                  </td>
                </tr>
                <tr *ngIf="usuariosFiltrados.length === 0">
                  <td colspan="7" class="empty-row">No hay usuarios para mostrar</td>
                </tr>
              </ng-container>

              <!-- Filas para niños (PerfilNino) -->
              <ng-container *ngIf="filtroRol === 'NINO'">
                <tr *ngFor="let n of ninosFiltrados">
                  <td class="td-user">
                    <div class="user-avatar nino-av">{{ avatarEmoji(n.avatar) }}</div>
                    <div>
                      <p class="user-name">{{ n.nombre }}</p>
                      <p class="user-email">{{ n.edad }} años{{ n.diagnostico ? ' · ' + n.diagnostico : '' }}</p>
                    </div>
                  </td>
                  <td><span class="badge badge-nino">Niño</span></td>
                  <td class="td-gray">{{ n.padre?.usuario?.nombre ?? '—' }}</td>
                  <td class="td-gray">—</td>
                  <td class="td-gray">—</td>
                  <td>
                    <span class="badge" [ngClass]="n.activo ? 'badge-activo' : 'badge-inactivo'">
                      {{ n.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="td-actions">
                    <button class="action-btn edit-btn" title="Editar"><mat-icon>edit</mat-icon></button>
                    <button class="action-btn del-btn" title="Eliminar"><mat-icon>delete_outline</mat-icon></button>
                  </td>
                </tr>
                <tr *ngIf="ninosFiltrados.length === 0">
                  <td colspan="7" class="empty-row">No hay perfiles de niños registrados</td>
                </tr>
              </ng-container>
            </tbody>
          </table>

          <!-- Footer tabla -->
          <div class="table-footer" *ngIf="!loading && usuariosFiltrados.length > 0">
            <span class="footer-info">
              Mostrando {{ usuariosFiltrados.length }} de {{ usuarios().length }} usuarios
            </span>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    :host { display:block; height:100vh; }

    /* ══ LAYOUT ══ */
    .admin-page {
      display: flex; height: 100vh; overflow: hidden;
      font-family: 'Quicksand', sans-serif;
    }

    /* ══ SIDEBAR ══ */
    .sidebar {
      width: 220px; min-width: 220px;
      background: linear-gradient(180deg, #1a0f3a 0%, #1e1b4b 60%, #2d1272 100%);
      display: flex; flex-direction: column;
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
      color: rgba(255,255,255,0.35); margin: 16px 8px 6px; padding: 0;
    }
    .sb-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      color: rgba(255,255,255,0.60); font-size: 14px; font-weight: 600;
      cursor: pointer; text-decoration: none;
      transition: all .18s; margin-bottom: 2px; position: relative;
    }
    .sb-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sb-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .sb-item.active {
      background: rgba(139,92,246,0.3); color: white;
      box-shadow: inset 0 0 0 1px rgba(139,92,246,0.4);
    }
    .sb-badge {
      margin-left: auto; background: #EF4444; color: white;
      font-size: 11px; font-weight: 800; border-radius: 10px;
      padding: 1px 7px;
    }

    .sb-user {
      display: flex; align-items: center; gap: 10px; padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .sb-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(139,92,246,0.4);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; color: white; flex-shrink: 0;
    }
    .sb-user-info { flex: 1; min-width: 0; }
    .sb-user-name {
      display: block; font-size: 13px; font-weight: 700; color: white;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-user-role { font-size: 11px; color: rgba(255,255,255,0.45); }
    .sb-logout {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.35); padding: 4px; border-radius: 6px;
      transition: all .2s; display: flex;
    }
    .sb-logout:hover { color: white; background: rgba(255,255,255,0.1); }
    .sb-logout mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ══ MAIN ══ */
    .main {
      flex: 1; background: #F0EEFF; overflow-y: auto;
      padding: 28px 32px; display: flex; flex-direction: column; gap: 20px;
    }

    /* Top bar */
    .top-bar {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .page-title {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 22px; font-weight: 800; color: #1E1B4B; margin: 0;
    }
    .top-actions { display: flex; gap: 12px; align-items: center; }
    .search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1.5px solid #DDD6FE; border-radius: 12px;
      padding: 8px 14px;
    }
    .search-ico { font-size: 18px; color: #94A3B8; }
    .search-input {
      border: none; outline: none; font-size: 13px; font-weight: 600;
      color: #334155; background: transparent; width: 180px;
      font-family: 'Quicksand',sans-serif;
    }
    .search-input::placeholder { color: #94A3B8; }
    .btn-new {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; border-radius: 12px; border: none;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      font-family: 'Quicksand',sans-serif; font-size: 13px; font-weight: 700;
      color: white; cursor: pointer; transition: all .2s;
    }
    .btn-new:hover { box-shadow: 0 4px 14px rgba(79,70,229,0.35); }
    .btn-new mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Stats */
    .stats-grid {
      display: grid; grid-template-columns: repeat(5,1fr); gap: 14px;
    }
    .stat-card {
      background: white; border-radius: 16px; padding: 16px 18px;
      display: flex; align-items: flex-start; gap: 12px;
      box-shadow: 0 2px 12px rgba(79,70,229,0.07);
    }
    .stat-ico {
      width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .stat-val {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 22px; font-weight: 800; color: #1E1B4B; margin: 0;
    }
    .stat-lbl { font-size: 11px; color: #94A3B8; margin: 0; font-weight: 600; }
    .stat-trend { font-size: 11px; margin: 2px 0 0; font-weight: 700; }
    .trend-up   { color: #16A34A; }
    .trend-warn { color: #D97706; }

    /* Card */
    .card {
      background: white; border-radius: 18px;
      box-shadow: 0 2px 12px rgba(79,70,229,0.07);
      overflow: hidden;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 0;
    }
    .card-title {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 15px; font-weight: 800; color: #1E1B4B; margin: 0;
    }

    /* Filter tabs */
    .filter-tabs { display: flex; gap: 4px; }
    .tab {
      padding: 6px 16px; border-radius: 8px; border: none;
      background: #F1F5F9; font-family: 'Quicksand',sans-serif;
      font-size: 13px; font-weight: 700; color: #64748B; cursor: pointer;
      transition: all .18s;
    }
    .tab:hover { background: #E2E8F0; }
    .tab-active { background: #4F46E5; color: white; }

    /* Loading */
    .loading-row {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 40px; color: #94A3B8; font-size: 14px;
    }
    .spinner {
      width: 20px; height: 20px; border: 2px solid #E2E8F0;
      border-top-color: #4F46E5; border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Tabla */
    .users-table {
      width: 100%; border-collapse: collapse; margin-top: 14px;
    }
    .users-table thead tr { border-bottom: 1.5px solid #F1F5F9; }
    .users-table th {
      font-size: 11px; font-weight: 700; letter-spacing: .8px;
      color: #94A3B8; padding: 10px 20px; text-align: left;
    }
    .users-table tbody tr {
      border-bottom: 1px solid #F8FAFC; transition: background .15s;
    }
    .users-table tbody tr:hover { background: #F8F7FF; }
    .users-table tbody tr:last-child { border-bottom: none; }
    .users-table td { padding: 14px 20px; font-size: 14px; color: #334155; }
    .td-gray { color: #94A3B8; font-size: 13px; }

    /* User cell */
    .td-user { display: flex; align-items: center; gap: 12px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; color: white; flex-shrink: 0;
    }
    .nino-av { background: linear-gradient(135deg, #A78BFA, #7C3AED); font-size: 20px; }
    .user-name  { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0; }
    .user-email { font-size: 12px; color: #94A3B8; margin: 0; }

    /* Badges */
    .badge {
      display: inline-block; padding: 4px 12px;
      border-radius: 20px; font-size: 12px; font-weight: 700;
    }
    .badge-docente  { background: #DCFCE7; color: #15803D; }
    .badge-padre    { background: #FEF9C3; color: #A16207; }
    .badge-nino     { background: #EDE9FE; color: #4F46E5; }
    .badge-admin    { background: #FEE2E2; color: #B91C1C; }
    .badge-activo   { background: #DCFCE7; color: #15803D; }
    .badge-inactivo { background: #FEE2E2; color: #B91C1C; }

    /* Actions */
    .td-actions { display: flex; gap: 6px; align-items: center; }
    .action-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .18s;
    }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .edit-btn { background: #EEF2FF; color: #4F46E5; }
    .edit-btn:hover { background: #4F46E5; color: white; }
    .del-btn  { background: #FEF2F2; color: #EF4444; }
    .del-btn:hover  { background: #EF4444; color: white; }

    .empty-row { text-align: center; color: #94A3B8; padding: 32px; }

    /* Footer */
    .table-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; border-top: 1px solid #F1F5F9;
    }
    .footer-info { font-size: 13px; color: #94A3B8; font-weight: 600; }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(3,1fr); }
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2,1fr); }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  ninos    = signal<PerfilNinoAdmin[]>([]);
  loading = true;
  busqueda = '';
  filtroRol = 'todos';
  usuariosFiltrados: Usuario[] = [];
  ninosFiltrados:    PerfilNinoAdmin[] = [];

  // Stats computadas
  ninosCount = computed(() => this.ninos().length);
  docentes   = computed(() => this.usuarios().filter(u => u.rol === 'DOCENTE').length);
  padres     = computed(() => this.usuarios().filter(u => u.rol === 'PADRE').length);
  alertCount = 0;

  private readonly AVATAR_MAP: Record<string, string> = {
    fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
    unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
    bear:'🐻', mouse:'🐭'
  };
  avatarEmoji(key?: string | null): string { return this.AVATAR_MAP[key ?? ''] ?? '👤'; }

  get iniciales() {
    const n = this.auth.userName();
    return n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'A';
  }

  constructor(public auth: AuthService, private adminService: AdminService) {}

  ngOnInit() {
    // Carga usuarios y niños en paralelo
    this.adminService.listarUsuarios().subscribe({
      next: data => {
        this.usuarios.set(data);
        this.alertCount = data.filter(u => !u.activo).length;
        this.filtrar();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.adminService.listarNinos().subscribe({
      next: data => {
        this.ninos.set(data);
        this.ninosFiltrados = data;
      },
      error: () => {}
    });
  }

  setFiltro(rol: string) {
    this.filtroRol = rol;
    this.filtrar();
  }

  filtrar() {
    const q = this.busqueda.trim().toLowerCase();

    if (this.filtroRol === 'NINO') {
      this.ninosFiltrados = q
        ? this.ninos().filter(n => n.nombre.toLowerCase().includes(q))
        : this.ninos();
      return;
    }

    let lista = this.usuarios();
    if (this.filtroRol !== 'todos') {
      lista = lista.filter(u => u.rol === this.filtroRol);
    }
    if (q) {
      lista = lista.filter(u =>
        u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    this.usuariosFiltrados = lista;
  }

  initials(nombre: string) {
    return nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  rolLabel(rol: string) {
    const map: Record<string, string> = {
      DOCENTE: 'Docente', PADRE: 'Padre/Tutor',
      NINO: 'Niño', ADMINISTRADOR: 'Admin'
    };
    return map[rol] ?? rol;
  }

  rolClass(rol: string) {
    return {
      'badge-docente': rol === 'DOCENTE',
      'badge-padre'  : rol === 'PADRE',
      'badge-nino'   : rol === 'NINO',
      'badge-admin'  : rol === 'ADMINISTRADOR',
    };
  }
}
