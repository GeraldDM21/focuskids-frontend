import { Component, OnInit } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AdminService, Usuario } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [
    NgIf, DatePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatCardModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Usuarios</mat-card-title>
        <mat-card-subtitle>{{ usuarios.length }} usuarios registrados</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading" class="center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <table mat-table [dataSource]="usuarios" *ngIf="!loading" class="full-width">

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let u">{{ u.nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>

          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let u">
              <mat-chip [highlighted]="true">{{ u.rol }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let u">
              <mat-chip [color]="u.activo ? 'primary' : 'warn'" [highlighted]="true">
                {{ u.activo ? 'Activo' : 'Inactivo' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Creado</th>
            <td mat-cell *matCellDef="let u">{{ u.fechaCreacion | date:'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button
                      [color]="u.activo ? 'warn' : 'primary'"
                      (click)="toggleActivo(u)"
                      [title]="u.activo ? 'Desactivar' : 'Activar'">
                <mat-icon>{{ u.activo ? 'block' : 'check_circle' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 32px; }
    mat-card-header { padding-bottom: 16px; }
  `]
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  columnas = ['nombre', 'email', 'rol', 'estado', 'fecha', 'acciones'];
  loading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.adminService.listarUsuarios().subscribe({
      next: data => { this.usuarios = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggleActivo(usuario: Usuario) {
    this.adminService.toggleActivo(usuario.id).subscribe({
      next: updated => {
        const idx = this.usuarios.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.usuarios[idx] = updated;
        this.usuarios = [...this.usuarios];
      }
    });
  }
}
