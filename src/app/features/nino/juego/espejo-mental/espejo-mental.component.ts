import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { VolumeControlComponent } from '../../../../shared/game-feedback/volume-control.component';
import { GameFeedbackService, NivelVolumen } from '../../../../shared/game-feedback/game-feedback.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';

type Estado = 'inicio' | 'cuenta' | 'mostrando' | 'input' | 'feedback' | 'resultados';
type Mood   = 'idle' | 'thinking' | 'excited' | 'celebrate' | 'encourage';

interface Elemento { id: number; color: string; colorActivo: string; glow: string; simbolo: string; nombre: string; }
interface ClickMetrica { elementId: number; ms: number; correcto: boolean; }
interface ConfettiPiece { id: number; left: number; color: string; delay: number; dur: number; size: number; }

@Component({
  selector: 'app-espejo-mental',
  standalone: true,
  imports: [CommonModule, GameFeedbackComponent, VolumeControlComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './espejo-mental.component.html',
  styleUrl: './espejo-mental.component.scss'
})
export class EspejoMentalComponent implements OnInit, OnDestroy {

  readonly ELEMENTOS: Elemento[] = [
    { id: 0, color: '#dc2626', colorActivo: '#ff6b6b', glow: 'rgba(220,38,38,.9)',  simbolo: '🔴', nombre: 'Rojo'     },
    { id: 1, color: '#1d4ed8', colorActivo: '#60a5fa', glow: 'rgba(29,78,216,.9)',  simbolo: '🔵', nombre: 'Azul'     },
    { id: 2, color: '#15803d', colorActivo: '#4ade80', glow: 'rgba(21,128,61,.9)',  simbolo: '🟢', nombre: 'Verde'    },
    { id: 3, color: '#b45309', colorActivo: '#fbbf24', glow: 'rgba(180,83,9,.9)',   simbolo: '🟡', nombre: 'Amarillo' },
  ];

  readonly MAX_RONDAS = 10;
  private readonly TONOS = [261.63, 329.63, 392.00, 523.25];

  readonly MASCOTA_MSGS: Record<Mood, string[]> = {
    idle:      ['¡Listo para jugar! 🎮', '¡Aquí vamos! ✨'],
    thinking:  ['¡Memoriza bien! 👀', '¡Presta atención! 🧠', '¡Fíjate en el orden! 🔍', '¡Concéntrate! 💡', '¡Obsérvame bien! 🌟'],
    excited:   ['¡Es tu turno! ¡Tú puedes! 💪', '¡Recuerda el orden! 🎯', '¡Vamos, campeón! 🚀', '¡Confío en ti! ⭐', '¡Tu cerebro es poderoso! 🧠'],
    celebrate: ['¡INCREÍBLE! ¡Lo lograste! 🎉', '¡PERFECTO! ¡Eres un genio! ⭐', '¡BRILLANTE! ¡Qué memoria! 🏆', '¡GENIAL! ¡Sigue así! 💫', '¡ASOMBROSO! 🦸‍♂️'],
    encourage: ['¡Casi! ¡Inténtalo de nuevo! 💪', '¡No pasa nada! ¡Tú puedes! 🌟', '¡Cada error te enseña algo! 💖', '¡Ánimo! ¡La próxima es tuya! 🌈'],
  };

  estado: Estado = 'inicio';
  secuencia: number[] = [];
  respuestaJugador: number[] = [];
  longitudActual = 3;
  elementoActivo = -1;
  elementoError = -1;
  erroresConsecutivos = 0;

  aciertos = 0; errores = 0; maxLongitud = 3; rondas = 0;
  metricas: ClickMetrica[] = [];
  tiempoInicioInput = 0;
  combo = 0; maxCombo = 0;
  showCombo = false; showConfetti = false;
  confettiPieces: ConfettiPiece[] = this.generarConfeti();

  cuentaTexto = '3';
  cuentaPop = false;

  mascotEmoji = '🦊';
  mascotMsg   = '¡Listo para jugar! 🎮';
  mascotMood: Mood = 'idle';
  voiceEnabled = true;
  private abortado = false;

  // ── Retroalimentación visual/sonora (CA-01..CA-06) ─────────────────────
  @ViewChild('feedback') feedback!: GameFeedbackComponent;
  volumenActual: NivelVolumen = 75;
  elementoCorrectoHighlight = -1; // CA-03: resalta el elemento correcto tras fallo
  elementoPista = -1;             // CA-03: pista sin penalizar puntaje
  private fallosParaPista = 0;    // contador independiente de erroresConsecutivos (dificultad)
  private profileId: number | null = null;
  private skipResolver: (() => void) | null = null;

  get secuenciaArray(): number[] { return Array.from({ length: this.longitudActual }); }

  get mascotDecoEmoji(): string {
    const map: Record<Mood, string> = {
      idle: '', thinking: '👀', excited: '💪', celebrate: '🎉', encourage: '💗'
    };
    return map[this.mascotMood];
  }

  private timers: ReturnType<typeof setTimeout>[] = [];
  private audioCtx: AudioContext | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private feedbackService: GameFeedbackService,
    private childProfileService: ChildProfileService,
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
      this.profileId = state.profileId;
      this.volumenActual = (state.profileVolumen ?? 75) as NivelVolumen;
      this.feedbackService.setVolumen(this.volumenActual);
    });
  }

  ngOnDestroy(): void { this.limpiarTimers(); this.audioCtx?.close(); window.speechSynthesis?.cancel(); }

  // ── Volumen (CA-05) ─────────────────────────────────────────────────────

  onVolumenChange(v: NivelVolumen): void {
    this.volumenActual = v;
    this.feedbackService.setVolumen(v);
    if (this.profileId != null) {
      this.childProfileService.updateVolumen(this.profileId, v).subscribe();
    }
  }

  // ── AUDIO ─────────────────────────────────────────

  private initAudio(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private tocar(freq: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.35, freqFin?: number): void {
    if (!this.audioCtx) return;
    try {
      const osc  = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      if (freqFin) osc.frequency.exponentialRampToValueAtTime(freqFin, this.audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + dur + 0.05);
    } catch (_) {}
  }

  // ── TTS ───────────────────────────────────────────

  toggleVoz(): void { this.voiceEnabled = !this.voiceEnabled; if (!this.voiceEnabled) window.speechSynthesis?.cancel(); }

  private hablar(texto: string, rate = 0.92, pitch = 1.15): Promise<void> {
    if (!this.voiceEnabled || !window.speechSynthesis) return Promise.resolve();
    return new Promise(resolve => {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(texto);
        utt.lang   = 'es-ES';
        utt.volume = 0.9;
        utt.rate   = rate;
        utt.pitch  = pitch;
        utt.onend  = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      } catch (_) { resolve(); }
    });
  }

  private sonarElemento(id: number): void { this.tocar(this.TONOS[id], 0.28, 'sine', 0.4); }
  // Los sonidos de acierto/error del CA-04 ahora los reproduce GameFeedbackService (assets OGG/MP3).
  private sonarTick(): void { this.tocar(440, 0.07, 'triangle', 0.22); }
  private sonarYa(): void {
    this.tocar(880, 0.12, 'sine', 0.45);
    setTimeout(() => this.tocar(1047, 0.18, 'sine', 0.4), 90);
    setTimeout(() => this.tocar(1319, 0.22, 'sine', 0.35), 180);
  }
  private sonarFanfare(): void {
    const notas = this.puntuacion >= 80 ? [523, 659, 784, 880, 1047] : [523, 659, 523];
    notas.forEach((f, i) => setTimeout(() => this.tocar(f, 0.3, 'sine', 0.4), i * 130));
  }

  // ── FLUJO ─────────────────────────────────────────

  iniciarJuego(): void {
    this.initAudio();
    this.abortado = false;
    this.aciertos = 0; this.errores = 0; this.maxLongitud = 3;
    this.rondas = 0; this.metricas = []; this.erroresConsecutivos = 0;
    this.longitudActual = 3; this.combo = 0; this.maxCombo = 0;
    this.nuevaRonda();
  }

  reiniciarJuego(): void { this.iniciarJuego(); }

  private nuevaRonda(): void { this.generarSecuencia(); this.iniciarCuenta(); }

  private generarSecuencia(): void {
    this.secuencia = Array.from({ length: this.longitudActual },
      () => Math.floor(Math.random() * this.ELEMENTOS.length));
  }

  private iniciarCuenta(): void {
    this.estado = 'cuenta';
    this.setMascota('idle');
    this.mostrarCuentaNum('3');
    this.sonarTick();
    this.cdr.detectChanges();

    const pasos = [
      { delay: 900,  texto: '2',    sonido: () => this.sonarTick() },
      { delay: 1800, texto: '1',    sonido: () => this.sonarTick() },
      { delay: 2700, texto: '¡YA!', sonido: () => this.sonarYa()  },
      { delay: 3400, texto: '',     sonido: () => {}, accion: () => this.mostrarSecuencia() },
    ];

    pasos.forEach(p => {
      this.timers.push(setTimeout(() => {
        if (p.texto) this.mostrarCuentaNum(p.texto);
        p.sonido();
        (p as any).accion?.();
        this.cdr.detectChanges();
      }, p.delay));
    });
  }

  private mostrarCuentaNum(texto: string): void {
    this.cuentaTexto = texto;
    this.cuentaPop = false;
    this.cdr.detectChanges();
    setTimeout(() => { this.cuentaPop = true; this.cdr.detectChanges(); }, 10);
    const vozMap: Record<string, string> = { '3': 'Tres', '2': 'Dos', '1': 'Uno', '¡YA!': '¡Ya!' };
    this.hablar(vozMap[texto] ?? texto, 0.85, 1.2);
  }

  private mostrarSecuencia(): void {
    this.estado = 'mostrando';
    this.respuestaJugador = [];
    this.elementoActivo = -1;
    this.showCombo = false;
    this.setMascota('thinking');
    this.cdr.detectChanges();

    let delay = 500;
    for (let i = 0; i < this.secuencia.length; i++) {
      const id = this.secuencia[i];
      this.timers.push(setTimeout(() => {
        this.elementoActivo = id; this.sonarElemento(id); this.cdr.detectChanges();
      }, delay));
      delay += 650;
      this.timers.push(setTimeout(() => {
        this.elementoActivo = -1; this.cdr.detectChanges();
      }, delay));
      delay += 300;
    }

    this.timers.push(setTimeout(() => {
      this.estado = 'input';
      this.tiempoInicioInput = Date.now();
      this.setMascota('excited');
      this.cdr.detectChanges();
    }, delay + 200));
  }

  clicarElemento(id: number): void {
    if (this.estado !== 'input') return;
    // CA-01: se marca el inicio justo en el input; el cálculo correcto/incorrecto es 100% local.
    const t0 = this.feedbackService.marcarInicio();
    this.sonarElemento(id);
    const ms       = Date.now() - this.tiempoInicioInput;
    const esperado = this.secuencia[this.respuestaJugador.length];
    const correcto = id === esperado;
    this.metricas.push({ elementId: id, ms, correcto });
    this.respuestaJugador.push(id);

    if (!correcto) {
      this.elementoError = id;
      this.cdr.detectChanges();
      this.timers.push(setTimeout(() => { this.elementoError = -1; this.cdr.detectChanges(); }, 450));
      this.manejarError(esperado);
      this.feedbackService.registrarLatencia(t0);
      return;
    }
    if (this.respuestaJugador.length === this.secuencia.length) {
      this.manejarAcierto();
      this.feedbackService.registrarLatencia(t0);
    }
  }

  private manejarAcierto(): void {
    this.aciertos++; this.rondas++;
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.erroresConsecutivos = 0;
    this.fallosParaPista = 0;
    this.elementoPista = -1;
    // Sube 1 elemento solo cada 2 aciertos seguidos (max 8 para niños)
    if (this.combo > 0 && this.combo % 2 === 0) {
      this.longitudActual = Math.min(this.longitudActual + 1, 8);
    }
    this.maxLongitud = Math.max(this.maxLongitud, this.longitudActual);
    this.showCombo = this.combo >= 2;
    this.feedback.showCorrect(); // CA-02: sonido + borde verde + check + partículas, <=1.2s
    this.estado = 'feedback';
    this.cdr.detectChanges();

    const speechDone = this.setMascota('celebrate');
    const minPausa   = this.crearPausaCancelable(1400);

    Promise.all([speechDone, minPausa]).then(() => {
      if (this.abortado) return;
      this.showConfetti = false;
      if (this.rondas >= this.MAX_RONDAS) {
        this.dispararConfeti(); // celebración solo al terminar la partida completa
        this.estado = 'resultados'; this.sonarFanfare();
        const txt = (this.tituloFinal + '. ' + this.mensajeFinal).replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
        setTimeout(() => this.hablar(txt, 0.88, 1.1), 800);
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    });
  }

  private manejarError(elementoCorrecto: number): void {
    this.errores++; this.rondas++;
    this.combo = 0; this.erroresConsecutivos++;
    this.fallosParaPista++;
    if (this.erroresConsecutivos >= 2) {
      this.longitudActual = Math.max(this.longitudActual - 1, 2);
      this.erroresConsecutivos = 0;
    }
    // CA-03: resalta el elemento correcto en verde por 1.5s
    this.elementoCorrectoHighlight = elementoCorrecto;
    this.timers.push(setTimeout(() => { this.elementoCorrectoHighlight = -1; this.cdr.detectChanges(); }, 1500));

    this.feedback.showIncorrect(undefined, this.fallosParaPista >= 3); // CA-03/CA-04
    this.estado = 'feedback';
    this.cdr.detectChanges();

    const speechDone = this.setMascota('encourage');
    const minPausa   = this.crearPausaCancelable(1400);

    Promise.all([speechDone, minPausa]).then(() => {
      if (this.abortado) return;
      if (this.rondas >= this.MAX_RONDAS) {
        this.estado = 'resultados'; this.sonarFanfare();
        const txt = (this.tituloFinal + '. ' + this.mensajeFinal).replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
        setTimeout(() => this.hablar(txt, 0.88, 1.1), 800);
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    });
  }

  // ── CA-06: skip de la animación de transición entre rondas ─────────────

  /** Crea una pausa que se resuelve sola tras `ms`, o antes si el niño hace clic para saltarla (<100ms). */
  private crearPausaCancelable(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setTimeout(resolve, ms);
      this.skipResolver = () => { clearTimeout(timer); resolve(); };
    });
  }

  saltarSiEsPosible(): void {
    if (this.estado === 'cuenta') {
      this.timers.forEach(t => clearTimeout(t));
      this.timers = [];
      this.mostrarSecuencia();
    } else if (this.estado === 'feedback' && this.skipResolver) {
      const resolver = this.skipResolver;
      this.skipResolver = null;
      resolver();
    }
  }

  onIncorrectShown(): void {
    // El feedback de error ya es visible; el resaltado del elemento correcto
    // se activó al mismo tiempo desde manejarError() (CA-03).
  }

  onHintRequested(): void {
    // CA-03: pista sin penalizar puntaje — resalta brevemente el próximo elemento esperado.
    this.fallosParaPista = 0;
    const esperado = this.secuencia[this.respuestaJugador.length];
    this.elementoPista = esperado;
    this.cdr.detectChanges();
    this.timers.push(setTimeout(() => { this.elementoPista = -1; this.cdr.detectChanges(); }, 700));
  }

  terminarSesion(): void {
    this.limpiarTimers();
    this.dispararConfeti();
    this.estado = 'resultados';
    this.sonarFanfare();
    this.cdr.detectChanges();
    setTimeout(() => this.hablar(this.tituloFinal + '. ' + this.mensajeFinal.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim(), 0.88, 1.1), 800);
  }

  volver(): void { this.router.navigate(['/nino/juegos']); }

  get puntuacion(): number {
    return this.rondas === 0 ? 0 : Math.round((this.aciertos / this.rondas) * 100);
  }
  get trofeoEmoji(): string {
    return this.puntuacion >= 85 ? '🏆' : this.puntuacion >= 65 ? '🥈' : this.puntuacion >= 40 ? '🥉' : '🌟';
  }
  get tituloFinal(): string {
    return this.puntuacion >= 85 ? '¡Memoria de élite!' : this.puntuacion >= 65 ? '¡Muy bien hecho!' : this.puntuacion >= 40 ? '¡Buen esfuerzo!' : '¡Sigue practicando!';
  }
  get mensajeFinal(): string {
    if (this.puntuacion >= 85) return `¡Alcanzaste secuencias de ${this.maxLongitud} elementos! Tu memoria de trabajo es excelente. 🧠✨`;
    if (this.puntuacion >= 65) return `Lograste secuencias de hasta ${this.maxLongitud} elementos. ¡Tu memoria está mejorando! 🌟`;
    if (this.puntuacion >= 40) return `La práctica fortalece tu cerebro. ¡Inténtalo de nuevo y supera tu récord! 💪`;
    return `¡No te rindas! Cada intento entrena tu memoria. ¡Yo sé que puedes! 💖`;
  }

  private setMascota(mood: Mood): Promise<void> {
    this.mascotMood = mood;
    const msgs = this.MASCOTA_MSGS[mood];
    this.mascotMsg = msgs[Math.floor(Math.random() * msgs.length)];
    this.mascotEmoji = '🦊';
    const textoVoz = this.mascotMsg.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
    return this.hablar(textoVoz);
  }

  private dispararConfeti(): void {
    this.confettiPieces = this.generarConfeti();
    this.showConfetti = true;
  }

  private generarConfeti(): ConfettiPiece[] {
    const colores = ['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#34d399','#fb923c','#e879f9'];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i, left: Math.random() * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 500, dur: 1400 + Math.random() * 800,
      size: 6 + Math.random() * 9,
    }));
  }

  private limpiarTimers(): void { this.abortado = true; this.timers.forEach(t => clearTimeout(t)); this.timers = []; }
}
