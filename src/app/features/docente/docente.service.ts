import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SesionJuego, Metrica, AlertaRegresion } from '../padre/padre.service';

export interface AlumnoDocente {
  id: number;
  nombre: string;
  edad: number;
  avatar?: string;
  diagnostico?: string;
  activo: boolean;
  padre?: { id: number; usuario?: { nombre?: string; } };
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAlumnos(docenteUsuarioId: number) {
    return this.http.get<AlumnoDocente[]>(`${this.api}/perfil/docente/${docenteUsuarioId}`);
  }

  getSesiones(perfilId: number) {
    return this.http.get<SesionJuego[]>(`${this.api}/sesiones/perfil/${perfilId}`);
  }

  getMetricas(perfilId: number) {
    return this.http.get<Metrica[]>(`${this.api}/reportes/perfil/${perfilId}/metricas`);
  }

  getAlertas(perfilId: number) {
    return this.http.get<AlertaRegresion[]>(`${this.api}/reportes/perfil/${perfilId}/alertas/pendientes`);
  }
}
