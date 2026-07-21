import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NivelVolumen } from './game-feedback.service';

// CA-05: control de volumen de 5 niveles (0/25/50/75/100%), reutilizable en los 12 juegos.
@Component({
  selector: 'app-volume-control',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vc-wrap">
      <span class="vc-icon">{{ volumen === 0 ? '🔇' : volumen < 50 ? '🔉' : '🔊' }}</span>
      <div class="vc-niveles">
        @for (n of niveles; track n) {
          <button type="button" class="vc-dot" [class.vc-dot-on]="volumen >= n"
            [attr.aria-label]="'Volumen ' + n + '%'"
            (click)="seleccionar(n)"></button>
        }
      </div>
      <span class="vc-pct">{{ volumen }}%</span>
    </div>
  `,
  styles: [`
    .vc-wrap { display: flex; align-items: center; gap: 8px; }
    .vc-icon { font-size: 18px; }
    .vc-niveles { display: flex; align-items: center; gap: 5px; }
    .vc-dot {
      width: 16px; height: 16px; border-radius: 50%; cursor: pointer;
      border: 1.5px solid rgba(255,255,255,.35); background: rgba(255,255,255,.08);
      transition: all .15s;
    }
    .vc-dot-on { background: linear-gradient(135deg,#a78bfa,#60a5fa); border-color: rgba(167,139,250,.8); box-shadow: 0 0 8px rgba(167,139,250,.6); }
    .vc-dot:hover { transform: scale(1.15); }
    .vc-pct { font-size: 12px; font-weight: 700; color: rgba(255,255,255,.6); min-width: 34px; }
  `]
})
export class VolumeControlComponent {
  @Input() volumen: NivelVolumen = 75;
  @Output() volumenChange = new EventEmitter<NivelVolumen>();

  readonly niveles: NivelVolumen[] = [0, 25, 50, 75, 100];

  seleccionar(n: NivelVolumen): void {
    if (n === this.volumen) return;
    this.volumen = n;
    this.volumenChange.emit(n);
  }
}
