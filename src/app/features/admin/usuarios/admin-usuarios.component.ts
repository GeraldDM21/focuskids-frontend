import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService, Usuario, UsuarioRol, UsuarioPage, UsuarioEditRequest
} from '../../../core/services/admin.service';
import { catchError, debounceTime, Subject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const ROL_LABEL: Record<UsuarioRol, string> = {
  NINO:          'Niño',
  PADRE:         'Padre/Tutor',
  DOCENTE:       'Docente',
  ADMINISTRADOR: 'Administrador',
};
const ROL_COLOR: Record<UsuarioRol, string> = {
  NINO:          '#A855F7',
  PADRE:         '#3B82F6',
  DOCENTE:       '#10B981',
  ADMINISTRADOR: '#EF4444',
};

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="usr-root">

  <!-- ══ CABECERA ══ -->
  <div class="page-header">
    <div>
      <h1 class="ph-title">👥 Gestión de Usuarios</h1>
      <p class="ph-sub">{{ totalElements }} usuarios registrados en el sistema</p>
    </div>
  </div>

  <!-- ══ BARRA DE BÚSQUEDA Y FILTROS (CA-01) ══ -->
  <div class="barra-card">
    <div class="barra-row">
      <div class="search-wrap">
        <span class="search-ico">🔍</span>
        <input class="search-input" type="text" placeholder="Buscar por nombre o correo…"
               [(ngModel)]="queryText" (ngModelChange)="onQuery()"/>
        @if (queryText) {
          <button class="search-clear" (click)="queryText=''; onQuery()">✕</button>
        }
      </div>
      <select class="filtro-rol" [(ngModel)]="filtroRol" (change)="buscar()">
        <option value="">— Todos los roles —</option>
        <option value="ADMINISTRADOR">Administrador</option>
        <option value="DOCENTE">Docente</option>
        <option value="PADRE">Padre/Tutor</option>
        <option value="NINO">Niño</option>
      </select>
    </div>
    @if (totalElements > 0) {
      <div class="filtro-meta">
        {{ totalElements }} resultado{{ totalElements !== 1 ? 's' : '' }}
        · Página {{ paginaActual + 1 }} de {{ totalPaginas }}
      </div>
    }
  </div>

  <!-- ══ TABLA (CA-01) ══ -->
  @if (loading) {
    <div class="loader-wrap"><div class="spinner"></div></div>
  } @else if (usuarios.length === 0) {
    <div class="empty-state">
      <span style="font-size:48px">🔍</span>
      <p>No se encontraron usuarios con ese criterio.</p>
    </div>
  } @else {
    <div class="tabla-wrap">
      <table class="tabla">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (u of usuarios; track u.id) {
            <tr class="fila" [class.fila-inactivo]="!u.activo">
              <td class="td-usuario">
                <div class="avatar-chip">
                  <div class="avatar-ico" [style.background]="rolColor(u.rol) + '22'"
                       [style.color]="rolColor(u.rol)">
                    {{ inicial(u.nombre) }}
                  </div>
                  <div>
                    <div class="u-nombre">{{ u.nombre }}</div>
                    <div class="u-email">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="rol-badge"
                      [style.background]="rolColor(u.rol) + '18'"
                      [style.color]="rolColor(u.rol)">
                  {{ rolLabel(u.rol) }}
                </span>
              </td>
              <td>
                <span class="estado-badge" [class.est-activo]="u.activo" [class.est-inactivo]="!u.activo">
                  {{ u.activo ? '● Activo' : '○ Inactivo' }}
                </span>
              </td>
              <td class="td-fecha">{{ formatFecha(u.fechaCreacion) }}</td>
              <td class="td-acciones">
                <!-- Editar (CA-02) -->
                <button class="accion-btn btn-edit" (click)="abrirEditar(u)" title="Editar usuario">✏️</button>
                <!-- Activar / Suspender (CA-03) -->
                <button class="accion-btn" [class.btn-suspend]="u.activo" [class.btn-activate]="!u.activo"
                        (click)="toggleActivo(u)"
                        [title]="u.activo ? 'Suspender cuenta' : 'Reactivar cuenta'">
                  {{ u.activo ? '⛔' : '✅' }}
                </button>
                <!-- Eliminar (CA-04) -->
                <button class="accion-btn btn-del" (click)="pedirEliminar(u)" title="Eliminar usuario">🗑</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- ══ PAGINACIÓN ══ -->
    <div class="paginacion">
      <button class="pag-btn" [disabled]="paginaActual === 0" (click)="irPagina(0)">«</button>
      <button class="pag-btn" [disabled]="paginaActual === 0" (click)="irPagina(paginaActual - 1)">‹</button>
      @for (p of paginas; track p) {
        <button class="pag-btn" [class.pag-activa]="p === paginaActual" (click)="irPagina(p)">{{ p + 1 }}</button>
      }
      <button class="pag-btn" [disabled]="paginaActual >= totalPaginas - 1" (click)="irPagina(paginaActual + 1)">›</button>
      <button class="pag-btn" [disabled]="paginaActual >= totalPaginas - 1" (click)="irPagina(totalPaginas - 1)">»</button>
    </div>
  }

  <!-- ══ MODAL EDITAR (CA-02) ══ -->
  @if (editando) {
    <div class="overlay" (click)="cerrarEditar()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2 class="modal-title">✏️ Editar usuario</h2>
        <p class="modal-sub">{{ editando.email }}</p>

        @if (editError) { <div class="modal-error">{{ editError }}</div> }

        <div class="form-group">
          <label>Nombre</label>
          <input class="form-input" type="text" [(ngModel)]="editForm.nombre"/>
        </div>

        <div class="form-group">
          <label>Rol</label>
          <select class="form-input" [(ngModel)]="editForm.rol">
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="DOCENTE">Docente</option>
            <option value="PADRE">Padre/Tutor</option>
            <option value="NINO">Niño</option>
          </select>
          @if (bajandoPrivilegios) {
            <p class="aviso-privilegios">
              ⚠️ Estás bajando privilegios de Administrador. El usuario perderá acceso al panel admin.
            </p>
          }
        </div>

        <div class="form-group">
          <label>Estado</label>
          <select class="form-input" [(ngModel)]="editForm.activo">
            <option [ngValue]="true">Activo</option>
            <option [ngValue]="false">Inactivo (suspendido)</option>
          </select>
        </div>

        <p class="modal-nota">🔒 La contraseña no se modifica desde el panel de administración.</p>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cerrarEditar()">Cancelar</button>
          <button class="btn-save" [disabled]="guardandoEdit" (click)="guardarEdicion()">
            {{ guardandoEdit ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ MODAL ELIMINAR (CA-04) ══ -->
  @if (eliminando) {
    <div class="overlay">
      <div class="modal modal-sm">

        @if (paso === 1) {
          <!-- Paso 1: primera confirmación -->
          <div style="text-align:center;font-size:48px;margin-bottom:8px">⚠️</div>
          <h2 class="modal-title">Eliminar usuario</h2>
          <p class="delete-msg">
            ¿Confirmas que deseas eliminar a
            <strong>{{ eliminando.nombre }}</strong> ({{ eliminando.email }})?
          </p>
          @if (elimError) { <div class="modal-error">{{ elimError }}</div> }
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cancelarEliminar()">Cancelar</button>
            <button class="btn-danger" (click)="paso = 2">Continuar →</button>
          </div>
        } @else {
          <!-- Paso 2: segunda confirmación -->
          <div style="text-align:center;font-size:48px;margin-bottom:8px">🚨</div>
          <h2 class="modal-title">Confirmación final</h2>
          <p class="delete-msg">
            Esta acción es <strong>irreversible</strong>. Se eliminarán todos los datos asociados
            a <strong>{{ eliminando.nombre }}</strong>.<br><br>
            Escribe <strong>ELIMINAR</strong> para confirmar:
          </p>
          <input class="form-input" style="margin:12px 0 4px" type="text"
                 [(ngModel)]="confirmText" placeholder="ELIMINAR"/>
          @if (elimError) { <div class="modal-error">{{ elimError }}</div> }
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cancelarEliminar()">Cancelar</button>
            <button class="btn-danger" [disabled]="confirmText !== 'ELIMINAR' || guardandoElim"
                    (click)="confirmarEliminar()">
              {{ guardandoElim ? 'Eliminando…' : 'Eliminar definitivamente' }}
            </button>
          </div>
        }

      </div>
    </div>
  }

</div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    .usr-root { font-family:'Inter',-apple-system,sans-serif; color:#1E293B;
                display:flex; flex-direction:column; gap:18px; padding:4px 0 32px; }

    /* ── Cabecera ── */
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; }
    .ph-title { font-size:22px; font-weight:900; color:#1E1B4B; }
    .ph-sub   { font-size:12px; color:#94A3B8; margin-top:4px; }

    /* ── Barra búsqueda ── */
    .barra-card { background:white; border-radius:16px; padding:16px 20px;
                  box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .barra-row  { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
    .search-wrap { flex:1; min-width:200px; position:relative; display:flex; align-items:center; }
    .search-ico  { position:absolute; left:12px; font-size:15px; pointer-events:none; }
    .search-input { width:100%; padding:10px 36px 10px 36px; border:2px solid #E4DEFF;
                    border-radius:12px; font-size:14px; font-family:inherit;
                    color:#1E293B; outline:none; }
    .search-input:focus { border-color:#7C3AED; }
    .search-clear { position:absolute; right:10px; background:none; border:none;
                    color:#94A3B8; cursor:pointer; font-size:14px; }
    .filtro-rol  { padding:10px 14px; border:2px solid #E4DEFF; border-radius:12px;
                   font-size:13px; font-family:inherit; color:#1E293B; outline:none;
                   background:white; min-width:170px; }
    .filtro-rol:focus { border-color:#7C3AED; }
    .filtro-meta { margin-top:10px; font-size:12px; color:#64748B;
                   border-top:1px solid #F1F5F9; padding-top:10px; }

    /* ── Loader / Empty ── */
    .loader-wrap { display:flex; justify-content:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #DDD6FE;
               border-top-color:#7C3AED; border-radius:50%;
               animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:12px;
                   padding:48px; background:white; border-radius:16px;
                   box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .empty-state p { color:#64748B; font-size:14px; }

    /* ── Tabla ── */
    .tabla-wrap { background:white; border-radius:16px; overflow:hidden;
                  box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .tabla { width:100%; border-collapse:collapse; }
    .tabla thead tr { background:#F8F7FF; border-bottom:2px solid #EDE9FE; }
    .tabla th { padding:12px 16px; text-align:left; font-size:11px; font-weight:800;
                text-transform:uppercase; letter-spacing:.7px; color:#5B21B6; white-space:nowrap; }
    .tabla td { padding:12px 16px; border-bottom:1px solid #F1F5F9;
                font-size:13px; vertical-align:middle; }
    .fila:hover { background:#FAFAFE; }
    .fila:last-child td { border-bottom:none; }
    .fila-inactivo { opacity:.55; }

    /* Avatar chip */
    .avatar-chip { display:flex; align-items:center; gap:10px; }
    .avatar-ico { width:36px; height:36px; border-radius:50%; flex-shrink:0;
                  display:flex; align-items:center; justify-content:center;
                  font-size:15px; font-weight:800; }
    .u-nombre { font-weight:700; color:#1E1B4B; font-size:13.5px; }
    .u-email  { font-size:11.5px; color:#64748B; }

    /* Rol badge */
    .rol-badge { display:inline-block; padding:3px 10px; border-radius:20px;
                 font-size:11px; font-weight:800; }

    /* Estado badge */
    .estado-badge { display:inline-block; padding:4px 10px; border-radius:20px;
                    font-size:11.5px; font-weight:800; }
    .est-activo   { background:#DCFCE7; color:#15803D; }
    .est-inactivo { background:#F1F5F9; color:#94A3B8; }

    .td-fecha { white-space:nowrap; font-size:12px; color:#64748B; }
    .td-acciones { white-space:nowrap; }

    /* Botones de acción */
    .accion-btn { width:34px; height:34px; border:none; border-radius:10px;
                  font-size:16px; cursor:pointer; transition:all .15s;
                  display:inline-flex; align-items:center; justify-content:center;
                  margin-right:4px; }
    .btn-edit     { background:#EDE9FE; }
    .btn-edit:hover    { background:#DDD6FE; }
    .btn-suspend  { background:#FEF9C3; }
    .btn-suspend:hover { background:#FEF08A; }
    .btn-activate { background:#DCFCE7; }
    .btn-activate:hover { background:#BBF7D0; }
    .btn-del      { background:#FEE2E2; }
    .btn-del:hover { background:#FECAca; }

    /* ── Paginación ── */
    .paginacion { display:flex; justify-content:center; align-items:center;
                  gap:6px; flex-wrap:wrap; }
    .pag-btn { width:36px; height:36px; border:2px solid #E4DEFF; border-radius:10px;
               background:white; color:#5B21B6; font-size:13px; font-weight:700;
               cursor:pointer; transition:all .15s; font-family:inherit;
               display:flex; align-items:center; justify-content:center; }
    .pag-btn:hover:not(:disabled) { background:#EDE9FE; border-color:#A78BFA; }
    .pag-btn:disabled { opacity:.3; cursor:not-allowed; }
    .pag-activa { background:#4F46E5 !important; border-color:#4F46E5 !important; color:white !important; }

    /* ── Modales ── */
    .overlay { position:fixed; inset:0; background:rgba(30,27,78,.45);
               display:flex; align-items:center; justify-content:center;
               z-index:1000; padding:20px; }
    .modal { background:white; border-radius:24px; padding:32px 36px;
             width:100%; max-width:440px; box-shadow:0 20px 60px rgba(30,27,78,.2); }
    .modal-sm { max-width:380px; text-align:center; }
    .modal-title { font-size:20px; font-weight:900; color:#1E1B4B; margin-bottom:4px; text-align:center; }
    .modal-sub   { font-size:12.5px; color:#64748B; text-align:center; margin-bottom:18px; }
    .modal-nota  { font-size:11.5px; color:#94A3B8; background:#F8F7FF;
                   border-radius:10px; padding:10px 14px; margin-top:4px; }
    .modal-error { background:#FEE2E2; color:#B91C1C; border-radius:10px;
                   padding:10px 14px; font-size:13px; font-weight:700; margin-bottom:14px; }
    .form-group  { margin-bottom:16px; }
    .form-group label { display:block; font-size:12px; font-weight:800;
                        color:#1E1B4B; margin-bottom:7px; }
    .form-input  { width:100%; padding:11px 14px; border:2px solid #E4DEFF;
                   border-radius:12px; font-size:14px; font-family:inherit;
                   color:#1E293B; outline:none; }
    .form-input:focus { border-color:#7C3AED; }
    .aviso-privilegios { font-size:12px; color:#92400E; background:#FEF9C3;
                         border-radius:8px; padding:8px 12px; margin-top:8px; }
    .modal-footer { display:flex; gap:10px; margin-top:22px; justify-content:flex-end; }
    .btn-cancel { background:#F3F0FF; color:#5B21B6; border:2px solid #DDD6FE;
                  border-radius:12px; padding:10px 20px; font-size:14px;
                  font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-save   { background:linear-gradient(135deg,#7C3AED,#4F46E5); color:white;
                  border:none; border-radius:12px; padding:10px 20px; font-size:14px;
                  font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-save:disabled { opacity:.5; cursor:not-allowed; }
    .btn-danger { background:#B91C1C; color:white; border:none; border-radius:12px;
                  padding:10px 20px; font-size:14px; font-weight:700;
                  cursor:pointer; font-family:inherit; }
    .btn-danger:disabled { opacity:.5; cursor:not-allowed; }
    .delete-msg { font-size:13.5px; color:#64748B; line-height:1.7; margin-bottom:8px; }
    .delete-msg strong { color:#1E1B4B; }
  `]
})
export class AdminUsuariosComponent implements OnInit {

  usuarios:      Usuario[] = [];
  loading        = true;
  totalPaginas   = 0;
  totalElements  = 0;
  paginaActual   = 0;

  // Búsqueda y filtros
  queryText  = '';
  filtroRol  = '';
  private query$ = new Subject<void>();

  // Modal editar (CA-02)
  editando:     Usuario | null = null;
  editForm:     { nombre: string; rol: UsuarioRol; activo: boolean } = { nombre: '', rol: 'PADRE', activo: true };
  guardandoEdit = false;
  editError     = '';

  // Modal eliminar (CA-04)
  eliminando:    Usuario | null = null;
  paso           = 1;
  confirmText    = '';
  guardandoElim  = false;
  elimError      = '';

  constructor(
    private adminService: AdminService,
    private cdr:          ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Debounce para la búsqueda por texto
    this.query$.pipe(
      debounceTime(350),
      switchMap(() => {
        this.loading = true;
        this.paginaActual = 0;
        this.cdr.detectChanges();
        return this.adminService.buscarUsuarios(this.queryText, this.filtroRol, 0)
          .pipe(catchError(() => of(null)));
      })
    ).subscribe(page => this.aplicarResultado(page));

    this.buscar();
  }

  buscar(reset = true): void {
    if (reset) this.paginaActual = 0;
    this.loading = true;
    this.cdr.detectChanges();

    this.adminService.buscarUsuarios(this.queryText, this.filtroRol, this.paginaActual)
      .pipe(catchError(() => of(null)))
      .subscribe(page => this.aplicarResultado(page));
  }

  onQuery(): void { this.query$.next(); }

  irPagina(p: number): void {
    if (p < 0 || p >= this.totalPaginas) return;
    this.paginaActual = p;
    this.buscar(false);
  }

  private aplicarResultado(page: UsuarioPage | null): void {
    if (page) {
      this.usuarios      = page.content;
      this.totalPaginas  = page.totalPages;
      this.totalElements = page.totalElements;
      this.paginaActual  = page.number;
    } else {
      this.usuarios = [];
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  // ── Toggle activo (CA-03) ─────────────────────────────────────────────────

  toggleActivo(u: Usuario): void {
    this.adminService.toggleActivo(u.id).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        const idx = this.usuarios.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.usuarios[idx] = updated;
        this.usuarios = [...this.usuarios];
      }
      this.cdr.detectChanges();
    });
  }

  // ── Modal editar (CA-02) ──────────────────────────────────────────────────

  abrirEditar(u: Usuario): void {
    this.editando  = u;
    this.editForm  = { nombre: u.nombre, rol: u.rol, activo: u.activo };
    this.editError = '';
    this.cdr.detectChanges();
  }

  cerrarEditar(): void { this.editando = null; this.cdr.detectChanges(); }

  guardarEdicion(): void {
    if (!this.editando) return;
    this.guardandoEdit = true;
    this.editError     = '';

    const req: UsuarioEditRequest = {
      nombre: this.editForm.nombre.trim(),
      rol:    this.editForm.rol,
      activo: this.editForm.activo,
    };

    this.adminService.editarUsuario(this.editando.id, req).subscribe({
      next: updated => {
        const idx = this.usuarios.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.usuarios[idx] = updated;
        this.usuarios      = [...this.usuarios];
        this.guardandoEdit = false;
        this.editando      = null;
        this.cdr.detectChanges();
      },
      error: err => {
        this.editError     = err.error?.message || 'Error al guardar los cambios.';
        this.guardandoEdit = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Modal eliminar (CA-04) ────────────────────────────────────────────────

  pedirEliminar(u: Usuario): void {
    this.eliminando    = u;
    this.paso          = 1;
    this.confirmText   = '';
    this.elimError     = '';
    this.guardandoElim = false;
    this.cdr.detectChanges();
  }

  cancelarEliminar(): void { this.eliminando = null; this.cdr.detectChanges(); }

  confirmarEliminar(): void {
    if (!this.eliminando || this.confirmText !== 'ELIMINAR') return;
    this.guardandoElim = true;

    this.adminService.eliminarUsuario(this.eliminando.id).subscribe({
      next: () => {
        this.usuarios      = this.usuarios.filter(u => u.id !== this.eliminando!.id);
        this.totalElements = Math.max(0, this.totalElements - 1);
        this.eliminando    = null;
        this.guardandoElim = false;
        this.cdr.detectChanges();
      },
      error: err => {
        // CA-04: mostrar error si tiene niños activos
        this.elimError     = err.error?.message
                          || 'No se pudo eliminar el usuario.';
        this.guardandoElim = false;
        this.paso          = 1;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  inicial(nombre: string): string { return (nombre || '?').charAt(0).toUpperCase(); }
  rolLabel(rol: UsuarioRol): string { return ROL_LABEL[rol] ?? rol; }
  rolColor(rol: UsuarioRol): string { return ROL_COLOR[rol] ?? '#64748B'; }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-CR',
      { day:'2-digit', month:'short', year:'numeric' });
  }

  get bajandoPrivilegios(): boolean {
    return this.editando?.rol === 'ADMINISTRADOR' && this.editForm.rol !== 'ADMINISTRADOR';
  }

  get paginas(): number[] {
    const total  = this.totalPaginas;
    const actual = this.paginaActual;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const inicio = Math.max(0, Math.min(actual - 3, total - 7));
    return Array.from({ length: Math.min(7, total) }, (_, i) => inicio + i);
  }
}
