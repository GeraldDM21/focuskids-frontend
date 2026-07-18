import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, NgIf,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatCheckboxModule
  ],
  template: `
    <div class="reg-page">

      <!-- ══ PANEL IZQUIERDO ══ -->
      <div class="reg-left">
        <div class="orb o1"></div>
        <div class="orb o2"></div>
        <div class="orb o3"></div>
        <div class="orb o4"></div>
        <div class="orb o5"></div>

        <div class="left-inner">
          <div class="brand">
            <span class="brand-ico">🧠</span>
            <span class="brand-name">FocusKids</span>
          </div>

          <div class="left-pitch">
            <h2>Crea tu cuenta<br>en minutos</h2>
            <p>Únete a las familias que ya están transformando el aprendizaje de sus hijos con TDAH.</p>
          </div>

          <ul class="features">
            <li>
              <span class="feat-ico"><mat-icon>videogame_asset</mat-icon></span>
              12 juegos cognitivos adaptativos
            </li>
            <li>
              <span class="feat-ico"><mat-icon>insights</mat-icon></span>
              Seguimiento de progreso en tiempo real
            </li>
            <li>
              <span class="feat-ico"><mat-icon>emoji_events</mat-icon></span>
              Sistema de logros y recompensas
            </li>
            <li>
              <span class="feat-ico"><mat-icon>lock</mat-icon></span>
              Privacidad y seguridad garantizadas
            </li>
          </ul>

          <p class="left-login">
            ¿Ya tienes cuenta?
            <a routerLink="/auth/login">Inicia sesión aquí</a>
          </p>
        </div>
      </div>

      <!-- ══ PANEL DERECHO ══ -->
      <div class="reg-right">
        <div class="form-wrap">

          <!-- Indicador de pasos -->
          <div class="steps">
            <div class="step" [class.done]="step > 1" [class.active]="step === 1">
              <div class="step-circle">
                <mat-icon *ngIf="step > 1">check</mat-icon>
                <span *ngIf="step <= 1">1</span>
              </div>
              <span class="step-label">Rol</span>
            </div>
            <div class="step-line" [class.done]="step > 1"></div>
            <div class="step" [class.done]="step > 2" [class.active]="step === 2">
              <div class="step-circle">
                <mat-icon *ngIf="step > 2">check</mat-icon>
                <span *ngIf="step <= 2">2</span>
              </div>
              <span class="step-label">Datos</span>
            </div>
            <div class="step-line" [class.done]="step > 2"></div>
            <div class="step" [class.active]="step === 3">
              <div class="step-circle"><span>3</span></div>
              <span class="step-label">Listo</span>
            </div>
          </div>

          <!-- ── PASO 1: ROL ── -->
          <ng-container *ngIf="step === 1">
            <h2 class="form-title">Crea tu cuenta</h2>
            <p class="form-sub">Selecciona tu rol y completa tu información</p>

            <div class="role-cards">
              <button type="button" class="role-card" [class.active]="rolSeleccionado === 'PADRE'"
                      (click)="rolSeleccionado = 'PADRE'">
                <mat-icon class="role-mat-icon">family_restroom</mat-icon>
                <span>Padre / Tutor</span>
              </button>
              <button type="button" class="role-card" [class.active]="rolSeleccionado === 'DOCENTE'"
                      (click)="rolSeleccionado = 'DOCENTE'">
                <mat-icon class="role-mat-icon">school</mat-icon>
                <span>Docente</span>
              </button>
            </div>

            <button class="btn-primary full-width" [disabled]="!rolSeleccionado" (click)="goStep2()">
              Continuar
              <mat-icon>arrow_forward</mat-icon>
            </button>

            <p class="bottom-link">
              ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a>
            </p>
          </ng-container>

          <!-- ── PASO 2: DATOS ── -->
          <ng-container *ngIf="step === 2">
            <h2 class="form-title">Completa tus datos</h2>
            <p class="form-sub">Ingresa tu información para crear la cuenta</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">

              <div class="field-row">
                <mat-form-field appearance="outline" class="field">
                  <mat-label>Nombre</mat-label>
                  <input matInput formControlName="nombre" placeholder="Tu nombre">
                  <mat-error *ngIf="form.get('nombre')?.hasError('required')">Requerido</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" class="field">
                  <mat-label>Apellido</mat-label>
                  <input matInput formControlName="apellido" placeholder="Tu apellido">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Correo electrónico</mat-label>
                <input matInput formControlName="email" type="email" placeholder="ejemplo@correo.com">
                <mat-icon matSuffix>mail</mat-icon>
                <mat-error *ngIf="form.get('email')?.hasError('required')">Requerido</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
              </mat-form-field>

              <div class="field-row">
                <mat-form-field appearance="outline" class="field">
                  <mat-label>Contraseña</mat-label>
                  <input matInput formControlName="password"
                         [type]="hidePassword ? 'password' : 'text'" placeholder="Mín. 8 caracteres">
                  <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                    <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mín. 8 caracteres</mat-error>
                  <mat-error *ngIf="form.get('password')?.hasError('pattern') && !form.get('password')?.hasError('minlength')">
                    Requiere mayúscula y número
                  </mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" class="field">
                  <mat-label>Confirmar contraseña</mat-label>
                  <input matInput formControlName="confirmPassword"
                         [type]="hideConfirm ? 'password' : 'text'" placeholder="Repite la contraseña">
                  <button mat-icon-button matSuffix type="button" (click)="hideConfirm = !hideConfirm">
                    <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched">
                    No coinciden
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Barra de fuerza -->
              <div class="strength-wrap" *ngIf="form.get('password')?.value">
                <div class="strength-row">
                  <span class="strength-lbl" [style.color]="strengthColor">{{ strengthLabel }}</span>
                  <span class="strength-hint">{{ strengthHint }}</span>
                </div>
                <div class="strength-segs">
                  <div class="seg" [style.background]="strengthScore >= 1 ? strengthColor : '#E2E8F0'"></div>
                  <div class="seg" [style.background]="strengthScore >= 2 ? strengthColor : '#E2E8F0'"></div>
                  <div class="seg" [style.background]="strengthScore >= 3 ? strengthColor : '#E2E8F0'"></div>
                  <div class="seg" [style.background]="strengthScore >= 4 ? strengthColor : '#E2E8F0'"></div>
                </div>
              </div>

              <!-- Campos extra PADRE -->
              <ng-container *ngIf="rolSeleccionado === 'PADRE'">
                <div class="field-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>Teléfono (opcional)</mat-label>
                    <input matInput formControlName="telefono" placeholder="88881234">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>Relación con el niño</mat-label>
                    <mat-select formControlName="relacionConNino">
                      <mat-option value="Padre">Padre</mat-option>
                      <mat-option value="Madre">Madre</mat-option>
                      <mat-option value="Tutor">Tutor legal</mat-option>
                      <mat-option value="Otro">Otro</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </ng-container>

              <!-- Campos extra DOCENTE -->
              <ng-container *ngIf="rolSeleccionado === 'DOCENTE'">
                <div class="field-row">
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>Institución educativa</mat-label>
                    <input matInput formControlName="institucion" placeholder="Nombre del centro">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="field">
                    <mat-label>Grado / Grupo</mat-label>
                    <input matInput formControlName="gradoGrupo" placeholder="Ej: 3° A">
                  </mat-form-field>
                </div>
              </ng-container>

              <!-- Términos -->
              <div class="terms-row">
                <mat-checkbox formControlName="aceptaTerminos" color="primary">
                  Acepto los <a routerLink="/terminos" target="_blank">Términos de servicio</a>
                  y la <a routerLink="/privacidad" target="_blank">Política de privacidad</a> de FocusKids
                </mat-checkbox>
                <div class="terms-error"
                     *ngIf="form.get('aceptaTerminos')?.invalid && form.get('aceptaTerminos')?.touched">
                  Debes aceptar los términos para continuar
                </div>
              </div>

              <div class="error-msg" *ngIf="errorMsg">
                <mat-icon>error_outline</mat-icon> {{ errorMsg }}
              </div>

              <div class="btn-row">
                <button type="button" class="btn-ghost" (click)="step = 1">
                  <mat-icon>arrow_back</mat-icon>
                </button>
                <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
                  <mat-spinner *ngIf="loading" diameter="18" style="margin-right:8px"></mat-spinner>
                  <ng-container *ngIf="!loading">Crear mi cuenta gratis</ng-container>
                  <ng-container *ngIf="loading">Creando cuenta…</ng-container>
                </button>
              </div>

            </form>
          </ng-container>

          <!-- ── PASO 3: ÉXITO ── -->
          <ng-container *ngIf="step === 3">
            <div class="success-state">
              <div class="success-ico">📧</div>
              <h2>¡Cuenta creada!</h2>
              <p>{{ successMsg }}</p>
              <a routerLink="/auth/login" class="btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                <mat-icon>login</mat-icon>
                Iniciar sesión
              </a>
            </div>
          </ng-container>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }

    /* ══ LAYOUT ══ */
    .reg-page {
      display: flex;
      min-height: 100vh;
    }

    /* ══ PANEL IZQUIERDO ══ */
    .reg-left {
      width: 380px;
      min-width: 320px;
      flex-shrink: 0;
      background: linear-gradient(160deg, #0D0620 0%, #1E1B4B 55%, #2D1272 100%);
      padding: 0 44px;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    /* ── Esferas animadas ── */
    .orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      will-change: transform, opacity;
    }

    /* Esfera grande superior derecha — índigo */
    .o1 {
      width: 280px; height: 280px;
      top: -80px; right: -80px;
      background: radial-gradient(circle at 35% 35%,
        rgba(129,140,248,0.55) 0%,
        rgba(79,70,229,0.30) 45%,
        transparent 70%);
      animation: float1 9s ease-in-out infinite;
    }

    /* Esfera mediana inferior izquierda — violeta */
    .o2 {
      width: 200px; height: 200px;
      bottom: -60px; left: -60px;
      background: radial-gradient(circle at 40% 40%,
        rgba(167,139,250,0.50) 0%,
        rgba(124,58,237,0.25) 50%,
        transparent 70%);
      animation: float2 11s ease-in-out infinite;
    }

    /* Esfera pequeña central izquierda — lavanda */
    .o3 {
      width: 110px; height: 110px;
      top: 42%; left: 10%;
      background: radial-gradient(circle at 40% 35%,
        rgba(196,181,253,0.45) 0%,
        rgba(139,92,246,0.20) 55%,
        transparent 70%);
      animation: float3 7s ease-in-out infinite;
    }

    /* Esfera pequeña superior izquierda — azul púrpura */
    .o4 {
      width: 80px; height: 80px;
      top: 18%; left: 18%;
      background: radial-gradient(circle at 38% 38%,
        rgba(165,180,252,0.50) 0%,
        rgba(99,102,241,0.22) 55%,
        transparent 70%);
      animation: float4 8s ease-in-out infinite;
    }

    /* Esfera muy pequeña — brillo extra */
    .o5 {
      width: 55px; height: 55px;
      bottom: 28%; right: 14%;
      background: radial-gradient(circle at 35% 35%,
        rgba(224,214,255,0.60) 0%,
        rgba(139,92,246,0.25) 55%,
        transparent 70%);
      animation: float5 6s ease-in-out infinite;
    }

    /* Keyframes — cada esfera flota en dirección distinta */
    @keyframes float1 {
      0%,100% { transform: translate(0, 0) scale(1); }
      33%     { transform: translate(-18px, 22px) scale(1.04); }
      66%     { transform: translate(12px, -14px) scale(0.97); }
    }
    @keyframes float2 {
      0%,100% { transform: translate(0, 0) scale(1); }
      40%     { transform: translate(20px, -24px) scale(1.06); }
      70%     { transform: translate(-10px, 10px) scale(0.96); }
    }
    @keyframes float3 {
      0%,100% { transform: translate(0, 0) scale(1); opacity:.9; }
      50%     { transform: translate(14px, -18px) scale(1.08); opacity:1; }
    }
    @keyframes float4 {
      0%,100% { transform: translate(0, 0); opacity:.85; }
      45%     { transform: translate(-12px, 16px); opacity:1; }
      80%     { transform: translate(8px, -8px); opacity:.75; }
    }
    @keyframes float5 {
      0%,100% { transform: translate(0, 0) scale(1); opacity:.8; }
      50%     { transform: translate(-10px, -14px) scale(1.12); opacity:1; }
    }

    .left-inner { position:relative; z-index:1; width:100%; }

    .brand {
      display:flex; align-items:center; gap:10px;
      margin-bottom:44px;
    }
    .brand-ico { font-size:28px; }
    .brand-name {
      font-family:'Baloo 2','Quicksand',sans-serif;
      font-size:20px; font-weight:800; color:white;
    }

    .left-pitch h2 {
      font-family:'Baloo 2','Quicksand',sans-serif;
      font-size:30px; font-weight:800; color:white;
      line-height:1.2; margin:0 0 14px;
    }
    .left-pitch p {
      font-family:'Quicksand',sans-serif;
      font-size:14px; color:rgba(255,255,255,0.6);
      line-height:1.65; margin:0 0 36px;
    }

    .features {
      list-style:none; margin:0 0 40px; padding:0;
      display:flex; flex-direction:column; gap:16px;
    }
    .features li {
      display:flex; align-items:center; gap:14px;
      font-family:'Quicksand',sans-serif;
      font-size:14px; color:rgba(255,255,255,0.85); font-weight:600;
    }
    .feat-ico {
      width:38px; height:38px; border-radius:11px; flex-shrink:0;
      background:rgba(129,140,248,0.18);
      border:1px solid rgba(129,140,248,0.2);
      display:flex; align-items:center; justify-content:center;
    }
    .feat-ico mat-icon { color:#818CF8; font-size:18px; width:18px; height:18px; }

    .left-login {
      font-family:'Quicksand',sans-serif;
      font-size:13.5px; color:rgba(255,255,255,0.5); margin:0;
    }
    .left-login a { color:#A5B4FC; font-weight:700; text-decoration:none; }
    .left-login a:hover { color:#C7D2FE; text-decoration:underline; }

    /* ══ PANEL DERECHO ══ */
    .reg-right {
      flex:1;
      background:#F8F7FF;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:40px 24px;
    }

    .form-wrap {
      width:100%;
      max-width:560px;
      background:white;
      border-radius:24px;
      box-shadow:0 8px 40px rgba(79,70,229,0.10);
      padding:36px 40px;
    }

    /* ══ STEPS ══ */
    .steps {
      display:flex; align-items:center; justify-content:center;
      margin-bottom:32px;
    }
    .step { display:flex; flex-direction:column; align-items:center; gap:6px; }
    .step-circle {
      width:38px; height:38px; border-radius:50%;
      border:2px solid #E2E8F0; background:white;
      display:flex; align-items:center; justify-content:center;
      font-family:'Quicksand',sans-serif;
      font-size:14px; font-weight:700; color:#94A3B8;
      transition:all .3s;
    }
    .step.active .step-circle {
      border-color:#4F46E5; background:#4F46E5; color:white;
      box-shadow:0 0 0 4px rgba(79,70,229,0.15);
    }
    .step.done .step-circle {
      border-color:#4F46E5; background:#4F46E5; color:white;
    }
    .step.done .step-circle mat-icon { font-size:16px; width:16px; height:16px; }
    .step-label {
      font-family:'Quicksand',sans-serif; font-size:11px; font-weight:600;
      color:#94A3B8; transition:color .3s;
    }
    .step.active .step-label, .step.done .step-label { color:#4F46E5; }
    .step-line {
      flex:1; height:2px; background:#E2E8F0;
      margin:0 10px; margin-bottom:18px; min-width:40px;
      transition:background .3s;
    }
    .step-line.done { background:#4F46E5; }

    /* ══ TÍTULOS ══ */
    .form-title {
      font-family:'Baloo 2','Quicksand',sans-serif;
      font-size:22px; font-weight:800; color:#1E1B4B; margin:0 0 4px;
    }
    .form-sub {
      font-family:'Quicksand',sans-serif;
      font-size:13.5px; color:#94A3B8; margin:0 0 24px;
    }

    /* ══ ROLE CARDS ══ */
    .role-cards {
      display:grid; grid-template-columns:1fr 1fr; gap:14px;
      margin-bottom:24px;
    }
    .role-card {
      display:flex; flex-direction:column; align-items:center; gap:12px;
      padding:28px 16px;
      border:2px solid #E2E8F0; border-radius:18px;
      background:white; cursor:pointer;
      font-family:'Quicksand',sans-serif;
      font-size:14px; font-weight:700; color:#64748B;
      transition:all .2s;
    }
    .role-card:hover {
      border-color:#818CF8; color:#4F46E5;
      background:#F5F3FF;
    }
    .role-card.active {
      border-color:#4F46E5;
      background:linear-gradient(135deg,#F5F3FF,#EDE9FE);
      color:#4F46E5;
      box-shadow:0 4px 20px rgba(79,70,229,0.18);
    }
    .role-mat-icon { font-size:38px; width:38px; height:38px; }

    /* ══ FIELDS ══ */
    .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .field { width:100%; }
    .full-width { width:100%; }

    /* Override Material outline color to purple */
    ::ng-deep .reg-right .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .reg-right .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .reg-right .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #4F46E5 !important;
    }
    ::ng-deep .reg-right .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
      color: #4F46E5 !important;
    }
    ::ng-deep .reg-right .mat-mdc-checkbox.mat-primary .mdc-checkbox__background {
      border-color: #4F46E5 !important;
    }

    /* ══ FUERZA ══ */
    .strength-wrap { margin:-2px 0 12px; }
    .strength-row { display:flex; justify-content:space-between; margin-bottom:6px; }
    .strength-lbl { font-family:'Quicksand',sans-serif; font-size:12px; font-weight:700; }
    .strength-hint { font-family:'Quicksand',sans-serif; font-size:11.5px; color:#94A3B8; }
    .strength-segs { display:flex; gap:5px; }
    .seg { flex:1; height:5px; border-radius:3px; transition:background .3s; }

    /* ══ TÉRMINOS ══ */
    .terms-row { margin:8px 0 14px; }
    .terms-row mat-checkbox { font-family:'Quicksand',sans-serif; font-size:13px; color:#64748B; }
    .terms-row a { color:#4F46E5; font-weight:700; text-decoration:none; }
    .terms-row a:hover { text-decoration:underline; }
    .terms-error { font-family:'Quicksand',sans-serif; font-size:11.5px; color:#e8607a; margin-top:4px; padding-left:4px; }

    /* ══ ERROR ══ */
    .error-msg {
      display:flex; align-items:center; gap:8px;
      background:#FEF2F2; color:#DC2626;
      font-family:'Quicksand',sans-serif; font-weight:600; font-size:13px;
      padding:10px 12px; border-radius:12px; margin-bottom:12px;
    }

    /* ══ BOTONES ══ */
    .btn-row { display:flex; gap:10px; align-items:center; }
    .btn-primary {
      flex:1;
      display:flex; align-items:center; justify-content:center; gap:6px;
      padding:14px 24px;
      background:linear-gradient(135deg,#4F46E5,#7C3AED);
      color:white; border:none; border-radius:14px;
      font-family:'Baloo 2','Quicksand',sans-serif;
      font-size:15px; font-weight:700; cursor:pointer;
      transition:all .2s; box-sizing:border-box;
    }
    .btn-primary:hover:not([disabled]) {
      box-shadow:0 6px 24px rgba(79,70,229,0.4); transform:translateY(-1px);
    }
    .btn-primary[disabled] { opacity:0.5; cursor:not-allowed; }
    .btn-primary.full-width { width:100%; margin-top:4px; }
    .btn-ghost {
      display:flex; align-items:center; justify-content:center;
      width:48px; height:48px; flex-shrink:0;
      background:#F1F5F9; color:#64748B;
      border:none; border-radius:14px; cursor:pointer;
      transition:all .2s;
    }
    .btn-ghost:hover { background:#E2E8F0; color:#1E293B; }

    /* ══ LINK INFERIOR ══ */
    .bottom-link {
      text-align:center; margin-top:16px;
      font-family:'Quicksand',sans-serif; font-size:13.5px; color:#94A3B8;
    }
    .bottom-link a { color:#4F46E5; font-weight:700; text-decoration:none; }
    .bottom-link a:hover { text-decoration:underline; }

    /* ══ ÉXITO ══ */
    .success-state { text-align:center; padding:20px 0; }
    .success-ico { font-size:60px; margin-bottom:16px; }
    .success-state h2 {
      font-family:'Baloo 2','Quicksand',sans-serif;
      font-size:24px; font-weight:800; color:#4F46E5; margin:0 0 10px;
    }
    .success-state p {
      font-family:'Quicksand',sans-serif;
      font-size:14.5px; color:#64748B; margin:0 0 28px; line-height:1.6;
    }

    /* ══ RESPONSIVE ══ */
    @media (max-width:900px) {
      .reg-left { display:none; }
      .reg-right { background:linear-gradient(160deg,#0D0620 0%,#1E1B4B 55%,#2D1272 100%); }
      .form-wrap { box-shadow:0 8px 40px rgba(0,0,0,0.3); }
    }
    @media (max-width:540px) {
      .form-wrap { padding:28px 20px; }
      .field-row { grid-template-columns:1fr; }
      .role-cards { grid-template-columns:1fr 1fr; }
    }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  hidePassword = true;
  hideConfirm = true;
  step = 1;
  rolSeleccionado: 'PADRE' | 'DOCENTE' | '' = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre:          ['', Validators.required],
      apellido:        [''],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', Validators.required],
      rol:             ['PADRE', Validators.required],
      telefono:        [''],
      relacionConNino: [''],
      institucion:     [''],
      gradoGrupo:      [''],
      aceptaTerminos:  [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass    = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
  }

  goStep2() {
    if (!this.rolSeleccionado) return;
    this.form.patchValue({ rol: this.rolSeleccionado });
    this.step = 2;
  }

  get strengthScore(): number {
    const pw: string = this.form.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/\d/.test(pw))            score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  get strengthLabel(): string {
    return ['', 'Débil', 'Regular', 'Buena', 'Segura'][this.strengthScore] || '';
  }

  get strengthHint(): string {
    const pw: string = this.form.get('password')?.value || '';
    if (pw.length < 8)              return 'Mín. 8 caracteres';
    if (!/[A-Z]/.test(pw))          return 'Agrega una mayúscula';
    if (!/\d/.test(pw))             return 'Agrega un número';
    if (!/[^A-Za-z0-9]/.test(pw))  return 'Agrega un símbolo (!@#...)';
    return '¡Contraseña segura!';
  }

  get strengthColor(): string {
    return ['', '#EF4444', '#F59E0B', '#3B82F6', '#4F46E5'][this.strengthScore] || '#E2E8F0';
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const { confirmPassword, aceptaTerminos, apellido, nombre, ...rest } = this.form.value;
    const payload = { ...rest, nombre: `${nombre} ${apellido}`.trim() };

    this.auth.register(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMsg = response.mensaje || 'Cuenta creada. Revisa tu correo para verificarla.';
        this.step = 3;
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
