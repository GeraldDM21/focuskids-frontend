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
    const savedUser = this.storage.getUser();
    if (savedUser && this.storage.getToken()) {
      this._user.set(savedUser);
    }
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
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
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
      case 'NINO':          this.router.navigate(['/juegos']); break;
      default:              this.router.navigate(['/auth/login']);
    }
  }
}
