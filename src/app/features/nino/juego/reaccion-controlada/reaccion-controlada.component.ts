import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reaccion-controlada',
  standalone: true,
  imports: [],
  template: `
    <div class="stub-page">
      <div class="stub-card">
        <div class="stub-emoji">⚡</div>
        <h1>Reacción Controlada</h1>
        <p class="stub-sub">🚧 Juego en desarrollo...</p>
        <button class="btn-volver" (click)="volver()">← Volver a juegos</button>
      </div>
    </div>
  `,
  styles: [`
    .stub-page { min-height:100vh; background:linear-gradient(135deg,#0f172a,#1e3a8a); display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; }
    .stub-card { text-align:center; color:white; padding:48px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:28px; backdrop-filter:blur(12px); }
    .stub-emoji { font-size:88px; margin-bottom:16px; filter:drop-shadow(0 0 24px rgba(37,99,235,.7)); animation:float 3s ease-in-out infinite; }
    h1 { font-size:28px; font-weight:900; margin:0 0 8px; }
    .stub-sub { color:#64748b; font-size:16px; margin:0 0 28px; }
    .btn-volver { background:#2563EB; color:white; border:none; border-radius:14px; padding:14px 32px; font-size:15px; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-volver:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(37,99,235,.5); }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  `]
})
export class ReaccionControladaComponent {
  constructor(private router: Router) {}
  volver() { this.router.navigate(['/nino/juegos']); }
}
