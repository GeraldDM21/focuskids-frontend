import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PerfilNino {
  id?: number;
  nombre: string;
  edad: number;
  diagnostico?: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly url = `${environment.apiUrl}/perfil`;

  constructor(private http: HttpClient) {}

  listarPorPadre(padreId: number) {
    return this.http.get<PerfilNino[]>(`${this.url}/padre/${padreId}`);
  }

  obtener(id: number) {
    return this.http.get<PerfilNino>(`${this.url}/${id}`);
  }

  crear(padreId: number, perfil: PerfilNino) {
    return this.http.post<PerfilNino>(`${this.url}/padre/${padreId}`, perfil);
  }

  actualizar(id: number, perfil: PerfilNino) {
    return this.http.put<PerfilNino>(`${this.url}/${id}`, perfil);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
