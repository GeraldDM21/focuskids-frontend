import {
  Component,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router} from '@angular/router';
import { take } from 'rxjs';

import {
  CascadaResultadoResponse,
  EstadoJuego,
  Mood,
  NumeroCayendo,
  OperacionMatematica,
  ResultadoOperacion
} from './cascada-numerica.types';

import {
  CascadaNumericaService
} from '../../../../core/services/cascada-numerica.service';

import {
  ChildProfileService
} from '../../../padre/perfiles/child-profile.service';

@Component({
  selector: 'app-cascada-numerica',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cascada-numerica.component.html',
  styleUrl: './cascada-numerica.component.scss'
})

export class CascadaNumericaComponent implements OnDestroy {
  readonly MAX_OPERACIONES = 20;
  readonly DURACION_MAXIMA_MS = 5 * 60 * 1000;
  readonly VELOCIDAD_INICIAL_MS = 4000;
  readonly VELOCIDAD_MINIMA_MS = 1800;

  estado: EstadoJuego = 'inicio';
  sonidoActivo = true;
  mascotMood: Mood = 'idle';
  mascotMsg = '¡Vamos a entrenar tu cálculo mental!';

  cuentaRegresiva = 3;
  cuentaTexto = '3';

  mensajeFeedback = '';
  feedbackCorrecto = false;

  vozActiva = true;

  private vozActual:
    SpeechSynthesisUtterance | null = null;

  operacionActual: OperacionMatematica | null = null;
  numerosCayendo: NumeroCayendo[] = [];

  operacionesCompletadas = 0;

  aciertos = 0;
  errores = 0;
  omisiones = 0;
  combo = 0;
  maxCombo = 0;
  nivelActual = 1;
  velocidadCaidaMs = this.VELOCIDAD_INICIAL_MS;

  resultados: ResultadoOperacion[] = [];

  tiempoInicioSesion = 0;
  tiempoInicioOperacion = 0;
  tiempoRestanteSegundos = 300;

  respuestaBloqueada = false;
  sesionFinalizada = false;

  sesionBackendId: number | null = null;

  guardandoOperacion = false;
  finalizandoBackend = false;

  errorBackend = '';

  resultadoBackend: CascadaResultadoResponse | null = null;

  private timerCaida: ReturnType<typeof setTimeout> | null = null;
  private timerSesion: ReturnType<typeof setInterval> | null = null;
  private timerFeedback: ReturnType<typeof setTimeout> | null = null;
  private timerCuenta: ReturnType<typeof setInterval> | null = null;

  private audioCtx: AudioContext | null = null;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly cascadaService:
    CascadaNumericaService,
    private readonly childProfileService:
    ChildProfileService
  ) {}

  iniciarJuego(): void {
    this.initAudio();
    this.errorBackend = '';

    this.childProfileService.activeProfile$
      .pipe(take(1))
      .subscribe({
        next: perfil => {
          if (!perfil?.profileId) {
            this.errorBackend =
              'No hay un perfil infantil activo.';

            this.cdr.detectChanges();
            return;
          }

          this.cascadaService
            .iniciarSesion(perfil.profileId)
            .subscribe({
              next: respuesta => {
                this.sesionBackendId =
                  respuesta.sesionId;

                this.nivelActual =
                  respuesta.nivelInicial;

                this.velocidadCaidaMs =
                  respuesta.velocidadCaidaMs;

                this.comenzarJuegoLocal();
              },
              error: error => {
                console.error(
                  'Error al iniciar Cascada Numérica:',
                  error
                );

                console.error(
                  'Respuesta del backend:',
                  error.error
                );

                this.errorBackend =
                  error.error?.message ??
                  error.error?.error ??
                  'No se pudo iniciar la sesión del juego.';

                this.cdr.detectChanges();
              }
            });
        }
      });
  }

  private comenzarJuegoLocal(): void {

    const nivelInicialBackend = this.nivelActual;
    const velocidadInicialBackend = this.velocidadCaidaMs;

    this.reiniciarEstadisticas(false);

    this.nivelActual = nivelInicialBackend;
    this.velocidadCaidaMs = velocidadInicialBackend;

    this.prepararPrimeraOperacion();

    this.estado = 'cuenta';
    this.cuentaRegresiva = 3;
    this.cuentaTexto = '3';

    this.mascotMood = 'excited';

    this.mascotMsg =
      '¡Aquí vamos! Resuelve rápido y atrapa el resultado. ✨';

    this.tiempoRestanteSegundos =
      this.DURACION_MAXIMA_MS / 1000;

    this.iniciarCuentaRegresiva();

    this.cdr.detectChanges();
  }

  private prepararPrimeraOperacion(): void {
    this.operacionActual =
      this.generarOperacion();

    this.numerosCayendo =
      this.generarNumerosCayendo(
        this.operacionActual
      );

    this.respuestaBloqueada = true;
  }


  volverAJuegos(): void {
    this.limpiarTemporizadores();

    this.router.navigate([
      '/nino/juegos'
    ]);
  }

  alternarSonido(): void {
    this.sonidoActivo =
      !this.sonidoActivo;

    this.vozActiva =
      this.sonidoActivo;

    if (!this.sonidoActivo) {
      this.detenerVoz();
    } else {
      this.initAudio();

      this.sonarTick();

      this.hablar(
        'Sonido activado.'
      );
    }

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.detenerVoz();
    this.limpiarTemporizadores();

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {
        // El contexto ya puede estar cerrado.
      });

      this.audioCtx = null;
    }
  }

  private reiniciarEstadisticas(
    reiniciarBackend = true
  ): void {
    this.limpiarTemporizadores();

    this.operacionesCompletadas = 0;

    this.aciertos = 0;
    this.errores = 0;
    this.omisiones = 0;

    this.combo = 0;
    this.maxCombo = 0;

    this.nivelActual = 1;
    this.velocidadCaidaMs = this.VELOCIDAD_INICIAL_MS;

    this.resultados = [];

    this.operacionActual = null;
    this.numerosCayendo = [];

    this.tiempoInicioSesion = 0;
    this.tiempoInicioOperacion = 0;
    this.tiempoRestanteSegundos = 300;

    this.respuestaBloqueada = false;
    this.sesionFinalizada = false;

    this.mensajeFeedback = '';
    this.feedbackCorrecto = false;

    this.mascotMood = 'idle';
    this.mascotMsg = '¡Vamos a entrenar tu cálculo mental!';

    if (reiniciarBackend) {
      this.sesionBackendId = null;
    }

    this.resultadoBackend = null;
    this.guardandoOperacion = false;
    this.finalizandoBackend = false;
  }

  private iniciarCuentaRegresiva(): void {
    this.limpiarTimerCuenta();

    this.cuentaRegresiva = 3;
    this.cuentaTexto = '3';

    this.sonarTick();

    this.timerCuenta = setInterval(() => {
      this.cuentaRegresiva--;

      if (this.cuentaRegresiva > 0) {
        this.cuentaTexto =
          this.cuentaRegresiva.toString();

        this.sonarTick();
        this.reiniciarAnimacionCuenta();
      } else if (
        this.cuentaRegresiva === 0
      ) {
        this.cuentaTexto = '¡YA!';

        this.sonarYa();
        this.reiniciarAnimacionCuenta();
      } else {
        this.limpiarTimerCuenta();
        this.activarOperacionPreparada();
        return;
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private activarOperacionPreparada(): void {
    if (
      !this.operacionActual ||
      this.numerosCayendo.length !== 3
    ) {
      this.nuevaOperacion();
      return;
    }

    this.estado = 'jugando';
    this.respuestaBloqueada = false;

    this.mascotMood = 'thinking';
    this.mascotMsg =
      '¡Resuelve la operación y atrapa el resultado!';

    this.tiempoInicioSesion = Date.now();
    this.iniciarTemporizadorSesion();

    this.decirOperacion(
      this.operacionActual
    );

    this.tiempoInicioOperacion = Date.now();

    this.timerCaida = setTimeout(() => {
      this.registrarOmision();
    }, this.velocidadCaidaMs);

    this.cdr.detectChanges();
  }

  private iniciarTemporizadorSesion(): void {
    this.limpiarTimerSesion();

    this.timerSesion = setInterval(() => {
      const tiempoTranscurrido =
        Date.now() - this.tiempoInicioSesion;

      const tiempoRestante =
        this.DURACION_MAXIMA_MS - tiempoTranscurrido;

      this.tiempoRestanteSegundos = Math.max(
        0, Math.ceil(tiempoRestante /1000)
      );

      if(tiempoRestante <= 0) {
        this.finalizarJuego();
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private reiniciarAnimacionCuenta(): void {
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      const elemento =
        document.querySelector(
          '.cuenta-numero'
        ) as HTMLElement | null;

      if (!elemento) {
        return;
      }

      elemento.style.animation = 'none';

      void elemento.offsetWidth;

      elemento.style.animation = '';
    });
  }

  get tiempoFormateado(): string {
    const minutos = Math.floor(
      this.tiempoRestanteSegundos / 60
    );

    const segundos =
      this.tiempoRestanteSegundos % 60;

    return `${minutos.toString().padStart(2, '0')}:` +
      `${segundos.toString().padStart(2, '0')}`;
  }

  private numeroAleatorio(
    minimo: number,
    maximo: number
  ): number {
    return Math.floor (
      Math.random() * (maximo - minimo + 1)
    ) + minimo;
  }

  private seleccionarOperador(): '+' | '-' | '×' {
    if (this.nivelActual === 1) {
      return Math.random() < 0.5 ? '+' : '-';
    }

    const operadores: Array<'+' | '-' | '×'> = [
      '+',
      '-',
      '×'
    ];

    const indice = this.numeroAleatorio(
      0,
      operadores.length - 1
    );

    return operadores[indice];
  }

  private generarOperacion(): OperacionMatematica {
    const operador = this.seleccionarOperador();

    let numero1 = 0;
    let numero2 = 0;
    let resultado = 0;

    if(operador === '+') {
      const maximo = this.obtenerMaximoPorNivel();

      numero1 = this.numeroAleatorio(1, maximo);
      numero2 = this.numeroAleatorio(1, maximo);
      resultado = numero1 + numero2;
    }

    if (operador === '-') {
      const maximo = this.obtenerMaximoPorNivel();

      numero1 = this.numeroAleatorio(2, maximo);

      numero2 = this.numeroAleatorio(1, numero1);

      resultado = numero1 - numero2;
    }

    if(operador === '×') {
      const maximoMultiplicacion =
        this.obtenerMaximoMultiplicacion();

      numero1 = this.numeroAleatorio(
        2,
        maximoMultiplicacion
      );

      numero2 = this.numeroAleatorio(
        2,
        maximoMultiplicacion
      );

      resultado = numero1 * numero2;
    }

    return {
      numero1,
      numero2,
      operador,
      resultado,
      texto: `${numero1} ${operador} ${numero2}`,
    };
  }

  private obtenerMaximoPorNivel(): number {
    switch (this.nivelActual) {
      case 1:
        return 10;

      case 2:
        return 20;

      case 3:
        return 35;

      case 4:
        return 50;

      default:
        return 70;
    }
  }

  private obtenerMaximoMultiplicacion(): number {
    switch (this.nivelActual) {
      case 1:
        return 3;

      case 2:
        return 5;

      case 3:
        return 7;

      default:
        return 10;
    }
  }

  private generarDistractores(
    operacion: OperacionMatematica
  ): number[] {
    const distractores = new Set<number>();

    if (operacion.operador === '×') {
      const resultadoAnterior =
        operacion.numero1 * Math.max(
          1,
          operacion.numero2 - 1
        );

      const resultadoSiguiente =
        operacion.numero1 * (
          operacion.numero2 + 1
        );

      if (
        resultadoAnterior >= 0 &&
        resultadoAnterior !== operacion.resultado
      ) {
        distractores.add(resultadoAnterior);
      }

      if (
        resultadoSiguiente >= 0 &&
        resultadoSiguiente !== operacion.resultado
      ) {
        distractores.add(resultadoSiguiente);
      }
    }

    const variaciones = [
      -1,
      1,
      -2,
      2,
      -3,
      3,
      -5,
      5
    ];

    let intentos = 0;
    const maximoIntentos = 30;

    while (
      distractores.size < 2 &&
      intentos < maximoIntentos
      ) {
      intentos++;

      const indice = this.numeroAleatorio(
        0,
        variaciones.length - 1
      );

      const distractor =
        operacion.resultado + variaciones[indice];

      if (
        distractor >= 0 &&
        distractor !== operacion.resultado
      ) {
        distractores.add(distractor);
      }
    }

    /*
     * Respaldo determinista:
     * completa los distractores aunque las variaciones
     * aleatorias anteriores no hayan sido suficientes.
     */
    let incremento = 1;

    while (distractores.size < 2) {
      const distractor =
        Math.max(0, operacion.resultado + incremento);

      if (distractor !== operacion.resultado) {
        distractores.add(distractor);
      }

      incremento++;
    }

    return Array.from(distractores).slice(0, 2);
  }

  private mezclar<T>(elementos: T[]): T[] {
    const copia = [...elementos];

    for (
      let indice = copia.length - 1;
      indice > 0;
      indice--
    ) {
      const indiceAleatorio =
        this.numeroAleatorio(0, indice);

      [
        copia[indice],
        copia[indiceAleatorio]
      ] = [
        copia[indiceAleatorio],
        copia[indice]
      ];
    }

    return copia;
  }

  private generarNumerosCayendo(
    operacion: OperacionMatematica
  ): NumeroCayendo[] {
    const distractores =
      this.generarDistractores(operacion);

    const numerosBase: NumeroCayendo[] = [
      {
        id: 1,
        valor: operacion.resultado,
        correcto: true,
        posicionX: 20,
        duracionMs: this.velocidadCaidaMs,
        seleccionado: false
      },
      {
        id: 2,
        valor: distractores[0],
        correcto: false,
        posicionX: 50,
        duracionMs: this.velocidadCaidaMs,
        seleccionado: false
      },
      {
        id: 3,
        valor: distractores[1],
        correcto: false,
        posicionX: 80,
        duracionMs: this.velocidadCaidaMs,
        seleccionado: false
      }
    ];

    const numerosMezclados =
      this.mezclar(numerosBase);

    const posiciones = [20, 50, 80];

    return numerosMezclados.map(
      (numero, indice) => ({
        ...numero,
        posicionX: posiciones[indice]
      })
    );
  }

  private nuevaOperacion(): void {
    if (this.debeFinalizar()) {
      this.finalizarJuego();
      return;
    }

    this.limpiarTimerCaida();
    this.limpiarTimerFeedback();

    this.estado = 'jugando';
    this.respuestaBloqueada = false;

    this.mascotMood = 'thinking';
    this.mascotMsg =
      '¡Resuelve la operación y atrapa el resultado!';

    this.operacionActual =
      this.generarOperacion();

    this.numerosCayendo =
      this.generarNumerosCayendo(
        this.operacionActual
      );

    this.decirOperacion(
      this.operacionActual
    );

    this.tiempoInicioOperacion = Date.now();

    this.timerCaida = setTimeout(() => {
      this.registrarOmision();
    }, this.velocidadCaidaMs);

    this.cdr.detectChanges();
  }

  private debeFinalizar(): boolean {
    const superoOperaciones =
      this.operacionesCompletadas >=
      this.MAX_OPERACIONES;

    const superoTiempo =
      Date.now() - this.tiempoInicioSesion >=
      this.DURACION_MAXIMA_MS;

    return superoOperaciones || superoTiempo;
  }

  private limpiarTimerCaida(): void {
    if (this.timerCaida !== null) {
      clearTimeout(this.timerCaida);
      this.timerCaida = null;
    }
  }

  private limpiarTimerSesion(): void {
    if (this.timerSesion !== null) {
      clearInterval(this.timerSesion);
      this.timerSesion = null;
    }
  }

  private limpiarTimerFeedback(): void {
    if (this.timerFeedback !== null) {
      clearTimeout(this.timerFeedback);
      this.timerFeedback = null;
    }
  }

  private limpiarTimerCuenta(): void {
    if (this.timerCuenta !== null) {
      clearInterval(this.timerCuenta);
      this.timerCuenta = null;
    }
  }

  private limpiarTemporizadores(): void {
    this.limpiarTimerCaida();
    this.limpiarTimerSesion();
    this.limpiarTimerFeedback();
    this.limpiarTimerCuenta();
  }

  seleccionarNumero(numero: NumeroCayendo): void {
    if (
      this.respuestaBloqueada ||
      this.estado !== 'jugando' ||
      !this.operacionActual
    ) {
      return;
    }

    this.respuestaBloqueada = true;
    numero.seleccionado = true;

    this.limpiarTimerCaida();

    const tiempoRespuestaMs =
      Date.now() - this.tiempoInicioOperacion;

    if (numero.correcto) {
      this.registrarAcierto(
        numero,
        tiempoRespuestaMs
      );
    } else {
      this.registrarError(
        numero,
        tiempoRespuestaMs
      );
    }

    this.cdr.detectChanges();
  }

  private guardarResultadoOperacion(
    tipoResultado: 'ACIERTO' | 'ERROR' | 'OMISION',
    respuestaSeleccionada: number | null,
    tiempoRespuestaMs: number | null
  ): void {
    if (!this.operacionActual) {
      return;
    }

    this.operacionesCompletadas++;

    const resultado: ResultadoOperacion = {
      numeroOperacion:
      this.operacionesCompletadas,

      numero1:
      this.operacionActual.numero1,

      numero2:
      this.operacionActual.numero2,

      operador:
      this.operacionActual.operador,

      resultadoCorrecto:
      this.operacionActual.resultado,

      respuestaSeleccionada,

      tipoResultado,

      tiempoRespuestaMs,

      velocidadCaidaMs:
      this.velocidadCaidaMs,

      nivel:
      this.nivelActual
    };

    this.resultados.push(resultado);
    this.registrarOperacionBackend(resultado);
  }

  private registrarOperacionBackend(
    resultado: ResultadoOperacion
  ): void {
    if (!this.sesionBackendId) {
      return;
    }

    this.guardandoOperacion = true;

    this.cascadaService
      .registrarOperacion(
        this.sesionBackendId,
        resultado
      )
      .subscribe({
        next: ajuste => {
          this.nivelActual =
            ajuste.nivelSugerido;

          this.velocidadCaidaMs =
            ajuste.velocidadSugeridaMs;

          this.guardandoOperacion = false;

          this.cdr.detectChanges();
        },
        error: () => {
          this.guardandoOperacion = false;

          this.errorBackend =
            'No se pudo registrar una operación.';

          this.cdr.detectChanges();
        }
      });
  }

  private finalizarJuego(): void {
    if (this.sesionFinalizada) {
      return;
    }

    this.sesionFinalizada = true;
    this.limpiarTemporizadores();

    this.estado = 'resultados';

    this.mascotMood = 'celebrate';

    this.mascotMsg =
      '¡Terminaste la Cascada Numérica!';

    if (!this.sesionBackendId) {
      this.cdr.detectChanges();
      return;
    }

    this.finalizandoBackend = true;

    this.cascadaService.finalizarSesion(
      this.sesionBackendId,
      {
        aciertos: this.aciertos,
        errores: this.errores,
        omisiones: this.omisiones,
        maxCombo: this.maxCombo,

        duracionTotalMs: Math.min(
          Date.now() - this.tiempoInicioSesion,
          this.DURACION_MAXIMA_MS
        ),

        nivelFinal: this.nivelActual
      }
    ).subscribe({
      next: resultado => {
        this.resultadoBackend = resultado;
        this.finalizandoBackend = false;

        this.cdr.detectChanges();
      },
      error: () => {
        this.finalizandoBackend = false;

        this.errorBackend =
          'La partida terminó, pero no se pudo guardar el resumen.';

        this.cdr.detectChanges();
      }
    });

    this.cdr.detectChanges();
  }

  private registrarAcierto(
    numero: NumeroCayendo,
    tiempoRespuestaMs: number
  ): void {
    this.aciertos++;

    this.combo++;
    this.maxCombo = Math.max(
      this.maxCombo,
      this.combo
    );

    this.guardarResultadoOperacion(
      'ACIERTO',
      numero.valor,
      tiempoRespuestaMs
    );

    this.feedbackCorrecto = true;
    this.mensajeFeedback =
      '¡Correcto! 🎉';

    this.estado = 'feedback';

    this.mascotMood = 'celebrate';
    this.mascotMsg =
      '¡Excelente! Encontraste el resultado correcto.';

    this.sonarAcierto();

    this.hablar(
      '¡Correcto! Muy bien.'
    );

    this.continuarDespuesDelFeedback();
  }

  private registrarError(
    numero: NumeroCayendo,
    tiempoRespuestaMs: number
  ): void {
    if (!this.operacionActual) {
      return;
    }

    this.errores++;
    this.combo = 0;

    this.guardarResultadoOperacion(
      'ERROR',
      numero.valor,
      tiempoRespuestaMs
    );

    this.feedbackCorrecto = false;

    this.mensajeFeedback =
      `Casi. La respuesta era ` +
      `${this.operacionActual.resultado}.`;

    this.estado = 'feedback';

    this.mascotMood = 'encourage';
    this.mascotMsg =
      '¡No pasa nada! La siguiente puede ser tuya.';

    this.sonarError();

    this.hablar(
      `Casi. La respuesta correcta era ` +
      `${this.operacionActual.resultado}.`
    );

    this.continuarDespuesDelFeedback();
  }

  private registrarOmision(): void {
    if (
      this.respuestaBloqueada ||
      this.estado !== 'jugando' ||
      !this.operacionActual
    ) {
      return;
    }

    this.respuestaBloqueada = true;

    this.omisiones++;
    this.combo = 0;

    this.guardarResultadoOperacion(
      'OMISION',
      null,
      null
    );

    this.feedbackCorrecto = false;

    this.mensajeFeedback =
      `¡Tiempo! La respuesta era ` +
      `${this.operacionActual.resultado}.`;

    this.estado = 'feedback';

    this.mascotMood = 'encourage';
    this.mascotMsg =
      '¡Sigue intentándolo! Responde un poco más rápido.';

    this.sonarOmision();

    this.hablar(
      `Se acabó el tiempo. La respuesta era ` +
      `${this.operacionActual.resultado}.`
    );


    this.continuarDespuesDelFeedback();

    this.cdr.detectChanges();
  }

  private continuarDespuesDelFeedback(): void {
    this.limpiarTimerFeedback();

    this.timerFeedback = setTimeout(() => {
      if (this.debeFinalizar()) {
        this.finalizarJuego();
        return;
      }

      this.nuevaOperacion();
    }, 1500);
  }

  private decirOperacion(
    operacion: OperacionMatematica
  ): void {
    const operadorHablado =
      this.obtenerOperadorHablado(
        operacion.operador
      );

    const mensaje =
      `${operacion.numero1} ` +
      `${operadorHablado} ` +
      `${operacion.numero2}`;

    this.hablar(mensaje);
  }

  private obtenerOperadorHablado(
    operador: '+' | '-' | '×'
  ): string {
    switch (operador) {
      case '+':
        return 'más';

      case '-':
        return 'menos';

      case '×':
        return 'por';
    }
  }

  private hablar(texto: string): void {
    if (
      !this.sonidoActivo ||
      !this.vozActiva ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const mensaje =
      new SpeechSynthesisUtterance(texto);

    mensaje.lang = 'es-ES';
    mensaje.rate = 0.88;
    mensaje.pitch = 1.15;
    mensaje.volume = 1;

    const voces =
      window.speechSynthesis.getVoices();

    const vozEspanol =
      voces.find(
        voz =>
          voz.lang.toLowerCase()
            .startsWith('es')
      );

    if (vozEspanol) {
      mensaje.voice = vozEspanol;
    }

    this.vozActual = mensaje;

    window.speechSynthesis.speak(mensaje);
  }

  private detenerVoz(): void {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }

    this.vozActual = null;
  }

  private initAudio(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (
        window.AudioContext ||
        (window as any).webkitAudioContext
      )();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {
        // El navegador puede bloquear el audio
        // hasta que exista interacción del usuario.
      });
    }
  }

  private tocar(
    frecuencia: number,
    duracion: number,
    tipo: OscillatorType = 'sine',
    volumen = 0.3,
    frecuenciaFinal?: number
  ): void {
    if (
      !this.audioCtx ||
      !this.sonidoActivo
    ) {
      return;
    }

    try {
      const oscilador =
        this.audioCtx.createOscillator();

      const ganancia =
        this.audioCtx.createGain();

      oscilador.connect(ganancia);
      ganancia.connect(
        this.audioCtx.destination
      );

      oscilador.type = tipo;

      oscilador.frequency.setValueAtTime(
        frecuencia,
        this.audioCtx.currentTime
      );

      if (frecuenciaFinal) {
        oscilador.frequency
          .exponentialRampToValueAtTime(
            frecuenciaFinal,
            this.audioCtx.currentTime +
            duracion
          );
      }

      ganancia.gain.setValueAtTime(
        volumen,
        this.audioCtx.currentTime
      );

      ganancia.gain
        .exponentialRampToValueAtTime(
          0.001,
          this.audioCtx.currentTime +
          duracion
        );

      oscilador.start(
        this.audioCtx.currentTime
      );

      oscilador.stop(
        this.audioCtx.currentTime +
        duracion +
        0.05
      );
    } catch (_) {
      // No se interrumpe el juego si el
      // navegador no puede producir sonido.
    }
  }

  private sonarAcierto(): void {
    const notas = [
      523,
      659,
      784,
      1047
    ];

    notas.forEach(
      (frecuencia, indice) => {
        setTimeout(() => {
          this.tocar(
            frecuencia,
            0.18,
            'sine',
            0.35
          );
        }, indice * 75);
      }
    );
  }

  private sonarError(): void {
    this.tocar(
      220,
      0.12,
      'sawtooth',
      0.28
    );

    setTimeout(() => {
      this.tocar(
        180,
        0.22,
        'sawtooth',
        0.23,
        140
      );
    }, 100);
  }

  private sonarOmision(): void {
    this.tocar(
      330,
      0.12,
      'triangle',
      0.22
    );

    setTimeout(() => {
      this.tocar(
        260,
        0.16,
        'triangle',
        0.2
      );
    }, 110);

    setTimeout(() => {
      this.tocar(
        190,
        0.25,
        'triangle',
        0.18,
        150
      );
    }, 220);
  }

  private sonarTick(): void {
    this.tocar(
      440,
      0.07,
      'triangle',
      0.22
    );
  }

  private sonarYa(): void {
    this.tocar(
      880,
      0.12,
      'sine',
      0.45
    );

    setTimeout(() => {
      this.tocar(
        1047,
        0.18,
        'sine',
        0.4
      );
    }, 90);

    setTimeout(() => {
      this.tocar(
        1319,
        0.22,
        'sine',
        0.35
      );
    }, 180);
  }

}
