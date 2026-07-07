import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <h2>Bienvenido, {{ auth.userName() }}</h2>

    <mat-card style="max-width: 480px;">
      <mat-card-content style="display:flex; align-items:center; gap:16px; padding:24px;">
        <mat-icon style="font-size:48px; width:48px; height:48px; color:#3f51b5;">
          school
        </mat-icon>
        <div>
          <h3 style="margin:0">Módulo Docente</h3>
          <p style="margin:4px 0 0; color:#666">
            Las funciones de gestión de estudiantes y reportes estarán disponibles próximamente.
          </p>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class DocenteDashboardComponent {
  constructor(public auth: AuthService) {}
}
