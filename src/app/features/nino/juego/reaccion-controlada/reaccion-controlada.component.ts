import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Ajusta estas rutas relativas a la ubicación real de reaccion-controlada dentro del proyecto.
import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';

import { ReaccionControladaService } from './reaccion-controlada.service';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import {
  ComparacionSesion,
  ConfettiPiece,
  DefinicionEstimulo,
  EnsayoResultado,
  EstadoJuego,
  MascotMood,
  MetricasSesion,
  TipoEstimulo,
} from './reaccion-controlada.model';

const TOTAL_ENSAYOS_SESION = 20;

@Component({
  selector: 'app-reaccion-controlada',
  standalone: true,
  imports: [CommonModule, GameFeedbackComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reaccion-controlada.component.html',
  styleUrls: ['./reaccion-controlada.component.css'],
})
export class ReaccionControladaComponent implements OnInit, OnDestroy {

  @ViewChild('feedback') feedback!: GameFeedbackComponent;

  // ── Estado de pantalla ──────────────────────────────────────────────────
  estado: EstadoJuego = 'inicio';
  nivelActual = 1;

  // ── Mascota Froggy ──────────────────────────────────────────────────────
  mascotMood: MascotMood = 'idle';
  mascotMsg = '¡Hola! Soy Froggy 🐸 ¡Vamos a entrenar tu control!';

  // ── Ensayo en curso ──────────────────────────────────────────────────────
  ensayoIndex = 0;
  readonly totalEnsayosSesion = TOTAL_ENSAYOS_SESION;
  estimuloActual: DefinicionEstimulo | null = null;
  estimuloVisible = false;
  yaPresiono = false;
  tiempoInicioEstimulo = 0;

  private probabilidadNoGo = 0.20;
  private resultados: EnsayoResultado[] = [];
  private timerEstimulo: ReturnType<typeof setTimeout> | null = null;
  private timerVentana: ReturnType<typeof setTimeout> | null = null;
  private sesionActiva = false;

  // Identificador único del ensayo activo. Evita que un timer "viejo" (de un
  // ensayo ya resuelto) cierre por error el ensayo siguiente.
  private trialId = 0;

  // ── Backend / métricas ────────────────────────────────────────────────────
  private readonly JUEGO_ID = 8;
  private sesionBackendId: number | null = null;
  private nivelFacilId: number | null = null;
  private profileId: number | null = null;

  // ── Resultados finales ───────────────────────────────────────────────────
  metricasFinal: MetricasSesion | null = null;
  comparacionSesion: ComparacionSesion | null = null;
  confettiPieces: ConfettiPiece[] = [];

  readonly LETRAS = ['A', 'B', 'C', 'D'];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private reaccionService: ReaccionControladaService,
    private sesionJuegoService: SesionJuegoService,
    private childProfileService: ChildProfileService,
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
      this.profileId = state.profileId;
    });
    this.sesionJuegoService.obtenerNiveles(this.JUEGO_ID).subscribe({
      next: niveles => { this.nivelFacilId = niveles[0]?.id ?? null; },
      error: () => { /* continúa sin backend */ }
    });
  }

  ngOnDestroy(): void {
    this.detenerTimers();
  }

  // ── Getters de UI ─────────────────────────────────────────────────────────

  get aciertosGoParciales(): number {
    return this.resultados.filter(r => r.tipo === 'go' && r.correcto).length;
  }

  get falsasAlarmasParciales(): number {
    return this.resultados.filter(r => r.tipo === 'nogo' && r.presiono).length;
  }

  get progresoPorc(): number {
    return Math.round((this.ensayoIndex / this.totalEnsayosSesion) * 100);
  }

  get trofeoEmoji(): string {
    const idx = this.metricasFinal?.indiceImpulsividad ?? 100;
    return idx <= 15 ? '🏆' : idx <= 35 ? '🥈' : idx <= 60 ? '🥉' : '🌟';
  }

  get tituloFinal(): string {
    const idx = this.metricasFinal?.indiceImpulsividad ?? 100;
    return idx <= 15 ? '¡Control de impulsos excelente!' :
      idx <= 35 ? '¡Muy buen autocontrol!' :
        idx <= 60 ? '¡Buen esfuerzo, Froggy está orgulloso!' :
          '¡Sigue practicando, cada intento cuenta!';
  }

  // ── Flujo principal ───────────────────────────────────────────────────────

  iniciarJuego(): void {
    const sesionAnterior = this.reaccionService.obtenerSesionAnterior();
    // CA-04: la frecuencia de estímulos inhibidores de esta sesión se ajusta
    // según el índice de impulsividad detectado la sesión previa.
    this.probabilidadNoGo = sesionAnterior
      ? this.reaccionService.ajustarFrecuenciaNoGo(sesionAnterior.indiceImpulsividad)
      : 0.20;

    this.resultados = [];
    this.ensayoIndex = 0;
    this.estimuloActual = null;
    this.estimuloVisible = false;
    this.yaPresiono = false;
    this.metricasFinal = null;
    this.comparacionSesion = null;
    this.sesionActiva = true;
    this.sesionBackendId = null;
    this.estado = 'juego';
    this.setMascota('thinking', '¡Atrápalas cuando veas la mosca 🪰, pero quieta con la abeja 🐝!');
    this.cdr.detectChanges();

    // Backend session (CA-04)
    if (this.profileId != null && this.nivelFacilId != null) {
      this.sesionJuegoService.iniciarSesion({
        perfilId: this.profileId,
        juegoId: this.JUEGO_ID,
        nivelId: this.nivelFacilId,
      }).subscribe({
        next: sesion => {
          this.sesionBackendId = sesion.id ?? null;
          if (sesion.id) this.sesionJuegoService.comenzarTracking(sesion.id);  // CA-04
        },
        error: () => { /* continúa sin backend */ }
      });
    }

    this.programarSiguienteEstimulo();
  }

  // CA-01: espera un intervalo variable (500ms–1500ms) antes del próximo estímulo.
  private programarSiguienteEstimulo(): void {
    if (!this.sesionActiva) return;

    if (this.ensayoIndex >= this.totalEnsayosSesion) {
      this.terminarJuego();
      return;
    }

    const intervalo = this.reaccionService.generarIntervaloEstimulo();
    this.timerEstimulo = setTimeout(() => this.mostrarEstimulo(), intervalo);
  }

  private mostrarEstimulo(): void {
    if (!this.sesionActiva) return;

    // Cancela cualquier timer de ventana que hubiera quedado pendiente de un
    // ensayo anterior antes de abrir uno nuevo (defensa adicional al token).
    if (this.timerVentana) { clearTimeout(this.timerVentana); this.timerVentana = null; }

    const idDeEsteEnsayo = ++this.trialId;
    const tipo: TipoEstimulo = this.reaccionService.decidirTipoEstimulo(this.probabilidadNoGo);
    this.estimuloActual = this.reaccionService.obtenerDefinicion(tipo);
    this.estimuloVisible = true;
    this.yaPresiono = false;
    this.tiempoInicioEstimulo = Date.now();
    this.sesionJuegoService.marcarElementoAparece();  // CA-08
    this.cdr.detectChanges();

    const ventana = this.reaccionService.ventanaLimiteMs(tipo);
    this.timerVentana = setTimeout(() => this.cerrarEnsayo(idDeEsteEnsayo), ventana);
  }

  // El niño presiona el botón de reacción mientras el estímulo está visible.
  presionarBoton(event: PointerEvent): void {
    if (!this.estimuloVisible || this.yaPresiono || !this.estimuloActual) return;
    this.yaPresiono = true;

    // Clave del fix: se cancela el timer de ventana de ESTE ensayo de inmediato,
    // para que no quede vivo y cierre por error un ensayo futuro.
    if (this.timerVentana) { clearTimeout(this.timerVentana); this.timerVentana = null; }

    const tiempoReaccionMs = Date.now() - this.tiempoInicioEstimulo;
    const esGo = this.estimuloActual.tipo === 'go';

    this.sesionJuegoService.trackClick(  // CA-07
      event.clientX,
      event.clientY,
      this.estimuloActual.emoji,
      esGo
    );
    if (esGo) {
      this.sesionJuegoService.trackRespuestaMs(tiempoReaccionMs);  // CA-05
    }

    this.registrarEnsayo(this.estimuloActual.tipo, true, tiempoReaccionMs);
  }

  // Se cumplió la ventana de respuesta sin que el niño presionara.
  // Recibe el id del ensayo para el que se programó este timer: si para cuando
  // dispara ya estamos en otro ensayo (id distinto), se ignora sin efecto.
  private cerrarEnsayo(idDelEnsayo: number): void {
    this.timerVentana = null;
    if (idDelEnsayo !== this.trialId) return;
    if (!this.estimuloVisible || !this.estimuloActual) return;

    if (!this.yaPresiono) {
      this.registrarEnsayo(this.estimuloActual.tipo, false, null);
    }
  }

  private registrarEnsayo(tipo: TipoEstimulo, presiono: boolean, tiempoReaccionMs: number | null): void {
    const resultado = this.reaccionService.evaluarEnsayo(this.ensayoIndex, tipo, presiono, tiempoReaccionMs);
    this.resultados.push(resultado);

    this.estimuloVisible = false;
    this.estimuloActual = null;
    this.ensayoIndex++;

    if (resultado.correcto) {
      this.setMascota('celebrate', this.pick(['¡Genial! 🎉', '¡Así se hace! 🐸', '¡Excelente control! ⭐']));
      this.feedback?.showCorrect();
    } else {
      this.setMascota('encourage', tipo === 'nogo'
        ? '¡Cuidado con la abeja! Espera la próxima 🐝'
        : '¡Casi! Prepárate para la próxima mosca 🪰');
      this.feedback?.showIncorrect();
    }

    this.cdr.detectChanges();
    this.programarSiguienteEstimulo();
  }

  private terminarJuego(): void {
    this.sesionActiva = false;
    this.detenerTimers();

    const metricas = this.reaccionService.calcularMetricas(this.resultados);
    this.metricasFinal = metricas;

    // CA-03: fire-and-forget metrics finalization
    if (this.sesionBackendId != null) {
      const totalGo = this.resultados.filter(r => r.tipo === 'go').length;
      const aciertosGo = this.resultados.filter(r => r.tipo === 'go' && r.correcto).length;
      this.sesionJuegoService.finalizarSesion(
        this.sesionBackendId,
        Math.max(0, 100 - metricas.indiceImpulsividad),
        totalGo,
        aciertosGo
      );
    }

    const sesionAnterior = this.reaccionService.obtenerSesionAnterior();
    // CA-05: notificación positiva si el SSRT mejora más de un 15% vs la sesión anterior.
    this.comparacionSesion = this.reaccionService.compararConSesionAnterior(metricas.ssrtMs, sesionAnterior);

    this.reaccionService.guardarSesion({
      fecha: Date.now(),
      ssrtMs: metricas.ssrtMs,
      indiceImpulsividad: metricas.indiceImpulsividad,
      nivelActual: this.nivelActual,
      probabilidadNoGo: this.probabilidadNoGo,
    });

    // CA-06: los datos de impulsividad quedan listos para viajar al dashboard del padre/tutor.
    this.reaccionService.enviarMetricasADashboard(metricas);

    this.confettiPieces = this.reaccionService.generarConfeti();
    this.estado = 'resultados';

    const msg = this.comparacionSesion.mejoraSignificativa
      ? `¡Mejoraste tu tiempo de control un ${this.comparacionSesion.mejoraSSRTPorc}% desde la última vez! 🐸💚`
      : this.tituloFinal;
    this.setMascota('celebrate', msg);
    this.cdr.detectChanges();
  }

  jugarDeNuevo(): void {
    this.estado = 'inicio';
    this.setMascota('idle', '¡Hola! Soy Froggy 🐸 ¡Vamos a entrenar tu control!');
    this.cdr.detectChanges();
  }

  volver(): void {
    this.detenerTimers();
    this.router.navigate(['/nino/juegos']);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private detenerTimers(): void {
    this.sesionActiva = false;
    if (this.timerEstimulo) { clearTimeout(this.timerEstimulo); this.timerEstimulo = null; }
    if (this.timerVentana)  { clearTimeout(this.timerVentana);  this.timerVentana  = null; }
  }

  private setMascota(mood: MascotMood, msg: string): void {
    this.mascotMood = mood;
    this.mascotMsg = msg;
  }

  private pick(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
