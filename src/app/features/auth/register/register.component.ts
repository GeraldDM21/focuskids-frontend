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
      <mat-card class="register-card">
        <mat-card-header>
          <div class="header-content">
            <h1>Crear cuenta</h1>
            <p>FocusKids — Registro de usuarios</p>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre completo</mat-label>
              <input matInput formControlName="nombre">
              <mat-error *ngIf="form.get('nombre')?.hasError('required')">Requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="email" type="email">
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
              <mat-icon>error_outline</mat-icon> {{ errorMsg }}
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="form.invalid || loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Crear cuenta</span>
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
    .register-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #3f51b5 0%, #7986cb 100%);
      padding: 24px 16px;
    }
    .register-card { width: 100%; max-width: 460px; border-radius: 16px !important; }
    .header-content { width: 100%; text-align: center; padding: 16px 0 8px; }
    .header-content h1 { font-size: 24px; font-weight: 700; color: #3f51b5; margin: 0; }
    .header-content p { font-size: 13px; color: #888; margin: 4px 0 0; }
    mat-card-content { padding: 8px 24px 24px !important; }
    .full-width { width: 100%; margin-bottom: 4px; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px;
      display: flex; align-items: center; justify-content: center; gap: 8px; }
    .error-msg { display: flex; align-items: center; gap: 8px; color: #f44336; font-size: 13px; margin-bottom: 8px; }
    .login-link { text-align: center; margin-top: 16px; font-size: 13px; color: #666; }
    .login-link a { color: #3f51b5; text-decoration: none; font-weight: 500; }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  hidePassword = true;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre:         ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      password:       ['', [Validators.required, Validators.minLength(8)]],
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
      next: () => { this.loading = false; this.auth.redirectByRole(); },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.status === 400
          ? 'El correo ya está registrado o los datos son inválidos.'
          : 'Error al crear la cuenta. Intente de nuevo.';
      }
    });
  }
}
