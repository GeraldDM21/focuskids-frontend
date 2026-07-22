import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { VolumeControlComponent } from '../../../../shared/game-feedback/volume-control.component';
import { GameFeedbackService, NivelVolumen } from '../../../../shared/game-feedback/game-feedback.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';

type Estado = 'inicio' | 'lectura' | 'pregunta' | 'resultados';
type Mood   = 'idle' | 'thinking' | 'celebrate' | 'encourage';

interface Pregunta {
  texto:    string;
  opciones: string[];
  correcta: number;     // índice de la opción correcta
  pista:    string;
  tipo:     string;     // causal | emotiva | referencial | predictiva | filosófica
}

interface Historia {
  id:        number;
  nivel:     number;
  titulo:    string;
  texto:     string;
  preguntas: Pregunta[];
}

// ─── Banco de historias ────────────────────────────────────────────────────────

const HISTORIAS: Historia[] = [
  // ── Nivel 1 ──────────────────────────────────────────────────────────────────
  {
    id: 1, nivel: 1,
    titulo: 'El perro guardián',
    texto:
      'Marco tenía un perro llamado Canela. Cada noche, Canela rondaba la casa y gruñía si escuchaba ruidos extraños. Una tarde, los papás de Marco salieron al supermercado y Marco se quedó solo por primera vez.\n\n' +
      'Cuando el sol se ocultó, Marco sintió escalofríos. Se metió en su cuarto y apagó la luz. De repente, escuchó un ruido en la cocina. Se tapó con las cobijas, muy asustado.\n\n' +
      'Segundos después, sintió algo cálido y peludo subir a su cama. Era Canela, que había ido a hacerle compañía. Marco exhaló despacio y sonrió. Ya no estaba solo.',
    preguntas: [
      {
        // Correcta → B
        texto:    '¿Por qué Marco sintió escalofríos cuando el sol se ocultó?',
        opciones: ['Porque tenía frío en su cuarto', 'Porque era la primera vez que se quedaba solo en casa', 'Porque escuchó un ruido extraño'],
        correcta: 1,
        pista:    'El cuento dice que era la primera vez que sus papás lo dejaban solo. ¿Qué puede sentir alguien en una situación nueva y desconocida?',
        tipo:     'causal'
      },
      {
        // Correcta → C
        texto:    '¿Cómo supo Marco que lo que subió a su cama era Canela?',
        opciones: ['Porque prendió la luz del cuarto', 'Porque reconoció su ladrido', 'Porque sintió algo cálido y peludo'],
        correcta: 2,
        pista:    'Lee de nuevo qué sintió Marco cuando algo subió a su cama. ¿Qué palabras usa el cuento para describirlo?',
        tipo:     'referencial'
      },
      {
        // Correcta → A  (reordenado: correcto primero)
        texto:    '¿Por qué Marco sonrió al final del cuento?',
        opciones: ['Porque Canela vino a acompañarlo y ya no estaba solo', 'Porque sus papás habían llegado a casa', 'Porque el ruido resultó ser el viento'],
        correcta: 0,
        pista:    'El cuento termina con las palabras "Ya no estaba solo." ¿Quién lo hizo sentir acompañado?',
        tipo:     'emotiva'
      }
    ]
  },

  // ── Nivel 2 ──────────────────────────────────────────────────────────────────
  {
    id: 2, nivel: 2,
    titulo: 'La nota de música',
    texto:
      'Andrea llevaba semanas practicando para el recital de piano. Cada tarde, después de la escuela, se sentaba al piano y repetía la misma pieza una y otra vez. Su hermano menor, Tomás, siempre la escuchaba desde el pasillo.\n\n' +
      'Pero el día del recital, cuando Andrea puso los dedos en las teclas, su mente quedó en blanco. Las notas que tanto había practicado desaparecieron. Sintió que su corazón latía muy fuerte. Cerró los ojos un momento.\n\n' +
      'Entonces escuchó, muy bajito, a alguien tararear la melodía desde las filas del público. Era Tomás, mirándola fijamente con los ojos muy abiertos. Algo se acomodó dentro de Andrea. Puso los dedos en las teclas y tocó perfectamente, sin equivocarse ni una sola vez.',
    preguntas: [
      {
        // Correcta → C  (reordenado: correcto al final)
        texto:    '¿Por qué la mente de Andrea "quedó en blanco" frente al piano?',
        opciones: ['Porque no había practicado suficiente', 'Porque olvidó sus partituras en casa', 'Porque los nervios del recital la bloquearon'],
        correcta: 2,
        pista:    'El cuento dice que Andrea practicó durante semanas. Si sabía bien las notas, ¿qué pudo haberla bloqueado de repente frente a tanto público?',
        tipo:     'causal'
      },
      {
        // Correcta → A  (reordenado: correcto primero)
        texto:    '¿Por qué Tomás tarareó la melodía desde el público?',
        opciones: ['Para ayudar a Andrea a recordar la canción', 'Porque le gustaba llamar la atención', 'Porque no sabía que debía guardar silencio'],
        correcta: 0,
        pista:    'Tomás escuchaba a Andrea practicar todos los días. Cuando la vio bloqueada, ¿qué crees que quiso hacer para ayudarla?',
        tipo:     'predictiva'
      },
      {
        // Correcta → B  (sin cambios)
        texto:    '¿Qué significa que "algo se acomodó dentro de Andrea"?',
        opciones: ['Que se acomodó mejor en la silla del piano', 'Que recuperó la calma y la confianza para tocar', 'Que recordó las notas como por arte de magia'],
        correcta: 1,
        pista:    'Esta es una expresión que describe un sentimiento, no un movimiento físico. ¿Cómo estaba Andrea antes y cómo quedó después de escuchar a su hermano?',
        tipo:     'emotiva'
      }
    ]
  },

  // ── Nivel 3 ──────────────────────────────────────────────────────────────────
  {
    id: 3, nivel: 3,
    titulo: 'El árbol de los sueños',
    texto:
      'En el centro del barrio donde vivía Rosa había un árbol enorme. Los vecinos más viejos decían que ese árbol había estado ahí desde antes de que construyeran las primeras casas. Algunos aseguraban que si le pedías un deseo sincero, lo concedía.\n\n' +
      'Rosa no lo creía. Tenía doce años y ya no creía en esas cosas. Pero una tarde, después de recibir una mala nota en matemáticas, caminó hasta el árbol sin pensarlo. Se sentó bajo su sombra durante mucho tiempo, pensando en sus errores.\n\n' +
      'Cuando se levantó para irse, notó algo grabado en la corteza: muchos nombres de personas, algunos con fechas de hace décadas. Eran los nombres de quienes, como ella, habían ido a pensar bajo ese árbol.\n\n' +
      'Rosa tocó la corteza fría. Entendió que el árbol no concedía deseos, pero sí ofrecía algo igual de valioso: un lugar tranquilo para pensar con claridad y encontrar las propias respuestas.',
    preguntas: [
      {
        // Correcta → C  (reordenado: correcto al final)
        texto:    '¿Por qué Rosa fue al árbol esa tarde "sin pensarlo"?',
        opciones: ['Porque quería pedir un deseo al árbol', 'Porque tenía costumbre de caminar por el barrio', 'Porque necesitaba un lugar tranquilo para procesar sus sentimientos'],
        correcta: 2,
        pista:    'Rosa no creía en los poderes del árbol. Pero acababa de tener un momento difícil con su nota. ¿Qué suele necesitar alguien cuando está molesto o triste?',
        tipo:     'causal'
      },
      {
        // Correcta → A  (reordenado: correcto primero)
        texto:    '¿Qué significaban los nombres grabados en el árbol?',
        opciones: ['Que otras personas también habían ido ahí a reflexionar en momentos difíciles', 'Que la gente había dañado el árbol al grabarlo', 'Que el árbol guardaba un registro mágico de sus visitantes'],
        correcta: 0,
        pista:    'Rosa fue al árbol después de un momento difícil. Los nombres tenían fechas muy antiguas. ¿Qué crees que llevó a todas esas personas a visitar ese mismo árbol?',
        tipo:     'referencial'
      },
      {
        // Correcta → B  (reordenado: correcto en medio)
        texto:    '¿Qué aprendió Rosa sobre el verdadero valor del árbol?',
        opciones: ['Que los poderes del árbol eran un mito sin ningún valor real', 'Que su valor era dar un espacio de calma para pensar y encontrar las propias respuestas', 'Que tenía poderes mágicos pero solo para quien lo visitaba de verdad'],
        correcta: 1,
        pista:    'Lee la última frase del cuento. Rosa dice que el árbol no concedía deseos, pero ofrecía algo "igual de valioso". ¿Qué era ese algo?',
        tipo:     'filosófica'
      }
    ]
  }
];

const TIPO_LABELS: Record<string, string> = {
  causal:      'Causas y consecuencias',
  emotiva:     'Emociones y sentimientos',
  referencial: 'Información del texto',
  predictiva:  'Predicción de intenciones',
  filosófica:  'Significados profundos',
};

const TIPO_TIPS: Record<string, string> = {
  causal:      'Practica preguntarte: ¿Por qué pasó esto?',
  emotiva:     'Practica preguntarte: ¿Cómo se siente este personaje?',
  referencial: 'Practica buscar pistas dentro del texto antes de responder.',
  predictiva:  'Practica preguntarte: ¿Qué crees que hará o pensará este personaje?',
  filosófica:  'Practica preguntarte: ¿Qué quiso decir el autor con esto?',
};

// ─── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-historia-viva',
  standalone: true,
  imports: [CommonModule, GameFeedbackComponent, VolumeControlComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './historia-viva.component.html',
  styleUrl: './historia-viva.component.scss'
})
export class HistoriaVivaComponent implements OnInit, OnDestroy {

  readonly LETRAS = ['A', 'B', 'C'];

  // ── Estado del juego ────────────────────────────────────────────────────────
  estado:          Estado  = 'inicio';
  nivelActual              = 1;
  historiaActual:  Historia | null = null;
  preguntaIdx              = 0;
  modoRelectura            = false;

  // ── Estado de la pregunta ───────────────────────────────────────────────────
  respuestaSeleccionada: number | null = null;
  respondioCorrectamente: boolean | null = null;
  opcionesErradas:        number[]      = [];
  mostrandoPista          = false;
  mostrandoTexto          = false;

  // ── Métricas (CA-04) ────────────────────────────────────────────────────────
  tiempoInicioLectura = 0;
  tiempoLectura       = 0;   // segundos
  usoAudio            = 0;
  releidasCount       = 0;
  preguntasCorrectas  = 0;
  intentosTotales     = 0;
  tiposErradas:       string[] = [];

  // ── Mascota ─────────────────────────────────────────────────────────────────
  mascotMsg  = '¡Hola! Soy Benny 🐰 ¡Hoy te voy a contar una historia increíble! 📖';
  mascotMood: Mood = 'idle';

  // ── Audio ───────────────────────────────────────────────────────────────────
  voiceEnabled = true;
  leyendoAudio = false;

  // ── Confetti (celebración final) ──────────────────────────────────────────
  confettiPieces: { id:number; left:number; color:string; delay:number; dur:number; size:number }[] = [];

  private audioCtx: AudioContext | null = null;

  // ── Retroalimentación visual/sonora (CA-01..CA-06) ─────────────────────
  @ViewChild('feedback') feedback!: GameFeedbackComponent;
  volumenActual: NivelVolumen = 75;
  mostrarCorrectaTemporal = false; // CA-03: resalta la opción correcta 1.5s
  private profileId: number | null = null;
  private skipResolver: (() => void) | null = null;

  // ── Backend session tracking ──
  private readonly JUEGO_ID = 12;  // "Historia Viva" es ID 12 en el seeder
  private sesionBackendId: number | null = null;
  private nivelFacilId: number | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private feedbackService: GameFeedbackService,
    private childProfileService: ChildProfileService,
    private sesionService: SesionJuegoService,
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
      this.profileId = state.profileId;
      this.volumenActual = (state.profileVolumen ?? 75) as NivelVolumen;
      this.feedbackService.setVolumen(this.volumenActual);
    });
    this.sesionService.obtenerNiveles(this.JUEGO_ID).subscribe({
      next: niveles => { this.nivelFacilId = niveles[0]?.id ?? null; },
      error: () => {}
    });
  }

  private iniciarSesionBackend(): void {
    if (!this.profileId || !this.nivelFacilId) return;
    this.sesionService.iniciarSesion({
      perfilId: this.profileId,
      juegoId:  this.JUEGO_ID,
      nivelId:  this.nivelFacilId,
    }).subscribe({
      next: sesion => { this.sesionBackendId = sesion.id; },
      error: () => {}
    });
  }

  private finalizarSesionBackend(): void {
    if (!this.sesionBackendId) return;
    this.sesionService.finalizarSesion(this.sesionBackendId, this.puntuacion).subscribe({
      next: () => { this.sesionBackendId = null; },
      error: () => {}
    });
  }

  // ── Volumen (CA-05) ─────────────────────────────────────────────────────

  onVolumenChange(v: NivelVolumen): void {
    this.volumenActual = v;
    this.feedbackService.setVolumen(v);
    if (this.profileId != null) {
      this.childProfileService.updateVolumen(this.profileId, v).subscribe();
    }
  }

  ngOnDestroy(): void {
    window.speechSynthesis?.cancel();
    this.audioCtx?.close();
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  get parrafos(): string[] {
    return (this.historiaActual?.texto ?? '').split('\n').filter(p => p.trim());
  }

  get preguntaActual(): Pregunta | null {
    return this.historiaActual?.preguntas[this.preguntaIdx] ?? null;
  }

  get tipoLabel(): string {
    return TIPO_LABELS[this.preguntaActual?.tipo ?? ''] ?? '';
  }

  get puntuacion(): number {
    const total = this.historiaActual?.preguntas.length ?? 1;
    return Math.round((this.preguntasCorrectas / total) * 100);
  }

  get trofeoEmoji(): string {
    return this.puntuacion >= 90 ? '🏆' : this.puntuacion >= 70 ? '🥈' : this.puntuacion >= 40 ? '🥉' : '🌟';
  }

  get tituloFinal(): string {
    return this.puntuacion >= 90 ? '¡Comprensión de élite!' :
           this.puntuacion >= 70 ? '¡Muy buena comprensión!' :
           this.puntuacion >= 40 ? '¡Buen esfuerzo!' : '¡Sigue practicando!';
  }

  get tiempoLecturaFmt(): string {
    const m = Math.floor(this.tiempoLectura / 60);
    const s = this.tiempoLectura % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  // CA-06: resumen de tipos de inferencia
  get tiposInferencia(): { tipo:string; label:string; errada:boolean; tip:string }[] {
    if (!this.historiaActual) return [];
    const tipos = [...new Set(this.historiaActual.preguntas.map(p => p.tipo))];
    return tipos.map(t => ({
      tipo: t,
      label: TIPO_LABELS[t] ?? t,
      errada: this.tiposErradas.includes(t),
      tip: TIPO_TIPS[t] ?? '',
    }));
  }

  // ── Flujo principal ─────────────────────────────────────────────────────────

  iniciarLectura(): void {
    this.initAudio();
    this.sesionBackendId = null;
    this.iniciarSesionBackend();
    const historia = HISTORIAS.find(h => h.nivel === this.nivelActual) ?? HISTORIAS[0];
    this.historiaActual    = historia;
    this.modoRelectura     = false;
    this.estado            = 'lectura';
    this.tiempoInicioLectura = Date.now();
    this.usoAudio          = 0;
    this.releidasCount     = 0;
    this.preguntasCorrectas = 0;
    this.intentosTotales   = 0;
    this.tiposErradas      = [];
    this.leyendoAudio      = false;
    this.setMascota('thinking', '¡Tómate el tiempo que necesites para leer! 📖');
    this.cdr.detectChanges();
  }

  iniciarPreguntas(): void {
    window.speechSynthesis?.cancel();
    this.leyendoAudio  = false;
    this.tiempoLectura = Math.round((Date.now() - this.tiempoInicioLectura) / 1000);
    this.preguntaIdx   = 0;
    this.estado        = 'pregunta';
    this.resetPregunta();
    this.setMascota('thinking', '¡Piensa bien antes de responder! 🤔');
    this.cdr.detectChanges();
  }

  seleccionarOpcion(idx: number): void {
    if (this.opcionesErradas.includes(idx)) return;
    if (this.respondioCorrectamente === true)  return;

    // CA-01: se marca el inicio justo en el input; el cálculo correcto/incorrecto es 100% local.
    const t0 = this.feedbackService.marcarInicio();

    this.respuestaSeleccionada = idx;
    const correcto = idx === (this.preguntaActual?.correcta ?? -1);
    this.respondioCorrectamente = correcto;

    if (correcto) {
      this.preguntasCorrectas++;
      this.setMascota('celebrate', this.pick(['¡CORRECTO! ¡Eres genial! 🎉', '¡Perfecto! ¡Lo sabías! ⭐', '¡Muy bien! ¡Sigue así! 🏆']));
      this.feedback.showCorrect(); // CA-02
      this.cdr.detectChanges();
      this.feedbackService.registrarLatencia(t0);

      const speech = this.hablar('¡Correcto!');
      const pause  = this.crearPausaCancelable(1200); // CA-06: se puede saltar con un clic
      Promise.all([speech, pause]).then(() => {
        this.siguientePregunta();
        this.cdr.detectChanges();
      });

    } else {
      this.intentosTotales++;
      this.opcionesErradas.push(idx);
      this.mostrandoPista = true;
      const tipo = this.preguntaActual?.tipo ?? '';
      if (!this.tiposErradas.includes(tipo)) this.tiposErradas.push(tipo);
      this.respuestaSeleccionada = null;
      this.respondioCorrectamente = null;
      this.setMascota('encourage', '¡Casi! Lee la pista de abajo 💡');
      this.feedback.showIncorrect(); // CA-03/CA-04 (la pista propia de este juego ya se muestra abajo)
      // CA-03: resalta la opción correcta en verde por 1.5s
      this.mostrarCorrectaTemporal = true;
      this.cdr.detectChanges();
      this.feedbackService.registrarLatencia(t0);
      setTimeout(() => { this.mostrarCorrectaTemporal = false; this.cdr.detectChanges(); }, 1500);
      this.hablar('¡Casi! Lee la pista.');
    }
  }

  // ── CA-06: skip de la animación de transición tras responder correcto ───

  private crearPausaCancelable(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setTimeout(resolve, ms);
      this.skipResolver = () => { clearTimeout(timer); resolve(); };
    });
  }

  saltarSiEsPosible(): void {
    if (this.skipResolver) {
      const resolver = this.skipResolver;
      this.skipResolver = null;
      resolver();
    }
  }

  private siguientePregunta(): void {
    if (!this.historiaActual) return;
    if (this.preguntaIdx + 1 < this.historiaActual.preguntas.length) {
      this.preguntaIdx++;
      this.resetPregunta();
      this.setMascota('thinking', this.pick(['¿Y esta? ¡Tú puedes! 💪', '¡Siguiente pregunta! 🎯', '¡Vamos con la siguiente! 🧠']));
    } else {
      this.terminarJuego();
    }
    this.cdr.detectChanges();
  }

  private terminarJuego(): void {
    // Ajuste adaptativo de nivel (CA-03)
    const rate = this.puntuacion;
    if (rate >= 70 && this.nivelActual < 3) this.nivelActual++;
    else if (rate < 40 && this.nivelActual > 1) this.nivelActual--;

    this.confettiPieces = this.generarConfeti();
    this.estado = 'resultados';
    this.finalizarSesionBackend();
    this.tocarFanfare();

    const msg = rate >= 70
      ? `¡Excelente! Respondiste ${this.preguntasCorrectas} de ${this.historiaActual?.preguntas.length} preguntas. Tu comprensión lectora es muy buena. 🧠✨`
      : rate >= 40
        ? `¡Buen trabajo! Respondiste ${this.preguntasCorrectas} de ${this.historiaActual?.preguntas.length}. Con práctica cada vez será mejor. 💪`
        : `¡No te rindas! Cada lectura fortalece tu comprensión. ¡Inténtalo de nuevo! 💖`;

    this.setMascota('celebrate', msg);
    this.cdr.detectChanges();
    setTimeout(() => {
      const txt = (this.tituloFinal + '. ' + msg).replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
      this.hablar(txt, 0.88, 1.1);
    }, 800);
  }

  jugarDeNuevo(): void {
    window.speechSynthesis?.cancel();
    this.estado = 'inicio';
    this.cdr.detectChanges();
  }

  volver(): void {
    window.speechSynthesis?.cancel();
    this.router.navigate(['/nino/juegos']);
  }

  // ── Re-leer ─────────────────────────────────────────────────────────────────

  toggleReleer(): void {
    if (!this.mostrandoTexto) this.releidasCount++;
    this.mostrandoTexto = !this.mostrandoTexto;
    this.cdr.detectChanges();
  }

  // ── Audio TTS ────────────────────────────────────────────────────────────────

  toggleVoz(): void {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) { window.speechSynthesis?.cancel(); this.leyendoAudio = false; }
    this.cdr.detectChanges();
  }

  leerHistoria(): void {
    if (!this.historiaActual) return;
    this.usoAudio++;
    this.leyendoAudio = true;
    this.cdr.detectChanges();
    const utt = new SpeechSynthesisUtterance(this.historiaActual.texto.replace(/\n/g, ' '));
    utt.lang  = 'es-ES'; utt.rate = 0.88; utt.pitch = 1.0; utt.volume = 0.95;
    utt.onend = () => { this.leyendoAudio = false; this.cdr.detectChanges(); };
    utt.onerror = () => { this.leyendoAudio = false; this.cdr.detectChanges(); };
    window.speechSynthesis?.cancel();
    if (this.voiceEnabled) window.speechSynthesis?.speak(utt);
    else { this.leyendoAudio = false; this.cdr.detectChanges(); }
  }

  detenerAudio(): void {
    window.speechSynthesis?.cancel();
    this.leyendoAudio = false;
    this.cdr.detectChanges();
  }

  private hablar(texto: string, rate = 0.92, pitch = 1.15): Promise<void> {
    if (!this.voiceEnabled || !window.speechSynthesis) return Promise.resolve();
    return new Promise(resolve => {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(texto);
        utt.lang = 'es-ES'; utt.volume = 0.9; utt.rate = rate; utt.pitch = pitch;
        utt.onend = () => resolve(); utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      } catch (_) { resolve(); }
    });
  }

  // ── Audio Web API ────────────────────────────────────────────────────────────

  private initAudio(): void {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private tocar(freq: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.3): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      osc.start(); osc.stop(this.audioCtx.currentTime + dur + 0.05);
    } catch (_) {}
  }

  // Los sonidos de acierto/error del CA-04 ahora los reproduce GameFeedbackService (assets OGG/MP3).
  private tocarFanfare(): void { [523,659,784,880,1047].forEach((f,i) => setTimeout(() => this.tocar(f, 0.3, 'sine', 0.35), i * 120)); }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private setMascota(mood: Mood, msg: string): void {
    this.mascotMood = mood; this.mascotMsg = msg;
  }

  private resetPregunta(): void {
    this.respuestaSeleccionada  = null;
    this.respondioCorrectamente = null;
    this.opcionesErradas        = [];
    this.mostrandoPista         = false;
    this.mostrandoTexto         = false;
    this.mostrarCorrectaTemporal = false;
    this.skipResolver           = null;
  }

  private generarConfeti() {
    const colores = ['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#34d399','#fb923c'];
    return Array.from({ length: 32 }, (_, i) => ({
      id: i, left: Math.random() * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 500, dur: 1400 + Math.random() * 800,
      size: 6 + Math.random() * 9,
    }));
  }

  private pick(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)]; }
}
