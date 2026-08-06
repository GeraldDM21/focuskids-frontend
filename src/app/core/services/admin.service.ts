import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type UsuarioRol = 'NINO' | 'PADRE' | 'DOCENTE' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
  fechaCreacion: string;
}

export interface UsuarioPage {
  content: Usuario[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface UsuarioEditRequest {
  nombre?: string | null;
  rol?: UsuarioRol | null;
  activo?: boolean | null;
}

export interface PerfilNinoAdmin {
  id: number;
  nombre: string;
  edad: number | null;
  diagnostico: string | null;
  avatar: string | null;
  activo: boolean;
  padre?: { id: number; usuario?: { nombre: string; email: string } };
}

export interface LogAuditoria {
  id: number;
  accion: string;
  entidad: string | null;
  descripcion: string | null;
  resultado: string | null;   // 'EXITO' | 'FALLO'
  fecha: string;
  ip: string | null;
  usuario?: Pick<Usuario, 'id' | 'nombre' | 'email'> | null;
}

export interface LogPage {
  content: LogAuditoria[];
  totalPages: number;
  totalElements: number;
  number: number;    // página actual (0-indexed)
  size: number;
}

export type LogFiltros = {
  page?: number;
  fechaDesde?: string;   // ISO datetime
  fechaHasta?: string;
  accion?: string;
  usuarioId?: number | null;
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly url = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listarUsuarios() {
    return this.http.get<Usuario[]>(`${this.url}/usuarios`);
  }

  /** CA-01: búsqueda paginada */
  buscarUsuarios(q: string, rol: string, page: number) {
    let params = new HttpParams()
      .set('q', q).set('rol', rol).set('page', page.toString());
    return this.http.get<UsuarioPage>(`${this.url}/usuarios/buscar`, { params });
  }

  toggleActivo(id: number) {
    return this.http.put<Usuario>(`${this.url}/usuarios/${id}/toggle-activo`, {});
  }

  /** CA-02: editar nombre, rol y/o estado */
  editarUsuario(id: number, req: UsuarioEditRequest) {
    return this.http.put<Usuario>(`${this.url}/usuarios/${id}`, req);
  }

  /** CA-04: eliminar usuario */
  eliminarUsuario(id: number) {
    return this.http.delete<void>(`${this.url}/usuarios/${id}`);
  }

  listarNinos() {
    return this.http.get<PerfilNinoAdmin[]>(`${this.url}/ninos`);
  }

  /** @deprecated usar obtenerLogsFiltrados */
  obtenerLogs() {
    return this.http.get<LogAuditoria[]>(`${this.url}/logs`);
  }

  /** CA-02 / CA-04 / CA-05: paginación + filtros */
  obtenerLogsFiltrados(filtros: LogFiltros) {
    let params = new HttpParams();
    if (filtros.page != null)       params = params.set('page',       filtros.page.toString());
    if (filtros.fechaDesde)         params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta)         params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.accion)             params = params.set('accion',     filtros.accion);
    if (filtros.usuarioId != null)  params = params.set('usuarioId',  filtros.usuarioId.toString());
    return this.http.get<LogPage>(`${this.url}/logs/filtrados`, { params });
  }

  /** CA-02: exportar filtro actual a CSV — devuelve Blob para descarga */
  exportarLogsCsv(filtros: Omit<LogFiltros, 'page'>) {
    let params = new HttpParams();
    if (filtros.fechaDesde)        params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta)        params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.accion)            params = params.set('accion',     filtros.accion);
    if (filtros.usuarioId != null) params = params.set('usuarioId',  filtros.usuarioId!.toString());
    return this.http.get(`${this.url}/logs/exportar-csv`, {
      params,
      responseType: 'blob'
    });
  }
}
