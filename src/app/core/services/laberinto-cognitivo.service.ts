import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  FinalizarLaberintoRequest,
  IniciarLaberintoRequest,
  IniciarLaberintoResponse,
  LaberintoResultadoResponse,
  RegistrarPasoRequest,
  RegistrarPasoResponse
} from '../../features/nino/juego/laberinto/laberinto.types';

@Injectable({
  providedIn: 'root'
})
export class LaberintoCognitivoService {

  private readonly apiUrl =
    `${environment.apiUrl}/juegos/laberinto-cognitivo`;

  constructor(
    private readonly http: HttpClient
  ) {}

  iniciarSesion(
    perfilId: number
  ): Observable<IniciarLaberintoResponse> {
    const request: IniciarLaberintoRequest = {
      perfilId
    };

    return this.http.post<IniciarLaberintoResponse>(
      `${this.apiUrl}/sesiones`,
      request
    );
  }

  registrarPaso(
    sesionId: number,
    paso: RegistrarPasoRequest
  ): Observable<RegistrarPasoResponse> {
    return this.http.post<RegistrarPasoResponse>(
      `${this.apiUrl}/sesiones/${sesionId}/pasos`,
      paso
    );
  }

  finalizarSesion(
    sesionId: number,
    request: FinalizarLaberintoRequest
  ): Observable<LaberintoResultadoResponse> {
    return this.http.put<LaberintoResultadoResponse>(
      `${this.apiUrl}/sesiones/${sesionId}/finalizar`,
      request
    );
  }
}
