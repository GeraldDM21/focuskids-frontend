import { Injectable } from '@angular/core';

// Historia: "Retroalimentación visual y sonora en tiempo real durante el juego"
// Servicio compartido por los 12 juegos (hoy: Espejo Mental e Historia Viva).
// Se encarga de: reproducir los efectos de sonido de acierto/error respetando
// el volumen persistido por perfil (CA-05), elegir los textos aleatorios
// (CA-02/CA-03) y medir la latencia input -> feedback visible (CA-01).

export type NivelVolumen = 0 | 25 | 50 | 75 | 100;

const AUDIO_BASE = 'assets/audio/';

const CORRECT_FILES = ['correct-1', 'correct-2', 'correct-3'];
const INCORRECT_FILES = ['incorrect-1', 'incorrect-2'];

// CA-02: 5 opciones de texto para respuesta correcta
export const TEXTOS_ACIERTO = [
  '¡Genial!',
  '¡Excelente!',
  '¡Perfecto!',
  '¡Muy bien!',
  '¡Increíble!',
];

// CA-03: 5 opciones de texto de aliento (nunca "Error"/"Fallaste"/"Incorrecto")
export const TEXTOS_ALIENTO = [
  '¡Casi lo tienes!',
  '¡Sigue intentando!',
  '¡Tú puedes!',
  '¡Un poco más!',
  '¡No te rindas!',
];

const PALABRAS_PROHIBIDAS = /error|fallaste|incorrecto/i;

@Injectable({ providedIn: 'root' })
export class GameFeedbackService {

  private volumen: NivelVolumen = 75;
  private correctPool: HTMLAudioElement[] = [];
  private incorrectPool: HTMLAudioElement[] = [];
  private latencias: number[] = []; // ms, buffer rotativo (últimas 50) — CA-01

  constructor() {
    this.correctPool = CORRECT_FILES.map(f => this.crearAudio(f));
    this.incorrectPool = INCORRECT_FILES.map(f => this.crearAudio(f));

    // Sanity check en desarrollo: ningún texto debe contener palabras prohibidas (CA-03)
    [...TEXTOS_ACIERTO, ...TEXTOS_ALIENTO].forEach(t => {
      if (PALABRAS_PROHIBIDAS.test(t)) {
        console.error(`[GameFeedback] Texto "${t}" contiene una palabra prohibida por CA-03`);
      }
    });
  }

  private crearAudio(nombreBase: string): HTMLAudioElement {
    const audio = new Audio();
    // Preferimos OGG si el navegador lo soporta, si no MP3 (CA-04)
    const soportaOgg = audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
    audio.src = `${AUDIO_BASE}${nombreBase}.${soportaOgg ? 'ogg' : 'mp3'}`;
    audio.preload = 'auto';
    audio.volume = this.volumen / 100;
    return audio;
  }

  /** CA-05: fija el volumen (0/25/50/75/100) para todos los efectos precargados. */
  setVolumen(v: NivelVolumen): void {
    this.volumen = v;
    [...this.correctPool, ...this.incorrectPool].forEach(a => (a.volume = v / 100));
  }

  getVolumen(): NivelVolumen {
    return this.volumen;
  }

  /** Reproduce un efecto de acierto al azar (clona el nodo para permitir solapes). */
  playCorrect(): void {
    this.playRandomFrom(this.correctPool);
  }

  /** Reproduce un efecto de error al azar (clona el nodo para permitir solapes). */
  playIncorrect(): void {
    this.playRandomFrom(this.incorrectPool);
  }

  private playRandomFrom(pool: HTMLAudioElement[]): void {
    if (this.volumen === 0 || pool.length === 0) return;
    const original = pool[Math.floor(Math.random() * pool.length)];
    const clon = original.cloneNode(true) as HTMLAudioElement;
    clon.volume = this.volumen / 100;
    clon.play().catch(() => { /* autoplay bloqueado: se ignora silenciosamente */ });
  }

  textoAcierto(): string {
    return TEXTOS_ACIERTO[Math.floor(Math.random() * TEXTOS_ACIERTO.length)];
  }

  textoAliento(): string {
    return TEXTOS_ALIENTO[Math.floor(Math.random() * TEXTOS_ALIENTO.length)];
  }

  // ── CA-01: instrumentación de latencia input -> feedback visible ──────────

  /** Llamar justo antes de calcular correcto/incorrecto (inicio del input del niño). */
  marcarInicio(): number {
    return performance.now();
  }

  /** Llamar justo después de disparar el feedback visual (mismo tick, sin awaits). */
  registrarLatencia(inicio: number): void {
    const ms = performance.now() - inicio;
    this.latencias.push(ms);
    if (this.latencias.length > 50) this.latencias.shift();
    if (this.latencias.length === 50) {
      const p95 = this.percentil95();
      if (p95 > 200) {
        console.warn(`[GameFeedback] CA-01: p95 de latencia = ${p95.toFixed(1)}ms (excede 200ms sobre 50 mediciones)`);
      }
    }
  }

  private percentil95(): number {
    const ordenado = [...this.latencias].sort((a, b) => a - b);
    const idx = Math.min(ordenado.length - 1, Math.ceil(0.95 * ordenado.length) - 1);
    return ordenado[idx];
  }

  /** Expuesto para debug/QA manual (consola del navegador). */
  getP95Debug(): { muestras: number; p95: number | null } {
    return { muestras: this.latencias.length, p95: this.latencias.length ? this.percentil95() : null };
  }
}
