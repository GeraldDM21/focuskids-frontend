import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-icon class="icon">lock</mat-icon>
      <h1>Acceso no autorizado</h1>
      <p>No tiene permisos para ver esta página.</p>
      <button mat-raised-button color="primary" (click)="goBack()">
        Volver al inicio
      </button>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
      text-align: center;
    }
    .icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }
    h1 { margin: 0; color: #333; }
    p { color: #666; }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
