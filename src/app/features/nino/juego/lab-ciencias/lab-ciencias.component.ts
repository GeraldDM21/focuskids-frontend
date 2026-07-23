import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import {
  Subject,
  takeUntil
} from 'rxjs';

import {
  MascotComponent,
  MascotMood
} from '../../../../shared/components/mascot/mascot.component';

import {
  ChildProfileService
} from '../../../padre/perfiles/child-profile.service';

import {
  LabCienciasService
} from './lab-ciencias.service';

import {
  EstadoLab,
  ExperimentoLab,
  FinalizarLabRequest,
  IngredienteLab,
  LabResultadoResponse,
  NivelLab,
  RegistrarIntentoRequest
} from './lab-ciencias.model';

@Component({
  selector: 'app-lab-ciencias',

  standalone: true,

  imports: [
    CommonModule,
    MascotComponent
  ],

  templateUrl:
    './lab-ciencias.component.html',

  styleUrls: [
    './lab-ciencias.component.css'
  ]
})
export class LabCienciasComponent
  implements OnInit, OnDestroy {

  estado: EstadoLab = 'inicio';

  nivelActual: NivelLab = 'FACIL';

  perfilId = 0;

  sesionId: number | null = null;

  sonidoActivo = true;

  cargandoTexto =
    'Preparando el laboratorio...';

  progresoCarga = 0;

  ingredientes: IngredienteLab[] = [];

  experimentos: ExperimentoLab[] = [];

  experimentoActualIndex = 0;

  seleccionados: IngredienteLab[] = [];

  confettiActivo = false;

  confettiPiezas = Array.from(
    { length: 55 },
    (_, index) => ({
      id: index,

      left:
        Math.random() * 100,

      delay:
        Math.random() * 1.8,

      duration:
        2.4
        + Math.random() * 2,

      rotation:
        Math.random() * 360,

      emoji: [
        '🎉',
        '✨',
        '⭐',
        '🧪',
        '🎊',
        '🔬'
      ][index % 6]
    })
  );

  get cantidadIngredientesRequerida():
    number {
    return this.cantidadPorNivel(
      this.nivelActual
    );
  }

  get combinacionCorrectaActual():
    string[] {
    return (
      this.experimentoActual
        ?.combinacionesCorrectas[
        this.nivelActual
        ]
      ?? []
    );
  }

  private cantidadPorNivel(
    nivel: NivelLab
  ): number {
    switch (nivel) {
      case 'FACIL':
        return 2;

      case 'MEDIO':
      case 'DIFICIL':
        return 3;

      case 'EXPERTO':
        return 4;
    }
  }

  resultadoVisible = false;

  resultadoExitoso = false;

  mensajeResultado = '';

  emojiResultado = '🧪';

  explicacionActual = '';

  mezclando = false;

  intentosExperimento = 0;

  intentosTotales = 0;

  hipotesisCorrectas = 0;

  hipotesisIncorrectas = 0;

  experimentosCompletados = 0;

  inicioSesionMs = 0;

  inicioExperimentoMs = 0;

  tiemposDescubrimiento: number[] = [];

  puntaje = 0;

  nivelSugerido: NivelLab | null = null;

  resultadoFinal:
    LabResultadoResponse | null = null;

  errorApi = '';

  mascotMood: MascotMood = 'idle';

  mascotMsg =
    '¡Hola! Soy Buddy 🐶. Vamos a descubrir reglas mezclando ingredientes.';

  readonly niveles: {
    id: NivelLab;
    label: string;
    emoji: string;
    desc: string;
  }[] = [
    {
      id: 'FACIL',
      label: 'Fácil',
      emoji: '🟢',
      desc:
        '4 ingredientes · 2 experimentos'
    },
    {
      id: 'MEDIO',
      label: 'Medio',
      emoji: '🟡',
      desc:
        '5 ingredientes · 3 experimentos'
    },
    {
      id: 'DIFICIL',
      label: 'Difícil',
      emoji: '🟠',
      desc:
        '6 ingredientes · menos pistas'
    },
    {
      id: 'EXPERTO',
      label: 'Experto',
      emoji: '🔴',
      desc:
        '6 ingredientes · 4 experimentos'
    }
  ];

  private mascotTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private cargaTimer:
    ReturnType<typeof setInterval> | null =
    null;

  private cambioPantallaTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private mezclaTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private audioCtx: AudioContext | null =
    null;

  private readonly destruir$ =
    new Subject<void>();

  constructor(
    private readonly service:
    LabCienciasService,

    private readonly profileService:
    ChildProfileService,

    private readonly router:
    Router,

    private readonly cdr:
    ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.profileService.activeProfile$
      .pipe(
        takeUntil(this.destruir$)
      )
      .subscribe(state => {
        if (!state.profileId) {
          this.router.navigate([
            '/padre/perfiles/selector'
          ]);

          return;
        }

        this.perfilId = state.profileId;
      });
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();

    this.limpiarTemporizadores();

    if (
      this.audioCtx
      && this.audioCtx.state !== 'closed'
    ) {
      void this.audioCtx.close();
    }

    window.speechSynthesis?.cancel();
  }

  seleccionarNivel(
    nivel: NivelLab
  ): void {
    this.nivelActual = nivel;
  }

  iniciarJuego(
    nivel: NivelLab = this.nivelActual
  ): void {
    if (!this.perfilId) {
      this.errorApi =
        'No hay un perfil infantil activo. Selecciona un perfil antes de iniciar.';

      return;
    }

    this.limpiarTemporizadores();

    this.nivelActual = nivel;

    this.estado = 'cargando';

    this.progresoCarga = 0;

    this.errorApi = '';

    this.cargandoTexto =
      'Preparando ingredientes...';

    const config =
      this.service.generarConfig(nivel);

    this.ingredientes =
      config.ingredientes;

    this.experimentos =
      config.experimentos;

    this.nivelSugerido =
      config.siguiente;

    this.reiniciarEstadisticas();

    this.service
      .iniciarSesion(
        this.perfilId,
        nivel
      )
      .pipe(
        takeUntil(this.destruir$)
      )
      .subscribe({
        next: response => {
          this.sesionId =
            response.sesionId;

          this.animarCarga();
        },

        error: error => {
          console.error(
            'Error al iniciar Lab de Ciencias:',
            error
          );

          this.sesionId = null;

          this.errorApi =
            'No se pudo conectar con el backend. Verifica que Spring Boot esté ejecutándose.';

          this.estado = 'inicio';
        }
      });
  }

  private animarCarga(): void {
    const textos = [
      'Preparando ingredientes...',
      'Limpiando los tubos...',
      'Encendiendo el laboratorio...',
      '¡Todo listo!'
    ];

    let paso = 0;

    this.cargaTimer = setInterval(() => {
      this.progresoCarga = Math.min(
        100,
        this.progresoCarga + 10
      );

      paso = Math.min(
        textos.length - 1,
        Math.floor(
          this.progresoCarga / 30
        )
      );

      this.cargandoTexto =
        textos[paso];

      if (this.progresoCarga >= 100) {
        if (this.cargaTimer) {
          clearInterval(
            this.cargaTimer
          );

          this.cargaTimer = null;
        }

        this.cambioPantallaTimer =
          setTimeout(() => {
            this.estado = 'jugando';

            this.inicioSesionMs =
              Date.now();

            this.prepararExperimento();

            this.setMascot(
              'excited',
              '¡El laboratorio está listo! Lee el objetivo y formula tu hipótesis.'
            );

            this.cdr.detectChanges();
          }, 350);
      }
    }, 90);
  }

  private reiniciarEstadisticas(): void {
    this.experimentoActualIndex = 0;

    this.seleccionados = [];

    this.resultadoVisible = false;

    this.resultadoExitoso = false;

    this.intentosExperimento = 0;

    this.intentosTotales = 0;

    this.hipotesisCorrectas = 0;

    this.hipotesisIncorrectas = 0;

    this.experimentosCompletados = 0;

    this.tiemposDescubrimiento = [];

    this.puntaje = 0;

    this.resultadoFinal = null;
  }

  private prepararExperimento(): void {
    this.seleccionados = [];

    this.resultadoVisible = false;

    this.resultadoExitoso = false;

    this.mensajeResultado = '';

    this.explicacionActual = '';

    this.emojiResultado = '🧪';

    this.intentosExperimento = 0;

    this.inicioExperimentoMs =
      Date.now();
  }

  get experimentoActual():
    ExperimentoLab | null {
    return this.experimentos[
      this.experimentoActualIndex
      ] ?? null;
  }

  get progresoExperimentos(): number {
    if (!this.experimentos.length) {
      return 0;
    }

    return (
      this.experimentosCompletados
      / this.experimentos.length
    ) * 100;
  }

  get puedeMezclar(): boolean {
    return (
      this.seleccionados.length
      === this.cantidadIngredientesRequerida
      && !this.mezclando
      && !this.resultadoExitoso
    );
  }

  get mostrarPista(): boolean {
    if (this.nivelActual === 'FACIL') {
      return true;
    }

    if (
      this.nivelActual === 'MEDIO'
      && this.intentosExperimento >= 1
    ) {
      return true;
    }

    return (
      this.intentosExperimento >= 2
    );
  }

  get siguienteNivel():
    NivelLab | null {
    switch (this.nivelActual) {
      case 'FACIL':
        return 'MEDIO';

      case 'MEDIO':
        return 'DIFICIL';

      case 'DIFICIL':
        return 'EXPERTO';

      case 'EXPERTO':
        return null;
    }
  }

  seleccionarIngrediente(
    ingrediente: IngredienteLab
  ): void {
    if (
      this.mezclando
      || this.resultadoExitoso
    ) {
      return;
    }

    const index =
      this.seleccionados.findIndex(
        seleccionado =>
          seleccionado.id === ingrediente.id
      );

    if (index >= 0) {
      this.seleccionados.splice(
        index,
        1
      );

      return;
    }

    if (
      this.seleccionados.length
      >= this.cantidadIngredientesRequerida
    ) {
      this.seleccionados.shift();
    }

    this.seleccionados.push(
      ingrediente
    );

    this.playTone(
      420,
      0.08,
      'sine'
    );
  }

  onDragStart(
    event: DragEvent,
    ingrediente: IngredienteLab
  ): void {
    event.dataTransfer?.setData(
      'text/plain',
      ingrediente.id
    );

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed =
        'copy';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    const id =
      event.dataTransfer?.getData(
        'text/plain'
      );

    const ingrediente =
      this.ingredientes.find(
        item => item.id === id
      );

    if (ingrediente) {
      this.seleccionarIngrediente(
        ingrediente
      );
    }
  }

  permitirDrop(
    event: DragEvent
  ): void {
    event.preventDefault();
  }

  quitarSeleccionado(
    index: number
  ): void {
    if (this.mezclando) {
      return;
    }

    this.seleccionados.splice(
      index,
      1
    );
  }

  mezclar(): void {
    if (
      !this.puedeMezclar
      || !this.experimentoActual
      || this.sesionId === null
    ) {
      return;
    }

    const seleccionados =
      [...this.seleccionados];

    this.mezclando = true;
    this.resultadoVisible = false;
    this.errorApi = '';

    this.intentosExperimento++;
    this.intentosTotales++;

    const idsSeleccionados =
      seleccionados
        .map(ingrediente =>
          ingrediente.id
            .trim()
            .toLowerCase()
        )
        .sort();

    const idsCorrectos =
      this.combinacionCorrectaActual
        .map(id =>
          id.trim().toLowerCase()
        )
        .sort();

    const exito =
      idsSeleccionados.length
      === idsCorrectos.length
      && idsCorrectos.every(
        (id, index) =>
          id === idsSeleccionados[index]
      );

    const tiempoIntento =
      Date.now()
      - this.inicioExperimentoMs;

    const request:
      RegistrarIntentoRequest = {
      numeroExperimento:
        this.experimentoActualIndex + 1,

      experimentoCodigo:
      this.experimentoActual.id,

      ingredientes:
      idsSeleccionados,

      exitoso:
      exito,

      tiempoIntentoMs:
      tiempoIntento,

      intentosAcumuladosExperimento:
      this.intentosExperimento,

      nivel:
      this.nivelActual
    };

    this.mezclaTimer =
      setTimeout(() => {
        this.mezclaTimer = null;
        this.mezclando = false;

        this.mostrarResultado(
          exito,
          tiempoIntento
        );

        this.service
          .registrarIntento(
            this.sesionId!,
            request
          )
          .pipe(
            takeUntil(
              this.destruir$
            )
          )
          .subscribe({
            next: response => {
              this.nivelSugerido =
                response.nivelSugerido;
            },

            error: error => {
              console.error(
                'Error al registrar intento:',
                error.error ?? error
              );

              this.errorApi =
                'El resultado se mostró, pero el intento no pudo guardarse.';
            }
          });

        this.cdr.detectChanges();
      }, 550);
  }

  private mostrarResultado(
    exito: boolean,
    tiempoDescubrimiento: number
  ): void {
    const experimento =
      this.experimentoActual;

    if (!experimento) {
      return;
    }

    this.resultadoVisible = true;
    this.resultadoExitoso = exito;

    if (exito) {
      this.hipotesisCorrectas++;
      this.experimentosCompletados++;

      this.tiemposDescubrimiento.push(
        tiempoDescubrimiento
      );

      this.mensajeResultado =
        experimento.resultadoExito;

      this.emojiResultado =
        experimento.emojiResultado;

      this.explicacionActual =
        experimento
          .explicacionCientifica[
          this.nivelActual
          ];

      this.puntaje += Math.max(
        100,
        500 -
        (
          this.intentosExperimento - 1
        ) * 80
      );

      this.playSuccess();

      this.setMascot(
        'celebrate',
        '¡Hipótesis correcta! Observa el resultado y lee la explicación científica.'
      );

      this.hablar(
        this.explicacionActual
      );

      return;
    }

    this.hipotesisIncorrectas++;

    this.mensajeResultado =
      'La mezcla no produjo el efecto esperado. Cambia uno de los ingredientes y vuelve a probar.';

    this.emojiResultado = '💨';

    this.explicacionActual =
      'Un resultado que no funciona también aporta evidencia: ahora sabes que esta pareja no cumple la regla.';

    this.playError();

    this.setMascot(
      'encourage',
      '¡Buen intento! En ciencia, cada fallo ayuda a descartar una hipótesis.'
    );
  }

  continuar(): void {
    if (!this.resultadoExitoso) {

      this.seleccionados = [];

      this.resultadoVisible = false;
      this.resultadoExitoso = false;

      this.mensajeResultado = '';
      this.explicacionActual = '';
      this.emojiResultado = '🧪';

      this.setMascot(
        'thinking',
        'Cambia los ingredientes y prueba una hipótesis diferente.'
      );

      this.cdr.detectChanges();

      return;
    }

    if (
      this.experimentoActualIndex + 1
      < this.experimentos.length
    ) {
      this.experimentoActualIndex++;

      this.prepararExperimento();

      this.setMascot(
        'thinking',
        'Nuevo experimento: observa las pistas y prueba una combinación diferente.'
      );

      return;
    }

    this.finalizarJuego();
  }

  private finalizarJuego(): void {
    if (this.sesionId === null) {
      return;
    }

    const request:
      FinalizarLabRequest = {
      experimentosCompletados:
      this.experimentosCompletados,

      hipotesisCorrectas:
      this.hipotesisCorrectas,

      hipotesisIncorrectas:
      this.hipotesisIncorrectas,

      intentosTotales:
      this.intentosTotales,

      tiempoTotalMs:
        Math.max(
          0,
          Date.now()
          - this.inicioSesionMs
        ),

      nivelFinal:
      this.nivelActual
    };

    this.estado = 'completado';
    this.confettiActivo = true;
    this.playComplete();

    this.service
      .finalizarSesion(
        this.sesionId,
        request
      )
      .pipe(
        takeUntil(
          this.destruir$
        )
      )
      .subscribe({
        next: resultado => {
          this.resultadoFinal =
            resultado;

          this.puntaje =
            resultado.puntaje;

          this.nivelSugerido =
            resultado.nivelSugerido;
        },

        error: error => {
          console.error(
            'Error al finalizar sesión:',
            error.error ?? error
          );

          this.errorApi =
            error.error?.error
            ?? 'La partida terminó, pero no se pudo guardar el resumen final.';
        }
      });
  }

  setMascot(
    mood: MascotMood,
    message: string,
    duracionMs = 4200
  ): void {
    if (this.mascotTimer) {
      clearTimeout(
        this.mascotTimer
      );
    }

    this.mascotMood = mood;

    this.mascotMsg = message;

    this.mascotTimer =
      setTimeout(() => {
        this.mascotMood = 'idle';

        this.mascotMsg =
          '💡 Combina dos ingredientes y observa qué evidencia aparece.';
      }, duracionMs);
  }

  toggleSonido(): void {
    this.sonidoActivo =
      !this.sonidoActivo;

    if (!this.sonidoActivo) {
      window.speechSynthesis?.cancel();
    }
  }

  jugarDeNuevo(): void {
    this.iniciarJuego(
      this.nivelActual
    );
  }

  subirNivel(): void {
    const siguiente =
      this.siguienteNivel;

    if (!siguiente) {
      return;
    }

    this.confettiActivo = false;

    this.iniciarJuego(
      siguiente
    );
  }

  volverInicio(): void {
    this.limpiarTemporizadores();

    window.speechSynthesis?.cancel();

    this.estado = 'inicio';

    this.sesionId = null;

    this.errorApi = '';
  }

  volverLobby(): void {
    this.router.navigate([
      '/nino/juegos'
    ]);
  }

  nivelLabel(
    nivel: NivelLab | null =
    this.nivelActual
  ): string {
    return this.niveles.find(
      opcion =>
        opcion.id === nivel
    )?.label ?? 'Fácil';
  }

  promedioIntentos(): string {
    if (!this.experimentosCompletados) {
      return '0.0';
    }

    return (
      this.intentosTotales
      / this.experimentosCompletados
    ).toFixed(1);
  }

  tiempoPromedio(): string {
    if (
      !this.tiemposDescubrimiento.length
    ) {
      return '0 s';
    }

    const total =
      this.tiemposDescubrimiento.reduce(
        (acumulado, tiempo) =>
          acumulado + tiempo,
        0
      );

    const promedio =
      total
      / this.tiemposDescubrimiento.length;

    return `${Math.round(
      promedio / 1000
    )} s`;
  }

  private getAudio():
    AudioContext | null {
    if (!this.sonidoActivo) {
      return null;
    }

    this.audioCtx ??=
      new AudioContext();

    if (
      this.audioCtx.state === 'suspended'
    ) {
      void this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  private playTone(
    frecuencia: number,
    duracion: number,
    tipo: OscillatorType = 'sine',
    retraso = 0
  ): void {
    const contexto =
      this.getAudio();

    if (!contexto) {
      return;
    }

    const oscilador =
      contexto.createOscillator();

    const ganancia =
      contexto.createGain();

    oscilador.frequency.value =
      frecuencia;

    oscilador.type = tipo;

    ganancia.gain.value = 0.12;

    oscilador.connect(ganancia);

    ganancia.connect(
      contexto.destination
    );

    const inicio =
      contexto.currentTime
      + retraso;

    oscilador.start(inicio);

    ganancia.gain
      .exponentialRampToValueAtTime(
        0.001,
        inicio + duracion
      );

    oscilador.stop(
      inicio + duracion
    );
  }

  private playSuccess(): void {
    [
      523,
      659,
      784
    ].forEach(
      (frecuencia, indice) => {
        this.playTone(
          frecuencia,
          0.22,
          'sine',
          indice * 0.1
        );
      }
    );
  }

  private playComplete(): void {
    [
      523,
      659,
      784,
      1047
    ].forEach(
      (frecuencia, indice) => {
        this.playTone(
          frecuencia,
          0.3,
          'triangle',
          indice * 0.12
        );
      }
    );
  }

  private playError(): void {
    this.playTone(
      220,
      0.25,
      'sawtooth'
    );
  }

  private hablar(
    texto: string
  ): void {
    if (
      !this.sonidoActivo
      || !(
        'speechSynthesis'
        in window
      )
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const voz =
      new SpeechSynthesisUtterance(
        texto
      );

    voz.lang = 'es-ES';

    voz.rate = 0.92;

    window.speechSynthesis.speak(
      voz
    );
  }

  private limpiarTemporizadores(): void {
    if (this.cargaTimer) {
      clearInterval(
        this.cargaTimer
      );

      this.cargaTimer = null;
    }

    if (this.mascotTimer) {
      clearTimeout(
        this.mascotTimer
      );

      this.mascotTimer = null;
    }

    if (this.cambioPantallaTimer) {
      clearTimeout(
        this.cambioPantallaTimer
      );

      this.cambioPantallaTimer = null;
    }

    if (this.mezclaTimer) {
      clearTimeout(
        this.mezclaTimer
      );

      this.mezclaTimer = null;
    }
  }
}
