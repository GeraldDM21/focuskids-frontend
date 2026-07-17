import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, NgIf,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="register-page">
      <div class="bg-decor" aria-hidden="true">
        <span class="blob blob-1"></span>
        <span class="blob blob-2"></span>
        <span class="blob blob-3"></span>

        <!-- Huellitas de fondo (pequenas, dispersas) -->
        <svg class="paw" style="top:80.8%;left:62.1%;width:19px;transform:rotate(-8deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:98%;left:31.1%;width:19px;transform:rotate(-16deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:77.8%;left:47.5%;width:15px;transform:rotate(-25deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:50.6%;left:28.1%;width:15px;transform:rotate(-21deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:26.5%;left:22.0%;width:16px;transform:rotate(12deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:70.8%;left:97%;width:16px;transform:rotate(-30deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:22.7%;left:97%;width:20px;transform:rotate(23deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:30.7%;left:44.6%;width:22px;transform:rotate(-19deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:1%;left:31.7%;width:17px;transform:rotate(-12deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:98%;left:51.1%;width:13px;transform:rotate(-21deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:20.5%;left:1%;width:19px;transform:rotate(4deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:98%;left:17.5%;width:18px;transform:rotate(9deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:44.7%;left:46.5%;width:22px;transform:rotate(-10deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:49.4%;left:97%;width:15px;transform:rotate(14deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:75.3%;left:37.8%;width:21px;transform:rotate(30deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:1%;left:65.9%;width:22px;transform:rotate(11deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:25.9%;left:32.1%;width:13px;transform:rotate(-1deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:1%;left:97%;width:21px;transform:rotate(-5deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:1.8%;left:11.5%;width:19px;transform:rotate(-5deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:51.7%;left:15.1%;width:19px;transform:rotate(-24deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:98%;left:97%;width:20px;transform:rotate(10deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:98%;left:88.7%;width:19px;transform:rotate(-27deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:1%;left:78.4%;width:16px;transform:rotate(-26deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:74.0%;left:86.4%;width:16px;transform:rotate(-2deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:46.2%;left:1%;width:15px;transform:rotate(-23deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:1%;left:1%;width:18px;transform:rotate(8deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:29.3%;left:64.1%;width:13px;transform:rotate(-24deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>
        <svg class="paw" style="top:78.5%;left:2.4%;width:13px;transform:rotate(6deg);" viewBox="0 0 40 40"><ellipse cx="20" cy="27" rx="9" ry="7"/><circle cx="10" cy="14" r="3.6"/><circle cx="20" cy="9" r="4"/><circle cx="30" cy="14" r="3.6"/></svg>

        <svg class="animal animal-giraffe" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="50" width="20" height="80" rx="10" fill="#EF9F27"/>
          <ellipse cx="50" cy="140" rx="30" ry="18" fill="#EF9F27"/>
          <ellipse cx="50" cy="35" rx="16" ry="20" fill="#EF9F27"/>
          <ellipse cx="34" cy="28" rx="7" ry="4" fill="#EF9F27" transform="rotate(-20 34 28)"/>
          <ellipse cx="66" cy="28" rx="7" ry="4" fill="#EF9F27" transform="rotate(20 66 28)"/>
          <circle cx="43" cy="14" r="4" fill="#EF9F27"/>
          <circle cx="57" cy="14" r="4" fill="#EF9F27"/>
          <circle cx="45" cy="70" r="5" fill="#FAEEDA"/>
          <circle cx="55" cy="90" r="5" fill="#FAEEDA"/>
          <circle cx="44" cy="110" r="5" fill="#FAEEDA"/>
          <circle cx="56" cy="34" r="2.5" fill="#854F0B"/>
        </svg>

        <svg class="animal animal-dog" viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="65" cy="80" rx="40" ry="24" fill="#AFA9EC"/>
          <circle cx="65" cy="40" r="28" fill="#AFA9EC"/>
          <ellipse cx="40" cy="38" rx="10" ry="18" fill="#7F77DD" transform="rotate(-15 40 38)"/>
          <ellipse cx="90" cy="38" rx="10" ry="18" fill="#7F77DD" transform="rotate(15 90 38)"/>
          <ellipse cx="65" cy="52" rx="12" ry="9" fill="#EEEDFE"/>
          <circle cx="65" cy="50" r="3" fill="#3C3489"/>
          <circle cx="55" cy="34" r="3" fill="#3C3489"/>
          <circle cx="75" cy="34" r="3" fill="#3C3489"/>
          <path d="M100 85 Q120 75 118 60" stroke="#AFA9EC" stroke-width="8" stroke-linecap="round" fill="none"/>
        </svg>

        <svg class="animal animal-cat" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="78" rx="34" ry="20" fill="#F2A9C6"/>
          <circle cx="60" cy="38" r="26" fill="#F2A9C6"/>
          <path d="M38 22 L46 6 L52 26 Z" fill="#F2A9C6"/>
          <path d="M82 22 L74 6 L68 26 Z" fill="#F2A9C6"/>
          <path d="M42 20 L48 10 L50 24 Z" fill="#E8799F"/>
          <path d="M78 20 L72 10 L70 24 Z" fill="#E8799F"/>
          <circle cx="50" cy="38" r="3" fill="#8A3D5A"/>
          <circle cx="70" cy="38" r="3" fill="#8A3D5A"/>
          <path d="M56 48 Q60 52 64 48" stroke="#8A3D5A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M95 88 Q112 80 108 62" stroke="#F2A9C6" stroke-width="8" stroke-linecap="round" fill="none"/>
        </svg>

        <svg class="animal animal-rabbit" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="98" rx="30" ry="26" fill="#F5CE6B"/>
          <circle cx="50" cy="55" r="22" fill="#F5CE6B"/>
          <ellipse cx="35" cy="18" rx="8" ry="26" fill="#F5CE6B"/>
          <ellipse cx="65" cy="18" rx="8" ry="26" fill="#F5CE6B"/>
          <ellipse cx="35" cy="18" rx="4" ry="18" fill="#FBEFC9"/>
          <ellipse cx="65" cy="18" rx="4" ry="18" fill="#FBEFC9"/>
          <circle cx="42" cy="52" r="3" fill="#8A5A16"/>
          <circle cx="58" cy="52" r="3" fill="#8A5A16"/>
          <ellipse cx="50" cy="62" rx="5" ry="3.5" fill="#FBEFC9"/>
        </svg>
      </div>

      <mat-card class="register-card">
        <mat-card-header>
          <div class="header-content">
            <div class="logo-badge">
              <mat-icon class="logo-icon">auto_awesome</mat-icon>
            </div>
            <h1>Crear cuenta</h1>
            <p>FocusKids — Regístrate para empezar a jugar y aprender 🎉</p>
          </div>
        </mat-card-header>

        <mat-card-content>

          <div class="success-box" *ngIf="successMsg">
            <div class="success-icon-badge">
              <mat-icon>mark_email_read</mat-icon>
            </div>
            <p>{{ successMsg }}</p>
            <a routerLink="/auth/login" class="login-link">Ir a iniciar sesión</a>
          </div>

          <form *ngIf="!successMsg" [formGroup]="form" (ngSubmit)="onSubmit()">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre completo</mat-label>
              <input matInput formControlName="nombre">
              <mat-icon matSuffix>badge</mat-icon>
              <mat-error *ngIf="form.get('nombre')?.hasError('required')">Requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="email" type="email">
              <mat-icon matSuffix>mail</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Requerido</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password"
                     [type]="hidePassword ? 'password' : 'text'">
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('pattern') && !form.get('password')?.hasError('minlength')">
                Debe incluir al menos 1 mayúscula y 1 número
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo de cuenta</mat-label>
              <mat-select formControlName="rol">
                <mat-option value="PADRE">Padre / Tutor</mat-option>
                <mat-option value="DOCENTE">Docente</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Campos extra para PADRE -->
            <ng-container *ngIf="form.get('rol')?.value === 'PADRE'">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Teléfono (opcional)</mat-label>
                <input matInput formControlName="telefono">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Relación con el niño</mat-label>
                <mat-select formControlName="relacionConNino">
                  <mat-option value="Padre">Padre</mat-option>
                  <mat-option value="Madre">Madre</mat-option>
                  <mat-option value="Tutor">Tutor legal</mat-option>
                  <mat-option value="Otro">Otro</mat-option>
                </mat-select>
              </mat-form-field>
            </ng-container>

            <!-- Campos extra para DOCENTE -->
            <ng-container *ngIf="form.get('rol')?.value === 'DOCENTE'">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Institución educativa</mat-label>
                <input matInput formControlName="institucion">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Grado / Grupo</mat-label>
                <input matInput formControlName="gradoGrupo" placeholder="Ej: 3° grado A">
              </mat-form-field>
            </ng-container>

            <div class="error-msg" *ngIf="errorMsg">
              <mat-icon>sentiment_dissatisfied</mat-icon> {{ errorMsg }}
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="form.invalid || loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <ng-container *ngIf="!loading">
                <mat-icon>celebration</mat-icon>
                <span>Crear cuenta</span>
              </ng-container>
            </button>

            <p class="login-link">
              ¿Ya tiene cuenta? <a routerLink="/auth/login">Iniciar sesión</a>
            </p>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    /* ============================================================
       FocusKids — Registro
       Misma identidad visual que Login: paleta calmada TDAH-friendly,
       tipografía redondeada, formas suaves, decoración mínima y sin
       animaciones continuas.
       ============================================================ */

    .register-page {
      position: relative;
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;

      background: linear-gradient(160deg, #eaf6ff 0%, #f1ecff 55%, #fff6e8 100%);

      --mat-sys-primary: #1e9a85;
      --mat-sys-on-primary: #ffffff;
      --mat-sys-primary-container: #d7f4ee;
      --mat-sys-on-primary-container: #0e4f42;
      --mat-sys-secondary: #ff8c61;
      --mat-sys-on-secondary: #ffffff;
      --mat-sys-error: #e8607a;
      --mat-sys-on-error: #ffffff;
      --mat-sys-outline: #bfe0d8;
      --mat-sys-outline-variant: #dceef7;
      --mat-sys-surface: #ffffff;
      --mat-sys-on-surface: #33415c;
      --mat-sys-on-surface-variant: #6b7a99;
    }

    .bg-decor { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
    .blob { position: absolute; border-radius: 50%; opacity: 0.55; }
    .blob-1 { width: 240px; height: 240px; background: #ffe1ce; top: -70px; left: -70px; }
    .blob-2 { width: 170px; height: 170px; background: #cff3ea; bottom: 30px; right: -50px; }
    .blob-3 { width: 120px; height: 120px; background: #ffefbe; bottom: -40px; left: 18%; }

    .animal { position: absolute; opacity: 0.16; }
    .paw { position: absolute; fill: currentColor; color: #33415c; opacity: 0.11; }
    .animal-giraffe { top: 10px; left: -10px; width: 80px; height: 128px; }
    .animal-dog { bottom: 28px; right: -22px; width: 120px; height: 100px; transform: rotate(-4deg); }
    .animal-cat { top: 46%; left: -14px; width: 88px; height: 80px; }
    .animal-rabbit { top: 42%; right: -10px; width: 70px; height: 98px; }

    .register-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 460px;
      max-height: 92vh;
      overflow-y: auto;
      border-radius: 28px !important;
      box-shadow: 0 14px 34px rgba(30, 154, 133, 0.18), 0 3px 10px rgba(51, 65, 92, 0.08) !important;
    }

    .header-content { width: 100%; text-align: center; padding: 26px 16px 6px; }

    .logo-badge {
      width: 64px; height: 64px; margin: 0 auto 12px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1e9a85, #3fd6be);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 20px rgba(30, 154, 133, 0.35);
    }
    .logo-icon { color: #ffffff; width: 32px; height: 32px; font-size: 32px; }

    .header-content h1 {
      font-family: 'Baloo 2', 'Quicksand', sans-serif;
      font-size: 26px; font-weight: 700; color: #128075; margin: 0;
    }
    .header-content p {
      font-family: 'Quicksand', sans-serif;
      font-size: 13.5px; font-weight: 500; color: #6b7a99; margin: 6px 0 0;
    }

    mat-card-content { padding: 10px 24px 26px !important; }
    .full-width { width: 100%; margin-bottom: 6px; font-family: 'Quicksand', sans-serif; }

    .error-msg {
      display: flex; align-items: center; gap: 8px;
      background: #fdecef; color: #c43d57;
      font-family: 'Quicksand', sans-serif; font-weight: 600; font-size: 13px;
      padding: 10px 12px; border-radius: 14px; margin-bottom: 10px;
    }

    .submit-btn {
      height: 52px; border-radius: 16px !important;
      font-family: 'Baloo 2', 'Quicksand', sans-serif;
      font-size: 16px; font-weight: 600; letter-spacing: 0.2px;
      margin-top: 8px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: transform 0.15s ease;
    }
    .submit-btn:not([disabled]):hover { transform: translateY(-1px) scale(1.01); }

    .login-link {
      text-align: center; margin-top: 16px;
      font-family: 'Quicksand', sans-serif; font-size: 13.5px; color: #6b7a99;
    }
    .login-link a, a.login-link {
      color: #1e9a85; text-decoration: none; font-weight: 700;
    }

    /* Caja de éxito post-registro (verificación por correo) */
    .success-box {
      text-align: center;
      padding: 22px 6px 10px;
      font-family: 'Quicksand', sans-serif;
    }
    .success-icon-badge {
      width: 64px; height: 64px; margin: 0 auto 14px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1e9a85, #3fd6be);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 20px rgba(30, 154, 133, 0.35);
    }
    .success-icon-badge mat-icon {
      color: #ffffff; font-size: 32px; width: 32px; height: 32px;
    }
    .success-box p {
      font-size: 14.5px; font-weight: 500; color: #33415c; margin: 0 0 18px;
      line-height: 1.5;
    }
    .success-box a.login-link {
      display: inline-block;
      background: #1e9a85;
      color: #ffffff !important;
      padding: 10px 24px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 14px;
    }

    @media (prefers-reduced-motion: reduce) {
      .submit-btn { transition: none; }
    }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  hidePassword = true;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre:         ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      password:       ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
      rol:            ['PADRE', Validators.required],
      telefono:       [''],
      relacionConNino:[''],
      institucion:    [''],
      gradoGrupo:     ['']
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.auth.register(this.form.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMsg = response.mensaje || 'Cuenta creada. Revisa tu correo para verificarla.';
      },
      error: (err) => {
        this.loading = false;
        const campos = err?.error?.campos;
        this.errorMsg = err?.error?.error
          || (campos ? Object.values(campos)[0] as string : null)
          || 'Error al crear la cuenta. Intente de nuevo.';
      }
    });
  }
}
