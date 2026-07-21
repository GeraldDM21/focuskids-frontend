import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MascotMood = 'idle' | 'thinking' | 'celebrate' | 'encourage' | 'excited' | 'warning';

export interface MascotConfig {
  emoji:  string;
  name:   string;
  color:  string;   // CSS color for ring/bubble accent
}

export const MASCOTAS: Record<string, MascotConfig> = {
  espejo:   { emoji: '🦊', name: 'Foxy',  color: '#F97316' },
  historia: { emoji: '🐰', name: 'Benny', color: '#EC4899' },
  numeros:  { emoji: '🦉', name: 'Ollie', color: '#8B5CF6' },
  laberinto:{ emoji: '🐱', name: 'Michi', color: '#06B6D4' },
  sopa:     { emoji: '🐼', name: 'Pandi', color: '#10B981' },
  piezas:   { emoji: '🐯', name: 'Tigre', color: '#EF4444' },
  juego7:   { emoji: '🦁', name: 'Leo',   color: '#F59E0B' },
  juego8:   { emoji: '🐨', name: 'Koby',  color: '#6366F1' },
  juego9:   { emoji: '🦄', name: 'Uni',   color: '#D946EF' },
  juego10:  { emoji: '🐶', name: 'Buddy', color: '#3B82F6' },
  juego11:  { emoji: '🐻', name: 'Bruno', color: '#78716C' },
  juego12:  { emoji: '🐭', name: 'Milo',  color: '#A855F7' },
};

@Component({
  selector: 'app-mascot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mascot-root" [class.hide]="!message">
      <!-- Burbuja de diálogo -->
      <div class="bubble"
           [class.bubble-celebrate]="mood === 'celebrate'"
           [class.bubble-encourage]="mood === 'encourage'"
           [class.bubble-warning]="mood  === 'warning'"
           [class.bubble-thinking]="mood  === 'thinking'"
           [style.--accent]="config.color">
        <span class="bubble-text">{{ message }}</span>
        <div class="bubble-tail"></div>
      </div>

      <!-- Avatar -->
      <div class="avatar-wrap"
           [class.bounce]="mood === 'celebrate'"
           [class.shake]="mood  === 'encourage'"
           [class.pulse]="mood  === 'excited'"
           [style.--accent]="config.color">
        <div class="avatar-ring"></div>
        <div class="avatar-emoji">{{ config.emoji }}</div>
        <div class="deco" *ngIf="mood === 'celebrate'">🎉</div>
      </div>

      <!-- Nombre -->
      <div class="mascot-name">{{ config.name }}</div>
    </div>
  `,
  styles: [`
    :host { position: fixed; bottom: 24px; left: 20px; z-index: 900; display: flex; flex-direction: column; align-items: center; gap: 0; pointer-events: none; }

    .mascot-root { display: flex; flex-direction: column; align-items: center; gap: 4px; transition: opacity .3s; }
    .mascot-root.hide { opacity: 0; pointer-events: none; }

    /* Burbuja */
    .bubble {
      background: white;
      border: 2px solid var(--accent, #10B981);
      border-radius: 16px;
      padding: 10px 14px;
      max-width: 220px;
      min-width: 140px;
      position: relative;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      animation: popIn .35s cubic-bezier(.34,1.56,.64,1);
    }
    .bubble-text { font-size: 13px; font-weight: 700; color: #1E293B; line-height: 1.4; display: block; }
    .bubble-tail {
      position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-top: 10px solid var(--accent, #10B981);
    }
    .bubble-celebrate { background: #F0FDF4; border-color: #16A34A; --accent: #16A34A; }
    .bubble-encourage { background: #FFF7ED; border-color: #F97316; --accent: #F97316; }
    .bubble-warning   { background: #FEF9C3; border-color: #CA8A04; --accent: #CA8A04; }
    .bubble-thinking  { background: #EFF6FF; border-color: #3B82F6; --accent: #3B82F6; }

    /* Avatar */
    .avatar-wrap {
      position: relative; width: 60px; height: 60px; margin-top: 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .avatar-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 3px solid var(--accent, #10B981);
      background: white;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent, #10B981) 20%, transparent);
    }
    .avatar-emoji { font-size: 34px; line-height: 1; position: relative; z-index: 1; }
    .deco { position: absolute; top: -6px; right: -8px; font-size: 18px; z-index: 2; }

    /* Nombre */
    .mascot-name { font-size: 11px; font-weight: 800; color: white; background: var(--accent, #10B981); padding: 2px 10px; border-radius: 20px; margin-top: 2px; }

    /* Animaciones */
    @keyframes popIn {
      from { opacity: 0; transform: scale(.7) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes bounceAnim {
      0%,100% { transform: translateY(0); }
      30%     { transform: translateY(-12px) scale(1.1); }
      60%     { transform: translateY(-5px); }
    }
    @keyframes shakeAnim {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-5px); }
      40%     { transform: translateX(5px); }
      60%     { transform: translateX(-4px); }
      80%     { transform: translateX(4px); }
    }
    @keyframes pulseAnim {
      0%,100% { transform: scale(1); }
      50%     { transform: scale(1.08); }
    }

    .bounce { animation: bounceAnim .6s ease forwards; }
    .shake  { animation: shakeAnim  .5s ease forwards; }
    .pulse  { animation: pulseAnim  1s ease infinite; }
  `]
})
export class MascotComponent implements OnChanges {
  @Input() game:    string      = 'sopa';
  @Input() mood:    MascotMood  = 'idle';
  @Input() message: string      = '';

  config: MascotConfig = MASCOTAS['sopa'];

  ngOnChanges() {
    this.config = MASCOTAS[this.game] ?? MASCOTAS['sopa'];
  }
}
