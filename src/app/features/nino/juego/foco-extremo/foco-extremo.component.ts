import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FocoExtremoService } from './foco-extremo.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { FocoExtremoConfig, Estimulo, ResultadoSesion, Nivel } from './foco-extremo.model';
import { MascotComponent, MascotMood } from '../../../../shared/components/mascot/mascot.component';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';
import { sinEmojis as sinEmojisUtil } from '../../../../shared/utils/tts-texto.util';

type Estado = 'inicio' | 'jugando' | 'completado';

@Component({
  selector: 'app-foco-extremo',
  standalone: true,
  imports: [CommonModule, MascotComponent],
  templateUrl: './foco-extremo.component.html',
  styleUrls: ['./foco-extremo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocoExtremoComponent implements OnInit, OnDestroy {
  estado: Estado = 'inicio';
  nivelActual: Nivel = 'FACIL';
  sonidoActivo = true;

  perfilId = 0;
  perfilNombre = '';

  private readonly JUEGO_ID = 2; // "Foco Extremo" en el seeder
  private sesionBackendId: number | null = null;
  private nivelFacilId: number | null = null;

  config: FocoExtremoConfig | null = null;

  estimuloActual: Estimulo | null = null;
  feedbackEstado: '' | 'ok' | 'error' = '';
  mostrandoObjetivo = false;

  private historial: Estimulo[] = [];
  private tiemposReaccion: number[] = [];
  aciertos = 0;
  omisiones = 0;
  falsasAlarmas = 0;
  racha = 0;
  mejorRacha = 0;

  sparklePiezas: { id: number; angle: number; dist: number; delay: number }[] = [];
  private sparkleId = 0;
  private sparkleTimeout: any = null;

  prepCountdown = 3;
  private prepCountdownInterval: any = null;

  tiempoRestante = 0;
  tiempoTotal = 0;
  private timerInterval: any = null;
  private endTime = 0;
  private audioCtx: AudioContext | null = null;
  private bgInterval: any = null;

  private estimuloTimeout: any = null;
  private prepTimeout: any = null;
  private profileSub?: Subscription;
  private cadenciaActual = 0;
  private ventana: ('acierto' | 'falsaAlarma' | 'omision' | 'inhibicion')[] = [];
  historialReciente: ('acierto' | 'falsaAlarma' | 'omision' | 'inhibicion')[] = [];
  seRedujoCadencia = false;
  private readonly VENTANA_TAM = 8;
  private readonly RATIO_ALARMA_LIMITE = 0.3;
  private readonly CADENCIA_MAX_MS = 2000;

  resultado: ResultadoSesion | null = null;
  nivelSugerido: Nivel | null = null;

  mascotMood: MascotMood = 'idle';
  mascotMsg = '¡Hola! Soy Leo 🦁 ¡Vamos a entrenar tu atención!';
  // ── Confetti ────────────────────────────────────────────────────────────
  confettiActivo = false;
  confettiPiezas = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ['#a78bfa', '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#c084fc', '#34d399', '#fb923c'][
      i % 8
    ],
    delay: Math.random() * 2,
    dur: 2.5 + Math.random() * 2,
    size: 8 + Math.random() * 8,
  }));

  private mascotTimer: any;

  /** Voz de Leo (TTS), independiente del control de sonido/efectos (sonidoActivo). */
  voiceEnabled = true;
  private leoVoice: SpeechSynthesisVoice | null = null;

  private readonly TIPS_IDLE = [
    '¡Presiona solo cuando veas tu objetivo!',
    '¡Si ves otro dibujo, no toques nada!',
    'Respira y mantén los ojos en la pantalla 👀',
    '¡No hay prisa, pero tampoco te distraigas!',
    '¡Tú controlas tus impulsos, tú decides!',
  ];

  setMascot(mood: MascotMood, msg: string, durMs = 1600): void {
    clearTimeout(this.mascotTimer);
    this.mascotMood = mood;
    this.mascotMsg = msg;
    if (mood !== 'idle') {
      this.mascotTimer = setTimeout(() => {
        const tip = this.TIPS_IDLE[Math.floor(Math.random() * this.TIPS_IDLE.length)];
        this.mascotMood = 'idle';
        this.mascotMsg = tip;
        this.cdr.markForCheck();
      }, durMs);
    }
  }

  constructor(
    private focoExtremoService: FocoExtremoService,
    private childProfileService: ChildProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sesionJuegoService: SesionJuegoService,
  ) {}

  ngOnInit(): void {
    this.profileSub = this.childProfileService.activeProfile$.subscribe((state) => {
      if (!state.profileId) {
        this.router.navigate(['/padre/perfiles/selector']);
        return;
      }
      this.perfilId = state.profileId;
      this.perfilNombre = state.profileName || 'Jugador';
    });
    // Cargar niveles y preseleccionar el recomendado por IA (CA-03)
    this.sesionJuegoService.obtenerNiveles(this.JUEGO_ID).subscribe({
      next: (niveles) => {
        this.nivelFacilId = niveles[0]?.id ?? null;
        if (this.perfilId) {
          this.sesionJuegoService
            .obtenerRecomendacion(this.perfilId, this.JUEGO_ID)
            .subscribe((rec) => {
              const match = rec?.nivelRecomendado?.id
                ? niveles.find((n) => n.id === rec.nivelRecomendado.id)
                : null;
              if (match) {
                this.nivelFacilId = match.id;
                if (rec!.nivelRecomendado.nivel) {
                  this.nivelActual = rec!.nivelRecomendado.nivel as Nivel;
                }
                this.cdr.detectChanges();
              }
            });
        }
      },
      error: () => {},
    });

    this.cargarVozLeo();
    this.speak('¡Hola! Soy Leo. Vamos a entrenar tu atención y tu autocontrol.');
  }

  ngOnDestroy(): void {
    this.detenerTimer();
    this.detenerCiclo();
    this.stopBgMusic();
    this.profileSub?.unsubscribe();
    clearTimeout(this.mascotTimer);
    window.speechSynthesis?.cancel();
    this.audioCtx?.close();
  }

  iniciarJuego(nivel: Nivel = this.nivelActual): void {
    this.detenerTimer();
    this.detenerCiclo();

    this.nivelActual = nivel;
    const config = this.focoExtremoService.getConfigLocal(nivel);
    this.config = config;
    this.cadenciaActual = config.cadenciaMs;
    this.tiempoRestante = config.duracionSegundos;
    this.tiempoTotal = config.duracionSegundos;

    this.historial = [];
    this.tiemposReaccion = [];
    this.aciertos = 0;
    this.omisiones = 0;
    this.falsasAlarmas = 0;
    this.racha = 0;
    this.mejorRacha = 0;
    this.sparklePiezas = [];
    this.ventana = [];
    this.historialReciente = [];
    this.seRedujoCadencia = false;
    this.resultado = null;
    this.nivelSugerido = null;
    this.estimuloActual = null;
    this.feedbackEstado = '';

    // Backend: iniciar sesión (CA-01)
    this.sesionBackendId = null;
    if (this.perfilId && this.nivelFacilId) {
      this.sesionJuegoService
        .iniciarSesion({
          perfilId: this.perfilId,
          juegoId: this.JUEGO_ID,
          nivelId: this.nivelFacilId,
        })
        .subscribe({
          next: (sesion) => {
            this.sesionBackendId = sesion.id ?? null;
            if (sesion.id) this.sesionJuegoService.comenzarTracking(sesion.id); // CA-04
          },
          error: () => {},
        });
    }

    this.estado = 'jugando';
    this.mostrandoObjetivo = true;
    this.setMascot(
      'excited',
      `¡Atención! Presiona solo cuando veas ${config.estimuloObjetivo}`,
      2200,
    );

    setTimeout(() => this.startBgMusic(), 200);
    this.iniciarTimer();

    this.prepCountdown = 3;
    this.prepCountdownInterval = setInterval(() => {
      this.prepCountdown = Math.max(1, this.prepCountdown - 1);
      this.cdr.markForCheck();
    }, 700);

    this.prepTimeout = setTimeout(() => {
      this.prepTimeout = null;
      clearInterval(this.prepCountdownInterval);
      this.prepCountdownInterval = null;
      this.mostrandoObjetivo = false;
      this.cicloEstimulos();
      this.cdr.markForCheck();
    }, 2200);
  }

  private cicloEstimulos(): void {
    if (this.estado !== 'jugando') return;
    this.evaluarEstimuloAnterior();
    if (this.estado !== 'jugando') return;

    const estimulo = this.generarEstimulo();
    this.historial.push(estimulo);
    this.estimuloActual = estimulo;
    this.feedbackEstado = '';
    this.sesionJuegoService.marcarElementoAparece(); // CA-08
    this.cdr.markForCheck();

    this.estimuloTimeout = setTimeout(() => this.cicloEstimulos(), this.cadenciaActual);
  }

  private generarEstimulo(): Estimulo {
    const config = this.config!;
    const esObjetivo = Math.random() >= config.ratioDistractor;
    const pool = config.poolDistractores;
    const simbolo = esObjetivo
      ? config.estimuloObjetivo
      : pool[Math.floor(Math.random() * pool.length)];

    return {
      id: this.historial.length,
      simbolo,
      tipo: esObjetivo ? 'objetivo' : 'distractor',
      timestampMostrado: Date.now(),
      respondido: false,
      tiempoReaccionMs: null,
    };
  }

  private evaluarEstimuloAnterior(): void {
    const previo = this.estimuloActual;
    if (!previo || previo.respondido) return;

    if (previo.tipo === 'objetivo') {
      this.omisiones++;
      this.racha = 0;
      this.registrarEnVentana('omision');
    } else {
      this.registrarEnVentana('inhibicion');
    }
  }

  @HostListener('window:keydown.space', ['$event'])
  onKey(event: any) {
    event.preventDefault();

    this.presionar();
  }

  presionar(event?: PointerEvent | MouseEvent): void {
    if (this.estado !== 'jugando' || !this.estimuloActual || this.estimuloActual.respondido) return;

    const estimulo = this.estimuloActual;
    estimulo.respondido = true;
    const tiempoReaccionMs = Date.now() - estimulo.timestampMostrado;
    estimulo.tiempoReaccionMs = tiempoReaccionMs;
    const esAcierto = estimulo.tipo === 'objetivo';

    // CA-07/08/09: trackClick con coordenadas (teclado → centro de pantalla)
    const cx = event?.clientX ?? window.innerWidth / 2;
    const cy = event?.clientY ?? window.innerHeight / 2;
    this.sesionJuegoService.trackClick(cx, cy, estimulo.simbolo, esAcierto);

    if (esAcierto) {
      this.aciertos++;
      this.tiemposReaccion.push(tiempoReaccionMs);
      this.feedbackEstado = 'ok';
      this.racha++;
      this.mejorRacha = Math.max(this.mejorRacha, this.racha);
      this.spawnSparkles();
      this.playAcierto();
      this.registrarEnVentana('acierto');
      this.setMascot(
        'celebrate',
        this.racha >= 5 ? `¡Racha de ${this.racha}! 🔥` : '¡Perfecto! ⚡',
      );
      this.sesionJuegoService.trackRespuestaMs(tiempoReaccionMs); // CA-05
    } else {
      this.falsasAlarmas++;
      this.feedbackEstado = 'error';
      this.racha = 0;
      this.playFalsaAlarma();
      this.registrarEnVentana('falsaAlarma');
      this.setMascot('encourage', '¡Cuidado! Ese no era tu objetivo 🚫');
    }
    this.cdr.markForCheck();
  }

  private spawnSparkles(): void {
    clearTimeout(this.sparkleTimeout);
    this.sparkleId++;
    const base = this.sparkleId * 100;
    this.sparklePiezas = Array.from({ length: 10 }, (_, i) => ({
      id: base + i,
      angle: (360 / 10) * i + Math.random() * 20,
      dist: 60 + Math.random() * 40,
      delay: Math.random() * 0.08,
    }));
    this.cdr.markForCheck();
    this.sparkleTimeout = setTimeout(() => {
      this.sparklePiezas = [];
      this.cdr.markForCheck();
    }, 550);
  }

  private registrarEnVentana(
    resultado: 'acierto' | 'falsaAlarma' | 'omision' | 'inhibicion',
  ): void {
    this.historialReciente.push(resultado);
    if (this.historialReciente.length > 6) this.historialReciente.shift();

    this.ventana.push(resultado);
    if (this.ventana.length < this.VENTANA_TAM) return;

    const distractoresEnVentana = this.ventana.filter(
      (r) => r === 'falsaAlarma' || r === 'inhibicion',
    );
    const falsasEnVentana = this.ventana.filter((r) => r === 'falsaAlarma').length;
    const ratioAlarma = distractoresEnVentana.length
      ? falsasEnVentana / distractoresEnVentana.length
      : 0;

    if (ratioAlarma > this.RATIO_ALARMA_LIMITE && this.cadenciaActual < this.CADENCIA_MAX_MS) {
      this.cadenciaActual = Math.min(this.CADENCIA_MAX_MS, Math.round(this.cadenciaActual * 1.25));
      this.seRedujoCadencia = true;
      this.setMascot('encourage', '¡Vamos más despacio para que puedas pensar! 🐢', 2200);
    }
    this.ventana = [];
  }

  private iniciarTimer(): void {
    this.endTime = Date.now() + this.tiempoTotal * 1000;
    this.timerInterval = setInterval(() => {
      const restante = Math.ceil((this.endTime - Date.now()) / 1000);
      this.tiempoRestante = Math.max(0, restante);
      if (this.tiempoRestante <= 10 && this.tiempoRestante > 0 && this.mascotMood === 'idle') {
        this.setMascot('warning', '⏰ ¡Ya casi terminamos, mantén el foco!', 3000);
      }
      if (this.tiempoRestante <= 0) {
        this.detenerTimer();
        this.finalizarSesion();
      }
      this.cdr.markForCheck();
    }, 250);
  }

  private detenerTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private detenerCiclo(): void {
    if (this.estimuloTimeout) {
      clearTimeout(this.estimuloTimeout);
      this.estimuloTimeout = null;
    }
    if (this.prepTimeout) {
      clearTimeout(this.prepTimeout);
      this.prepTimeout = null;
    }
    if (this.prepCountdownInterval) {
      clearInterval(this.prepCountdownInterval);
      this.prepCountdownInterval = null;
    }
    if (this.sparkleTimeout) {
      clearTimeout(this.sparkleTimeout);
      this.sparkleTimeout = null;
    }
  }

  private finalizarSesion(): void {
    this.evaluarEstimuloAnterior();
    this.detenerCiclo();
    this.stopBgMusic();
    this.estado = 'completado';
    this.estimuloActual = null;
    this.confettiActivo = true;
    this.resultado = this.calcularResultado();
    this.playFinalizado();

    // CA-03: fire-and-forget con 3 reintentos + localStorage fallback
    if (this.sesionBackendId) {
      const puntaje = this.resultado.indicePrecision;
      const intentos = this.aciertos + this.falsasAlarmas;
      this.sesionJuegoService.finalizarSesion(
        this.sesionBackendId,
        puntaje,
        intentos,
        this.aciertos,
      );
      this.sesionBackendId = null;
    }

    const buenDesempeno =
      this.resultado.indicePrecision >= 75 && this.resultado.indiceControlImpulsos >= 75;
    if (buenDesempeno) {
      this.setMascot('celebrate', '¡Excelente atención! 🌟 ¡Lo lograste!', 5000);
      this.speak('¡Excelente trabajo! Tu atención fue increíble');
      const siguiente = this.focoExtremoService.siguienteNivel(this.nivelActual);
      if (siguiente) this.nivelSugerido = siguiente;
    } else {
      this.setMascot('encourage', '¡Buen esfuerzo! Cada partida te hace más fuerte 💪', 5000);
      this.speak('¡Buen intento! Sigue practicando');
    }
  }

  private calcularResultado(): ResultadoSesion {
    const totalObjetivos = this.historial.filter((e) => e.tipo === 'objetivo').length;
    const totalDistractores = this.historial.length - totalObjetivos;
    const tiempoReaccionPromedioMs = this.tiemposReaccion.length
      ? Math.round(this.tiemposReaccion.reduce((a, b) => a + b, 0) / this.tiemposReaccion.length)
      : null;

    return {
      totalEstimulos: this.historial.length,
      totalObjetivos,
      totalDistractores,
      aciertos: this.aciertos,
      omisiones: this.omisiones,
      falsasAlarmas: this.falsasAlarmas,
      tiempoReaccionPromedioMs,
      indicePrecision: totalObjetivos ? Math.round((this.aciertos / totalObjetivos) * 100) : 0,
      indiceControlImpulsos: totalDistractores
        ? Math.round(((totalDistractores - this.falsasAlarmas) / totalDistractores) * 100)
        : 100,
      cadenciaFinalMs: this.cadenciaActual,
      seRedujoCadencia: this.seRedujoCadencia,
      mejorRacha: this.mejorRacha,
    };
  }

  jugarDeNuevo(): void {
    this.iniciarJuego(this.nivelActual);
  }
  subirNivel(): void {
    if (this.nivelSugerido) this.iniciarJuego(this.nivelSugerido);
  }
  salirConResultados(): void {
    this.finalizarSesion();
  }

  volverInicio(): void {
    this.detenerTimer();
    this.detenerCiclo();
    this.stopBgMusic();
    this.estado = 'inicio';
    this.confettiActivo = false;
    this.config = null;
    this.estimuloActual = null;
  }
  volverLobby(): void {
    this.detenerTimer();
    this.detenerCiclo();
    this.stopBgMusic();
    this.router.navigate(['/nino/juegos']);
  }
  toggleSonido(): void {
    this.sonidoActivo = !this.sonidoActivo;
    if (!this.sonidoActivo) this.stopBgMusic();
    else if (this.estado === 'jugando') this.startBgMusic();
  }

  private getAudio(): AudioContext | null {
    if (!this.sonidoActivo) return null;
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private playTone(
    freq: number,
    dur: number,
    type: OscillatorType = 'sine',
    vol = 0.25,
    delay = 0,
  ): void {
    const ctx = this.getAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.05);
    } catch {}
  }

  private startBgMusic(): void {
    const ctx = this.getAudio();
    if (!ctx) return;
    this.stopBgMusic();

    const notas = [262, 294, 330, 392, 440, 392, 330, 294];
    const durNota = 0.45;
    const loopDur = notas.length * durNota * 1000;

    const tocarMelodia = () => {
      const c = this.getAudio();
      if (!c) return;
      notas.forEach((freq, i) => {
        try {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.connect(gain);
          gain.connect(c.destination);
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const t = c.currentTime + i * durNota;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
          gain.gain.linearRampToValueAtTime(0, t + durNota - 0.05);
          osc.start(t);
          osc.stop(t + durNota);
        } catch {}
      });
    };

    tocarMelodia();
    this.bgInterval = setInterval(tocarMelodia, loopDur);
  }

  private stopBgMusic(): void {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
  }

  private playAcierto(): void {
    this.playTone(523, 0.1, 'sine', 0.3);
    this.playTone(784, 0.15, 'sine', 0.3, 0.1);
  }

  private playFalsaAlarma(): void {
    this.playTone(200, 0.2, 'sawtooth', 0.12);
  }

  private playFinalizado(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.playTone(f, 0.28, 'sine', 0.3, i * 0.13));
  }

  toggleVoz(): void {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) window.speechSynthesis?.cancel();
  }

  private cargarVozLeo(): void {
    const seleccionar = () => {
      const voces = window.speechSynthesis?.getVoices() ?? [];
      // Prioridad: voces en español disponibles en Windows/Mac/Android (mismo orden que Koby/Tigre/Buddy/Bongo)
      const candidatas = [
        voces.find((v) => v.name.includes('Jorge')),
        voces.find((v) => v.name.includes('Diego')),
        voces.find((v) => v.name.includes('Juan')),
        voces.find((v) => v.lang === 'es-MX'),
        voces.find((v) => v.lang === 'es-ES'),
        voces.find((v) => v.lang.startsWith('es')),
      ];
      this.leoVoice = candidatas.find((v) => !!v) ?? null;
    };
    if (window.speechSynthesis?.getVoices().length) {
      seleccionar();
    } else {
      window.speechSynthesis?.addEventListener('voiceschanged', seleccionar, { once: true });
    }
  }

  private sinEmojis(texto: string): string {
    return sinEmojisUtil(texto);
  }

  private speak(texto: string): void {
    if (!this.voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(this.sinEmojis(texto));
      if (this.leoVoice) {
        utt.voice = this.leoVoice;
        utt.lang = this.leoVoice.lang;
      } else {
        utt.lang = 'es-ES';
      }
      utt.rate = 0.92;
      utt.pitch = 1.05;
      utt.volume = 0.9;
      window.speechSynthesis.speak(utt);
    } catch {}
  }

  get timerPorcentaje(): number {
    return this.tiempoTotal ? (this.tiempoRestante / this.tiempoTotal) * 100 : 100;
  }

  get timerColor(): string {
    if (this.timerPorcentaje > 50) return '#F472B6';
    if (this.timerPorcentaje > 25) return '#E879F9';
    return '#FF6B6B';
  }

  formatTiempo(s: number): string {
    return `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  get nivelLabel(): string {
    return (
      { FACIL: 'Fácil', MEDIO: 'Medio', DIFICIL: 'Difícil', EXPERTO: 'Experto' }[
        this.nivelActual
      ] ?? this.nivelActual
    );
  }

  get nivelIcono(): string {
    return { FACIL: '⭐', MEDIO: '🔥', DIFICIL: '💎', EXPERTO: '👑' }[this.nivelActual] ?? '⭐';
  }

  get rachaGlow(): number {
    return Math.min(this.racha, 6);
  }
}
