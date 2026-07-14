import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ChildProfileService } from '../perfiles/child-profile.service';
import { ChildProfile } from '../perfiles/child-profile.model';

@Component({
  selector: 'app-padre-dashboard',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2>Bienvenido, {{ auth.userName() }}</h2>

    <div class="actions">
      <button mat-raised-button color="primary" routerLink="/padre/perfiles/selector">
        <mat-icon>add</mat-icon> Agregar perfil
      </button>
      <button mat-stroked-button routerLink="/padre/perfiles/selector">
        <mat-icon>list</mat-icon> Ver todos los perfiles
      </button>
    </div>

    <div *ngIf="loading" class="center"><mat-spinner diameter="40"></mat-spinner></div>

    <div class="grid" *ngIf="!loading">
      <mat-card *ngFor="let p of perfiles" class="perfil-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>child_care</mat-icon>
          <mat-card-title>{{ p.nombre }}</mat-card-title>
          <mat-card-subtitle>{{ p.edad ? p.edad + ' años' : '' }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="p.diagnostico">{{ p.diagnostico }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="primary" routerLink="/padre/perfiles/selector">
            <mat-icon>edit</mat-icon> Editar
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card *ngIf="perfiles.length === 0" class="empty-card">
        <mat-card-content>
          <mat-icon>person_add</mat-icon>
          <p>Aún no ha creado perfiles de niños.</p>
          <button mat-raised-button color="primary" routerLink="/padre/perfiles/selector">
            Crear primer perfil
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    h2 { margin-bottom: 16px; }
    .actions { display: flex; gap: 12px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .perfil-card mat-icon[mat-card-avatar] { font-size: 40px; width: 40px; height: 40px; color: #3f51b5; }
    .last-game { font-size: 12px; color: #888; margin: 4px 0 0; }
    .empty-card mat-card-content {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 32px; text-align: center; color: #888;
    }
    .empty-card mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .center { display: flex; justify-content: center; padding: 32px; }
  `]
})
export class PadreDashboardComponent implements OnInit {
  perfiles: ChildProfile[] = [];
  loading = true;

  constructor(
    public auth: AuthService,
    private childProfileService: ChildProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.childProfileService.getProfiles(user.usuarioId).subscribe({
        next: data => { this.perfiles = data; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    }
  }
}
