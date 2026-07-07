import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { PerfilService } from '../../../core/services/perfil.service';

@Component({
  selector: 'app-perfil-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, NgIf,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <mat-card style="max-width: 520px;">
      <mat-card-header>
        <mat-card-title>{{ editMode ? 'Editar' : 'Nuevo' }} Perfil de Niño</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="guardar()">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" placeholder="Nombre del niño">
            <mat-error *ngIf="form.get('nombre')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Edad</mat-label>
            <input matInput type="number" formControlName="edad" min="3" max="18">
            <mat-error *ngIf="form.get('edad')?.hasError('required')">Requerida</mat-error>
            <mat-error *ngIf="form.get('edad')?.hasError('min')">Mínimo 3 años</mat-error>
            <mat-error *ngIf="form.get('edad')?.hasError('max')">Máximo 18 años</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Diagnóstico (opcional)</mat-label>
            <textarea matInput formControlName="diagnostico" rows="3"
                      placeholder="Ej: TDAH leve, dificultades de atención..."></textarea>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMsg">
            <mat-icon>error_outline</mat-icon> {{ errorMsg }}
          </div>

          <div class="form-actions">
            <button mat-stroked-button type="button" routerLink="/padre/perfiles">Cancelar</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || loading">
              <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
              <span *ngIf="!loading">{{ editMode ? 'Guardar cambios' : 'Crear perfil' }}</span>
            </button>
          </div>

        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 8px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .error-msg { display: flex; align-items: center; gap: 8px; color: #f44336; font-size:13px; margin-bottom: 8px; }
  `]
})
export class PerfilFormComponent implements OnInit {
  form: FormGroup;
  editMode = false;
  perfilId?: number;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private perfilService: PerfilService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(3), Validators.max(18)]],
      diagnostico: ['']
    });
  }

  ngOnInit() {
    this.perfilId = this.route.snapshot.params['id'];
    if (this.perfilId) {
      this.editMode = true;
      this.perfilService.obtener(this.perfilId).subscribe({
        next: p => this.form.patchValue(p),
        error: () => this.router.navigate(['/padre/perfiles'])
      });
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const user = this.auth.user()!;
    const data = this.form.value;

    const op = this.editMode
      ? this.perfilService.actualizar(this.perfilId!, data)
      : this.perfilService.crear(user.usuarioId, data);

    op.subscribe({
      next: () => { this.loading = false; this.router.navigate(['/padre/perfiles']); },
      error: () => { this.loading = false; this.errorMsg = 'Error al guardar. Intente de nuevo.'; }
    });
  }
}
