import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';

import {
  FinalizarMaratonRequest,
  IniciarMaratonResponse,
  MaratonResultadoResponse,
  NivelMaraton,
  RegistrarRondaRequest,
  RegistrarRondaResponse,
} from './maraton-mental.model';

@Injectable({ providedIn: 'root' })
export class MaratonMentalService {
  private readonly API = `${environment.apiUrl}/juegos/maraton-mental`;

  constructor(private readonly http: HttpClient) {}

  iniciarSesion(perfilId: number, nivel: NivelMaraton): Observable<IniciarMaratonResponse> {
    return this.http.post<IniciarMaratonResponse>(`${this.API}/sesiones`, { perfilId, nivel });
  }

  registrarRonda(sesionId: number, request: RegistrarRondaRequest): Observable<RegistrarRondaResponse> {
    return this.http.post<RegistrarRondaResponse>(`${this.API}/sesiones/${sesionId}/rondas`, request);
  }

  finalizarSesion(sesionId: number, request: FinalizarMaratonRequest): Observable<MaratonResultadoResponse> {
    return this.http.put<MaratonResultadoResponse>(`${this.API}/sesiones/${sesionId}/finalizar`, request);
  }
}
