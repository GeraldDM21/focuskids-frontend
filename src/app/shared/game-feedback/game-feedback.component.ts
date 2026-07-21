import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameFeedbackService } from './game-feedback.service';

interface Particula { id: number; tx: number; ty: number; delay: number; color: string; }

// Historia: "Retroalimentación visual y sonora en tiempo real durante el juego"
// Componente visual compartido por los 12 juegos. Cada juego lo coloca dentro
// de un contenedor con position:relative y lo controla de forma imperativa
// llamando showCorrect()/showIncorrect() en el mismo instante en que calcula
// si la respuesta del niño fue correcta (CA-01: sin esperar al backend).
//
// El juego sigue siendo responsable de: resaltar su propio elemento "correcto"
// en verde por 1.5s cuando el niño falla (CA-03), ya que solo el juego sabe
// cuál es ese elemento en su DOM particular.
@Component({
  selector: 'app-game-feedback',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="gf-root" aria-live="polite">
        <div class="gf-border" [class.gf-border-correct]="modo === 'correct'" [class.gf-border-incorrect]="modo === 'incorrect'"></div>

        @if (modo === 'correct') {
          <div class="gf-check">✓</div>
          <div class="gf-particles">
            @for (p of particulas; track p.id) {
              <span class="gf-particle"
                [style.background]="p.color"
                [style.--tx.px]="p.tx"
                [style.--ty.px]="p.ty"
                [style.animation-delay.ms]="p.delay"></span>
            }
          </div>
          <div class="gf-pill gf-pill-correct">{{ mensaje }}</div>
        }

        @if (modo === 'incorrect') {
          <div class="gf-pill gf-pill-incorrect">
            <span>{{ mensaje }}</span>
            @if (mostrarPista) {
              <button type="button" class="gf-hint-btn" (click)="onHintClick()">💡 Ver pista</button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .gf-root { position: absolute; inset: 0; pointer-events: none; z-index: 60; border-radius: inherit; }

    .gf-border {
      position: absolute; inset: 0; border-radius: inherit;
      border: 5px solid transparent; transition: border-color .1s ease;
    }
    .gf-border-correct {
      border-color: #22c55e;
      box-shadow: 0 0 24px rgba(34,197,94,.55), inset 0 0 24px rgba(34,197,94,.25);
      animation: gfBorderIn .15s ease;
    }
    .gf-border-incorrect {
      border-color: #ef4444;
      opacity: .6;
      animation: gfBorderIn .15s ease;
    }
    @keyframes gfBorderIn { from { opacity: 0; } }

    .gf-check {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-size: 72px; font-weight: 900; color: #22c55e;
      text-shadow: 0 0 24px rgba(34,197,94,.8);
      animation: gfCheckPop .4s cubic-bezier(.34,1.56,.64,1) forwards;
    }
    @keyframes gfCheckPop {
      0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      60%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .gf-particles { position: absolute; inset: 0; overflow: visible; }
    .gf-particle {
      position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; border-radius: 50%;
      animation: gfParticle .7s ease-out forwards;
    }
    @keyframes gfParticle {
      0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(.3); opacity: 0; }
    }

    .gf-pill {
      position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
      padding: 8px 18px; border-radius: 20px; font-weight: 800; font-size: 14px;
      white-space: nowrap; display: flex; align-items: center; gap: 10px;
      backdrop-filter: blur(6px); animation: gfPillIn .25s cubic-bezier(.34,1.56,.64,1);
      pointer-events: auto;
    }
    @keyframes gfPillIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } }
    .gf-pill-correct   { background: rgba(34,197,94,.16);  border: 1.5px solid rgba(34,197,94,.5);  color: #4ade80; }
    .gf-pill-incorrect { background: rgba(251,146,60,.16); border: 1.5px solid rgba(251,146,60,.5); color: #fb923c; }

    .gf-hint-btn {
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
      color: white; border-radius: 12px; padding: 4px 10px; font-size: 12px; font-weight: 700;
      cursor: pointer;
    }
    .gf-hint-btn:hover { background: rgba(255,255,255,.28); }
  `]
})
export class GameFeedbackComponent implements OnDestroy {

  /** Se dispara cuando el niño pide la pista ofrecida tras 3 fallos consecutivos (CA-03). No afecta puntaje. */
  @Output() hintRequested = new EventEmitter<void>();

  /** Se dispara justo cuando el feedback de error se hace visible, para que el juego resalte su propio elemento correcto (CA-03). */
  @Output() incorrectShown = new EventEmitter<void>();

  visible = false;
  modo: 'correct' | 'incorrect' | null = null;
  mensaje = '';
  mostrarPista = false;
  particulas: Particula[] = [];

  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly COLORES_ORO = ['#fbbf24', '#fde047', '#f59e0b', '#fcd34d'];

  constructor(private cdr: ChangeDetectorRef, private feedbackService: GameFeedbackService) {}

  ngOnDestroy(): void { if (this.hideTimer) clearTimeout(this.hideTimer); }

  /** CA-02: acierto. Reproduce sonido + muestra borde verde, checkmark, partículas doradas y texto. Total <= 1.2s. */
  showCorrect(mensaje?: string): void {
    this.feedbackService.playCorrect();
    this.mensaje = mensaje ?? this.feedbackService.textoAcierto();
    this.particulas = this.generarParticulas();
    this.reiniciar('correct');
  }

  /** CA-03: error. Reproduce sonido + borde rojo suave y texto de aliento (nunca "Error"/"Fallaste"/"Incorrecto"). */
  showIncorrect(mensaje?: string, mostrarPista = false): void {
    this.feedbackService.playIncorrect();
    this.mensaje = mensaje ?? this.feedbackService.textoAliento();
    this.mostrarPista = mostrarPista;
    this.reiniciar('incorrect');
    this.incorrectShown.emit();
  }

  hide(): void {
    this.visible = false;
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    this.cdr.detectChanges();
  }

  onHintClick(): void {
    this.hintRequested.emit();
  }

  // Fuerza que la animación se reinicie aunque el modo anterior sea el mismo,
  // y sincroniza el DOM inmediatamente (relevante para la medición de CA-01).
  private reiniciar(modo: 'correct' | 'incorrect'): void {
    this.visible = false;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.cdr.detectChanges();

    this.modo = modo;
    this.visible = true;
    this.cdr.detectChanges();

    const duracion = modo === 'correct' ? 1100 : 1500; // CA-02 <=1.2s / CA-03 resalta 1.5s
    this.hideTimer = setTimeout(() => {
      this.visible = false;
      this.cdr.detectChanges();
    }, duracion);
  }

  private generarParticulas(): Particula[] {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const dist = 60 + Math.random() * 50;
      return {
        id: Date.now() + i,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        delay: Math.random() * 80,
        color: this.COLORES_ORO[i % this.COLORES_ORO.length],
      };
    });
  }
}
