import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PiezasTiempoService, COLORES_PIEZAS, FORMAS_SIMETRICAS } from './piezas-tiempo.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { PiezaData, SlotData, Nivel } from './piezas-tiempo.model';

type Estado = 'inicio' | 'jugando' | 'completado' | 'tiempo-agotado';

const SVG_SHAPES: Record<string, string> = {
  circulo:    '<circle cx="50" cy="50" r="42"/>',
  cuadrado:   '<rect x="8" y="8" width="84" height="84" rx="8"/>',
  triangulo:  '<polygon points="50,8 92,92 8,92"/>',
  rectangulo: '<rect x="8" y="22" width="84" height="56" rx="6"/>',
  diamante:   '<polygon points="50,8 92,50 50,92 8,50"/>',
  pentagono:  '<polygon points="50,8 90,36 76,84 24,84 10,36"/>',
  estrella:   '<polygon points="50,5 62,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 38,38"/>',
  cruz:       '<polygon points="35,8 65,8 65,35 92,35 92,65 65,65 65,92 35,92 35,65 8,65 8,35 35,35"/>'
};

@Component({
  selector: 'app-piezas-tiempo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './piezas-tiempo.component.html',
  styleUrls: ['./piezas-tiempo.component.css']
})
export class PiezasTiempoComponent implements OnInit, OnDestroy {

  estado: Estado = 'inicio';
  nivelActual: Nivel = 'FACIL';
  sonidoActivo = true;
  perfilId = 0;

  piezas: PiezaData[] = [];
  slots:  SlotData[]  = [];
  piezaSeleccionada: PiezaData | null = null;

  piezaSvgMap: Map<string, SafeHtml> = new Map();
  slotSvgMap:  Map<string, SafeHtml> = new Map();

  // Drag & drop
  isDragging = false;
  dragPieza: PiezaData | null = null;
  ghostX = 0;
  ghostY = 0;
  private readonly GHOST_SIZE = 86;

  // Timer
  tiempoRestante = 0;
  tiempoTotal    = 0;
  private endTime = 0;
  private timerInterval: any = null;

  // Stats
  piezasColocadas = 0;
  rotaciones      = 0;
  fallidos        = 0;
  puntosBonus     = 0;

  requiereRotacion = false;
  nivelSugerido: Nivel | null = null;
  subioNivel = false;
  hintMsg = '';
  fraseMotivaconalActual = '';

  private readonly frasesMotivacionales = [
    '¡Sigue así, a la siguiente lo lograrás! 💪',
    '¡Casi lo tienes! Un poco más de práctica 🌟',
    '¡Cada intento te hace más fuerte! 🚀',
    '¡No te rindas, tú puedes lograrlo! ⭐',
    '¡El esfuerzo siempre vale la pena! 🎯',
    '¡Vas muy bien, sigue practicando! 🧠',
    '¡La próxima vez lo vas a lograr! 🌈'
  ];

  private readonly frasesCelebracion = [
    '¡Bien hecho!', '¡Increíble!', '¡Fantástico!', '¡Sigue así!',
    '¡Genial!', '¡Excelente!', '¡Muy bien!', '¡Eso es!', '¡Perfecto!', '¡Brillante!'
  ];

  private audioCtx: AudioContext | null = null;
  private bgInterval: any = null;

  readonly niveles: { id: Nivel; label: string; emoji: string; desc: string }[] = [
    { id: 'FACIL',   label: 'Fácil',   emoji: '🟢', desc: '3 piezas · 50s · 1 giro' },
    { id: 'MEDIO',   label: 'Medio',   emoji: '🟡', desc: '5 piezas · 42s · más giros' },
    { id: 'DIFICIL', label: 'Difícil', emoji: '🟠', desc: '6 piezas · 35s · giro libre' },
    { id: 'EXPERTO', label: 'Experto', emoji: '🔴', desc: '8 piezas · 28s · máxima dificultad' }
  ];

  constructor(
    private service: PiezasTiempoService,
    private profileService: ChildProfileService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileService.activeProfile$.subscribe(state => {
      if (!state.profileId) { this.router.navigate(['/padre/perfiles/selector']); return; }
      this.perfilId = state.profileId;
    });
  }

  ngOnDestroy(): void {
    this.detenerTimer();
    this.stopBgMusic();
    window.speechSynthesis?.cancel();
    this.audioCtx?.close();
  }

  // ── INICIO ──────────────────────────────────────────────────────────────

  seleccionarNivel(nivel: Nivel): void { this.nivelActual = nivel; }

  iniciarJuego(nivel: Nivel = this.nivelActual): void {
    this.nivelActual     = nivel;
    const cfg            = this.service.generarConfig(nivel);
    this.requiereRotacion = true; // siempre activo: formas no simétricas empiezan giradas
    this.nivelSugerido   = cfg.siguiente;
    this.tiempoTotal     = cfg.tiempo;
    this.tiempoRestante  = cfg.tiempo;
    this.piezasColocadas = 0;
    this.rotaciones      = 0;
    this.fallidos        = 0;
    this.puntosBonus     = 0;
    this.subioNivel      = false;
    this.piezaSeleccionada = null;
    this.isDragging      = false;
    this.dragPieza       = null;
    this.hintMsg         = '';
    this.piezaSvgMap.clear();
    this.slotSvgMap.clear();

    this.slots = cfg.formas.map((forma, i) => ({
      id: `slot-${i}`, forma, ocupado: false, animError: false, animOk: false
    }));

    const colores = [...COLORES_PIEZAS].sort(() => Math.random() - 0.5);
    const formasMezcladas = [...cfg.formas].sort(() => Math.random() - 0.5);

    this.piezas = formasMezcladas.map((forma, i) => {
      const esSimetrica = FORMAS_SIMETRICAS.includes(forma);
      // Simétricas: siempre 0° (no importa el ángulo).
      // No simétricas: ángulo aleatorio de rotacionesPosibles del nivel
      //   FACIL=[270]→1 clic, MEDIO=[90,270]→1 o 3, DIFICIL/EXPERTO=[90,180,270]
      const rotacion = esSimetrica
        ? 0
        : cfg.rotacionesPosibles[Math.floor(Math.random() * cfg.rotacionesPosibles.length)];
      return { id: `pieza-${i}`, forma, rotacion, color: colores[i % colores.length], colocada: false, seleccionada: false };
    });

    this.piezas.forEach(p => this.piezaSvgMap.set(p.id, this.buildPiezaSvg(p)));
    this.slots.forEach(s => this.slotSvgMap.set(s.id, this.buildSlotSvg(s.forma)));

    this.estado = 'jugando';
    this.cdr.detectChanges();
    this.iniciarTimer();
    setTimeout(() => this.startBgMusic(), 200);
  }

  // ── DRAG & DROP ──────────────────────────────────────────────────────────

  onPiezaMouseDown(pieza: PiezaData, event: MouseEvent): void {
    if (pieza.colocada || this.estado !== 'jugando') return;
    event.preventDefault();
    this.iniciarDrag(pieza, event.clientX, event.clientY);
  }

  onPiezaTouchStart(pieza: PiezaData, event: TouchEvent): void {
    if (pieza.colocada || this.estado !== 'jugando') return;
    event.preventDefault();
    const t = event.touches[0];
    this.iniciarDrag(pieza, t.clientX, t.clientY);
  }

  private iniciarDrag(pieza: PiezaData, x: number, y: number): void {
    this.piezas.forEach(p => p.seleccionada = false);
    pieza.seleccionada = true;
    this.piezaSeleccionada = pieza;
    this.isDragging = true;
    this.dragPieza  = pieza;
    this.ghostX = x - this.GHOST_SIZE / 2;
    this.ghostY = y - this.GHOST_SIZE / 2;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.ghostX = event.clientX - this.GHOST_SIZE / 2;
    this.ghostY = event.clientY - this.GHOST_SIZE / 2;
  }

  @HostListener('document:touchmove', ['$event'])
  onDocTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const t = event.touches[0];
    this.ghostX = t.clientX - this.GHOST_SIZE / 2;
    this.ghostY = t.clientY - this.GHOST_SIZE / 2;
  }

  @HostListener('document:mouseup', ['$event'])
  onDocMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.soltarPieza(event.clientX, event.clientY);
  }

  @HostListener('document:touchend', ['$event'])
  onDocTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;
    const t = event.changedTouches[0];
    this.soltarPieza(t.clientX, t.clientY);
  }

  private soltarPieza(x: number, y: number): void {
    this.isDragging = false;

    // Oculta el ghost para ver qué hay debajo
    const ghostEl = document.querySelector('.drag-ghost') as HTMLElement | null;
    if (ghostEl) ghostEl.style.visibility = 'hidden';
    const el = document.elementFromPoint(x, y);
    if (ghostEl) ghostEl.style.visibility = '';

    const slotEl = el?.closest('[data-slot-id]') as HTMLElement | null;
    if (slotEl && this.piezaSeleccionada) {
      const slotId = slotEl.getAttribute('data-slot-id');
      const slot   = this.slots.find(s => s.id === slotId);
      if (slot) { this.intentarColocar(slot); }
    }
    this.dragPieza = null;
  }

  // Click en slot (complementa drag; también funciona si el jugador prefiere hacer click)
  onSlotClick(slot: SlotData): void {
    if (!this.isDragging) this.intentarColocar(slot);
  }

  // ── ROTAR ────────────────────────────────────────────────────────────────

  rotarSeleccionada(): void {
    if (!this.piezaSeleccionada) return;
    const p = this.piezaSeleccionada;
    p.rotacion = (p.rotacion + 90) % 360;
    this.piezaSvgMap.set(p.id, this.buildPiezaSvg(p));
    this.rotaciones++;
    this.playRotar();
  }

  // ── COLOCAR PIEZA ────────────────────────────────────────────────────────

  intentarColocar(slot: SlotData): void {
    if (!this.piezaSeleccionada || slot.ocupado) return;
    const pieza  = this.piezaSeleccionada;
    const formaOk = pieza.forma === slot.forma;
    const rotOk   = this.rotacionValida(pieza);

    if (formaOk && rotOk) {
      pieza.colocada     = true;
      pieza.seleccionada = false;
      slot.ocupado       = true;
      slot.colorPieza    = pieza.color;
      slot.animOk        = true;
      this.slotSvgMap.set(slot.id, this.buildSlotSvgOcupado(slot.forma, pieza.color));
      setTimeout(() => { slot.animOk = false; }, 700);
      this.piezaSeleccionada = null;
      this.piezasColocadas++;
      this.hintMsg = '';
      this.playPiezaColocada();
      this.speak(this.frasesCelebracion[Math.floor(Math.random() * this.frasesCelebracion.length)]);

      if (this.piezasColocadas === this.slots.length) {
        this.detenerTimer();
        // Sin delay para evitar quedarse pegado; forzamos detección de cambios
        this.finalizarSesion('completado');
      }
    } else if (!formaOk) {
      this.fallidos++;
      this.triggerError(slot);
      pieza.seleccionada = false;
      this.piezaSeleccionada = null;
    } else {
      // Forma ok pero rotación mal
      this.fallidos++;
      this.triggerError(slot);
      this.hintMsg = '¡Rota la pieza! 🔄';
      setTimeout(() => { this.hintMsg = ''; }, 2200);
    }
  }

  private triggerError(slot: SlotData): void {
    slot.animError = true;
    setTimeout(() => { slot.animError = false; }, 600);
    this.playError();
  }

  private rotacionValida(pieza: PiezaData): boolean {
    // Formas simétricas: encajan en cualquier rotación (círculo, cuadrado, diamante, estrella, cruz)
    if (FORMAS_SIMETRICAS.includes(pieza.forma)) return true;
    // Formas no simétricas: siempre se valida la rotación, sin importar el nivel.
    // Las piezas en FACIL/MEDIO comienzan en 0° para que encajen de inmediato;
    // si el jugador las rota, debe volver a 0° para colocarlas.
    if (pieza.forma === 'rectangulo') return pieza.rotacion === 0 || pieza.rotacion === 180;
    return pieza.rotacion === 0; // triangulo, pentagono: exactamente 0°
  }

  // ── FINALIZAR ────────────────────────────────────────────────────────────

  private finalizarSesion(nuevoEstado: 'completado' | 'tiempo-agotado'): void {
    this.estado = nuevoEstado;
    this.cdr.detectChanges(); // forzar actualización inmediata de la vista
    this.stopBgMusic();

    if (nuevoEstado === 'completado') {
      this.puntosBonus = this.tiempoRestante;
      if (this.tiempoRestante / this.tiempoTotal > 0.5 && this.nivelSugerido) {
        this.subioNivel = true;
      }
      this.playCompletado();
      this.speak('¡Lo lograste! ¡Excelente trabajo!');
    } else {
      this.fraseMotivaconalActual = this.frasesMotivacionales[
        Math.floor(Math.random() * this.frasesMotivacionales.length)
      ];
      this.playTiempoAgotado();
      this.speak('¡Sigue intentando, tú puedes!');
    }

    this.service.guardarSesion({
      perfilId: this.perfilId,
      nivel: this.nivelActual,
      piezasTotales: this.slots.length,
      piezasColocadas: this.piezasColocadas,
      rotaciones: this.rotaciones,
      piezasFallidas: this.fallidos,
      tiempoUsadoSegundos: this.tiempoTotal - this.tiempoRestante,
      tiempoTotalSegundos: this.tiempoTotal,
      puntosBonus: this.puntosBonus,
      completada: nuevoEstado === 'completado',
      subioNivel: this.subioNivel
    });
  }

  // ── TIMER ────────────────────────────────────────────────────────────────

  private iniciarTimer(): void {
    this.endTime = Date.now() + this.tiempoTotal * 1000;
    this.timerInterval = setInterval(() => {
      const restante = Math.ceil((this.endTime - Date.now()) / 1000);
      this.tiempoRestante = Math.max(0, restante);
      if (this.tiempoRestante <= 0) {
        this.detenerTimer();
        this.finalizarSesion('tiempo-agotado');
      }
    }, 250);
  }

  private detenerTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  // ── AUDIO ────────────────────────────────────────────────────────────────

  private getAudio(): AudioContext | null {
    if (!this.sonidoActivo) return null;
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return this.audioCtx;
    } catch { return null; }
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, delay = 0): void {
    const ctx = this.getAudio(); if (!ctx) return;
    try {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
    } catch {}
  }

  private startBgMusic(): void {
    const ctx = this.getAudio(); if (!ctx) return;
    this.stopBgMusic();
    const notas = [330, 392, 440, 494, 523, 494, 440, 392];
    const durNota = 0.45;
    const loopDur = notas.length * durNota * 1000;
    const tocar = () => {
      const c = this.getAudio(); if (!c) return;
      notas.forEach((freq, i) => {
        try {
          const osc = c.createOscillator(); const gain = c.createGain();
          osc.connect(gain); gain.connect(c.destination);
          osc.type = 'triangle'; osc.frequency.value = freq;
          const t = c.currentTime + i * durNota;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.038, t + 0.05);
          gain.gain.linearRampToValueAtTime(0, t + durNota - 0.05);
          osc.start(t); osc.stop(t + durNota);
        } catch {}
      });
    };
    tocar();
    this.bgInterval = setInterval(tocar, loopDur);
  }

  private stopBgMusic(): void {
    if (this.bgInterval) { clearInterval(this.bgInterval); this.bgInterval = null; }
  }

  private playPiezaColocada(): void {
    this.playTone(523, 0.1, 'sine', 0.3);
    this.playTone(659, 0.1, 'sine', 0.3, 0.1);
    this.playTone(784, 0.2, 'sine', 0.3, 0.22);
  }
  private playRotar():       void { this.playTone(440, 0.08, 'triangle', 0.12); }
  private playError():       void { this.playTone(200, 0.2, 'sawtooth', 0.12); }
  private playCompletado():  void { [523,659,784,1047].forEach((f,i) => this.playTone(f,0.28,'sine',0.3,i*0.13)); }
  private playTiempoAgotado(): void { this.playTone(330,0.35,'triangle',0.2); this.playTone(220,0.5,'triangle',0.2,0.4); }

  private speak(texto: string): void {
    if (!this.sonidoActivo) return;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(texto);
      utt.lang = 'es-ES'; utt.rate = 0.88; utt.pitch = 1.15; utt.volume = 0.9;
      const vozEs = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('es'));
      if (vozEs) utt.voice = vozEs;
      window.speechSynthesis.speak(utt);
    } catch {}
  }

  // ── SVG ──────────────────────────────────────────────────────────────────

  private buildPiezaSvg(p: PiezaData): SafeHtml {
    const path = SVG_SHAPES[p.forma] ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
        <g transform="rotate(${p.rotacion},50,50)" fill="${p.color}" filter="drop-shadow(0 2px 6px ${p.color}88)">${path}</g>
      </svg>`
    );
  }

  private buildSlotSvg(forma: string): SafeHtml {
    const path = SVG_SHAPES[forma] ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
        <g fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.45)" stroke-width="3" stroke-dasharray="7,4">${path}</g>
      </svg>`
    );
  }

  private buildSlotSvgOcupado(forma: string, color: string): SafeHtml {
    const path = SVG_SHAPES[forma] ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
        <g fill="${color}" opacity="0.92" filter="drop-shadow(0 2px 8px ${color}99)">${path}</g>
      </svg>`
    );
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────

  getSlotSvg(slotId: string):   SafeHtml { return this.slotSvgMap.get(slotId)   ?? ''; }
  getPiezaSvg(piezaId: string): SafeHtml { return this.piezaSvgMap.get(piezaId) ?? ''; }

  get piezasRestantes(): PiezaData[] { return this.piezas.filter(p => !p.colocada); }

  get timerPorcentaje(): number {
    return this.tiempoTotal ? (this.tiempoRestante / this.tiempoTotal) * 100 : 100;
  }
  get timerColor(): string {
    if (this.timerPorcentaje > 50) return '#7ECEC4';
    if (this.timerPorcentaje > 25) return '#FFD97D';
    return '#FF6B6B';
  }
  formatTiempo(s: number): string {
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  }
  get nivelLabel(): string {
    return ({FACIL:'Fácil',MEDIO:'Medio',DIFICIL:'Difícil',EXPERTO:'Experto'})[this.nivelActual] ?? this.nivelActual;
  }

  jugarDeNuevo(): void { this.iniciarJuego(this.nivelActual); }
  subirNivel():   void { if (this.nivelSugerido) this.iniciarJuego(this.nivelSugerido); }

  volverInicio(): void {
    this.detenerTimer(); this.stopBgMusic();
    this.isDragging = false; this.dragPieza = null;
    this.piezas = []; this.slots = []; this.piezaSeleccionada = null;
    this.estado = 'inicio';
  }
  volverLobby(): void {
    this.detenerTimer(); this.stopBgMusic();
    this.router.navigate(['/nino/juegos']);
  }
  toggleSonido(): void {
    this.sonidoActivo = !this.sonidoActivo;
    if (!this.sonidoActivo) this.stopBgMusic();
    else if (this.estado === 'jugando') this.startBgMusic();
  }
}
