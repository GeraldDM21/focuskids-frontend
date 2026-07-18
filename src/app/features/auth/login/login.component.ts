import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, NgIf,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatCheckboxModule
  ],
  template: `
    <div class="login-page">

      <!-- Esferas animadas de fondo -->
      <div class="orb o1"></div>
      <div class="orb o2"></div>
      <div class="orb o3"></div>
      <div class="orb o4"></div>
      <div class="orb o5"></div>

      <!-- Tarjeta central -->
      <div class="login-card">

        <!-- Logo -->
        <div class="brand">
          <div class="brand-badge">🧠</div>
          <span class="brand-name">FocusKids</span>
        </div>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button type="button" class="tab active">Iniciar sesión</button>
          <a routerLink="/auth/register" class="tab">Registrarse</a>
        </div>

        <h2 class="card-title">Bienvenido de nuevo 👋</h2>
        <p class="card-sub">Inicia sesión para continuar</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <div class="field-wrap">
            <label>Correo electrónico</label>
            <mat-form-field appearance="outline" class="full-width">
              <input matInput formControlName="email" type="email" placeholder="ejemplo@correo.com">
              <mat-icon matSuffix>mail</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Requerido</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
            </mat-form-field>
          </div>

          <div class="field-wrap">
            <div class="pass-header">
              <label>Contraseña</label>
              <a href="#" class="forgot-link" (click)="$event.preventDefault()">¿Olvidaste tu contraseña?</a>
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <input matInput formControlName="password"
                     [type]="hidePassword ? 'password' : 'text'" placeholder="••••••••">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Requerido</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
            </mat-form-field>
          </div>

          <div class="remember-row">
            <mat-checkbox formControlName="rememberMe" color="primary">
              Recordarme por 30 días
            </mat-checkbox>
          </div>

          <div class="error-msg" *ngIf="errorMsg">
            <mat-icon>error_outline</mat-icon> {{ errorMsg }}
          </div>

          <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
            <mat-spinner *ngIf="loading" diameter="18" style="margin-right:8px"></mat-spinner>
            <ng-container *ngIf="!loading">Iniciar sesión 🚀</ng-container>
            <ng-container *ngIf="loading">Iniciando…</ng-container>
          </button>

        </form>

        <!-- Divisor social -->
        <div class="divider"><span>o continuar con</span></div>

        <div class="social-row">
          <button type="button" class="social-btn" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button type="button" class="social-btn" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
            Microsoft
          </button>
        </div>

        <p class="bottom-link">
          ¿No tienes cuenta? <a routerLink="/auth/register">Crear cuenta gratis</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }

    /* ══ PÁGINA ══ */
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 40%, #EDE9FE 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    /* ══ ESFERAS ANIMADAS ══ */
    .orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      will-change: transform;
    }

    /* Grande superior izquierda — lavanda */
    .o1 {
      width: 420px; height: 420px;
      top: -140px; left: -140px;
      background: radial-gradient(circle at 40% 40%,
        rgba(167,139,250,0.55) 0%,
        rgba(109,40,217,0.20) 50%,
        transparent 70%);
      animation: float1 10s ease-in-out infinite;
    }

    /* Grande inferior derecha — índigo oscuro */
    .o2 {
      width: 380px; height: 380px;
      bottom: -120px; right: -100px;
      background: radial-gradient(circle at 40% 40%,
        rgba(55,48,163,0.60) 0%,
        rgba(30,27,75,0.35) 50%,
        transparent 70%);
      animation: float2 12s ease-in-out infinite;
    }

    /* Mediana inferior izquierda — violeta suave */
    .o3 {
      width: 240px; height: 240px;
      bottom: 40px; left: 60px;
      background: radial-gradient(circle at 38% 38%,
        rgba(196,181,253,0.60) 0%,
        rgba(139,92,246,0.25) 55%,
        transparent 70%);
      animation: float3 8s ease-in-out infinite;
    }

    /* Pequeña superior derecha — índigo brillante */
    .o4 {
      width: 180px; height: 180px;
      top: 60px; right: 120px;
      background: radial-gradient(circle at 38% 35%,
        rgba(129,140,248,0.55) 0%,
        rgba(79,70,229,0.22) 55%,
        transparent 70%);
      animation: float4 9s ease-in-out infinite;
    }

    /* Pequeña central derecha — púrpura claro */
    .o5 {
      width: 120px; height: 120px;
      top: 45%; right: 8%;
      background: radial-gradient(circle at 40% 35%,
        rgba(216,180,254,0.65) 0%,
        rgba(167,139,250,0.25) 55%,
        transparent 70%);
      animation: float5 7s ease-in-out infinite;
    }

    @keyframes float1 {
      0%,100% { transform: translate(0,0) scale(1); }
      35%     { transform: translate(24px,-20px) scale(1.04); }
      70%     { transform: translate(-14px,18px) scale(0.97); }
    }
    @keyframes float2 {
      0%,100% { transform: translate(0,0) scale(1); }
      40%     { transform: translate(-22px,18px) scale(1.05); }
      75%     { transform: translate(14px,-12px) scale(0.96); }
    }
    @keyframes float3 {
      0%,100% { transform: translate(0,0); }
      50%     { transform: translate(18px,-22px) scale(1.07); }
    }
    @keyframes float4 {
      0%,100% { transform: translate(0,0); opacity:.9; }
      45%     { transform: translate(-14px,16px); opacity:1; }
    }
    @keyframes float5 {
      0%,100% { transform: translate(0,0) scale(1); }
      50%     { transform: translate(-12px,-16px) scale(1.10); }
    }

    /* ══ TARJETA ══ */
    .login-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 460px;
      background: white;
      border-radius: 28px;
      box-shadow: 0 20px 60px rgba(79,70,229,0.14), 0 4px 20px rgba(0,0,0,0.06);
      padding: 40px 44px;
    }

    /* ══ LOGO ══ */
    .brand {
      display: flex; align-items: center; gap: 10px;
      justify-content: center;
      margin-bottom: 28px;
    }
    .brand-badge {
      width: 44px; height: 44px; border-radius: 14px;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      box-shadow: 0 6px 18px rgba(79,70,229,0.35);
    }
    .brand-name {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 22px; font-weight: 800; color: #1E1B4B;
    }

    /* ══ TABS ══ */
    .auth-tabs {
      display: flex;
      background: #F1F5F9;
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 28px;
    }
    .tab {
      flex: 1; padding: 9px;
      border: none; background: none;
      font-family: 'Quicksand',sans-serif;
      font-size: 14px; font-weight: 700;
      color: #94A3B8; border-radius: 9px;
      cursor: pointer; text-align: center;
      text-decoration: none;
      transition: all .2s;
    }
    .tab.active {
      background: white;
      color: #4F46E5;
      box-shadow: 0 2px 8px rgba(79,70,229,0.15);
    }
    .tab:not(.active):hover { color: #64748B; }

    /* ══ TÍTULOS ══ */
    .card-title {
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 22px; font-weight: 800; color: #1E1B4B;
      margin: 0 0 4px; text-align: center;
    }
    .card-sub {
      font-family: 'Quicksand',sans-serif;
      font-size: 13.5px; color: #94A3B8;
      margin: 0 0 24px; text-align: center;
    }

    /* ══ FIELDS ══ */
    .field-wrap { margin-bottom: 4px; }
    .field-wrap label {
      display: block;
      font-family: 'Quicksand',sans-serif;
      font-size: 12.5px; font-weight: 700; color: #475569;
      margin-bottom: 4px;
    }
    .pass-header { display: flex; justify-content: space-between; align-items: baseline; }
    .forgot-link {
      font-family: 'Quicksand',sans-serif;
      font-size: 12px; font-weight: 700; color: #4F46E5;
      text-decoration: none;
    }
    .forgot-link:hover { text-decoration: underline; }
    .full-width { width: 100%; }

    /* Override focus color to purple */
    ::ng-deep .login-card .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .login-card .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .login-card .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #4F46E5 !important;
    }
    ::ng-deep .login-card .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
      color: #4F46E5 !important;
    }

    /* ══ REMEMBER ══ */
    .remember-row {
      margin: 4px 0 14px;
      font-family: 'Quicksand',sans-serif; font-size: 13px; color: #64748B;
    }

    /* ══ ERROR ══ */
    .error-msg {
      display: flex; align-items: center; gap: 8px;
      background: #FEF2F2; color: #DC2626;
      font-family: 'Quicksand',sans-serif; font-weight: 600; font-size: 13px;
      padding: 10px 12px; border-radius: 12px; margin-bottom: 12px;
    }

    /* ══ BOTÓN PRIMARIO ══ */
    .btn-primary {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 14px;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white; border: none; border-radius: 14px;
      font-family: 'Baloo 2','Quicksand',sans-serif;
      font-size: 15px; font-weight: 700; cursor: pointer;
      transition: all .2s;
    }
    .btn-primary:hover:not([disabled]) {
      box-shadow: 0 6px 24px rgba(79,70,229,0.42); transform: translateY(-1px);
    }
    .btn-primary[disabled] { opacity: 0.5; cursor: not-allowed; }

    /* ══ DIVISOR ══ */
    .divider {
      display: flex; align-items: center; gap: 12px;
      margin: 20px 0;
      font-family: 'Quicksand',sans-serif; font-size: 12.5px; color: #CBD5E1;
      font-weight: 600;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: #E2E8F0;
    }

    /* ══ SOCIAL ══ */
    .social-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .social-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 11px;
      border: 1.5px solid #E2E8F0; border-radius: 12px;
      background: white; cursor: not-allowed; opacity: 0.65;
      font-family: 'Quicksand',sans-serif; font-size: 14px; font-weight: 700; color: #475569;
      transition: all .2s;
    }

    /* ══ LINK INFERIOR ══ */
    .bottom-link {
      text-align: center;
      font-family: 'Quicksand',sans-serif; font-size: 13.5px; color: #94A3B8;
      margin: 0;
    }
    .bottom-link a { color: #4F46E5; font-weight: 700; text-decoration: none; }
    .bottom-link a:hover { text-decoration: underline; }

    @media (max-width: 500px) {
      .login-card { padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { rememberMe, ...credentials } = this.form.value;

    this.auth.login(credentials).subscribe({
      next: () => {
        this.loading = false;
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.error
          || (err.status === 401 ? 'Correo o contraseña incorrectos' : 'Error al iniciar sesión. Intente de nuevo.');
      }
    });
  }
}
