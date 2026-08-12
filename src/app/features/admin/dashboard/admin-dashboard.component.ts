import { Component, OnInit, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, EMPTY } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, Usuario, PerfilNinoAdmin, UsuarioEditRequest, UsuarioRol } from '../../../core/services/admin.service';
import { AdminUsuariosComponent } from '../usuarios/admin-usuarios.component';
import { environment } from '../../../../environments/environment';

interface Juego { id: number; nombre: string; tipo: string; descripcion?: string; activo?: boolean; }

type Tab = 'dashboard' | 'usuarios' | 'juegos' | 'analiticas' | 'alertas' | 'reportes' | 'instituciones';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, AdminUsuariosComponent],
  template: `
<div class="admin-page">

  <!-- ══ SIDEBAR ══ -->
  <aside class="sidebar">
    <div class="sb-logo">
      <span>🧠</span>
      <span class="sb-logo-txt">FocusKids</span>
    </div>

    <nav class="sb-nav">
      <p class="sb-section">PANEL ADMIN</p>
      <button class="sb-item" [class.active]="tab()==='dashboard'"      (click)="setTab('dashboard')">      <mat-icon>dashboard</mat-icon>       Dashboard</button>
      <button class="sb-item" [class.active]="tab()==='usuarios'"       (click)="setTab('usuarios')">       <mat-icon>group</mat-icon>            Usuarios</button>
      <button class="sb-item" [class.active]="tab()==='instituciones'"  (click)="setTab('instituciones')">  <mat-icon>account_balance</mat-icon>  Instituciones</button>
      <button class="sb-item" [class.active]="tab()==='juegos'"         (click)="irJuegos()">               <mat-icon>sports_esports</mat-icon>   Juegos</button>
      <p class="sb-section">SISTEMA</p>
      <button class="sb-item" [class.active]="tab()==='analiticas'"     (click)="setTab('analiticas')">     <mat-icon>analytics</mat-icon>        Analíticas</button>
      <button class="sb-item" [class.active]="tab()==='alertas'"        (click)="setTab('alertas')">
        <mat-icon>notifications</mat-icon> Alertas
        @if (inactivos().length > 0) { <span class="sb-badge">{{ inactivos().length }}</span> }
      </button>
      <button class="sb-item" (click)="router.navigate(['/admin/config'])"><mat-icon>settings</mat-icon> Config. Juegos</button>
      <button class="sb-item" [class.active]="tab()==='reportes'"       (click)="setTab('reportes')">       <mat-icon>summarize</mat-icon>         Reportes</button>
    </nav>

    <div class="sb-user">
      <div class="sb-avatar">{{ iniciales }}</div>
      <div class="sb-user-info">
        <span class="sb-user-name">{{ auth.userName() }}</span>
        <span class="sb-user-role">Administrador</span>
      </div>
      <button class="sb-logout" (click)="auth.logout()" title="Cerrar sesión"><mat-icon>logout</mat-icon></button>
    </div>
  </aside>

  <!-- ══ MAIN ══ -->
  <main class="main">

    <!-- ── TOP BAR ── -->
    <div class="top-bar">
      <h1 class="page-title">{{ tabTitulo }}</h1>
      <div class="top-actions">
        @if (tab === 'dashboard' || tab === 'usuarios') {
          <div class="search-wrap">
            <mat-icon class="search-ico">search</mat-icon>
            <input class="search-input" placeholder="Buscar usuarios..."
                   [(ngModel)]="busqueda" (ngModelChange)="filtrar()">
          </div>
        }
        <button class="btn-new" (click)="abrirNuevoUsuario()">
          <mat-icon>add</mat-icon> Nuevo usuario
        </button>
      </div>
    </div>

    <!-- ══════════════════════════ DASHBOARD ══════════════════════════ -->
    @if (tab() === 'dashboard') {

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-ico" style="background:#EDE9FE">👥</span>
          <div>
            <p class="stat-val">{{ totalUsuarios() }}</p>
            <p class="stat-lbl">Total Usuarios</p>
            <p class="stat-trend trend-up">Usuarios + niños</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#DCFCE7">🎮</span>
          <div>
            <p class="stat-val">{{ ninos().length }}</p>
            <p class="stat-lbl">Niños registrados</p>
            <p class="stat-trend trend-up">Perfiles activos</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#FEF9C3">🎓</span>
          <div>
            <p class="stat-val">{{ docentes() }}</p>
            <p class="stat-lbl">Docentes</p>
            <p class="stat-trend trend-up">{{ docentesActivos() }} activos</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#FEE2E2">👨‍👩‍👧</span>
          <div>
            <p class="stat-val">{{ padres() }}</p>
            <p class="stat-lbl">Padres/Tutores</p>
            <p class="stat-trend trend-up">{{ padresActivos() }} activos</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#FEF3C7">⚠️</span>
          <div>
            <p class="stat-val">{{ inactivos().length }}</p>
            <p class="stat-lbl">Usuarios inactivos</p>
            <p class="stat-trend trend-warn">Requieren revisión</p>
          </div>
        </div>
      </div>

      <!-- Tabla rápida -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestión de usuarios</h2>
          <div class="filter-tabs">
            <button class="tab" [class.tab-active]="filtroRol==='todos'"      (click)="setFiltro('todos')">Todos</button>
            <button class="tab" [class.tab-active]="filtroRol==='DOCENTE'"    (click)="setFiltro('DOCENTE')">Docentes</button>
            <button class="tab" [class.tab-active]="filtroRol==='PADRE'"      (click)="setFiltro('PADRE')">Padres</button>
            <button class="tab" [class.tab-active]="filtroRol==='NINO'"       (click)="setFiltro('NINO')">Niños</button>
            <button class="tab" [class.tab-active]="filtroRol==='ADMINISTRADOR'" (click)="setFiltro('ADMINISTRADOR')">Admin</button>
          </div>
        </div>

        @if (loading) {
          <div class="loading-row"><div class="spinner"></div><span>Cargando usuarios...</span></div>
        } @else {
          <table class="users-table">
            <thead><tr>
              <th>USUARIO</th><th>ROL</th><th>REGISTRO</th><th>ESTADO</th><th>ACCIONES</th>
            </tr></thead>
            <tbody>
              @if (filtroRol !== 'NINO') {
                @for (u of usuariosFiltrados; track u.id) {
                  <tr>
                    <td class="td-user">
                      <div class="user-avatar">{{ initials(u.nombre) }}</div>
                      <div><p class="user-name">{{ u.nombre }}</p><p class="user-email">{{ u.email }}</p></div>
                    </td>
                    <td><span class="badge" [ngClass]="rolClass(u.rol)">{{ rolLabel(u.rol) }}</span></td>
                    <td class="td-gray">{{ u.fechaCreacion | date:'dd/MM/yyyy' }}</td>
                    <td><span class="badge" [ngClass]="u.activo ? 'badge-activo' : 'badge-inactivo'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td class="td-actions">
                      <button class="action-btn edit-btn" title="Editar" (click)="abrirEditar(u)"><mat-icon>edit</mat-icon></button>
                      <button class="action-btn del-btn"  title="Eliminar" (click)="abrirEliminar(u, 'usuario')"><mat-icon>delete_outline</mat-icon></button>
                    </td>
                  </tr>
                }
                @if (usuariosFiltrados.length === 0) {
                  <tr><td colspan="5" class="empty-row">No hay usuarios para mostrar</td></tr>
                }
              } @else {
                @for (n of ninosFiltrados; track n.id) {
                  <tr>
                    <td class="td-user">
                      <div class="user-avatar nino-av">{{ avatarEmoji(n.avatar) }}</div>
                      <div><p class="user-name">{{ n.nombre }}</p><p class="user-email">{{ n.edad }} años{{ n.diagnostico ? ' · ' + n.diagnostico : '' }}</p></div>
                    </td>
                    <td><span class="badge badge-nino">Niño</span></td>
                    <td class="td-gray">{{ n.padre?.usuario?.nombre ?? '—' }}</td>
                    <td><span class="badge" [ngClass]="n.activo ? 'badge-activo' : 'badge-inactivo'">{{ n.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td class="td-actions">
                      <button class="action-btn del-btn" title="Eliminar perfil" (click)="abrirEliminarNino(n)"><mat-icon>delete_outline</mat-icon></button>
                    </td>
                  </tr>
                }
                @if (ninosFiltrados.length === 0) {
                  <tr><td colspan="5" class="empty-row">No hay perfiles de niños registrados</td></tr>
                }
              }
            </tbody>
          </table>
          <div class="table-footer">
            <span class="footer-info">
              Mostrando {{ filtroRol === 'NINO' ? ninosFiltrados.length : usuariosFiltrados.length }}
              · Total: {{ totalUsuarios() }} registros (incluye niños)
            </span>
            <button class="btn-ver-todo" (click)="setTab('usuarios')">Ver gestión completa →</button>
          </div>
        }
      </div>
    }

    <!-- ══════════════════════════ USUARIOS ══════════════════════════ -->
    @if (tab() === 'usuarios') {
      <app-admin-usuarios />
    }

    <!-- ══════════════════════════ INSTITUCIONES ══════════════════════════ -->
    @if (tab() === 'instituciones') {
      <div class="placeholder-card">
        <div class="ph-ico">🏫</div>
        <h2>Módulo de Instituciones</h2>
        <p>Este módulo está en desarrollo. Permitirá gestionar las instituciones educativas vinculadas a la plataforma, asociar docentes y grupos de estudiantes.</p>
        <div class="ph-info-grid">
          <div class="ph-info-item"><span class="ph-info-lbl">Docentes registrados</span><span class="ph-info-val">{{ docentes() }}</span></div>
          <div class="ph-info-item"><span class="ph-info-lbl">Padres/Tutores</span><span class="ph-info-val">{{ padres() }}</span></div>
          <div class="ph-info-item"><span class="ph-info-lbl">Niños en plataforma</span><span class="ph-info-val">{{ ninos().length }}</span></div>
        </div>
      </div>
    }

    <!-- ══════════════════════════ JUEGOS ══════════════════════════ -->
    @if (tab() === 'juegos') {
      <div class="card" style="padding:22px 24px">
        <div class="card-header" style="margin-bottom:18px">
          <h2 class="card-title">🎮 Catálogo de juegos</h2>
          <span class="stat-lbl">{{ juegos.length }} juegos registrados</span>
        </div>
        @if (loadingJuegos) {
          <div class="loading-row"><div class="spinner"></div><span>Cargando juegos...</span></div>
        } @else if (juegos.length === 0) {
          <div class="empty-row" style="padding:40px;text-align:center;color:#94A3B8">No hay juegos registrados.</div>
        } @else {
          <div class="juegos-grid">
            @for (j of juegos; track j.id) {
              <div class="juego-card">
                <div class="jc-ico">{{ juegoIco(j.nombre) }}</div>
                <div class="jc-nombre">{{ j.nombre }}</div>
                <div class="jc-tipo">{{ j.tipo ?? '—' }}</div>
                @if (j.descripcion) { <div class="jc-desc">{{ j.descripcion }}</div> }
                <span class="badge" [ngClass]="j.activo !== false ? 'badge-activo' : 'badge-inactivo'">
                  {{ j.activo !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- ══════════════════════════ ANALÍTICAS ══════════════════════════ -->
    @if (tab() === 'analiticas') {
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-ico" style="background:#EDE9FE">👥</span>
          <div><p class="stat-val">{{ totalUsuarios() }}</p><p class="stat-lbl">Total registros</p></div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#DCFCE7">✅</span>
          <div><p class="stat-val">{{ activos() }}</p><p class="stat-lbl">Usuarios activos</p><p class="stat-trend trend-up">{{ pctActivos() }}%</p></div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#FEE2E2">❌</span>
          <div><p class="stat-val">{{ inactivos().length }}</p><p class="stat-lbl">Usuarios inactivos</p><p class="stat-trend trend-warn">{{ pctInactivos() }}%</p></div>
        </div>
        <div class="stat-card">
          <span class="stat-ico" style="background:#FEF9C3">🎮</span>
          <div><p class="stat-val">{{ ninos().length }}</p><p class="stat-lbl">Niños</p></div>
        </div>
      </div>

      <div class="analiticas-grid">
        <div class="card" style="padding:22px">
          <h3 class="card-title" style="margin-bottom:16px">Distribución por rol</h3>
          @for (r of rolesData(); track r.rol) {
            <div class="rol-bar-row">
              <span class="rol-bar-lbl">{{ r.label }}</span>
              <div class="rol-bar-wrap">
                <div class="rol-bar-fill" [style.width]="r.pct+'%'" [style.background]="r.color"></div>
              </div>
              <span class="rol-bar-cnt">{{ r.count }}</span>
            </div>
          }
        </div>
        <div class="card" style="padding:22px">
          <h3 class="card-title" style="margin-bottom:16px">Estado de cuentas</h3>
          <div class="estado-donut">
            <div class="donut-ring">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#F1F5F9" stroke-width="12"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke="#22C55E" stroke-width="12"
                  stroke-dasharray="{{ donutActivos() }} {{ donutTotal() }}"
                  stroke-dashoffset="0" transform="rotate(-90 40 40)"/>
              </svg>
              <div class="donut-label">
                <span class="donut-pct">{{ pctActivos() }}%</span>
                <span class="donut-sub">activos</span>
              </div>
            </div>
            <div class="donut-legend">
              <div class="dl-row"><span class="dl-dot" style="background:#22C55E"></span>Activos: {{ activos() }}</div>
              <div class="dl-row"><span class="dl-dot" style="background:#EF4444"></span>Inactivos: {{ inactivos().length }}</div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════ ALERTAS ══════════════════════════ -->
    @if (tab() === 'alertas') {
      <div class="card" style="padding:22px 24px">
        <div class="card-header" style="margin-bottom:18px">
          <h2 class="card-title">⚠️ Usuarios inactivos</h2>
          <span class="badge badge-inactivo">{{ inactivos().length }} alertas</span>
        </div>
        @if (inactivos().length === 0) {
          <div class="empty-row" style="padding:40px;text-align:center;color:#94A3B8">✅ No hay usuarios inactivos. Todo en orden.</div>
        } @else {
          <table class="users-table">
            <thead><tr><th>USUARIO</th><th>ROL</th><th>REGISTRO</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead>
            <tbody>
              @for (u of inactivos(); track u.id) {
                <tr>
                  <td class="td-user">
                    <div class="user-avatar">{{ initials(u.nombre) }}</div>
                    <div><p class="user-name">{{ u.nombre }}</p><p class="user-email">{{ u.email }}</p></div>
                  </td>
                  <td><span class="badge" [ngClass]="rolClass(u.rol)">{{ rolLabel(u.rol) }}</span></td>
                  <td class="td-gray">{{ u.fechaCreacion | date:'dd/MM/yyyy' }}</td>
                  <td><span class="badge badge-inactivo">Inactivo</span></td>
                  <td class="td-actions">
                    <button class="btn-activar" (click)="toggleActivo(u)">Activar</button>
                    <button class="action-btn edit-btn" (click)="abrirEditar(u)"><mat-icon>edit</mat-icon></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- ══════════════════════════ REPORTES ══════════════════════════ -->
    @if (tab() === 'reportes') {
      <div class="reportes-wrap">
        <div class="card" style="padding:28px;text-align:center">
          <div style="font-size:3rem;margin-bottom:12px">📋</div>
          <h2 class="card-title" style="margin-bottom:8px;font-size:18px">Logs de auditoría</h2>
          <p style="color:#64748B;font-size:14px;margin-bottom:20px">Registro completo de acciones del sistema con filtros por fecha, acción y usuario. Exportable a CSV.</p>
          <button class="btn-new" (click)="router.navigate(['/admin/logs'])">
            <mat-icon>open_in_new</mat-icon> Abrir logs de auditoría
          </button>
        </div>
        <div class="stats-grid" style="margin-top:0">
          <div class="stat-card">
            <span class="stat-ico" style="background:#EDE9FE">👥</span>
            <div><p class="stat-val">{{ totalUsuarios() }}</p><p class="stat-lbl">Usuarios totales</p></div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#FEE2E2">⚠️</span>
            <div><p class="stat-val">{{ inactivos().length }}</p><p class="stat-lbl">Inactivos</p></div>
          </div>
          <div class="stat-card">
            <span class="stat-ico" style="background:#DCFCE7">🎮</span>
            <div><p class="stat-val">{{ juegos.length }}</p><p class="stat-lbl">Juegos</p></div>
          </div>
        </div>
      </div>
    }

  </main>
</div>

<!-- ══════════ MODAL: EDITAR USUARIO ══════════ -->
@if (editando) {
  <div class="modal-overlay" (click)="cerrarEditar()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">✏️ Editar usuario</h3>
      <div class="form-group">
        <label>Nombre</label>
        <input class="form-input" [(ngModel)]="editNombre" placeholder="Nombre completo"/>
      </div>
      <div class="form-group">
        <label>Rol</label>
        <select class="form-input" [(ngModel)]="editRol">
          <option value="PADRE">Padre/Tutor</option>
          <option value="DOCENTE">Docente</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>
      </div>
      <div class="form-group form-row">
        <label>Estado</label>
        <label class="toggle-label">
          <input type="checkbox" [(ngModel)]="editActivo"/>
          {{ editActivo ? 'Activo' : 'Inactivo' }}
        </label>
      </div>
      @if (editError) { <p class="form-error">{{ editError }}</p> }
      <div class="modal-actions">
        <button class="btn-cancel" (click)="cerrarEditar()">Cancelar</button>
        <button class="btn-save" [disabled]="guardando" (click)="guardarEdicion()">
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ══════════ MODAL: CONFIRMAR ELIMINAR ══════════ -->
@if (eliminandoId !== null) {
  <div class="modal-overlay" (click)="cerrarEliminar()">
    <div class="modal-box modal-danger" (click)="$event.stopPropagation()">
      <h3 class="modal-title">🗑️ Eliminar usuario</h3>
      <p style="color:#64748B;margin-bottom:20px">¿Estás seguro de eliminar a <strong>{{ eliminandoNombre }}</strong>? Esta acción no se puede deshacer.</p>
      @if (editError) { <p class="form-error">{{ editError }}</p> }
      <div class="modal-actions">
        <button class="btn-cancel" (click)="cerrarEliminar()">Cancelar</button>
        <button class="btn-delete" [disabled]="guardando" (click)="confirmarEliminar()">
          {{ guardando ? 'Eliminando…' : 'Sí, eliminar' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ══════════ MODAL: NUEVO USUARIO ══════════ -->
@if (modalNuevo) {
  <div class="modal-overlay" (click)="cerrarNuevo()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">➕ Nuevo usuario</h3>
      <div class="form-group">
        <label>Nombre completo</label>
        <input class="form-input" [(ngModel)]="nuevoNombre" placeholder="Nombre completo"/>
      </div>
      <div class="form-group">
        <label>Correo electrónico</label>
        <input class="form-input" type="email" [(ngModel)]="nuevoEmail" placeholder="correo@ejemplo.com"/>
      </div>
      <div class="form-group">
        <label>Contraseña</label>
        <input class="form-input" type="password" [(ngModel)]="nuevoPassword" placeholder="Mínimo 6 caracteres"/>
      </div>
      <div class="form-group">
        <label>Rol</label>
        <select class="form-input" [(ngModel)]="nuevoRol">
          <option value="PADRE">Padre/Tutor</option>
          <option value="DOCENTE">Docente</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>
      </div>
      @if (editError) { <p class="form-error">{{ editError }}</p> }
      @if (nuevoOk) { <p class="form-ok">✅ Usuario creado correctamente.</p> }
      <div class="modal-actions">
        <button class="btn-cancel" (click)="cerrarNuevo()">Cancelar</button>
        <button class="btn-save" [disabled]="guardando" (click)="crearUsuario()">
          {{ guardando ? 'Creando…' : 'Crear usuario' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    :host { display:block; height:100vh; }
    *{ box-sizing:border-box; margin:0; padding:0; }
    .admin-page { display:flex; height:100vh; overflow:hidden; font-family:'Quicksand',sans-serif; }

    /* ── SIDEBAR ── */
    .sidebar { width:220px; min-width:220px; background:linear-gradient(180deg,#1a0f3a,#1e1b4b 60%,#2d1272); display:flex; flex-direction:column; }
    .sb-logo { display:flex; align-items:center; gap:10px; padding:24px 20px 20px; border-bottom:1px solid rgba(255,255,255,.08); font-size:17px; font-weight:800; color:white; }
    .sb-logo-txt { font-family:'Baloo 2',sans-serif; }
    .sb-nav { flex:1; padding:16px 12px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
    .sb-section { font-size:10px; font-weight:700; letter-spacing:1.2px; color:rgba(255,255,255,.35); margin:16px 8px 4px; }
    .sb-item { display:flex; align-items:center; gap:10px; width:100%; background:none; border:none;
               padding:10px 12px; border-radius:10px; color:rgba(255,255,255,.6); font-size:14px; font-weight:600;
               cursor:pointer; text-align:left; transition:all .18s; position:relative; font-family:'Quicksand',sans-serif; }
    .sb-item mat-icon { font-size:18px; width:18px; height:18px; }
    .sb-item:hover { background:rgba(255,255,255,.08); color:white; }
    .sb-item.active { background:rgba(139,92,246,.3); color:white; box-shadow:inset 0 0 0 1px rgba(139,92,246,.4); }
    .sb-badge { margin-left:auto; background:#EF4444; color:white; font-size:11px; font-weight:800; border-radius:10px; padding:1px 7px; }
    .sb-user { display:flex; align-items:center; gap:10px; padding:16px; border-top:1px solid rgba(255,255,255,.08); }
    .sb-avatar { width:36px; height:36px; border-radius:10px; background:rgba(139,92,246,.4); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:white; flex-shrink:0; }
    .sb-user-info { flex:1; min-width:0; }
    .sb-user-name { display:block; font-size:13px; font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sb-user-role { font-size:11px; color:rgba(255,255,255,.45); }
    .sb-logout { background:none; border:none; cursor:pointer; color:rgba(255,255,255,.35); padding:4px; border-radius:6px; display:flex; transition:all .2s; }
    .sb-logout:hover { color:white; background:rgba(255,255,255,.1); }

    /* ── MAIN ── */
    .main { flex:1; background:#F0EEFF; overflow-y:auto; padding:28px 32px; display:flex; flex-direction:column; gap:20px; }
    .top-bar { display:flex; justify-content:space-between; align-items:center; gap:16px; }
    .page-title { font-family:'Baloo 2',sans-serif; font-size:22px; font-weight:800; color:#1E1B4B; }
    .top-actions { display:flex; gap:12px; align-items:center; }
    .search-wrap { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid #DDD6FE; border-radius:12px; padding:8px 14px; }
    .search-ico { font-size:18px; color:#94A3B8; }
    .search-input { border:none; outline:none; font-size:13px; font-weight:600; color:#334155; background:transparent; width:180px; font-family:'Quicksand',sans-serif; }
    .btn-new { display:flex; align-items:center; gap:6px; padding:10px 18px; border-radius:12px; border:none;
               background:linear-gradient(135deg,#4F46E5,#7C3AED); font-family:'Quicksand',sans-serif;
               font-size:13px; font-weight:700; color:white; cursor:pointer; transition:all .2s; }
    .btn-new:hover { box-shadow:0 4px 14px rgba(79,70,229,.35); }
    .btn-new mat-icon { font-size:16px; width:16px; height:16px; }
    .btn-ver-todo { background:#EDE9FE; color:#4F46E5; border:none; border-radius:8px; padding:6px 14px; font-size:13px; font-weight:700; cursor:pointer; font-family:'Quicksand',sans-serif; }

    /* ── STATS ── */
    .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
    @media(max-width:1200px){ .stats-grid{ grid-template-columns:repeat(3,1fr); } }
    @media(max-width:900px){ .stats-grid{ grid-template-columns:repeat(2,1fr); } }
    .stat-card { background:white; border-radius:16px; padding:16px 18px; display:flex; align-items:flex-start; gap:12px; box-shadow:0 2px 12px rgba(79,70,229,.07); }
    .stat-ico { width:42px; height:42px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:20px; }
    .stat-val { font-family:'Baloo 2',sans-serif; font-size:22px; font-weight:800; color:#1E1B4B; }
    .stat-lbl { font-size:11px; color:#94A3B8; font-weight:600; }
    .stat-trend { font-size:11px; margin-top:2px; font-weight:700; }
    .trend-up { color:#16A34A; }
    .trend-warn { color:#D97706; }

    /* ── CARD ── */
    .card { background:white; border-radius:18px; box-shadow:0 2px 12px rgba(79,70,229,.07); overflow:hidden; }
    .card-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 0; }
    .card-title { font-family:'Baloo 2',sans-serif; font-size:15px; font-weight:800; color:#1E1B4B; }
    .filter-tabs { display:flex; gap:4px; flex-wrap:wrap; }
    .tab { padding:6px 14px; border-radius:8px; border:none; background:#F1F5F9; font-size:12px; font-weight:700; color:#64748B; cursor:pointer; transition:all .18s; font-family:'Quicksand',sans-serif; }
    .tab:hover { background:#E2E8F0; }
    .tab-active { background:#4F46E5; color:white; }
    .loading-row { display:flex; align-items:center; justify-content:center; gap:12px; padding:40px; color:#94A3B8; font-size:14px; }
    .spinner { width:20px; height:20px; border:2px solid #E2E8F0; border-top-color:#4F46E5; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to{ transform:rotate(360deg); } }

    /* ── TABLE ── */
    .users-table { width:100%; border-collapse:collapse; margin-top:14px; }
    .users-table thead tr { border-bottom:1.5px solid #F1F5F9; }
    .users-table th { font-size:11px; font-weight:700; letter-spacing:.8px; color:#94A3B8; padding:10px 20px; text-align:left; }
    .users-table tbody tr { border-bottom:1px solid #F8FAFC; transition:background .15s; }
    .users-table tbody tr:hover { background:#F8F7FF; }
    .users-table td { padding:12px 20px; font-size:14px; color:#334155; }
    .td-gray { color:#94A3B8; font-size:13px; }
    .td-user { display:flex; align-items:center; gap:12px; }
    .user-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#4F46E5,#7C3AED); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:white; flex-shrink:0; }
    .nino-av { background:linear-gradient(135deg,#A78BFA,#7C3AED); font-size:20px; }
    .user-name { font-size:14px; font-weight:700; color:#1E293B; }
    .user-email { font-size:12px; color:#94A3B8; }
    .td-actions { display:flex; gap:6px; align-items:center; }
    .action-btn { width:32px; height:32px; border-radius:8px; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .18s; }
    .action-btn mat-icon { font-size:16px; width:16px; height:16px; }
    .edit-btn { background:#EEF2FF; color:#4F46E5; }
    .edit-btn:hover { background:#4F46E5; color:white; }
    .del-btn { background:#FEF2F2; color:#EF4444; }
    .del-btn:hover { background:#EF4444; color:white; }
    .btn-activar { background:#DCFCE7; color:#15803D; border:none; border-radius:8px; padding:5px 12px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Quicksand',sans-serif; }
    .btn-activar:hover { background:#15803D; color:white; }
    .empty-row { text-align:center; color:#94A3B8; padding:32px; }
    .table-footer { display:flex; justify-content:space-between; align-items:center; padding:14px 24px; border-top:1px solid #F1F5F9; }
    .footer-info { font-size:13px; color:#94A3B8; font-weight:600; }

    /* ── BADGES ── */
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
    .badge-docente  { background:#DCFCE7; color:#15803D; }
    .badge-padre    { background:#FEF9C3; color:#A16207; }
    .badge-nino     { background:#EDE9FE; color:#4F46E5; }
    .badge-admin    { background:#FEE2E2; color:#B91C1C; }
    .badge-activo   { background:#DCFCE7; color:#15803D; }
    .badge-inactivo { background:#FEE2E2; color:#B91C1C; }

    /* ── JUEGOS ── */
    .juegos-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; padding:4px 0; }
    .juego-card { background:#F8F7FF; border:1px solid #EDE9FE; border-radius:14px; padding:18px 14px; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
    .jc-ico { font-size:2rem; }
    .jc-nombre { font-size:13px; font-weight:700; color:#1E1B4B; }
    .jc-tipo { font-size:11px; color:#7C3AED; font-weight:600; background:#EDE9FE; border-radius:8px; padding:2px 8px; }
    .jc-desc { font-size:11px; color:#64748B; line-height:1.4; }

    /* ── ANALÍTICAS ── */
    .analiticas-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:900px){ .analiticas-grid{ grid-template-columns:1fr; } }
    .rol-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .rol-bar-lbl { font-size:13px; font-weight:600; color:#334155; width:110px; flex-shrink:0; }
    .rol-bar-wrap { flex:1; height:10px; background:#F1F5F9; border-radius:999px; overflow:hidden; }
    .rol-bar-fill { height:100%; border-radius:999px; transition:width .5s; }
    .rol-bar-cnt { font-size:13px; font-weight:700; color:#1E1B4B; width:28px; text-align:right; }
    .estado-donut { display:flex; align-items:center; gap:24px; }
    .donut-ring { position:relative; width:100px; height:100px; flex-shrink:0; }
    .donut-ring svg { width:100%; height:100%; }
    .donut-label { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
    .donut-pct { display:block; font-size:18px; font-weight:800; color:#1E1B4B; }
    .donut-sub { font-size:10px; color:#94A3B8; font-weight:600; }
    .donut-legend { display:flex; flex-direction:column; gap:10px; }
    .dl-row { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:#334155; }
    .dl-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }

    /* ── PLACEHOLDER ── */
    .placeholder-card { background:white; border-radius:18px; padding:48px; text-align:center; box-shadow:0 2px 12px rgba(79,70,229,.07); }
    .ph-ico { font-size:4rem; margin-bottom:16px; }
    .placeholder-card h2 { font-size:20px; font-weight:800; color:#1E1B4B; margin-bottom:10px; }
    .placeholder-card p { color:#64748B; font-size:14px; max-width:480px; margin:0 auto 24px; line-height:1.6; }
    .ph-info-grid { display:flex; justify-content:center; gap:32px; }
    .ph-info-item { display:flex; flex-direction:column; align-items:center; gap:4px; }
    .ph-info-lbl { font-size:12px; color:#94A3B8; font-weight:600; }
    .ph-info-val { font-size:24px; font-weight:800; color:#4F46E5; }

    /* ── REPORTES ── */
    .reportes-wrap { display:flex; flex-direction:column; gap:20px; }

    /* ── MODALES ── */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-box { background:white; border-radius:20px; padding:28px; width:420px; max-width:95vw; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .modal-danger { border-top:4px solid #EF4444; }
    .modal-title { font-size:17px; font-weight:800; color:#1E1B4B; margin-bottom:20px; }
    .form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
    .form-group label { font-size:12px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.5px; }
    .form-input { padding:10px 14px; border:2px solid #E4DEFF; border-radius:10px; font-size:14px; font-family:'Quicksand',sans-serif; color:#1E293B; outline:none; background:white; }
    .form-input:focus { border-color:#7C3AED; }
    .form-row { flex-direction:row; align-items:center; justify-content:space-between; }
    .toggle-label { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:#334155; cursor:pointer; }
    .form-error { color:#EF4444; font-size:13px; font-weight:600; margin-bottom:10px; }
    .form-ok { color:#16A34A; font-size:13px; font-weight:600; margin-bottom:10px; }
    .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:20px; }
    .btn-cancel { padding:10px 20px; border-radius:10px; border:2px solid #E4DEFF; background:white; color:#64748B; font-size:14px; font-weight:700; cursor:pointer; font-family:'Quicksand',sans-serif; }
    .btn-save { padding:10px 20px; border-radius:10px; border:none; background:linear-gradient(135deg,#4F46E5,#7C3AED); color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:'Quicksand',sans-serif; }
    .btn-save:disabled { opacity:.55; cursor:not-allowed; }
    .btn-delete { padding:10px 20px; border-radius:10px; border:none; background:#EF4444; color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:'Quicksand',sans-serif; }
    .btn-delete:disabled { opacity:.55; cursor:not-allowed; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  readonly API = environment.apiUrl;
  tab = signal<Tab>('dashboard');
  setTab(t: Tab) { this.tab.set(t); }

  usuarios = signal<Usuario[]>([]);
  ninos    = signal<PerfilNinoAdmin[]>([]);
  loading = true;
  busqueda = '';
  filtroRol = 'todos';
  usuariosFiltrados: Usuario[] = [];
  ninosFiltrados:    PerfilNinoAdmin[] = [];

  juegos: Juego[] = [];
  loadingJuegos = false;

  // Computed stats
  totalUsuarios = computed(() => this.usuarios().length + this.ninos().length);
  docentes      = computed(() => this.usuarios().filter(u => u.rol === 'DOCENTE').length);
  padres        = computed(() => this.usuarios().filter(u => u.rol === 'PADRE').length);
  docentesActivos = computed(() => this.usuarios().filter(u => u.rol === 'DOCENTE' && u.activo).length);
  padresActivos   = computed(() => this.usuarios().filter(u => u.rol === 'PADRE'   && u.activo).length);
  activos    = computed(() => this.usuarios().filter(u => u.activo).length);
  inactivos  = computed(() => this.usuarios().filter(u => !u.activo));
  pctActivos = computed(() => {
    const total = this.usuarios().length;
    return total ? Math.round(this.activos() / total * 100) : 0;
  });
  pctInactivos = computed(() => 100 - this.pctActivos());
  donutTotal   = computed(() => Math.PI * 2 * 30);
  donutActivos = computed(() => this.pctActivos() / 100 * this.donutTotal());

  rolesData = computed(() => {
    const lista = this.usuarios();
    const max = lista.length || 1;
    return [
      { rol: 'PADRE',         label: 'Padres/Tutores', count: lista.filter(u => u.rol === 'PADRE').length,         color: '#3B82F6', pct: 0 },
      { rol: 'DOCENTE',       label: 'Docentes',       count: lista.filter(u => u.rol === 'DOCENTE').length,       color: '#10B981', pct: 0 },
      { rol: 'ADMINISTRADOR', label: 'Admins',         count: lista.filter(u => u.rol === 'ADMINISTRADOR').length, color: '#EF4444', pct: 0 },
    ].map(r => ({ ...r, pct: Math.round(r.count / max * 100) }));
  });

  // Modal editar
  editando: Usuario | null = null;
  editNombre = ''; editRol: UsuarioRol = 'PADRE'; editActivo = true;
  editError = ''; guardando = false;

  // Modal eliminar
  eliminandoId: number | null = null;
  eliminandoNombre = '';
  eliminandoTipo: 'usuario' | 'nino' = 'usuario';

  // Modal nuevo usuario
  modalNuevo = false;
  nuevoNombre = ''; nuevoEmail = ''; nuevoPassword = ''; nuevoRol: UsuarioRol = 'PADRE';
  nuevoOk = false;

  private readonly AVATAR_MAP: Record<string, string> = {
    fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
    unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯', bear:'🐻', mouse:'🐭'
  };
  private readonly JUEGO_ICO_MAP: Record<string, string> = {
    'Espejo Mental':'🪞', 'Historia Viva':'📖', 'Palabras Ocultas':'📝',
    'Piezas en Tiempo':'🧩', 'Foco Extremo':'🎯', 'Cascada Numérica':'🔢',
    'Laberinto Cognitivo':'🌀', 'Maratón Mental':'🏃', 'Ritmo y Patrón':'🎵',
    'Reacción Controlada':'⚡', 'Mapa Aventura':'🗺️', 'Lab de Ciencias':'🔬',
  };

  get iniciales() {
    const n = this.auth.userName();
    return n ? n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'A';
  }
  get tabTitulo() {
    const m: Record<Tab, string> = {
      dashboard: 'Panel de Administración', usuarios: 'Gestión de Usuarios',
      juegos: 'Juegos', analiticas: 'Analíticas', alertas: 'Alertas',
      reportes: 'Reportes', instituciones: 'Instituciones',
    };
    return m[this.tab()];
  }

  constructor(
    public  auth:  AuthService,
    public  router: Router,
    private adminSvc: AdminService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.adminSvc.listarUsuarios().pipe(catchError(() => of([]))).subscribe((data: Usuario[]) => {
      this.usuarios.set(data);
      this.filtrar();
      this.loading = false;
      this.cdr.detectChanges();
    });
    this.adminSvc.listarNinos().pipe(catchError(() => of([]))).subscribe((data: PerfilNinoAdmin[]) => {
      this.ninos.set(data);
      this.ninosFiltrados = data;
      this.cdr.detectChanges();
    });
  }

  irJuegos() {
    this.tab.set('juegos');
    if (this.juegos.length === 0 && !this.loadingJuegos) {
      this.loadingJuegos = true;
      this.http.get<Juego[]>(`${this.API}/juegos`).pipe(catchError(() => of([]))).subscribe(j => {
        this.juegos = j;
        this.loadingJuegos = false;
        this.cdr.detectChanges();
      });
    }
  }

  setFiltro(rol: string) { this.filtroRol = rol; this.filtrar(); }

  filtrar() {
    const q = this.busqueda.trim().toLowerCase();
    if (this.filtroRol === 'NINO') {
      this.ninosFiltrados = q ? this.ninos().filter(n => n.nombre.toLowerCase().includes(q)) : this.ninos();
      return;
    }
    let lista = this.usuarios();
    if (this.filtroRol !== 'todos') lista = lista.filter(u => u.rol === this.filtroRol);
    if (q) lista = lista.filter(u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    this.usuariosFiltrados = lista;
  }

  // ── Edit modal ──
  abrirEditar(u: Usuario) {
    this.editando  = u;
    this.editNombre = u.nombre;
    this.editRol   = u.rol as UsuarioRol;
    this.editActivo = u.activo;
    this.editError = '';
  }
  cerrarEditar() { this.editando = null; this.guardando = false; this.editError = ''; }
  guardarEdicion() {
    if (!this.editando) return;
    this.guardando = true; this.editError = '';
    const req: UsuarioEditRequest = { nombre: this.editNombre, rol: this.editRol, activo: this.editActivo };
    this.adminSvc.editarUsuario(this.editando.id, req).pipe(catchError(e => {
      this.editError = e.error?.message ?? 'Error al guardar.';
      this.guardando = false;
      this.cdr.detectChanges();
      return of(null);
    })).subscribe(u => {
      if (!u) return;
      this.usuarios.update(list => list.map(x => x.id === u.id ? u : x));
      this.filtrar();
      this.guardando = false;
      this.cerrarEditar();
      this.cdr.detectChanges();
    });
  }

  // ── Delete modal ──
  abrirEliminar(u: Usuario, tipo: 'usuario' | 'nino') {
    this.eliminandoId     = u.id;
    this.eliminandoNombre = u.nombre;
    this.eliminandoTipo   = tipo;
    this.editError = '';
  }
  abrirEliminarNino(n: PerfilNinoAdmin) {
    this.eliminandoId     = n.id;
    this.eliminandoNombre = n.nombre;
    this.eliminandoTipo   = 'nino';
    this.editError = '';
  }
  cerrarEliminar() { this.eliminandoId = null; this.guardando = false; this.editError = ''; }
  confirmarEliminar() {
    if (this.eliminandoId === null) return;
    this.guardando = true; this.editError = '';
    if (this.eliminandoTipo === 'nino') {
      const ninoId = this.eliminandoId;
      this.http.delete(`${this.API}/perfil/${ninoId}`)
        .pipe(catchError(e => {
          this.editError = e.error?.message ?? 'Error al eliminar.';
          this.guardando = false; this.cdr.detectChanges(); return EMPTY;
        }))
        .subscribe(() => {
          this.ninos.update(list => list.filter(n => n.id !== ninoId));
          this.ninosFiltrados = this.ninosFiltrados.filter(n => n.id !== ninoId);
          this.guardando = false; this.cerrarEliminar(); this.cdr.detectChanges();
        });
      return;
    }
    const idAEliminar = this.eliminandoId;
    this.adminSvc.eliminarUsuario(idAEliminar).pipe(catchError(e => {
      this.editError = e.error?.message ?? 'Error al eliminar.';
      this.guardando = false; this.cdr.detectChanges(); return EMPTY;
    })).subscribe(() => {
      this.usuarios.update(list => list.filter(u => u.id !== idAEliminar));
      this.filtrar(); this.guardando = false; this.cerrarEliminar(); this.cdr.detectChanges();
    });
  }

  // ── Toggle activo (alertas tab) ──
  toggleActivo(u: Usuario) {
    this.adminSvc.toggleActivo(u.id).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.usuarios.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.filtrar(); this.cdr.detectChanges();
      }
    });
  }

  // ── Nuevo usuario modal ──
  abrirNuevoUsuario() {
    this.nuevoNombre = ''; this.nuevoEmail = ''; this.nuevoPassword = '';
    this.nuevoRol = 'PADRE'; this.editError = ''; this.nuevoOk = false;
    this.modalNuevo = true;
  }
  cerrarNuevo() { this.modalNuevo = false; this.guardando = false; this.editError = ''; this.nuevoOk = false; }
  crearUsuario() {
    if (!this.nuevoNombre || !this.nuevoEmail || !this.nuevoPassword) {
      this.editError = 'Todos los campos son obligatorios.'; return;
    }
    this.guardando = true; this.editError = '';
    this.http.post<any>(`${this.API}/auth/register`, {
      nombre: this.nuevoNombre, email: this.nuevoEmail,
      password: this.nuevoPassword, rol: this.nuevoRol
    }).pipe(catchError(e => {
      this.editError = e.error?.message ?? 'Error al crear el usuario.';
      this.guardando = false; this.cdr.detectChanges(); return of(null);
    })).subscribe(res => {
      if (!res) return;
      this.nuevoOk = true; this.guardando = false;
      // Recargar lista
      this.adminSvc.listarUsuarios().pipe(catchError(() => of([]))).subscribe((data: Usuario[]) => {
        this.usuarios.set(data); this.filtrar(); this.cdr.detectChanges();
      });
      setTimeout(() => this.cerrarNuevo(), 1500);
    });
  }

  // ── Helpers ──
  initials(nombre: string) { return nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
  avatarEmoji(key?: string | null) { return this.AVATAR_MAP[key ?? ''] ?? '👤'; }
  juegoIco(nombre: string) { return this.JUEGO_ICO_MAP[nombre] ?? '🎮'; }
  rolLabel(rol: string) {
    const map: Record<string,string> = { DOCENTE:'Docente', PADRE:'Padre/Tutor', NINO:'Niño', ADMINISTRADOR:'Admin' };
    return map[rol] ?? rol;
  }
  rolClass(rol: string) {
    return { 'badge-docente': rol==='DOCENTE', 'badge-padre': rol==='PADRE',
             'badge-nino': rol==='NINO', 'badge-admin': rol==='ADMINISTRADOR' };
  }
}
