import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';

import { ReaccionControladaService } from './reaccion-controlada.service';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import {
  ComparacionSesion,
  ConfettiPiece,
  EnsayoResultado,
  EstadoJuego,
  EstimuloEnVuelo,
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
  @ViewChild('botonReaccion') botonReaccion?: ElementRef<HTMLButtonElement>;

  estado: EstadoJuego = 'inicio';
  nivelActual = 1;

  mascotMood: MascotMood = 'idle';
  mascotMsg = '¡Hola! Soy Bruno 🐻 ¡Vamos a entrenar tu control!';

  ensayoIndex = 0;
  readonly totalEnsayosSesion = TOTAL_ENSAYOS_SESION;
  estimuloActual: EstimuloEnVuelo | null = null;
  estimuloVisible = false;
  yaPresiono = false;
  tiempoInicioEstimulo = 0;

  private probabilidadNoGo = 0.20;
  private resultados: EnsayoResultado[] = [];
  private timerEstimulo: ReturnType<typeof setTimeout> | null = null;
  private timerVentana: ReturnType<typeof setTimeout> | null = null;
  private sesionActiva = false;
  private trialId = 0;
  private ventanaActualMs = 0;

  private readonly JUEGO_ID = 8;
  private sesionBackendId: number | null = null;
  private nivelFacilId: number | null = null;
  private profileId: number | null = null;

  metricasFinal: MetricasSesion | null = null;
  comparacionSesion: ComparacionSesion | null = null;
  confettiPieces: ConfettiPiece[] = [];

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
      next: niveles => {
        this.nivelFacilId = niveles[0]?.id ?? null;
        if (this.profileId) {
          this.sesionJuegoService.obtenerRecomendacion(this.profileId, this.JUEGO_ID)
            .subscribe(rec => {
              const match = rec?.nivelRecomendado?.id
                ? niveles.find(n => n.id === rec.nivelRecomendado.id)
                : null;
              if (match) {
                this.nivelFacilId = match.id;
                if (rec!.nivelRecomendado.nivel) {
                  const mapa: Record<string, number> = { FACIL: 1, MEDIO: 2, DIFICIL: 3, EXPERTO: 4 };
                  this.nivelActual = mapa[rec!.nivelRecomendado.nivel] ?? this.nivelActual;
                }
              }
            });
        }
      },
      error: () => { /* continúa sin backend */ }
    });
  }

  ngOnDestroy(): void {
    this.detenerTimers();
  }

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
        idx <= 60 ? '¡Buen esfuerzo, Bruno está orgulloso!' :
          '¡Sigue practicando, cada intento cuenta!';
  }

  @HostListener('window:keydown', ['$event'])
  manejarTeclado(event: KeyboardEvent): void {
    if (event.code !== 'Space' && event.key !== ' ') return;
    if (this.estado !== 'juego') return;
    event.preventDefault();
    if (event.repeat) return;

    const rect = this.botonReaccion?.nativeElement.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 0;
    const y = rect ? rect.top + rect.height / 2 : 0;
    this.registrarRespuesta(x, y);
  }

  iniciarJuego(): void {
    const sesionAnterior = this.reaccionService.obtenerSesionAnterior();
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
    this.setMascota('thinking', '¡Atrápala cuando veas la abeja 🐝, pero quieto con la mosca 🪰!');
    this.cdr.detectChanges();

    if (this.profileId != null && this.nivelFacilId != null) {
      this.sesionJuegoService.iniciarSesion({
        perfilId: this.profileId,
        juegoId: this.JUEGO_ID,
        nivelId: this.nivelFacilId,
      }).subscribe({
        next: sesion => {
          this.sesionBackendId = sesion.id ?? null;
          if (sesion.id) this.sesionJuegoService.comenzarTracking(sesion.id);
        },
        error: () => { /* continúa sin backend */ }
      });
    }

    this.programarSiguienteEstimulo();
  }

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

    if (this.timerVentana) { clearTimeout(this.timerVentana); this.timerVentana = null; }

    const idDeEsteEnsayo = ++this.trialId;
    const tipo: TipoEstimulo = this.reaccionService.decidirTipoEstimulo(this.probabilidadNoGo);
    this.estimuloActual = this.reaccionService.obtenerEstimuloEnVuelo(tipo);
    this.estimuloVisible = true;
    this.yaPresiono = false;
    this.tiempoInicioEstimulo = Date.now();
    this.ventanaActualMs = this.reaccionService.ventanaRespuestaMs(this.estimuloActual);
    this.sesionJuegoService.marcarElementoAparece();
    this.cdr.detectChanges();

    this.timerVentana = setTimeout(() => this.cerrarEnsayo(idDeEsteEnsayo), this.ventanaActualMs);
  }

  presionarBoton(event: PointerEvent): void {
    event.preventDefault();
    this.registrarRespuesta(event.clientX, event.clientY);
  }

  private registrarRespuesta(clientX: number, clientY: number): void {
    if (this.estado !== 'juego' || !this.estimuloVisible || this.yaPresiono || !this.estimuloActual) return;
    this.yaPresiono = true;

    if (this.timerVentana) { clearTimeout(this.timerVentana); this.timerVentana = null; }

    const tiempoReaccionMs = Date.now() - this.tiempoInicioEstimulo;
    const esGo = this.estimuloActual.tipo === 'go';

    this.sesionJuegoService.trackClick(
      clientX,
      clientY,
      this.estimuloActual.emoji,
      esGo
    );
    if (esGo) {
      this.sesionJuegoService.trackRespuestaMs(tiempoReaccionMs);
    }

    this.registrarEnsayo(this.estimuloActual.tipo, true, tiempoReaccionMs);
  }

  private cerrarEnsayo(idDelEnsayo: number): void {
    this.timerVentana = null;
    if (idDelEnsayo !== this.trialId) return;
    if (!this.estimuloVisible || !this.estimuloActual) return;

    if (!this.yaPresiono) {
      this.registrarEnsayo(this.estimuloActual.tipo, false, null);
    }
  }

  private registrarEnsayo(tipo: TipoEstimulo, presiono: boolean, tiempoReaccionMs: number | null): void {
    const resultado = this.reaccionService.evaluarEnsayo(
      this.ensayoIndex,
      tipo,
      presiono,
      tiempoReaccionMs,
      this.ventanaActualMs,
    );
    this.resultados.push(resultado);

    this.estimuloVisible = false;
    this.estimuloActual = null;
    this.ensayoIndex++;

    if (resultado.correcto) {
      this.setMascota('celebrate', this.pick(['¡Genial! 🎉', '¡Así se hace! 🐻', '¡Excelente control! ⭐']));
      this.feedback?.showCorrect();
    } else {
      this.setMascota('encourage', tipo === 'nogo'
        ? '¡Cuidado con la mosca! Espera la próxima 🪰'
        : '¡Casi! Prepárate para la próxima abeja 🐝');
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
    this.comparacionSesion = this.reaccionService.compararConSesionAnterior(metricas.ssrtMs, sesionAnterior);

    this.reaccionService.guardarSesion({
      fecha: Date.now(),
      ssrtMs: metricas.ssrtMs,
      indiceImpulsividad: metricas.indiceImpulsividad,
      nivelActual: this.nivelActual,
      probabilidadNoGo: this.probabilidadNoGo,
    });

    this.reaccionService.enviarMetricasADashboard(metricas);

    this.confettiPieces = this.reaccionService.generarConfeti();
    this.estado = 'resultados';

    const msg = this.comparacionSesion.mejoraSignificativa
      ? `¡Mejoraste tu tiempo de control un ${this.comparacionSesion.mejoraSSRTPorc}% desde la última vez! 🐻💚`
      : this.tituloFinal;
    this.setMascota('celebrate', msg);
    this.cdr.detectChanges();
  }

  jugarDeNuevo(): void {
    this.estado = 'inicio';
    this.setMascota('idle', '¡Hola! Soy Bruno 🐻 ¡Vamos a entrenar tu control!');
    this.cdr.detectChanges();
  }

  salirConResultados(): void {
    this.terminarJuego();
  }

  volver(): void {
    this.detenerTimers();
    this.router.navigate(['/nino/juegos']);
  }

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
