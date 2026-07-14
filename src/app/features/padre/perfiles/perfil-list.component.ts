import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { PerfilService, PerfilNino } from '../../../core/services/perfil.service';

@Component({
  selector: 'app-perfil-list',
  standalone: true,
  imports: [
    RouterLink, NgIf,
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Perfiles de Niños</mat-card-title>
        <mat-card-subtitle>{{ perfiles.length }} perfiles registrados</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="toolbar-actions">
          <button mat-raised-button color="primary" routerLink="/padre/perfiles/nuevo">
            <mat-icon>add</mat-icon> Nuevo perfil
          </button>
        </div>

        <div *ngIf="loading" class="center"><mat-spinner diameter="40"></mat-spinner></div>

        <table mat-table [dataSource]="perfiles" *ngIf="!loading" class="full-width">

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let p">{{ p.nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="edad">
            <th mat-header-cell *matHeaderCellDef>Edad</th>
            <td mat-cell *matCellDef="let p">{{ p.edad }} años</td>
          </ng-container>

          <ng-container matColumnDef="diagnostico">
            <th mat-header-cell *matHeaderCellDef>Diagnóstico</th>
            <td mat-cell *matCellDef="let p">{{ p.diagnostico ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary"
                      [routerLink]="['/padre/perfiles/editar', p.id]" title="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="eliminar(p)" title="Eliminar">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
        </table>

        <p *ngIf="!loading && perfiles.length === 0" class="empty">
          <mat-icon>info</mat-icon> No hay perfiles registrados.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .toolbar-actions { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 32px; }
    .empty { display: flex; align-items: center; gap: 8px; color: #888; padding: 16px; }
  `]
})
export class PerfilListComponent implements OnInit {
  perfiles: PerfilNino[] = [];
  columnas = ['nombre', 'edad', 'diagnostico', 'acciones'];
  loading = true;

  constructor(private auth: AuthService, private perfilService: PerfilService) {}

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.perfilService.listarPorPadre(user.usuarioId).subscribe({
        next: data => { this.perfiles = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
    }
  }

  eliminar(perfil: PerfilNino) {
    if (!confirm(`¿Eliminar el perfil de ${perfil.nombre}?`)) return;
    this.perfilService.eliminar(perfil.id!).subscribe({
      next: () => { this.perfiles = this.perfiles.filter(p => p.id !== perfil.id); }
    });
  }
}
