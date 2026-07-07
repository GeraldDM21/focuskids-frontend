import { Component, OnInit } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AdminService, LogAuditoria } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [NgIf, DatePipe, MatTableModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Logs de Auditoría</mat-card-title>
        <mat-card-subtitle>Registro de actividad del sistema</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading" class="center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <table mat-table [dataSource]="logs" *ngIf="!loading" class="full-width">

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let l">{{ l.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>

          <ng-container matColumnDef="usuario">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let l">{{ l.usuario?.nombre ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="accion">
            <th mat-header-cell *matHeaderCellDef>Acción</th>
            <td mat-cell *matCellDef="let l">{{ l.accion }}</td>
          </ng-container>

          <ng-container matColumnDef="entidad">
            <th mat-header-cell *matHeaderCellDef>Entidad</th>
            <td mat-cell *matCellDef="let l">{{ l.entidad ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="ip">
            <th mat-header-cell *matHeaderCellDef>IP</th>
            <td mat-cell *matCellDef="let l">{{ l.ip ?? '—' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
        </table>

        <p *ngIf="!loading && logs.length === 0" class="empty">
          <mat-icon>info</mat-icon> No hay logs registrados aún.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 32px; }
    .empty { display: flex; align-items: center; gap: 8px; color: #888; padding: 16px; }
  `]
})
export class AdminLogsComponent implements OnInit {
  logs: LogAuditoria[] = [];
  columnas = ['fecha', 'usuario', 'accion', 'entidad', 'ip'];
  loading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.obtenerLogs().subscribe({
      next: data => { this.logs = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
