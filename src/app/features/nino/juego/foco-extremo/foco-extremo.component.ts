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

  config: FocoExtremoConfig | null = null;

  estimuloActual: Estimulo | null = null;
  feedbackEstado: '' | 'ok' | 'error' = '';
  mostrandoObjetivo = false;

  private historial: Estimulo[] = [];
  private tiemposReaccion: number[] = [];
  aciertos = 0;
  omisiones = 0;
  falsasAlarmas = 0;

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
  seRedujoCadencia = false;
  private readonly VENTANA_TAM = 8;
  private readonly RATIO_ALARMA_LIMITE = 0.3;
  private readonly CADENCIA_MAX_MS = 2000;

  resultado: ResultadoSesion | null = null;
  nivelSugerido: Nivel | null = null;

  mascotMood: MascotMood = 'idle';
  mascotMsg = '¡Hola! Soy Uni 🦄 ¡Vamos a entrenar tu atención!';
  private mascotTimer: any;

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
    this.ventana = [];
    this.seRedujoCadencia = false;
    this.resultado = null;
    this.nivelSugerido = null;
    this.estimuloActual = null;
    this.feedbackEstado = '';

    this.estado = 'jugando';
    this.mostrandoObjetivo = true;
    this.setMascot(
      'excited',
      `¡Atención! Presiona solo cuando veas ${config.estimuloObjetivo}`,
      2200,
    );

    setTimeout(() => this.startBgMusic(), 200);
    this.iniciarTimer();

    this.prepTimeout = setTimeout(() => {
      this.prepTimeout = null;
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

  presionar(): void {
    if (this.estado !== 'jugando' || !this.estimuloActual || this.estimuloActual.respondido) return;

    const estimulo = this.estimuloActual;
    estimulo.respondido = true;
    const tiempoReaccionMs = Date.now() - estimulo.timestampMostrado;
    estimulo.tiempoReaccionMs = tiempoReaccionMs;

    if (estimulo.tipo === 'objetivo') {
      this.aciertos++;
      this.tiemposReaccion.push(tiempoReaccionMs);
      this.feedbackEstado = 'ok';
      this.playAcierto();
      this.registrarEnVentana('acierto');
      this.setMascot('celebrate', '¡Perfecto! ⚡');
    } else {
      this.falsasAlarmas++;
      this.feedbackEstado = 'error';
      this.playFalsaAlarma();
      this.registrarEnVentana('falsaAlarma');
      this.setMascot('encourage', '¡Cuidado! Ese no era tu objetivo 🚫');
    }
    this.cdr.markForCheck();
  }


  private registrarEnVentana(
    resultado: 'acierto' | 'falsaAlarma' | 'omision' | 'inhibicion',
  ): void {
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
  }


  private finalizarSesion(): void {
    this.evaluarEstimuloAnterior();
    this.detenerCiclo();
    this.stopBgMusic();
    this.estado = 'completado';
    this.estimuloActual = null;
    this.resultado = this.calcularResultado();
    this.playFinalizado();

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
    };
  }


  jugarDeNuevo(): void {
    this.iniciarJuego(this.nivelActual);
  }
  subirNivel(): void {
    if (this.nivelSugerido) this.iniciarJuego(this.nivelSugerido);
  }
  volverInicio(): void {
    this.detenerTimer();
    this.detenerCiclo();
    this.stopBgMusic();
    this.estado = 'inicio';
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

  private speak(texto: string): void {
    if (!this.sonidoActivo) return;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(texto);
      utt.lang = 'es-ES';
      utt.rate = 0.88;
      utt.pitch = 1.15;
      utt.volume = 0.9;
      const voces = window.speechSynthesis.getVoices();
      const vozEs = voces.find((v) => v.lang.startsWith('es'));
      if (vozEs) utt.voice = vozEs;
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
}
