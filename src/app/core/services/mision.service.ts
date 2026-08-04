import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MisionEstado {
  reclamado:   boolean;
  recompensa?: string;
  misionIndex?: number;
}

export interface MisionReclamada {
  id:          number;
  perfilId:    number;
  fecha:       string;   // ISO date: "2026-08-03"
  misionIndex: number;
  recompensa:  string;
}

@Injectable({ providedIn: 'root' })
export class MisionService {

  private readonly base = `${environment.apiUrl}/misiones`;

  constructor(private http: HttpClient) {}

  getEstado(perfilId: number): Observable<MisionEstado> {
    return this.http.get<MisionEstado>(`${this.base}/estado/${perfilId}`);
  }

  reclamar(perfilId: number, misionIndex: number, recompensa: string): Observable<MisionReclamada> {
    return this.http.post<MisionReclamada>(`${this.base}/reclamar/${perfilId}`, { misionIndex, recompensa });
  }

  getHistorial(perfilId: number): Observable<MisionReclamada[]> {
    return this.http.get<MisionReclamada[]>(`${this.base}/historial/${perfilId}`);
  }
}
