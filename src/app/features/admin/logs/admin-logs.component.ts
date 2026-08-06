import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService, LogAuditoria, LogFiltros, LogPage, Usuario
} from '../../../core/services/admin.service';
import { catchError, of } from 'rxjs';

// ── Tipos de acción disponibles (CA-01) ───────────────────────────────────────
const TIPOS_ACCION = [
  'USUARIO_MODIFICADO',
  'USUARIO_ACTIVADO',
  'USUARIO_DESACTIVADO',
  'JUEGO_DESACTIVADO',
  'CONFIG_NIVEL_CAMBIADA',
  'LOGIN_EXITOSO',
  'LOGIN_FALLIDO',
  'PERFIL_CREADO',
  'PERFIL_ELIMINADO',
  'SESION_ELIMINADA',
];

@Component({
  selector:    'app-admin-logs',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="logs-root">

  <!-- ══ CABECERA ══ -->
  <div class="page-header">
    <div class="ph-left">
      <h1 class="ph-title">📋 Logs de Auditoría</h1>
      <p class="ph-sub">Registro inmutable de acciones administrativas · últimos 90 días</p>
    </div>
    <div class="ph-right">
      <!-- CA-02: exportar CSV del filtro actual -->
      <button class="btn-export" (click)="exportarCsv()" [disabled]="exportando">
        {{ exportando ? '⏳ Exportando…' : '⬇ Exportar CSV' }}
      </button>
    </div>
  </div>

  <!-- ══ FILTROS (CA-02) ══ -->
  <div class="filtros-card">
    <div class="filtros-row">

      <div class="filtro-group">
        <label class="filtro-label">Desde</label>
        <input class="filtro-input" type="text" placeholder="DD/MM/AAAA" maxlength="10"
               [(ngModel)]="filtroFechaDesde" (input)="onFechaInput()"/>
      </div>

      <div class="filtro-group">
        <label class="filtro-label">Hasta</label>
        <input class="filtro-input" type="text" placeholder="DD/MM/AAAA" maxlength="10"
               [(ngModel)]="filtroFechaHasta" (input)="onFechaInput()"/>
      </div>

      <div class="filtro-group">
        <label class="filtro-label">Tipo de acción</label>
        <select class="filtro-input" [(ngModel)]="filtroAccion" (change)="buscar()">
          <option value="">— Todas —</option>
          @for (t of tiposAccion; track t) {
            <option [value]="t">{{ t }}</option>
          }
        </select>
      </div>

      <div class="filtro-group">
        <label class="filtro-label">Admin ejecutor</label>
        <select class="filtro-input" [(ngModel)]="filtroUsuarioId" (change)="buscar()">
          <option [ngValue]="null">— Todos —</option>
          @for (u of admins; track u.id) {
            <option [ngValue]="u.id">{{ u.nombre || u.email }}</option>
          }
        </select>
      </div>

      <div class="filtro-group filtro-group-btn">
        <button class="btn-limpiar" (click)="limpiarFiltros()">✕ Limpiar</button>
      </div>

    </div>

    @if (totalElements > 0) {
      <div class="filtro-meta">
        {{ totalElements }} registro{{ totalElements !== 1 ? 's' : '' }} encontrado{{ totalElements !== 1 ? 's' : '' }}
        · Página {{ paginaActual + 1 }} de {{ totalPaginas }}
      </div>
    }
  </div>

  <!-- ══ TABLA (CA-01) ══ -->
  @if (loading) {
    <div class="loader-wrap"><div class="spinner"></div></div>
  } @else if (logs.length === 0) {
    <div class="empty-state">
      <span class="empty-ico">🔍</span>
      <p>No se encontraron logs con los filtros actuales.</p>
      @if (hayFiltrosActivos) {
        <button class="btn-limpiar-empty" (click)="limpiarFiltros()">Limpiar filtros</button>
      }
    </div>
  } @else {
    <div class="tabla-wrap">
      <table class="tabla">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin</th>
            <th>Tipo acción</th>
            <th>Descripción</th>
            <th>IP Origen</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          @for (log of logs; track log.id) {
            <tr class="fila" [class.fila-fallo]="log.resultado === 'FALLO'">
              <td class="td-fecha">{{ formatFecha(log.fecha) }}</td>
              <td class="td-usuario">
                @if (log.usuario) {
                  <div class="usuario-chip">
                    <span class="uc-inicial">{{ inicialUsuario(log.usuario.nombre) }}</span>
                    <span class="uc-nombre">{{ log.usuario.nombre || log.usuario.email }}</span>
                  </div>
                } @else {
                  <span class="sistema-tag">Sistema</span>
                }
              </td>
              <td class="td-accion">
                <span class="accion-badge" [class]="'accion-' + tipoClase(log.accion)">
                  {{ log.accion }}
                </span>
              </td>
              <td class="td-desc">{{ log.descripcion || log.entidad || '—' }}</td>
              <td class="td-ip">{{ log.ip || '—' }}</td>
              <td class="td-resultado">
                <span class="resultado-badge" [class.resultado-exito]="log.resultado === 'EXITO'"
                      [class.resultado-fallo]="log.resultado === 'FALLO'"
                      [class.resultado-nd]="!log.resultado">
                  {{ log.resultado === 'EXITO' ? '✓ ÉXITO'
                   : log.resultado === 'FALLO'  ? '✗ FALLO'
                   : '—' }}
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- ══ PAGINACIÓN (CA-04) ══ -->
    <div class="paginacion">
      <button class="pag-btn" [disabled]="paginaActual === 0" (click)="irPagina(0)">«</button>
      <button class="pag-btn" [disabled]="paginaActual === 0" (click)="irPagina(paginaActual - 1)">‹</button>

      @for (p of paginas; track p) {
        <button class="pag-btn" [class.pag-activa]="p === paginaActual"
                (click)="irPagina(p)">{{ p + 1 }}</button>
      }

      <button class="pag-btn" [disabled]="paginaActual >= totalPaginas - 1" (click)="irPagina(paginaActual + 1)">›</button>
      <button class="pag-btn" [disabled]="paginaActual >= totalPaginas - 1" (click)="irPagina(totalPaginas - 1)">»</button>
    </div>
  }

  <!-- CA-03: Nota de sólo lectura ─────────────────────────────────────────── -->
  <div class="nota-readonly">
    🔒 Los logs son de sólo lectura. No es posible editar, eliminar ni limpiar registros desde esta interfaz.
  </div>

</div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    .logs-root { font-family:'Inter',-apple-system,sans-serif; color:#1E293B;
                 display:flex; flex-direction:column; gap:18px; padding:4px 0 32px; }

    /* ── Cabecera ── */
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .ph-title { font-size:22px; font-weight:900; color:#1E1B4B; }
    .ph-sub   { font-size:12px; color:#94A3B8; margin-top:4px; }
    .btn-export { background:linear-gradient(135deg,#4F46E5,#7C3AED); color:white;
                  border:none; border-radius:12px; padding:10px 20px; font-size:13px;
                  font-weight:700; cursor:pointer; white-space:nowrap; font-family:inherit; }
    .btn-export:disabled { opacity:.55; cursor:not-allowed; }
    .btn-export:not(:disabled):hover { box-shadow:0 6px 18px rgba(79,70,229,.35); }

    /* ── Filtros ── */
    .filtros-card { background:white; border-radius:16px; padding:18px 20px;
                    box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .filtros-row { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; }
    .filtro-group { display:flex; flex-direction:column; gap:5px; min-width:140px; }
    .filtro-group-btn { justify-content:flex-end; }
    .filtro-label { font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.6px; }
    .filtro-input { padding:9px 12px; border:2px solid #E4DEFF; border-radius:10px;
                    font-size:13px; font-family:inherit; color:#1E293B; outline:none;
                    background:white; }
    .filtro-input:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.1); }
    .btn-limpiar { padding:9px 16px; background:#F3F0FF; color:#5B21B6; border:none;
                   border-radius:10px; font-size:13px; font-weight:700; cursor:pointer;
                   font-family:inherit; white-space:nowrap; }
    .btn-limpiar:hover { background:#EDE9FE; }
    .filtro-meta { margin-top:10px; font-size:12px; color:#64748B; border-top:1px solid #F1F5F9;
                   padding-top:10px; }

    /* ── Loader / Empty ── */
    .loader-wrap { display:flex; justify-content:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #DDD6FE;
               border-top-color:#7C3AED; border-radius:50%;
               animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:12px;
                   padding:48px; background:white; border-radius:16px;
                   box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .empty-ico { font-size:48px; }
    .empty-state p { color:#64748B; font-size:14px; }
    .btn-limpiar-empty { background:#EDE9FE; color:#5B21B6; border:none; border-radius:10px;
                         padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; }

    /* ── Tabla ── */
    .tabla-wrap { background:white; border-radius:16px; overflow:hidden;
                  box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .tabla { width:100%; border-collapse:collapse; }
    .tabla thead tr { background:#F8F7FF; border-bottom:2px solid #EDE9FE; }
    .tabla th { padding:12px 14px; text-align:left; font-size:11px; font-weight:800;
                text-transform:uppercase; letter-spacing:.7px; color:#5B21B6;
                white-space:nowrap; }
    .tabla td { padding:11px 14px; border-bottom:1px solid #F1F5F9;
                font-size:12.5px; vertical-align:middle; }
    .fila:hover { background:#FAFAFE; }
    .fila:last-child td { border-bottom:none; }
    .fila-fallo { background:#FFF5F5; }
    .fila-fallo:hover { background:#FEF2F2; }

    .td-fecha  { white-space:nowrap; color:#334155; font-size:12px; font-family:monospace; }
    .td-usuario { white-space:nowrap; }
    .td-accion { white-space:nowrap; }
    .td-desc   { color:#475569; max-width:320px; }
    .td-ip     { font-family:monospace; font-size:11.5px; color:#64748B; white-space:nowrap; }
    .td-resultado { white-space:nowrap; }

    /* Usuario chip */
    .usuario-chip { display:inline-flex; align-items:center; gap:7px; }
    .uc-inicial { width:26px; height:26px; border-radius:50%; background:#EDE9FE;
                  color:#5B21B6; font-size:11px; font-weight:800;
                  display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .uc-nombre { font-size:12.5px; font-weight:600; color:#334155; }
    .sistema-tag { font-size:11px; color:#94A3B8; font-style:italic; }

    /* Accion badge */
    .accion-badge { display:inline-block; padding:3px 8px; border-radius:6px;
                    font-size:10.5px; font-weight:800; letter-spacing:.3px; }
    .accion-usuario   { background:#EDE9FE; color:#5B21B6; }
    .accion-config    { background:#FEF9C3; color:#854D0E; }
    .accion-login     { background:#DCFCE7; color:#166534; }
    .accion-juego     { background:#FEE2E2; color:#991B1B; }
    .accion-perfil    { background:#DBEAFE; color:#1D4ED8; }
    .accion-generico  { background:#F1F5F9; color:#475569; }

    /* Resultado badge */
    .resultado-badge { display:inline-block; padding:3px 9px; border-radius:20px;
                       font-size:11px; font-weight:800; }
    .resultado-exito { background:#DCFCE7; color:#15803D; }
    .resultado-fallo { background:#FEE2E2; color:#B91C1C; }
    .resultado-nd    { background:#F1F5F9; color:#94A3B8; }

    /* ── Paginación ── */
    .paginacion { display:flex; justify-content:center; align-items:center;
                  gap:6px; flex-wrap:wrap; }
    .pag-btn { width:36px; height:36px; border:2px solid #E4DEFF; border-radius:10px;
               background:white; color:#5B21B6; font-size:13px; font-weight:700;
               cursor:pointer; display:flex; align-items:center; justify-content:center;
               transition:all .15s; font-family:inherit; }
    .pag-btn:hover:not(:disabled) { background:#EDE9FE; border-color:#A78BFA; }
    .pag-btn:disabled { opacity:.3; cursor:not-allowed; }
    .pag-activa { background:#4F46E5 !important; border-color:#4F46E5 !important;
                  color:white !important; }

    /* ── Nota readonly ── */
    .nota-readonly { text-align:center; font-size:11.5px; color:#94A3B8;
                     padding:10px 16px; background:#F8F7FF;
                     border-radius:12px; border:1.5px dashed #DDD6FE; }
  `]
})
export class AdminLogsComponent implements OnInit {

  logs:          LogAuditoria[] = [];
  admins:        Pick<any, 'id' | 'nombre' | 'email'>[] = [];
  tiposAccion    = TIPOS_ACCION;
  loading        = true;
  exportando     = false;

  // Filtros (CA-02)
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroAccion:     string = '';
  filtroUsuarioId:  number | null = null;

  // Paginación (CA-04)
  paginaActual  = 0;
  totalPaginas  = 0;
  totalElements = 0;

  constructor(
    private adminService: AdminService,
    private cdr:          ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Cargar lista de admins para el selector
    this.adminService.listarUsuarios().pipe(catchError(() => of([]))).subscribe(users => {
      this.admins = users.filter(u => u.rol === 'ADMINISTRADOR');
      this.cdr.detectChanges();
    });
    this.buscar();
  }

  buscar(reset = true): void {
    if (reset) this.paginaActual = 0;
    this.loading = true;
    this.cdr.detectChanges();

    const desdeIso = this.parseFecha(this.filtroFechaDesde);
    const hastaIso = this.parseFecha(this.filtroFechaHasta);
    const filtros: LogFiltros = {
      page:       this.paginaActual,
      accion:     this.filtroAccion     || undefined,
      usuarioId:  this.filtroUsuarioId  ?? undefined,
      fechaDesde: desdeIso ? desdeIso + 'T00:00:00' : undefined,
      fechaHasta: hastaIso ? hastaIso + 'T23:59:59' : undefined,
    };

    this.adminService.obtenerLogsFiltrados(filtros)
      .pipe(catchError(() => of(null)))
      .subscribe(page => {
        if (page) {
          this.logs          = page.content;
          this.totalPaginas  = page.totalPages;
          this.totalElements = page.totalElements;
          this.paginaActual  = page.number;
        } else {
          this.logs = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  irPagina(p: number): void {
    if (p < 0 || p >= this.totalPaginas) return;
    this.paginaActual = p;
    this.buscar(false);
  }

  limpiarFiltros(): void {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroAccion     = '';
    this.filtroUsuarioId  = null;
    this.buscar();
  }

  exportarCsv(): void {
    this.exportando = true;
    this.cdr.detectChanges();

    const desdeIsoExp = this.parseFecha(this.filtroFechaDesde);
    const hastaIsoExp = this.parseFecha(this.filtroFechaHasta);
    const filtros = {
      accion:     this.filtroAccion     || undefined,
      usuarioId:  this.filtroUsuarioId  ?? undefined,
      fechaDesde: desdeIsoExp ? desdeIsoExp + 'T00:00:00' : undefined,
      fechaHasta: hastaIsoExp ? hastaIsoExp + 'T23:59:59' : undefined,
    };

    this.adminService.exportarLogsCsv(filtros).subscribe({
      next: (blob: Blob) => {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `logs-auditoria-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.exportando = false; this.cdr.detectChanges(); }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Convierte DD/MM/AAAA → YYYY-MM-DD. Devuelve '' si el formato es inválido. */
  private parseFecha(s: string): string {
    if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return '';
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Dispara la búsqueda sólo cuando ambas fechas están vacías o tienen formato completo. */
  onFechaInput(): void {
    const ok = (v: string) => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v);
    if (ok(this.filtroFechaDesde) && ok(this.filtroFechaHasta)) this.buscar();
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-CR', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit', second:'2-digit'
    });
  }

  inicialUsuario(nombre?: string | null): string {
    return (nombre || 'S').charAt(0).toUpperCase();
  }

  tipoClase(accion: string): string {
    if (!accion) return 'generico';
    const a = accion.toLowerCase();
    if (a.includes('usuario'))  return 'usuario';
    if (a.includes('config'))   return 'config';
    if (a.includes('login'))    return 'login';
    if (a.includes('juego'))    return 'juego';
    if (a.includes('perfil'))   return 'perfil';
    return 'generico';
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.filtroFechaDesde || this.filtroFechaHasta ||
              this.filtroAccion     || this.filtroUsuarioId);
  }

  /** Genera el array de páginas visibles (máx 7 botones alrededor de la actual). */
  get paginas(): number[] {
    const total  = this.totalPaginas;
    const actual = this.paginaActual;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const inicio = Math.max(0, Math.min(actual - 3, total - 7));
    return Array.from({ length: Math.min(7, total) }, (_, i) => inicio + i);
  }
}
