import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface LogAuditoria {
  id: number;
  accion: string;
  entidad: string;
  fecha: string;
  ip: string;
  usuario?: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly url = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listarUsuarios() {
    return this.http.get<Usuario[]>(`${this.url}/usuarios`);
  }

  toggleActivo(id: number) {
    return this.http.put<Usuario>(`${this.url}/usuarios/${id}/toggle-activo`, {});
  }

  obtenerLogs() {
    return this.http.get<LogAuditoria[]>(`${this.url}/logs`);
  }
}
