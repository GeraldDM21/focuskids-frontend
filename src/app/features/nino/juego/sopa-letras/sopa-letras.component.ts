import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SopaLetrasService } from './sopa-letras.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { SopaLetrasConfig, PalabraColocada, Tema, Nivel } from './sopa-letras.model';

type Estado = 'inicio' | 'jugando' | 'completado' | 'tiempo-agotado';

@Component({
  selector: 'app-sopa-letras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sopa-letras.component.html',
  styleUrls: ['./sopa-letras.component.css']
})
export class SopaLetrasComponent implements OnInit, OnDestroy {

  // Estado general
  estado: Estado = 'inicio';
  temaSeleccionado: Tema = 'CIENCIAS';
  nivelActual: Nivel = 'FACIL';
  sonidoActivo = true;

  // Perfil activo
  perfilId = 0;
  perfilNombre = '';

  // Configuracion del juego
  config: SopaLetrasConfig | null = null;

  // Grilla
  grid: string[][] = [];
  cellState: string[][] = []; // '' | 'selected' | 'found' | 'error'
  palabrasColocadas: PalabraColocada[] = [];
  gridIndices: number[] = [];

  // Estadisticas
  palabrasEncontradasCount = 0;
  errores = 0;
  tiempoRestante = 0;
  tiempoTotal = 0;
  private timerInterval: any = null;
  private endTime = 0;
  private audioCtx: AudioContext | null = null;
  private bgInterval: any = null;

  // Frases de celebracion al encontrar una palabra
  private readonly frasesCelebracion = [
    '¡Bien hecho!',
    '¡Increíble!',
    '¡Fantástico!',
    '¡Sigue así!',
    '¡Genial!',
    '¡Excelente!',
    '¡Muy bien!',
    '¡Eso es!',
    '¡Perfecto!',
    '¡Brillante!'
  ];

  // Frase motivacional aleatoria para cuando se acaba el tiempo
  fraseMotivaconalActual = '';
  private readonly frasesMotivacionales = [
    '¡Sigue así, a la siguiente lo lograrás! 💪',
    '¡Casi lo tienes! Un poco más de práctica 🌟',
    '¡Cada intento te hace más fuerte! 🚀',
    '¡No te rindas, tú puedes lograrlo! ⭐',
    '¡El esfuerzo siempre vale la pena! 🎯',
    '¡Vas muy bien, sigue practicando! 🧠',
    '¡La próxima vez lo vas a lograr! 🌈'
  ];

  // Arrastre mouse / toque
  private dragging = false;
  private dragStart: { row: number; col: number } | null = null;
  private dragCurrent: { row: number; col: number } | null = null;

  // Resultado IA (CA-05)
  subioNivel = false;
  nivelSugerido: string | null = null;

  // Opciones de tema
  temas: { id: Tema; label: string; emoji: string }[] = [
    { id: 'CIENCIAS',    label: 'Ciencias',    emoji: '🔬' },
    { id: 'GEOGRAFIA',   label: 'Geografía',   emoji: '🗺️' },
    { id: 'MATEMATICAS', label: 'Matemáticas', emoji: '➗' }
  ];

  constructor(
    private sopaLetrasService: SopaLetrasService,
    private childProfileService: ChildProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
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
    this.stopBgMusic();
    window.speechSynthesis?.cancel();
    this.audioCtx?.close();
  }

  // ── INICIO ──────────────────────────────────────────────────────────────

  seleccionarTema(tema: Tema): void {
    this.temaSeleccionado = tema;
  }

  iniciarJuego(nivel: Nivel = this.nivelActual): void {
    this.nivelActual = nivel;
    const config = this.sopaLetrasService.getConfigLocal(this.temaSeleccionado, nivel);
    this.config = config;
    this.generarGrilla(config);
    this.tiempoRestante = config.tiempoSegundos;
    this.tiempoTotal = config.tiempoSegundos;
    this.palabrasEncontradasCount = 0;
    this.errores = 0;
    this.subioNivel = false;
    this.nivelSugerido = null;
    this.estado = 'jugando';
    this.iniciarTimer();
    setTimeout(() => this.startBgMusic(), 200);
  }

  // ── GRILLA ──────────────────────────────────────────────────────────────

  private generarGrilla(config: SopaLetrasConfig): void {
    const size = config.gridSize;
    this.gridIndices = Array.from({ length: size }, (_, i) => i);
    this.grid = Array.from({ length: size }, () => Array(size).fill(''));
    this.cellState = Array.from({ length: size }, () => Array(size).fill(''));
    this.palabrasColocadas = [];

    for (const palabra of config.palabras) {
      this.colocarPalabra(palabra, size);
    }

    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.grid[r][c] === '') {
          this.grid[r][c] = letras[Math.floor(Math.random() * letras.length)];
        }
      }
    }
  }

  private colocarPalabra(palabra: string, size: number): void {
    for (let intento = 0; intento < 150; intento++) {
      const dir: 'H' | 'V' = Math.random() < 0.5 ? 'H' : 'V';
      const maxRow = dir === 'H' ? size - 1 : size - palabra.length;
      const maxCol = dir === 'H' ? size - palabra.length : size - 1;
      if (maxRow < 0 || maxCol < 0) continue;

      const startRow = Math.floor(Math.random() * (maxRow + 1));
      const startCol = Math.floor(Math.random() * (maxCol + 1));

      let cabe = true;
      const celdas: { row: number; col: number }[] = [];

      for (let i = 0; i < palabra.length; i++) {
        const r = dir === 'H' ? startRow : startRow + i;
        const c = dir === 'H' ? startCol + i : startCol;
        if (this.grid[r][c] !== '' && this.grid[r][c] !== palabra[i]) {
          cabe = false; break;
        }
        celdas.push({ row: r, col: c });
      }

      if (cabe) {
        celdas.forEach((celda, i) => {
          const r = dir === 'H' ? startRow : startRow + i;
          const c = dir === 'H' ? startCol + i : startCol;
          this.grid[r][c] = palabra[i];
        });
        this.palabrasColocadas.push({ palabra, startRow, startCol, direccion: dir, celdas, encontrada: false });
        return;
      }
    }
  }

  // ── TIMER (CA-04) ────────────────────────────────────────────────────────

  // Timer basado en tiempo real: no se congela aunque el usuario cambie de pestana
  private iniciarTimer(): void {
    this.endTime = Date.now() + this.tiempoTotal * 1000;
    this.timerInterval = setInterval(() => {
      const restante = Math.ceil((this.endTime - Date.now()) / 1000);
      this.tiempoRestante = Math.max(0, restante);
      if (this.tiempoRestante <= 0) {
        this.detenerTimer();
        this.finalizarSesion('tiempo-agotado');
      }
    }, 250); // Verifica cada 250ms para mayor precision
  }

  private detenerTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  // ── AUDIO (Web Audio API + Web Speech API) ───────────────────────────────

  private getAudio(): AudioContext | null {
    if (!this.sonidoActivo) return null;
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return this.audioCtx;
    } catch { return null; }
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
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.05);
    } catch {}
  }

  // Musica de fondo: melodia suave en bucle mientras se juega
  private startBgMusic(): void {
    const ctx = this.getAudio();
    if (!ctx) return;
    this.stopBgMusic();

    // Melodia basada en escala pentatonica (suena agradable para ninos)
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
    if (this.bgInterval) { clearInterval(this.bgInterval); this.bgInterval = null; }
  }

  // Efectos de sonido
  private playPalabraEncontrada(): void {
    this.playTone(523, 0.12, 'sine', 0.3);
    this.playTone(659, 0.12, 'sine', 0.3, 0.12);
    this.playTone(784, 0.22, 'sine', 0.3, 0.25);
  }

  private playError(): void {
    this.playTone(200, 0.2, 'sawtooth', 0.12);
  }

  private playCompletado(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.playTone(f, 0.28, 'sine', 0.3, i * 0.13)
    );
  }

  private playTiempoAgotado(): void {
    this.playTone(330, 0.35, 'triangle', 0.2);
    this.playTone(220, 0.5,  'triangle', 0.2, 0.4);
  }

  // Voz en español usando Web Speech API (como el "bien hecho" de Espejo Mental)
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
      // Busca una voz en espanol si esta disponible
      const voces = window.speechSynthesis.getVoices();
      const vozEs = voces.find(v => v.lang.startsWith('es'));
      if (vozEs) utt.voice = vozEs;
      window.speechSynthesis.speak(utt);
    } catch {}
  }

  get timerPorcentaje(): number {
    return this.tiempoTotal ? (this.tiempoRestante / this.tiempoTotal) * 100 : 100;
  }

  get timerColor(): string {
    if (this.timerPorcentaje > 50) return '#7ECEC4';
    if (this.timerPorcentaje > 25) return '#FFD97D';
    return '#FF6B6B';
  }

  formatTiempo(s: number): string {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  // ── DRAG MOUSE ───────────────────────────────────────────────────────────

  onMouseDown(row: number, col: number, event: MouseEvent): void {
    event.preventDefault();
    if (this.estado !== 'jugando') return;
    this.dragging = true;
    this.dragStart = { row, col };
    this.dragCurrent = { row, col };
    this.actualizarSeleccion();
  }

  onMouseEnter(row: number, col: number): void {
    if (!this.dragging) return;
    this.dragCurrent = { row, col };
    this.actualizarSeleccion();
  }

  onMouseUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.validarSeleccion();
  }

  // ── DRAG TOQUE ───────────────────────────────────────────────────────────

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const t = event.touches[0];
    const celda = this.getCeldaEnPunto(t.clientX, t.clientY);
    if (celda && this.estado === 'jugando') {
      this.dragging = true;
      this.dragStart = celda;
      this.dragCurrent = celda;
      this.actualizarSeleccion();
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.dragging) return;
    const t = event.touches[0];
    const celda = this.getCeldaEnPunto(t.clientX, t.clientY);
    if (celda) { this.dragCurrent = celda; this.actualizarSeleccion(); }
  }

  onTouchEnd(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.validarSeleccion();
  }

  private getCeldaEnPunto(x: number, y: number): { row: number; col: number } | null {
    const el = document.elementFromPoint(x, y) as HTMLElement;
    if (!el) return null;
    const row = el.getAttribute('data-row');
    const col = el.getAttribute('data-col');
    return row !== null && col !== null ? { row: +row, col: +col } : null;
  }

  // ── SELECCION ────────────────────────────────────────────────────────────

  private actualizarSeleccion(): void {
    if (!this.dragStart || !this.dragCurrent) return;
    for (let r = 0; r < this.grid.length; r++)
      for (let c = 0; c < this.grid[r].length; c++)
        if (this.cellState[r][c] === 'selected') this.cellState[r][c] = '';

    for (const celda of this.getLinea(this.dragStart, this.dragCurrent))
      if (this.cellState[celda.row][celda.col] !== 'found')
        this.cellState[celda.row][celda.col] = 'selected';
  }

  private getLinea(a: { row: number; col: number }, b: { row: number; col: number }): { row: number; col: number }[] {
    const celdas: { row: number; col: number }[] = [];
    if (a.row === b.row) {
      for (let c = Math.min(a.col, b.col); c <= Math.max(a.col, b.col); c++)
        celdas.push({ row: a.row, col: c });
    } else if (a.col === b.col) {
      for (let r = Math.min(a.row, b.row); r <= Math.max(a.row, b.row); r++)
        celdas.push({ row: r, col: a.col });
    }
    return celdas;
  }

  private validarSeleccion(): void {
    if (!this.dragStart || !this.dragCurrent) { this.limpiarSeleccion(); return; }
    const celdas = this.getLinea(this.dragStart, this.dragCurrent);
    if (celdas.length < 2) { this.limpiarSeleccion(); return; }

    for (const pw of this.palabrasColocadas) {
      if (pw.encontrada) continue;
      if (this.celdasIguales(celdas, pw.celdas)) {
        pw.encontrada = true;
        this.palabrasEncontradasCount++;
        pw.celdas.forEach(c => { this.cellState[c.row][c.col] = 'found'; });
        this.dragStart = this.dragCurrent = null;
        this.playPalabraEncontrada();
        this.speak(this.frasesCelebracion[Math.floor(Math.random() * this.frasesCelebracion.length)]);
        if (this.palabrasEncontradasCount === this.palabrasColocadas.length) {
          this.detenerTimer();
          setTimeout(() => this.finalizarSesion('completado'), 150);
        }
        return;
      }
    }

    // Seleccion incorrecta
    this.errores++;
    this.playError();
    celdas.forEach(c => { if (this.cellState[c.row][c.col] !== 'found') this.cellState[c.row][c.col] = 'error'; });
    setTimeout(() => this.limpiarSeleccion(), 600);
  }

  private celdasIguales(a: { row: number; col: number }[], b: { row: number; col: number }[]): boolean {
    if (a.length !== b.length) return false;
    const fwd = a.every((c, i) => c.row === b[i].row && c.col === b[i].col);
    const rev = a.every((c, i) => c.row === b[b.length - 1 - i].row && c.col === b[b.length - 1 - i].col);
    return fwd || rev;
  }

  private limpiarSeleccion(): void {
    for (let r = 0; r < this.grid.length; r++)
      for (let c = 0; c < this.grid[r].length; c++)
        if (this.cellState[r][c] === 'selected' || this.cellState[r][c] === 'error')
          this.cellState[r][c] = '';
    this.dragStart = this.dragCurrent = null;
  }

  // ── FINALIZAR ────────────────────────────────────────────────────────────

  private finalizarSesion(nuevoEstado: 'completado' | 'tiempo-agotado'): void {
    this.estado = nuevoEstado;
    this.stopBgMusic();
    if (nuevoEstado === 'completado') {
      this.playCompletado();
      this.speak('¡Lo lograste! ¡Excelente trabajo!');
    } else {
      this.playTiempoAgotado();
      this.fraseMotivaconalActual = this.frasesMotivacionales[
        Math.floor(Math.random() * this.frasesMotivacionales.length)
      ];
      this.speak('¡Sigue intentando, tú puedes!');
    }
    if (nuevoEstado === 'completado' && this.config?.nivelSiguiente) {
      if (this.tiempoRestante / this.tiempoTotal > 0.30) {
        this.subioNivel = true;
        this.nivelSugerido = this.config.nivelSiguiente;
      }
    }
    if (this.config) {
      this.sopaLetrasService.guardarSesion({
        perfilId: this.perfilId,
        tema: this.config.tema,
        nivel: this.config.nivel,
        gridSize: this.config.gridSize,
        palabrasTotales: this.palabrasColocadas.length,
        palabrasEncontradas: this.palabrasEncontradasCount,
        errores: this.errores,
        tiempoUsadoSegundos: this.tiempoTotal - this.tiempoRestante,
        tiempoTotalSegundos: this.tiempoTotal,
        completada: nuevoEstado === 'completado',
        subioNivel: this.subioNivel
      });
    }
  }

  // ── ACCIONES ─────────────────────────────────────────────────────────────

  jugarDeNuevo(): void { this.iniciarJuego(this.nivelActual); }
  subirNivel(): void { if (this.nivelSugerido) this.iniciarJuego(this.nivelSugerido as Nivel); }
  volverInicio(): void {
    this.detenerTimer();
    this.stopBgMusic();
    this.sopaLetrasService.resetearPalabrasUsadas(this.temaSeleccionado);
    this.estado = 'inicio';
    this.config = null;
  }
  volverLobby(): void { this.detenerTimer(); this.stopBgMusic(); this.router.navigate(['/nino/juegos']); }
  toggleSonido(): void {
    this.sonidoActivo = !this.sonidoActivo;
    if (!this.sonidoActivo) this.stopBgMusic();
    else if (this.estado === 'jugando') this.startBgMusic();
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────

  getCellState(row: number, col: number): string { return this.cellState[row]?.[col] ?? ''; }

  get cellSize(): number {
    const s = this.config?.gridSize ?? 8;
    if (s <= 8)  return 58;
    if (s <= 10) return 52;
    if (s <= 12) return 46;
    return 36;
  }

  get etiquetaTema(): string { return this.temas.find(t => t.id === this.temaSeleccionado)?.label ?? ''; }
  get emojiTema(): string    { return this.temas.find(t => t.id === this.temaSeleccionado)?.emoji ?? ''; }

  get nivelLabel(): string {
    return ({ FACIL: 'Fácil', MEDIO: 'Medio', DIFICIL: 'Difícil', EXPERTO: 'Experto' })[this.nivelActual] ?? this.nivelActual;
  }
}
