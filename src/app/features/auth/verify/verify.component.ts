import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [NgIf, RouterLink, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="verify-page">
      <mat-card class="verify-card">
        <mat-card-content>
          <div class="state" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Verificando tu cuenta...</p>
          </div>

          <div class="state" *ngIf="!loading && success">
            <mat-icon class="ok">check_circle</mat-icon>
            <p>{{ mensaje }}</p>
            <a routerLink="/auth/login">Ir a iniciar sesión</a>
          </div>

          <div class="state" *ngIf="!loading && !success">
            <mat-icon class="error">error_outline</mat-icon>
            <p>{{ mensaje }}</p>
            <a routerLink="/auth/login">Ir a iniciar sesión</a>
            <a routerLink="/auth/register" class="secondary">Volver a registrarme</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #3f51b5 0%, #7986cb 100%);
      padding: 24px 16px;
    }
    .verify-card { width: 100%; max-width: 420px; border-radius: 16px !important; padding: 16px; }
    .state { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 8px; }
    .state p { font-size: 15px; color: #333; }
    mat-icon.ok { color: #4caf50; font-size: 56px; width: 56px; height: 56px; }
    mat-icon.error { color: #f44336; font-size: 56px; width: 56px; height: 56px; }
    a { color: #3f51b5; font-weight: 600; text-decoration: none; }
    a.secondary { color: #888; font-weight: 500; font-size: 13px; }
  `]
})
export class VerifyComponent implements OnInit {
  loading = true;
  success = false;
  mensaje = '';

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.loading = false;
      this.success = false;
      this.mensaje = 'Enlace de verificación inválido.';
      return;
    }

    this.auth.verify(token).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        this.mensaje = res.mensaje;
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        this.mensaje = err?.error?.error || 'No se pudo verificar la cuenta. El enlace puede haber expirado.';
      }
    });
  }
}
