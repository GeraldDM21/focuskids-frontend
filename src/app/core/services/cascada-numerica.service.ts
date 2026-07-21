import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  CascadaResultadoResponse,
  FinalizarCascadaRequest,
  IniciarCascadaRequest,
  IniciarCascadaResponse,
  RegistrarOperacionResponse,
  ResultadoOperacion
} from '../../features/nino/juego/cascada-numerica/cascada-numerica.types';

@Injectable({
  providedIn: 'root'
})
export class CascadaNumericaService {

  private readonly apiUrl =
    `${environment.apiUrl}/juegos/cascada-numerica`;

  constructor(
    private readonly http: HttpClient
  ) {}

  iniciarSesion(
    perfilId: number
  ): Observable<IniciarCascadaResponse> {
    const request: IniciarCascadaRequest = {
      perfilId
    };

    return this.http.post<IniciarCascadaResponse>(
      `${this.apiUrl}/sesiones`,
      request
    );
  }

  registrarOperacion(
    sesionId: number,
    resultado: ResultadoOperacion
  ): Observable<RegistrarOperacionResponse> {
    return this.http.post<RegistrarOperacionResponse>(
      `${this.apiUrl}/sesiones/${sesionId}/operaciones`,
      resultado
    );
  }

  finalizarSesion(
    sesionId: number,
    request: FinalizarCascadaRequest
  ): Observable<CascadaResultadoResponse> {
    return this.http.put<CascadaResultadoResponse>(
      `${this.apiUrl}/sesiones/${sesionId}/finalizar`,
      request
    );
  }

  obtenerOperaciones(
    sesionId: number
  ): Observable<ResultadoOperacion[]> {
    return this.http.get<ResultadoOperacion[]>(
      `${this.apiUrl}/sesiones/${sesionId}/operaciones`
    );
  }
}
