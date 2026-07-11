import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChildProfileService } from '../../padre/perfiles/child-profile.service';

interface Juego {
  nombre: string;
  tipo: string;
  icono: string;
  color: string;
  colorBg: string;
  descripcion: string;
  ruta: string;
}

@Component({
  selector: 'app-nino-juegos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lobby-wrapper">

      <!-- Header del niño -->
      <header class="lobby-header">
        <div class="header-left">
          <button class="btn-back" (click)="volverPerfiles()">
            ← Cambiar perfil
          </button>
        </div>
        <div class="header-center">
          <div class="avatar-bubble">{{ profileAvatar }}</div>
          <div class="welcome-text">
            <span class="hola">¡Hola,</span>
            <span class="nombre">{{ profileName }}!</span>
          </div>
        </div>
        <div class="header-right">
          <div class="nivel-badge">
            <span class="nivel-icon">⭐</span>
            <span class="nivel-text">Nivel 1</span>
          </div>
        </div>
      </header>

      <!-- Título -->
      <div class="lobby-title">
        <h1>¿A qué quieres jugar hoy?</h1>
        <p>Elige un juego y empieza a entrenar tu cerebro</p>
      </div>

      <!-- Grid de juegos -->
      <div class="juegos-grid">
        @for (juego of juegos; track juego.nombre) {
          <div class="juego-card" [style.--color]="juego.color" [style.--bg]="juego.colorBg"
               (click)="irAJuego(juego)">
            <div class="juego-icon">{{ juego.icono }}</div>
            <div class="juego-tipo">{{ juego.tipo }}</div>
            <div class="juego-nombre">{{ juego.nombre }}</div>
            <div class="juego-desc">{{ juego.descripcion }}</div>
            <button class="btn-jugar">¡Jugar!</button>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .lobby-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 50%, #FFF7ED 100%);
      font-family: 'Inter', -apple-system, sans-serif;
      padding-bottom: 40px;
    }

    /* ── HEADER ── */
    .lobby-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 32px;
      background: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .btn-back {
      background: #EEF2FF; border: none; border-radius: 10px;
      padding: 8px 16px; font-size: 14px; color: #4F46E5;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-back:hover { background: #E0E7FF; }
    .header-center { display: flex; align-items: center; gap: 14px; }
    .avatar-bubble {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #818CF8, #4F46E5);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; box-shadow: 0 4px 12px rgba(79,70,229,0.3);
    }
    .welcome-text { display: flex; flex-direction: column; }
    .hola { font-size: 13px; color: #64748B; }
    .nombre { font-size: 20px; font-weight: 800; color: #1E293B; }
    .nivel-badge {
      display: flex; align-items: center; gap: 6px;
      background: #FEF9C3; border: 1.5px solid #FDE047;
      border-radius: 20px; padding: 6px 14px;
    }
    .nivel-icon { font-size: 16px; }
    .nivel-text { font-size: 14px; font-weight: 700; color: #854D0E; }

    /* ── TÍTULO ── */
    .lobby-title { text-align: center; padding: 36px 24px 20px; }
    .lobby-title h1 { font-size: 30px; font-weight: 800; color: #1E293B; margin-bottom: 8px; }
    .lobby-title p { font-size: 16px; color: #64748B; }

    /* ── GRID ── */
    .juegos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .juego-card {
      background: white;
      border-radius: 20px;
      padding: 24px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.07);
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
      text-align: center;
    }
    .juego-card:hover {
      transform: translateY(-6px) scale(1.02);
      border-color: var(--color);
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    }

    .juego-icon { font-size: 48px; line-height: 1; margin-bottom: 4px; }
    .juego-tipo {
      font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: var(--color);
      background: var(--bg); padding: 3px 10px; border-radius: 20px;
    }
    .juego-nombre { font-size: 16px; font-weight: 800; color: #1E293B; }
    .juego-desc { font-size: 12px; color: #64748B; line-height: 1.5; }
    .btn-jugar {
      margin-top: 8px;
      background: var(--color);
      color: white; border: none; border-radius: 10px;
      padding: 8px 24px; font-size: 14px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
      width: 100%;
    }
    .btn-jugar:hover { opacity: 0.88; transform: translateY(-1px); }
  `]
})
export class NinoJuegosComponent implements OnInit {

  profileName = '';
  profileAvatar = '🦊';

  juegos: Juego[] = [
    { nombre:'Espejo Mental',       tipo:'Atención',   icono:'🪞', color:'#4F46E5', colorBg:'#EEF2FF', descripcion:'Imita la secuencia de movimientos.',      ruta:'/nino/juego/espejo-mental' },
    { nombre:'Foco Extremo',        tipo:'Atención',   icono:'🎯', color:'#4F46E5', colorBg:'#EEF2FF', descripcion:'Presiona solo el estímulo objetivo.',      ruta:'/nino/juego/foco-extremo' },
    { nombre:'Reacción Controlada', tipo:'Atención',   icono:'⚡', color:'#4F46E5', colorBg:'#EEF2FF', descripcion:'Controla tus impulsos con precisión.',      ruta:'/nino/juego/reaccion-controlada' },
    { nombre:'Cascada Numérica',    tipo:'Cálculo',    icono:'🔢', color:'#059669', colorBg:'#ECFDF5', descripcion:'Captura números y resuelve operaciones.',   ruta:'/nino/juego/cascada-numerica' },
    { nombre:'Maratón Mental',      tipo:'Cálculo',    icono:'🏃', color:'#059669', colorBg:'#ECFDF5', descripcion:'Resuelve operaciones en cadena.',           ruta:'/nino/juego/maraton-mental' },
    { nombre:'Laberinto Cognitivo', tipo:'Memoria',    icono:'🌀', color:'#7C3AED', colorBg:'#F5F3FF', descripcion:'Navega el laberinto recordando el camino.', ruta:'/nino/juego/laberinto' },
    { nombre:'Ritmo y Patrón',      tipo:'Memoria',    icono:'🎵', color:'#7C3AED', colorBg:'#F5F3FF', descripcion:'Repite secuencias de sonidos y colores.',   ruta:'/nino/juego/ritmo-patron' },
    { nombre:'Palabras Ocultas',    tipo:'Lenguaje',   icono:'📝', color:'#EA580C', colorBg:'#FFF7ED', descripcion:'Encuentra palabras en la grilla.',          ruta:'/nino/juego/palabras-ocultas' },
    { nombre:'Historia Viva',       tipo:'Lectura',    icono:'📖', color:'#D97706', colorBg:'#FFFBEB', descripcion:'Lee y responde preguntas de comprensión.',   ruta:'/nino/juego/historia-viva' },
    { nombre:'Piezas en Tiempo',    tipo:'Percepción', icono:'🧩', color:'#0891B2', colorBg:'#ECFEFF', descripcion:'Completa el rompecabezas contra el tiempo.', ruta:'/nino/juego/piezas-tiempo' },
    { nombre:'Mapa Aventura',       tipo:'Geografía',  icono:'🗺️', color:'#65A30D', colorBg:'#F7FEE7', descripcion:'Explora mapas y responde preguntas.',        ruta:'/nino/juego/mapa-aventura' },
    { nombre:'Lab de Ciencias',     tipo:'Lógica',     icono:'🔬', color:'#DB2777', colorBg:'#FDF2F8', descripcion:'Combina ingredientes y entrena la lógica.',  ruta:'/nino/juego/lab-ciencias' },
  ];

  constructor(
    private profileService: ChildProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileService.activeProfile$.subscribe(state => {
      if (!state.profileId) {
        this.router.navigate(['/padre/perfiles/selector']);
        return;
      }
      this.profileName = state.profileName || 'Niño';
      this.profileAvatar = this.avatarEmoji(state.profileAvatar || 'fox');
    });
  }

  private avatarEmoji(avatar: string): string {
    const map: Record<string, string> = {
      fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
      unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
      bear:'🐻', mouse:'🐭'
    };
    return map[avatar] ?? '🦊';
  }

  irAJuego(juego: Juego): void {
    // Por ahora muestra un alert — cada juego se implementará en su propia ruta
    alert(`¡${juego.nombre} próximamente! 🎮`);
  }

  volverPerfiles(): void {
    this.router.navigate(['/padre/perfiles/selector']);
  }
}
