import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CeldaMini { dia: number | null; fechaISO: string | null; deshabilitado: boolean; esHoy: boolean; esSeleccionado: boolean; }
interface SlotHora  { value: string; label: string; deshabilitado: boolean; ocupado: boolean; }

/**
 * Selector de fecha (y hora, opcional) construido a mano — sin <input type="date">/<input type="time">
 * nativos del navegador. Bloquea días/horas ya pasados y permite marcar horarios ya ocupados
 * (para evitar dos citas a la misma hora).
 */
@Component({
  selector: 'app-fecha-hora-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="fhp-root">
  <div class="fhp-row">
    <button type="button" class="fhp-chip" (click)="toggleFecha($event)">
      <span class="fhp-ico">📅</span>
      <span [class.fhp-placeholder]="!fecha">{{ fecha ? fechaFormateada : 'Selecciona una fecha' }}</span>
    </button>

    @if (mostrarHora) {
      <button type="button" class="fhp-chip" (click)="toggleHora($event)">
        <span class="fhp-ico">🕐</span>
        <span [class.fhp-placeholder]="!hora">{{ hora ? horaFormateada : (horaOpcional ? 'Sin hora' : 'Selecciona hora') }}</span>
      </button>
    }
  </div>

  @if (abierto === 'fecha') {
    <div class="fhp-panel" (click)="$event.stopPropagation()">
      <div class="fhp-panel-nav">
        <button type="button" class="fhp-nav-btn" (click)="cambiarMes(-1)">‹</button>
        <span class="fhp-panel-mes">{{ nombreMesVisible }}</span>
        <button type="button" class="fhp-nav-btn" (click)="cambiarMes(1)">›</button>
      </div>
      <div class="fhp-dow-row">
        @for (d of ['Lu','Ma','Mi','Ju','Vi','Sá','Do']; track d) { <span>{{ d }}</span> }
      </div>
      <div class="fhp-grid">
        @for (c of diasGrid; track $index) {
          <button type="button" class="fhp-day"
                  [class.fhp-day-vacio]="!c.fechaISO"
                  [class.fhp-day-hoy]="c.esHoy"
                  [class.fhp-day-sel]="c.esSeleccionado"
                  [disabled]="!c.fechaISO || c.deshabilitado"
                  (click)="c.fechaISO ? seleccionarDia(c.fechaISO) : null">
            {{ c.dia }}
          </button>
        }
      </div>
    </div>
  }

  @if (abierto === 'hora') {
    <div class="fhp-panel fhp-panel-hora" (click)="$event.stopPropagation()">
      @if (horaOpcional) {
        <button type="button" class="fhp-slot fhp-slot-clear" (click)="limpiarHora()">✕ Sin hora / todo el día</button>
      }
      <div class="fhp-slots">
        @for (s of slots; track s.value) {
          <button type="button" class="fhp-slot" [class.fhp-slot-sel]="hora === s.value"
                  [class.fhp-slot-ocupado]="s.ocupado" [disabled]="s.deshabilitado"
                  [title]="s.ocupado ? 'Ya hay una cita agendada a esta hora' : (s.deshabilitado ? 'Esa hora ya pasó' : '')"
                  (click)="seleccionarHora(s.value)">
            {{ s.label }}
            @if (s.ocupado) { <span class="fhp-slot-tag">Ocupado</span> }
          </button>
        }
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    .fhp-root { position: relative; }
    .fhp-row { display: flex; gap: 8px; }
    .fhp-chip {
      flex: 1; display: flex; align-items: center; gap: 8px;
      border: 1.5px solid #E5E7EB; border-radius: 10px; padding: 9px 12px;
      background: white; cursor: pointer; font-family: inherit; font-size: 13.5px; color: #1F2937;
      text-align: left;
    }
    .fhp-chip:hover { border-color: #86EFAC; }
    .fhp-placeholder { color: #9CA3AF; }
    .fhp-ico { font-size: 14px; flex-shrink: 0; }

    .fhp-panel {
      position: absolute; top: calc(100% + 6px); left: 0; z-index: 40;
      background: white; border: 1.5px solid #E5E7EB; border-radius: 14px;
      box-shadow: 0 12px 34px rgba(15,23,42,.16); padding: 14px; width: 280px;
    }
    .fhp-panel-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .fhp-nav-btn { width: 26px; height: 26px; border-radius: 8px; border: 1.5px solid #D1FAE5; background: white; color: #15803D; font-weight: 800; cursor: pointer; }
    .fhp-nav-btn:hover { background: #F0FDF4; }
    .fhp-panel-mes { font-size: 13px; font-weight: 800; color: #14532D; text-transform: capitalize; }
    .fhp-dow-row { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 4px; }
    .fhp-dow-row span { text-align: center; font-size: 10px; font-weight: 700; color: #9CA3AF; }
    .fhp-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
    .fhp-day {
      aspect-ratio: 1; border: none; border-radius: 8px; background: #F9FAFB;
      font-size: 12px; font-weight: 700; color: #374151; cursor: pointer; font-family: inherit;
    }
    .fhp-day:hover:not(:disabled) { background: #DCFCE7; }
    .fhp-day:disabled { color: #D1D5DB; cursor: not-allowed; background: transparent; }
    .fhp-day-vacio { visibility: hidden; }
    .fhp-day-hoy { border: 1.5px solid #86EFAC; }
    .fhp-day-sel { background: #15803D !important; color: white !important; }

    .fhp-panel-hora { width: 240px; max-height: 320px; overflow-y: auto; }
    .fhp-slots { display: flex; flex-direction: column; gap: 4px; }
    .fhp-slot {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      border: 1.5px solid #E5E7EB; border-radius: 9px; padding: 7px 10px;
      background: white; font-size: 12.5px; font-weight: 600; color: #374151; cursor: pointer; font-family: inherit;
    }
    .fhp-slot:hover:not(:disabled) { border-color: #86EFAC; background: #F0FDF4; }
    .fhp-slot:disabled { color: #D1D5DB; background: #F9FAFB; cursor: not-allowed; }
    .fhp-slot-sel { background: #15803D; border-color: #15803D; color: white; }
    .fhp-slot-ocupado:disabled { color: #B91C1C; background: #FEF2F2; }
    .fhp-slot-tag { font-size: 9.5px; font-weight: 800; background: #FCA5A5; color: #7F1D1D; border-radius: 20px; padding: 1px 6px; }
    .fhp-slot-clear { justify-content: center; color: #6B7280; margin-bottom: 6px; }
  `]
})
export class FechaHoraPickerComponent {
  @Input() fecha: string = '';
  @Output() fechaChange = new EventEmitter<string>();

  @Input() hora: string | null = null;
  @Output() horaChange = new EventEmitter<string | null>();

  @Input() mostrarHora = true;
  @Input() horaOpcional = true;
  @Input() horasOcupadas: string[] = [];

  abierto: 'fecha' | 'hora' | null = null;
  mesVisible = new Date();

  private readonly SLOTS_RAW: string[] = (() => {
    const out: string[] = [];
    for (let m = 7 * 60; m <= 19 * 60; m += 30) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      out.push(`${hh}:${mm}`);
    }
    return out;
  })();

  constructor(private eRef: ElementRef) {}

  @HostListener('document:click')
  onDocClick(): void { this.abierto = null; }

  private hoyISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  toggleFecha(ev: MouseEvent): void {
    ev.stopPropagation();
    if (this.fecha) { const [y, m] = this.fecha.split('-').map(Number); this.mesVisible = new Date(y, m - 1, 1); }
    this.abierto = this.abierto === 'fecha' ? null : 'fecha';
  }

  toggleHora(ev: MouseEvent): void {
    ev.stopPropagation();
    this.abierto = this.abierto === 'hora' ? null : 'hora';
  }

  cambiarMes(delta: number): void {
    this.mesVisible = new Date(this.mesVisible.getFullYear(), this.mesVisible.getMonth() + delta, 1);
  }

  get nombreMesVisible(): string {
    const s = this.mesVisible.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get diasGrid(): CeldaMini[] {
    const anio = this.mesVisible.getFullYear();
    const mes  = this.mesVisible.getMonth();
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const offset = (primerDia.getDay() + 6) % 7;
    const hoy = this.hoyISO();

    const celdas: CeldaMini[] = [];
    for (let i = 0; i < offset; i++) celdas.push({ dia: null, fechaISO: null, deshabilitado: true, esHoy: false, esSeleccionado: false });
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const fechaISO = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      celdas.push({
        dia, fechaISO,
        deshabilitado: fechaISO < hoy,
        esHoy: fechaISO === hoy,
        esSeleccionado: fechaISO === this.fecha,
      });
    }
    return celdas;
  }

  seleccionarDia(fechaISO: string): void {
    this.fecha = fechaISO;
    this.fechaChange.emit(fechaISO);
    this.abierto = null;
  }

  get fechaFormateada(): string {
    if (!this.fecha) return '';
    const [y, m, d] = this.fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  private formatearHora12(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const periodo = h < 12 ? 'a.m.' : 'p.m.';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
  }

  get horaFormateada(): string {
    return this.hora ? this.formatearHora12(this.hora) : '';
  }

  get slots(): SlotHora[] {
    const hoy = this.hoyISO();
    const esHoy = this.fecha === hoy;
    const ahora = new Date();
    return this.SLOTS_RAW.map(value => {
      const [h, m] = value.split(':').map(Number);
      const pasado = esHoy && (h < ahora.getHours() || (h === ahora.getHours() && m <= ahora.getMinutes()));
      const ocupado = this.horasOcupadas.includes(value);
      return { value, label: this.formatearHora12(value), deshabilitado: pasado || ocupado, ocupado };
    });
  }

  seleccionarHora(value: string): void {
    this.hora = value;
    this.horaChange.emit(value);
    this.abierto = null;
  }

  limpiarHora(): void {
    this.hora = null;
    this.horaChange.emit(null);
    this.abierto = null;
  }
}
