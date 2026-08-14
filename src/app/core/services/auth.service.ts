import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UsuarioRol } from '../models/auth.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private _user = signal<AuthResponse | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly userRol = computed(() => this._user()?.rol ?? null);
  readonly userName = computed(() => this._user()?.nombre ?? '');

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router
  ) {
    // A propósito NO se restaura la sesión guardada al abrir/recargar la
    // app: se pidió que siempre haya que iniciar sesión de nuevo, en vez de
    // quedar logueado indefinidamente entre visitas. Se limpia cualquier
    // token viejo para que tampoco quede flotando y se use por accidente
    // (el interceptor lo toma directo de storage, no de este signal).
    this.storage.clear();
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      timeout(15000),   // 15s máximo — evita quedar colgado si el backend no responde
      tap(response => {
        if (response.token) {
          this.storage.setToken(response.token);
          this.storage.setUser(response);
          this._user.set(response);
        }
      })
    );
  }

  register(request: RegisterRequest) {
    // No inicia sesión automáticamente: la cuenta queda inactiva
    // hasta que el usuario verifique su correo.
    // timeout: igual que login() — si el backend no responde en 15s (antes
    // podía tardar mucho más esperando el envío del correo de verificación),
    // se corta y se muestra un error en vez de dejar "Creando cuenta…" pegado.
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      timeout(15000)
    );
  }

  verify(token: string) {
    return this.http.get<{ mensaje: string }>(`${this.apiUrl}/verify`, { params: { token } });
  }

  logout(): void {
    this.storage.clear();
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  hasRole(rol: UsuarioRol): boolean {
    return this._user()?.rol === rol;
  }

  redirectByRole(): void {
    const rol = this._user()?.rol;
    switch (rol) {
      case 'PADRE':         this.router.navigate(['/padre/dashboard']); break;
      case 'DOCENTE':       this.router.navigate(['/docente/dashboard']); break;
      case 'ADMINISTRADOR': this.router.navigate(['/admin']); break;
      case 'NINO':          this.router.navigate(['/nino/juegos']); break;
      default:              this.router.navigate(['/auth/login']);
    }
  }
}
