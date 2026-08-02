import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MascotComponent, MascotMood } from '../../../../shared/components/mascot/mascot.component';
import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { GameFeedbackService, NivelVolumen } from '../../../../shared/game-feedback/game-feedback.service';
import { VolumeControlComponent } from '../../../../shared/game-feedback/volume-control.component';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';

import {
  Estado,
  EstimuloColor,
  EstimuloConteo,
  IniciarMaratonResponse,
  MaratonResultadoResponse,
  NivelMaraton,
  OpcionColor,
  RegistrarRondaRequest,
} from './maraton-mental.model';
import { MaratonMentalService } from './maraton-mental.service';
import {
  generarEstimuloColor,
  generarEstimuloConteo,
  reducirConfigColor,
  reducirConfigConteo,
} from './maraton-mental.utils';

@Component({
  selector: 'app-maraton-mental',
  standalone: true,
  imports: [CommonModule, MascotComponent, GameFeedbackComponent, VolumeControlComponent],
  templateUrl: './maraton-mental.component.html',
  styleUrls: ['./maraton-mental.component.css'],
})
export class MaratonMentalComponent implements OnInit, OnDestroy {
  // ── Estado general ────────────────────────────────────────────────────
  estado: Estado = 'inicio';
  nivelActual: NivelMaraton = 'FACIL';
  perfilId = 0;
  perfilNombre = '';
  sesionId: number | null = null;
  errorApi = '';

  config: IniciarMaratonResponse | null = null;

  readonly niveles: { id: NivelMaraton; label: string; emoji: string; desc: string }[] = [
    { id: 'FACIL', label: 'Fácil', emoji: '🟢', desc: '2-5 objetos · 3 colores · 8 rondas duales' },
    { id: 'MEDIO', label: 'Medio', emoji: '🟡', desc: '3-7 objetos · 4 colores · 10 rondas duales' },
    { id: 'DIFICIL', label: 'Difícil', emoji: '🟠', desc: '4-9 objetos · 5 colores · 12 rondas duales' },
    { id: 'EXPERTO', label: 'Experto', emoji: '🔴', desc: '5-12 objetos · 6 colores · 14 rondas duales' },
  ];

  // ── Calibración (fases individuales) ─────────────────────────────────
  calibracionFase: 'A' | 'B' = 'A';
  calibracionRondaActual = 0;
  estimuloConteo: EstimuloConteo | null = null;
  estimuloColor: EstimuloColor | null = null;
  private respondiendoCalibracion = false;

  // ── Fase dual (pantalla dividida) ────────────────────────────────────
  rondaDualActual = 0;
  estimuloConteoDual: EstimuloConteo | null = null;
  estimuloColorDual: EstimuloColor | null = null;
  tareaARespondidaRonda = false;
  tareaACorrectaRonda = false;
  tareaBRespondidaRonda = false;
  tareaBCorrectaRonda = false;
  private tareaATiempoRonda: number | null = null;
  private tareaBTiempoRonda: number | null = null;
  private rondaDualCerrada = false;

  // CA-05: una vez el motor detecta costo dual > 40% en una tarea, queda
  // reducida por el resto de la sesión (no se revierte a mitad de partida).
  reducirTareaA = false;
  reducirTareaB = false;
  avisoAjusteMsg = '';

  tiempoRestanteMs = 0;
  tiempoRondaTotalMs = 0;

  get tiempoRestantePct(): number {
    return this.tiempoRondaTotalMs ? (this.tiempoRestanteMs / this.tiempoRondaTotalMs) * 100 : 100;
  }

  // ── Resultado final ───────────────────────────────────────────────────
  resultadoFinal: MaratonResultadoResponse | null = null;
  puntaje = 0;
  nivelSugerido: NivelMaraton | null = null;

  confettiActivo = false;
  confettiPiezas = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.6,
    duration: 2.2 + Math.random() * 2,
    emoji: ['🎉', '🧠', '⚡', '✨', '🎊', '⭐'][i % 6],
  }));

  // ── Contadores para la capa genérica de métricas (CA-01 a CA-09) ─────
  private intentosTotales = 0;
  private aciertosTotales = 0;
  private inicioSesionMs = 0;
  private inicioEstimuloMs = 0;
  private inicioRondaDualMs = 0;

  // ── Mascota (Koby) ────────────────────────────────────────────────────
  mascotMood: MascotMood = 'idle';
  mascotMsg = '¡Hola! Soy Koby 🐨. Vamos a entrenar tu atención dividida.';
  private mascotTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Volumen (CA-05 del módulo compartido de feedback) ────────────────
  volumenActual: NivelVolumen = 75;

  @ViewChild('feedbackA') feedbackA?: GameFeedbackComponent;
  @ViewChild('feedbackB') feedbackB?: GameFeedbackComponent;

  private readonly frasesCelebracion = ['¡Genial!', '¡Excelente!', '¡Muy bien!', '¡Perfecto!', '¡Sigue así!'];
  private readonly frasesAliento = ['¡Casi!', '¡Sigue intentando!', '¡Tú puedes!', '¡Vamos de nuevo!'];

  private calibracionTimeout: ReturnType<typeof setTimeout> | null = null;
  private roundTimeout: ReturnType<typeof setTimeout> | null = null;
  private roundCountdownInterval: ReturnType<typeof setInterval> | null = null;
  private avanceTimeout: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;
  private readonly destruir$ = new Subject<void>();

  constructor(
    private readonly service: MaratonMentalService,
    private readonly profileService: ChildProfileService,
    private readonly router: Router,
    private readonly sesionJuegoService: SesionJuegoService,
    private readonly feedbackService: GameFeedbackService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.profileService.activeProfile$.pipe(takeUntil(this.destruir$)).subscribe(state => {
      if (!state.profileId) {
        this.router.navigate(['/padre/perfiles/selector']);
        return;
      }
      this.perfilId = state.profileId;
      this.perfilNombre = state.profileName || 'Jugador';
      this.volumenActual = (state.profileVolumen ?? 75) as NivelVolumen;
      this.feedbackService.setVolumen(this.volumenActual);
      this.detectarCambios();
    });
  }

  // Este proyecto corre Angular SIN zone.js (no está en package.json ni en los
  // polyfills). Eso significa que los cambios de estado hechos dentro de
  // setTimeout/setInterval/subscribe NO refrescan la pantalla solos: hay que
  // pedirle explícitamente a Angular que revise los cambios. Este helper lo
  // hace de forma segura (se ignora si la vista ya fue destruida).
  private detectarCambios(): void {
    try {
      this.cdr.detectChanges();
    } catch {
      // La vista ya no existe (el niño salió del juego mientras un timer disparaba).
    }
  }

  // setTimeout/setInterval que además avisan a Angular que debe re-renderizar
  // al terminar (o en cada tick, para el interval).
  private setTimeoutCd(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      fn();
      this.detectarCambios();
    }, ms);
  }

  private setIntervalCd(fn: () => void, ms: number): ReturnType<typeof setInterval> {
    return setInterval(() => {
      fn();
      this.detectarCambios();
    }, ms);
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
    this.limpiarTemporizadores();
    if (this.audioCtx && this.audioCtx.state !== 'closed') void this.audioCtx.close();
    window.speechSynthesis?.cancel();
  }

  // Helper para el template: dibuja N objetos en la grilla de conteo.
  arrayDe(n: number): number[] {
    return Array.from({ length: Math.max(0, n) }, (_, i) => i);
  }

  // ── Volumen ────────────────────────────────────────────────────────────
  onVolumenChange(v: NivelVolumen): void {
    this.volumenActual = v;
    this.feedbackService.setVolumen(v);
    if (this.perfilId) this.profileService.updateVolumen(this.perfilId, v).subscribe();
  }

  // ── Inicio ─────────────────────────────────────────────────────────────
  seleccionarNivel(nivel: NivelMaraton): void {
    this.nivelActual = nivel;
  }

  iniciarJuego(nivel: NivelMaraton = this.nivelActual): void {
    if (!this.perfilId) {
      this.errorApi = 'No hay un perfil infantil activo. Selecciona un perfil antes de iniciar.';
      return;
    }

    this.limpiarTemporizadores();
    this.nivelActual = nivel;
    this.estado = 'cargando';
    this.errorApi = '';
    this.resultadoFinal = null;
    this.confettiActivo = false;
    this.intentosTotales = 0;
    this.aciertosTotales = 0;
    this.reducirTareaA = false;
    this.reducirTareaB = false;
    this.avisoAjusteMsg = '';
    this.inicioSesionMs = Date.now();

    this.service
      .iniciarSesion(this.perfilId, nivel)
      .pipe(takeUntil(this.destruir$))
      .subscribe({
        next: response => {
          this.config = response;
          this.sesionId = response.sesionId;
          this.sesionJuegoService.comenzarTracking(response.sesionId);
          this.iniciarCalibracion('A');
          this.detectarCambios();
        },
        error: error => {
          console.error('Error al iniciar Maratón Mental:', error);
          this.sesionId = null;
          this.errorApi = 'No se pudo conectar con el backend. Verifica que Spring Boot esté ejecutándose.';
          this.estado = 'inicio';
          this.detectarCambios();
        },
      });
  }

  // ── Calibración individual (CA-04: línea base por tarea) ──────────────
  private iniciarCalibracion(fase: 'A' | 'B'): void {
    this.calibracionFase = fase;
    this.calibracionRondaActual = 0;
    this.estado = fase === 'A' ? 'calibracion_a' : 'calibracion_b';
    this.setMascot(
      'excited',
      fase === 'A'
        ? '¡Primero practiquemos "Contar Objetos" tú solito! 🔢'
        : '¡Ahora practiquemos "Identificar Color" tú solito! 🎨',
      2600,
    );
    this.siguienteEstimuloCalibracion();
  }

  private siguienteEstimuloCalibracion(): void {
    if (!this.config) return;
    this.calibracionRondaActual++;
    this.respondiendoCalibracion = false;

    if (this.calibracionFase === 'A') {
      this.estimuloConteo = generarEstimuloConteo(
        this.config.objetosMin,
        this.config.objetosMax,
        this.config.opcionesConteo,
      );
    } else {
      this.estimuloColor = generarEstimuloColor(this.config.opcionesColor);
    }

    this.inicioEstimuloMs = Date.now();
    this.sesionJuegoService.marcarElementoAparece();
    if (this.calibracionTimeout) clearTimeout(this.calibracionTimeout);
    this.calibracionTimeout = this.setTimeoutCd(() => this.onTimeoutCalibracion(), this.config.tiempoRondaMs);
  }

  responderCalibracionConteo(valor: number): void {
    if (this.estado !== 'calibracion_a' || this.respondiendoCalibracion || !this.estimuloConteo) return;
    this.resolverCalibracion(valor === this.estimuloConteo.cantidad, false);
  }

  responderCalibracionColor(opcion: OpcionColor): void {
    if (this.estado !== 'calibracion_b' || this.respondiendoCalibracion || !this.estimuloColor) return;
    this.resolverCalibracion(opcion.id === this.estimuloColor.objetivo.id, false);
  }

  private onTimeoutCalibracion(): void {
    if (this.respondiendoCalibracion) return;
    this.resolverCalibracion(false, true);
  }

  private resolverCalibracion(correcta: boolean, fueTimeout: boolean): void {
    this.respondiendoCalibracion = true;
    if (this.calibracionTimeout) clearTimeout(this.calibracionTimeout);

    const tiempoMs = fueTimeout ? null : Date.now() - this.inicioEstimuloMs;
    if (tiempoMs !== null) this.sesionJuegoService.trackRespuestaMs(tiempoMs);
    this.intentosTotales++;
    if (correcta) this.aciertosTotales++;

    const feedback = this.calibracionFase === 'A' ? this.feedbackA : this.feedbackB;
    if (correcta) {
      feedback?.showCorrect(this.frasesCelebracion[Math.floor(Math.random() * this.frasesCelebracion.length)]);
      this.playCorrecto();
    } else {
      feedback?.showIncorrect(fueTimeout ? '¡Se acabó el tiempo! Sigamos' : undefined);
      this.playIncorrecto();
    }
    this.setMascot(
      correcta ? 'celebrate' : 'encourage',
      correcta
        ? this.frasesCelebracion[Math.floor(Math.random() * this.frasesCelebracion.length)]
        : this.frasesAliento[Math.floor(Math.random() * this.frasesAliento.length)],
      1200,
    );

    if (this.sesionId !== null) {
      const req: RegistrarRondaRequest = {
        numeroRonda: this.calibracionRondaActual,
        fase: this.calibracionFase === 'A' ? 'CALIBRACION_A' : 'CALIBRACION_B',
        tareaARespondida: this.calibracionFase === 'A',
        tareaACorrecta: this.calibracionFase === 'A' ? correcta : false,
        tareaATiempoRespuestaMs: this.calibracionFase === 'A' ? tiempoMs : null,
        tareaBRespondida: this.calibracionFase === 'B',
        tareaBCorrecta: this.calibracionFase === 'B' ? correcta : false,
        tareaBTiempoRespuestaMs: this.calibracionFase === 'B' ? tiempoMs : null,
        nivel: this.nivelActual,
      };
      this.service.registrarRonda(this.sesionId, req).subscribe({ error: () => {} });
    }

    this.avanceTimeout = this.setTimeoutCd(() => {
      const totalCalibracion = this.config?.rondasCalibracionPorTarea ?? 3;
      if (this.calibracionRondaActual < totalCalibracion) {
        this.siguienteEstimuloCalibracion();
      } else if (this.calibracionFase === 'A') {
        this.iniciarCalibracion('B');
      } else {
        this.iniciarTransicionDual();
      }
    }, 900);
  }

  // ── Transición a fase dual ─────────────────────────────────────────────
  private iniciarTransicionDual(): void {
    this.estado = 'transicion_dual';
    this.setMascot('excited', '¡Muy bien! Ahora las DOS tareas al mismo tiempo 🧠⚡', 2600);
    this.playTransicion();
    this.hablar('¡Ahora las dos tareas al mismo tiempo!');
    this.avanceTimeout = this.setTimeoutCd(() => this.iniciarFaseDual(), 2800);
  }

  // ── Fase dual (CA-01/02/03/05) ─────────────────────────────────────────
  private iniciarFaseDual(): void {
    this.estado = 'dual';
    this.rondaDualActual = 0;
    this.siguienteRondaDual();
  }

  private siguienteRondaDual(): void {
    if (!this.config) return;
    this.rondaDualActual++;
    this.rondaDualCerrada = false;

    const cfgA = this.reducirTareaA
      ? reducirConfigConteo(this.config.objetosMin, this.config.objetosMax, this.config.opcionesConteo)
      : { objetosMin: this.config.objetosMin, objetosMax: this.config.objetosMax, opciones: this.config.opcionesConteo };
    this.estimuloConteoDual = generarEstimuloConteo(cfgA.objetosMin, cfgA.objetosMax, cfgA.opciones);

    const opcionesColorEfectivas = this.reducirTareaB
      ? reducirConfigColor(this.config.opcionesColor)
      : this.config.opcionesColor;
    this.estimuloColorDual = generarEstimuloColor(opcionesColorEfectivas);

    this.tareaARespondidaRonda = false;
    this.tareaACorrectaRonda = false;
    this.tareaATiempoRonda = null;
    this.tareaBRespondidaRonda = false;
    this.tareaBCorrectaRonda = false;
    this.tareaBTiempoRonda = null;

    this.inicioRondaDualMs = Date.now();
    this.sesionJuegoService.marcarElementoAparece();
    this.tiempoRondaTotalMs = this.config.tiempoRondaMs;
    this.tiempoRestanteMs = this.config.tiempoRondaMs;

    if (this.roundCountdownInterval) clearInterval(this.roundCountdownInterval);
    if (this.roundTimeout) clearTimeout(this.roundTimeout);

    this.roundCountdownInterval = this.setIntervalCd(() => {
      this.tiempoRestanteMs = Math.max(0, this.tiempoRondaTotalMs - (Date.now() - this.inicioRondaDualMs));
      if (this.tiempoRestanteMs <= 0) this.finalizarRondaDual();
    }, 100);
  }

  responderDualConteo(valor: number, event?: MouseEvent): void {
    if (this.estado !== 'dual' || this.tareaARespondidaRonda || !this.estimuloConteoDual) return;
    this.tareaARespondidaRonda = true;
    this.tareaACorrectaRonda = valor === this.estimuloConteoDual.cantidad;
    this.tareaATiempoRonda = Date.now() - this.inicioRondaDualMs;
    this.sesionJuegoService.trackRespuestaMs(this.tareaATiempoRonda);
    this.intentosTotales++;
    if (this.tareaACorrectaRonda) this.aciertosTotales++;

    if (this.tareaACorrectaRonda) { this.feedbackA?.showCorrect(); this.playCorrecto(); }
    else { this.feedbackA?.showIncorrect(); this.playIncorrecto(); }

    this.sesionJuegoService.trackClick(
      event?.clientX ?? 0,
      event?.clientY ?? 0,
      'contar-objetos',
      this.tareaACorrectaRonda,
    );
    this.comprobarRondaCompleta();
  }

  responderDualColor(opcion: OpcionColor, event?: MouseEvent): void {
    if (this.estado !== 'dual' || this.tareaBRespondidaRonda || !this.estimuloColorDual) return;
    this.tareaBRespondidaRonda = true;
    this.tareaBCorrectaRonda = opcion.id === this.estimuloColorDual.objetivo.id;
    this.tareaBTiempoRonda = Date.now() - this.inicioRondaDualMs;
    this.sesionJuegoService.trackRespuestaMs(this.tareaBTiempoRonda);
    this.intentosTotales++;
    if (this.tareaBCorrectaRonda) this.aciertosTotales++;

    if (this.tareaBCorrectaRonda) { this.feedbackB?.showCorrect(); this.playCorrecto(); }
    else { this.feedbackB?.showIncorrect(); this.playIncorrecto(); }

    this.sesionJuegoService.trackClick(
      event?.clientX ?? 0,
      event?.clientY ?? 0,
      'identificar-color',
      this.tareaBCorrectaRonda,
    );
    this.comprobarRondaCompleta();
  }

  private comprobarRondaCompleta(): void {
    if (this.tareaARespondidaRonda && this.tareaBRespondidaRonda) {
      if (this.roundCountdownInterval) clearInterval(this.roundCountdownInterval);
      if (this.roundTimeout) clearTimeout(this.roundTimeout);
      this.avanceTimeout = this.setTimeoutCd(() => this.finalizarRondaDual(), 500);
    }
  }

  private finalizarRondaDual(): void {
    if (this.rondaDualCerrada) return;
    this.rondaDualCerrada = true;
    if (this.roundCountdownInterval) clearInterval(this.roundCountdownInterval);
    if (this.roundTimeout) clearTimeout(this.roundTimeout);

    // CA-08: el tiempo se acabó sin que el niño respondiera esa tarea = omisión (cuenta como fallo).
    if (!this.tareaARespondidaRonda) { this.feedbackA?.showIncorrect('¡Se acabó el tiempo!'); this.intentosTotales++; }
    if (!this.tareaBRespondidaRonda) { this.feedbackB?.showIncorrect('¡Se acabó el tiempo!'); this.intentosTotales++; }

    if (this.sesionId !== null) {
      const req: RegistrarRondaRequest = {
        numeroRonda: this.rondaDualActual,
        fase: 'DUAL',
        tareaARespondida: this.tareaARespondidaRonda,
        tareaACorrecta: this.tareaACorrectaRonda,
        tareaATiempoRespuestaMs: this.tareaATiempoRonda,
        tareaBRespondida: this.tareaBRespondidaRonda,
        tareaBCorrecta: this.tareaBCorrectaRonda,
        tareaBTiempoRespuestaMs: this.tareaBTiempoRonda,
        nivel: this.nivelActual,
      };
      this.service.registrarRonda(this.sesionId, req).subscribe({
        next: resp => {
          // CA-05: latch — una vez reducida, la tarea se mantiene reducida el resto de la sesión.
          if (resp.reducirTareaA && !this.reducirTareaA) {
            this.reducirTareaA = true;
            this.avisoAjusteMsg = 'Vamos a facilitar un poquito "Contar Objetos" para ayudarte 💪';
            this.setMascot('encourage', this.avisoAjusteMsg, 2600);
          }
          if (resp.reducirTareaB && !this.reducirTareaB) {
            this.reducirTareaB = true;
            this.avisoAjusteMsg = 'Vamos a facilitar un poquito "Identificar Color" para ayudarte 💪';
            this.setMascot('encourage', this.avisoAjusteMsg, 2600);
          }
          this.detectarCambios();
        },
        error: () => {},
      });
    }

    this.avanceTimeout = this.setTimeoutCd(() => {
      const totalDuales = this.config?.rondasDuales ?? 8;
      if (this.rondaDualActual < totalDuales) {
        this.siguienteRondaDual();
      } else {
        this.finalizarJuego();
      }
    }, 700);
  }

  // ── Finalizar ──────────────────────────────────────────────────────────
  private finalizarJuego(): void {
    this.estado = 'completado';
    this.confettiActivo = true;
    this.playCompletado();

    if (this.sesionId === null) return;
    const tiempoTotalMs = Math.max(0, Date.now() - this.inicioSesionMs);

    // CA-03: capa genérica de métricas (fire-and-forget, no bloquea la pantalla de resultados)
    this.sesionJuegoService.finalizarSesion(this.sesionId, this.puntaje, this.intentosTotales, this.aciertosTotales);

    this.service
      .finalizarSesion(this.sesionId, { nivelFinal: this.nivelActual, tiempoTotalMs })
      .pipe(takeUntil(this.destruir$))
      .subscribe({
        next: resultado => {
          this.resultadoFinal = resultado;
          this.puntaje = resultado.puntaje;
          this.nivelSugerido = resultado.nivelSugerido;
          this.hablar('¡Excelente trabajo entrenando tu atención!');
          this.detectarCambios();
        },
        error: error => {
          console.error('Error al finalizar sesión:', error?.error ?? error);
          this.errorApi = 'La partida terminó, pero no se pudo guardar el resumen final.';
          this.detectarCambios();
        },
      });
  }

  jugarDeNuevo(): void {
    this.iniciarJuego(this.nivelActual);
  }

  subirNivel(): void {
    if (this.nivelSugerido) this.iniciarJuego(this.nivelSugerido);
  }

  volverLobby(): void {
    this.limpiarTemporizadores();
    this.router.navigate(['/nino/juegos']);
  }

  // ── Mascota ────────────────────────────────────────────────────────────
  setMascot(mood: MascotMood, msg: string, durMs = 1600): void {
    if (this.mascotTimer) clearTimeout(this.mascotTimer);
    this.mascotMood = mood;
    this.mascotMsg = msg;
    if (mood !== 'idle') {
      this.mascotTimer = this.setTimeoutCd(() => {
        this.mascotMood = 'idle';
      }, durMs);
    }
  }

  // ── Audio: Web Speech API (voz) + Web Audio API (efectos) ─────────────
  private hablar(texto: string): void {
    if (this.volumenActual === 0) return;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(texto);
      utt.lang = 'es-ES';
      utt.rate = 0.95;
      utt.pitch = 1.1;
      utt.volume = this.volumenActual / 100;
      const voces = window.speechSynthesis.getVoices();
      const vozEs = voces.find(v => v.lang.startsWith('es'));
      if (vozEs) utt.voice = vozEs;
      window.speechSynthesis.speak(utt);
    } catch {}
  }

  private getAudio(): AudioContext | null {
    if (this.volumenActual === 0) return null;
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, delay = 0): void {
    const ctx = this.getAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      const volumenEfectivo = vol * (this.volumenActual / 100);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volumenEfectivo, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.05);
    } catch {}
  }

  private playCorrecto(): void {
    this.playTone(523, 0.1, 'sine', 0.3);
    this.playTone(784, 0.15, 'sine', 0.3, 0.1);
  }

  private playIncorrecto(): void {
    this.playTone(220, 0.18, 'sawtooth', 0.18);
  }

  private playTransicion(): void {
    [440, 554, 659, 880].forEach((f, i) => this.playTone(f, 0.22, 'sine', 0.3, i * 0.11));
  }

  private playCompletado(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.playTone(f, 0.26, 'sine', 0.32, i * 0.13));
  }

  // ── Limpieza ───────────────────────────────────────────────────────────
  private limpiarTemporizadores(): void {
    if (this.calibracionTimeout) clearTimeout(this.calibracionTimeout);
    if (this.roundTimeout) clearTimeout(this.roundTimeout);
    if (this.roundCountdownInterval) clearInterval(this.roundCountdownInterval);
    if (this.avanceTimeout) clearTimeout(this.avanceTimeout);
    if (this.mascotTimer) clearTimeout(this.mascotTimer);
  }
}
