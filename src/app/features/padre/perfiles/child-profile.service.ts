import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ChildProfile, ChildProfileRequest, ActiveProfileState } from './child-profile.model';

// Servicio que se encarga de comunicarse con el backend para todo lo relacionado a perfiles de ninos
@Injectable({ providedIn: 'root' })
export class ChildProfileService {

  private readonly API_URL = 'http://localhost:8080/api/perfil';

  // Guarda cual perfil de nino esta activo en este momento (sin cerrar sesion del padre)
  private activeProfileSubject = new BehaviorSubject<ActiveProfileState>({
    profileId: null, profileName: null, profileAvatar: null
  });
  public activeProfile$ = this.activeProfileSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Trae todos los perfiles de un padre
  getProfiles(padreId: number): Observable<ChildProfile[]> {
    return this.http.get<ChildProfile[]>(`${this.API_URL}/padre/${padreId}`);
  }

  // Cambia el perfil activo y guarda cual quedo seleccionado (solo actualiza estado local)
  switchProfile(profileId: number, padreId: number): Observable<ChildProfile> {
    return this.http.get<ChildProfile>(`${this.API_URL}/${profileId}`).pipe(
      tap(profile => this.activeProfileSubject.next({
        profileId: profile.id,
        profileName: profile.nombre,
        profileAvatar: profile.avatar
      }))
    );
  }

  // Crea un nuevo perfil de nino
  createProfile(request: ChildProfileRequest, padreId: number): Observable<ChildProfile> {
    return this.http.post<ChildProfile>(`${this.API_URL}/padre/${padreId}`, request);
  }

  // Edita un perfil existente
  updateProfile(profileId: number, request: ChildProfileRequest, padreId: number): Observable<ChildProfile> {
    return this.http.put<ChildProfile>(`${this.API_URL}/${profileId}`, request);
  }

  // Activa o desactiva un perfil
  toggleStatus(profileId: number, padreId: number): Observable<ChildProfile> {
    return this.http.patch<ChildProfile>(`${this.API_URL}/${profileId}/toggle`, {});
  }

  // Elimina un perfil (el frontend ya pidio confirmacion antes de llamar esto)
  deleteProfile(profileId: number, padreId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${profileId}`);
  }

  // Limpia el perfil activo, por ejemplo cuando el padre cierra sesion
  clearActiveProfile(): void {
    this.activeProfileSubject.next({ profileId: null, profileName: null, profileAvatar: null });
  }
}
