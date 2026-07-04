import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div style="padding: 32px;">
      <h1>Bienvenido, {{ auth.userName() }}</h1>
      <p>Dashboard del Administrador — en construcción</p>
      <button mat-stroked-button color="warn" (click)="auth.logout()">Cerrar sesión</button>
    </div>
  `
})
export class AdminDashboardComponent {
  constructor(public auth: AuthService) {}
}
