import { Component, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Estado = 'inicio' | 'mostrando' | 'input' | 'feedback' | 'resultados';
type Mood   = 'idle' | 'thinking' | 'excited' | 'celebrate' | 'encourage';

interface Elemento {
  id: number;
  color: string;
  colorActivo: string;
  glow: string;
  simbolo: string;
  nombre: string;
}

interface ClickMetrica {
  elementId: number;
  ms: number;
  correcto: boolean;
}

@Component({
  selector: 'app-espejo-mental',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-wrapper">

      <!-- ╔══════════════════════════════╗
           ║     PANTALLA DE INICIO       ║
           ╚══════════════════════════════╝ -->
      @if (estado === 'inicio') {
        <div class="pantalla-inicio">

          <div class="mascota-grande">
            <div class="mascota-emoji bounce">🦊</div>
            <div class="burbuja-bienvenida">
              ¡Hola! Vamos a entrenar tu memoria 🧠
            </div>
          </div>

          <h1 class="titulo-juego">
            <span class="titulo-grad">Espejo</span>
            <span class="titulo-blanco"> Mental</span>
          </h1>
          <p class="subtitulo-juego">Mira la secuencia de colores y repítela en orden</p>

          <div class="instrucciones-grid">
            <div class="instr-card">
              <div class="instr-num">1</div>
              <div class="instr-emoji">👀</div>
              <div class="instr-text">Mira los colores que se iluminan</div>
            </div>
            <div class="instr-card">
              <div class="instr-num">2</div>
              <div class="instr-emoji">👆</div>
              <div class="instr-text">Tócalos en el mismo orden</div>
            </div>
            <div class="instr-card">
              <div class="instr-num">3</div>
              <div class="instr-emoji">🚀</div>
              <div class="instr-text">¡Si aciertas, la secuencia crece!</div>
            </div>
            <div class="instr-card">
              <div class="instr-num">4</div>
              <div class="instr-emoji">💪</div>
              <div class="instr-text">2 errores seguidos y baja la dificultad</div>
            </div>
          </div>

          <button class="btn-empezar" (click)="iniciarJuego()">
            <span class="btn-icon">🎮</span> ¡Empezar!
          </button>
        </div>
      }

      <!-- ╔══════════════════════════════╗
           ║     PANTALLA DE JUEGO        ║
           ╚══════════════════════════════╝ -->
      @if (estado === 'mostrando' || estado === 'input' || estado === 'feedback') {
        <div class="pantalla-juego">

          <!-- Confeti de acierto -->
          @if (showConfetti) {
            <div class="confetti-container">
              @for (p of confettiPieces; track p.id) {
                <div class="confeti" [style.left.%]="p.left" [style.background]="p.color"
                     [style.animation-delay.ms]="p.delay" [style.animation-duration.ms]="p.dur"
                     [style.width.px]="p.size" [style.height.px]="p.size * 1.6"></div>
              }
            </div>
          }

          <!-- Header -->
          <div class="game-header">
            <button class="btn-salir" (click)="terminarSesion()">✕ Salir</button>

            <div class="header-centro">
              <div class="progreso-barra">
                <div class="progreso-fill" [style.width.%]="(rondas / MAX_RONDAS) * 100"></div>
              </div>
              <span class="progreso-label">{{ rondas }}/{{ MAX_RONDAS }}</span>
            </div>

            <div class="header-stats">
              <div class="stat-pill verde">⭐ {{ aciertos }}</div>
              <div class="stat-pill rojo">💔 {{ errores }}</div>
            </div>
          </div>

          <!-- Mascota + burbuja -->
          <div class="mascota-row">
            <div class="mascota-juego" [class.mascota-bounce]="mascotMood === 'celebrate'"
                 [class.mascota-shake]="mascotMood === 'encourage'">
              {{ mascotEmoji }}
            </div>
            <div class="burbuja-dialogo" [class.burbuja-verde]="mascotMood === 'celebrate'"
                 [class.burbuja-naranja]="mascotMood === 'encourage'">
              {{ mascotMsg }}
            </div>
          </div>

          <!-- Badge de combo -->
          @if (showCombo && combo >= 2) {
            <div class="combo-badge">
              🔥 ¡Combo x{{ combo }}!
            </div>
          }

          <!-- Longitud de secuencia -->
          <div class="nivel-secuencia">
            @for (i of secuenciaArray; track $index) {
              <div class="seq-dot" [class.seq-dot-fill]="$index < respuestaJugador.length"></div>
            }
          </div>

          <!-- Elementos del juego -->
          <div class="elementos-grid">
            @for (el of ELEMENTOS; track el.id) {
              <button
                class="elemento"
                [class.activo]="elementoActivo === el.id"
                [class.error-anim]="elementoError === el.id"
                [class.clickable]="estado === 'input'"
                [style.--color]="el.color"
                [style.--color-activo]="el.colorActivo"
                [style.--glow]="el.glow"
                [disabled]="estado !== 'input'"
                (click)="clicarElemento(el.id)">
                <span class="el-simbolo">{{ el.simbolo }}</span>
                <span class="el-nombre">{{ el.nombre }}</span>
              </button>
            }
          </div>

        </div>
      }

      <!-- ╔══════════════════════════════╗
           ║   PANTALLA DE RESULTADOS     ║
           ╚══════════════════════════════╝ -->
      @if (estado === 'resultados') {
        <div class="pantalla-resultados">

          <!-- Confeti final -->
          @if (puntuacion >= 60) {
            <div class="confetti-container">
              @for (p of confettiPieces; track p.id) {
                <div class="confeti" [style.left.%]="p.left" [style.background]="p.color"
                     [style.animation-delay.ms]="p.delay" [style.animation-duration.ms]="p.dur"
                     [style.width.px]="p.size" [style.height.px]="p.size * 1.6"></div>
              }
            </div>
          }

          <div class="resultados-card">

            <div class="mascota-resultado">{{ trofeoEmoji }}</div>
            <h2 class="resultado-titulo">{{ tituloFinal }}</h2>

            <!-- Estrellas -->
            <div class="estrellas">
              <span class="estrella" [class.estrella-on]="puntuacion >= 40">⭐</span>
              <span class="estrella grande" [class.estrella-on]="puntuacion >= 65">⭐</span>
              <span class="estrella" [class.estrella-on]="puntuacion >= 85">⭐</span>
            </div>

            <!-- Puntuación circular -->
            <div class="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" class="ring-bg"/>
                <circle cx="60" cy="60" r="50" class="ring-fill"
                  [style.stroke-dasharray]="314"
                  [style.stroke-dashoffset]="314 - (314 * puntuacion / 100)"/>
              </svg>
              <div class="score-texto">
                <div class="score-num">{{ puntuacion }}%</div>
                <div class="score-lbl">precisión</div>
              </div>
            </div>

            <!-- Métricas -->
            <div class="metricas-row">
              <div class="metrica">
                <div class="m-icon">✅</div>
                <div class="m-val verde">{{ aciertos }}</div>
                <div class="m-lbl">Aciertos</div>
              </div>
              <div class="metrica">
                <div class="m-icon">❌</div>
                <div class="m-val rojo">{{ errores }}</div>
                <div class="m-lbl">Errores</div>
              </div>
              <div class="metrica">
                <div class="m-icon">🔗</div>
                <div class="m-val morado">{{ maxLongitud }}</div>
                <div class="m-lbl">Máx. seq.</div>
              </div>
              <div class="metrica">
                <div class="m-icon">🔥</div>
                <div class="m-val naranja">{{ maxCombo }}</div>
                <div class="m-lbl">Mejor combo</div>
              </div>
            </div>

            <p class="mensaje-final">{{ mensajeFinal }}</p>

            <div class="btns-final">
              <button class="btn-repetir" (click)="reiniciarJuego()">🔄 Jugar de nuevo</button>
              <button class="btn-volver"  (click)="volver()">← Volver</button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .game-wrapper {
      min-height: 100vh;
      background: linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', -apple-system, sans-serif;
      color: white;
      overflow: hidden;
      position: relative;
    }

    /* ══ CONFETI ══════════════════════════════════ */
    .confetti-container {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 100;
      overflow: hidden;
    }
    .confeti {
      position: absolute;
      top: -20px;
      border-radius: 3px;
      animation: caer linear forwards;
    }
    @keyframes caer {
      0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(110vh)  rotate(720deg); opacity: 0; }
    }

    /* ══ PANTALLA INICIO ══════════════════════════ */
    .pantalla-inicio {
      text-align: center;
      padding: 32px 24px 40px;
      max-width: 520px;
      width: 100%;
      animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }

    .mascota-grande {
      position: relative;
      display: inline-block;
      margin-bottom: 16px;
    }
    .mascota-emoji {
      font-size: 88px;
      line-height: 1;
      display: block;
      filter: drop-shadow(0 0 24px rgba(167,139,250,.7));
    }
    .burbuja-bienvenida {
      position: absolute;
      top: -8px;
      right: -140px;
      background: white;
      color: #1e293b;
      border-radius: 18px 18px 18px 4px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      animation: popIn .4s .3s both cubic-bezier(.34,1.56,.64,1);
    }
    .burbuja-bienvenida::before {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 12px;
      border: 8px solid transparent;
      border-top-color: white;
      border-bottom: none;
    }

    .titulo-juego {
      font-size: 48px;
      font-weight: 900;
      margin-bottom: 8px;
      line-height: 1.1;
    }
    .titulo-grad {
      background: linear-gradient(135deg, #a78bfa, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .titulo-blanco { color: white; }

    .subtitulo-juego {
      font-size: 16px;
      color: #94a3b8;
      margin-bottom: 32px;
    }

    .instrucciones-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 32px;
      text-align: left;
    }
    .instr-card {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px;
      padding: 16px;
      position: relative;
    }
    .instr-num {
      position: absolute;
      top: 10px;
      right: 12px;
      font-size: 11px;
      font-weight: 800;
      color: rgba(255,255,255,.2);
    }
    .instr-emoji { font-size: 28px; margin-bottom: 8px; }
    .instr-text  { font-size: 13px; color: #cbd5e1; line-height: 1.4; }

    .btn-empezar {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
      border: none;
      border-radius: 20px;
      padding: 18px 52px;
      font-size: 20px;
      font-weight: 800;
      cursor: pointer;
      transition: all .2s;
      box-shadow: 0 8px 32px rgba(124,58,237,.45),
                  0 0 0 0 rgba(124,58,237,.4);
      animation: pulseBtn 2s infinite;
    }
    .btn-empezar:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 16px 40px rgba(124,58,237,.6);
      animation: none;
    }
    .btn-icon { font-size: 22px; }

    @keyframes pulseBtn {
      0%,100% { box-shadow: 0 8px 32px rgba(124,58,237,.45), 0 0 0 0 rgba(124,58,237,.4); }
      50%      { box-shadow: 0 8px 32px rgba(124,58,237,.45), 0 0 0 14px rgba(124,58,237,0); }
    }

    /* ══ PANTALLA JUEGO ══════════════════════════ */
    .pantalla-juego {
      width: 100%;
      max-width: 520px;
      padding: 20px 20px 32px;
      position: relative;
    }

    /* Header */
    .game-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn-salir {
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.15);
      color: #94a3b8;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
      transition: all .2s;
      flex-shrink: 0;
    }
    .btn-salir:hover { background: rgba(239,68,68,.2); color: #f87171; border-color: #f87171; }

    .header-centro {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .progreso-barra {
      height: 8px;
      background: rgba(255,255,255,.1);
      border-radius: 100px;
      overflow: hidden;
    }
    .progreso-fill {
      height: 100%;
      background: linear-gradient(90deg, #a78bfa, #60a5fa);
      border-radius: 100px;
      transition: width .6s ease;
    }
    .progreso-label { font-size: 11px; color: #64748b; text-align: right; }

    .header-stats { display: flex; gap: 6px; flex-shrink: 0; }
    .stat-pill {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
    }
    .stat-pill.verde  { background: rgba(34,197,94,.15);  color: #4ade80; border: 1px solid rgba(34,197,94,.25); }
    .stat-pill.rojo   { background: rgba(239,68,68,.15);  color: #f87171; border: 1px solid rgba(239,68,68,.25); }

    /* Mascota en juego */
    .mascota-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      min-height: 70px;
    }
    .mascota-juego {
      font-size: 52px;
      line-height: 1;
      flex-shrink: 0;
      transition: transform .2s;
    }
    .mascota-bounce { animation: bounce .5s ease; }
    .mascota-shake  { animation: mascotShake .4s ease; }

    .burbuja-dialogo {
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.18);
      backdrop-filter: blur(8px);
      border-radius: 4px 18px 18px 18px;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 700;
      color: #e2e8f0;
      line-height: 1.4;
      animation: popIn .3s cubic-bezier(.34,1.56,.64,1);
      flex: 1;
    }
    .burbuja-verde   { background: rgba(34,197,94,.2);  border-color: rgba(34,197,94,.3);  color: #4ade80; }
    .burbuja-naranja { background: rgba(251,146,60,.2); border-color: rgba(251,146,60,.3); color: #fb923c; }

    /* Combo badge */
    .combo-badge {
      text-align: center;
      margin-bottom: 10px;
      font-size: 20px;
      font-weight: 900;
      color: #fb923c;
      text-shadow: 0 0 20px rgba(251,146,60,.7);
      animation: comboPop .4s cubic-bezier(.34,1.56,.64,1);
    }

    /* Dots de progreso de secuencia */
    .nivel-secuencia {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .seq-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,.15);
      border: 1.5px solid rgba(255,255,255,.25);
      transition: all .2s;
    }
    .seq-dot-fill {
      background: #a78bfa;
      border-color: #a78bfa;
      box-shadow: 0 0 8px rgba(167,139,250,.7);
    }

    /* ══ ELEMENTOS DEL JUEGO ══ */
    .elementos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .elemento {
      aspect-ratio: 1;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,.15);
      background: var(--color);
      box-shadow:
        0 10px 40px color-mix(in srgb, var(--color) 45%, transparent),
        inset 0 2px 0 rgba(255,255,255,.3);
      cursor: default;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: transform .12s ease, box-shadow .15s ease, border-color .15s;
      position: relative;
      overflow: hidden;
    }

    /* Brillo interno */
    .elemento::after {
      content: '';
      position: absolute;
      top: 12%;
      left: 20%;
      width: 35%;
      height: 28%;
      background: rgba(255,255,255,.25);
      border-radius: 50%;
      filter: blur(4px);
      pointer-events: none;
    }

    .elemento.clickable {
      cursor: pointer;
    }
    .elemento.clickable:hover {
      transform: scale(1.06);
      border-color: rgba(255,255,255,.5);
      box-shadow:
        0 16px 50px color-mix(in srgb, var(--color) 60%, transparent),
        inset 0 2px 0 rgba(255,255,255,.35);
    }
    .elemento.clickable:active {
      transform: scale(.93);
    }

    /* Estado ACTIVO — el que se ilumina en la secuencia */
    .elemento.activo {
      transform: scale(1.12);
      background: var(--color-activo);
      border-color: rgba(255,255,255,.8);
      box-shadow:
        0 0 0 8px rgba(255,255,255,.12),
        0 0 60px var(--glow),
        0 0 120px color-mix(in srgb, var(--glow) 50%, transparent),
        inset 0 2px 0 rgba(255,255,255,.5);
      animation: pulsoActivo .65s ease;
    }

    .el-simbolo {
      font-size: 44px;
      line-height: 1;
      pointer-events: none;
      position: relative;
      z-index: 1;
    }
    .el-nombre {
      font-size: 13px;
      font-weight: 800;
      color: rgba(255,255,255,.9);
      pointer-events: none;
      position: relative;
      z-index: 1;
      text-shadow: 0 1px 4px rgba(0,0,0,.4);
    }

    /* Animación error */
    .error-anim {
      animation: errorShake .4s ease !important;
      border-color: #f87171 !important;
      box-shadow: 0 0 0 4px rgba(239,68,68,.4) !important;
    }

    /* ══ PANTALLA RESULTADOS ══════════════════ */
    .pantalla-resultados {
      padding: 24px;
      width: 100%;
      max-width: 480px;
      position: relative;
    }
    .resultados-card {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 32px;
      padding: 36px 28px 32px;
      text-align: center;
      backdrop-filter: blur(16px);
      animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }
    .mascota-resultado {
      font-size: 72px;
      line-height: 1;
      margin-bottom: 12px;
      animation: bounce 1s ease infinite;
      display: block;
    }
    .resultado-titulo {
      font-size: 24px;
      font-weight: 900;
      color: #f1f5f9;
      margin-bottom: 16px;
    }

    /* Estrellas */
    .estrellas {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .estrella {
      font-size: 32px;
      filter: grayscale(1) opacity(.3);
      transition: all .4s cubic-bezier(.34,1.56,.64,1);
    }
    .estrella.grande { font-size: 44px; }
    .estrella.estrella-on {
      filter: grayscale(0) opacity(1) drop-shadow(0 0 12px rgba(250,204,21,.8));
      animation: starPop .5s cubic-bezier(.34,1.56,.64,1) both;
    }
    .estrellas .estrella:nth-child(2).estrella-on { animation-delay: .15s; }
    .estrellas .estrella:nth-child(3).estrella-on { animation-delay: .3s; }

    /* Score ring */
    .score-ring {
      position: relative;
      width: 130px;
      height: 130px;
      margin: 0 auto 24px;
    }
    .score-ring svg {
      width: 130px;
      height: 130px;
      transform: rotate(-90deg);
    }
    .ring-bg   { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 10; }
    .ring-fill {
      fill: none;
      stroke: #a78bfa;
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 1.2s ease;
    }
    .score-texto {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .score-num {
      font-size: 30px;
      font-weight: 900;
      background: linear-gradient(135deg, #a78bfa, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .score-lbl { font-size: 11px; color: #64748b; }

    /* Métricas */
    .metricas-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .metrica {
      background: rgba(255,255,255,.06);
      border-radius: 14px;
      padding: 12px 6px;
    }
    .m-icon { font-size: 18px; margin-bottom: 4px; }
    .m-val  { font-size: 26px; font-weight: 900; line-height: 1; margin-bottom: 2px; }
    .m-lbl  { font-size: 10px; color: #64748b; }
    .m-val.verde  { color: #4ade80; }
    .m-val.rojo   { color: #f87171; }
    .m-val.morado { color: #c4b5fd; }
    .m-val.naranja{ color: #fb923c; }

    .mensaje-final {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .btns-final { display: flex; gap: 10px; }
    .btn-repetir {
      flex: 1;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 14px 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s;
    }
    .btn-repetir:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,.5); }
    .btn-volver {
      flex: 1;
      background: rgba(255,255,255,.07);
      color: #94a3b8;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 14px;
      padding: 14px 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s;
    }
    .btn-volver:hover { background: rgba(255,255,255,.13); color: #f1f5f9; }

    /* ══ KEYFRAMES ══════════════════════════════ */
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes bounce {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-10px); }
    }
    @keyframes pulsoActivo {
      0%  { transform: scale(1); }
      40% { transform: scale(1.16); }
      70% { transform: scale(1.09); }
      100%{ transform: scale(1.12); }
    }
    @keyframes errorShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-10px) rotate(-3deg); }
      40%     { transform: translateX(10px)  rotate(3deg); }
      60%     { transform: translateX(-7px)  rotate(-2deg); }
      80%     { transform: translateX(7px)   rotate(2deg); }
    }
    @keyframes mascotShake {
      0%,100% { transform: rotate(0deg); }
      25%     { transform: rotate(-12deg); }
      75%     { transform: rotate(12deg); }
    }
    @keyframes comboPop {
      from { opacity: 0; transform: scale(.5) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes starPop {
      from { transform: scale(0) rotate(-30deg); }
      to   { transform: scale(1) rotate(0deg); }
    }
  `]
})
export class EspejoMentalComponent implements OnDestroy {

  readonly ELEMENTOS: Elemento[] = [
    { id: 0, color: '#dc2626', colorActivo: '#ff6b6b', glow: 'rgba(220,38,38,.9)',   simbolo: '🔴', nombre: 'Rojo'     },
    { id: 1, color: '#1d4ed8', colorActivo: '#60a5fa', glow: 'rgba(29,78,216,.9)',   simbolo: '🔵', nombre: 'Azul'     },
    { id: 2, color: '#15803d', colorActivo: '#4ade80', glow: 'rgba(21,128,61,.9)',   simbolo: '🟢', nombre: 'Verde'    },
    { id: 3, color: '#b45309', colorActivo: '#fbbf24', glow: 'rgba(180,83,9,.9)',    simbolo: '🟡', nombre: 'Amarillo' },
  ];

  readonly MAX_RONDAS = 10;

  readonly MASCOTA_MSGS: Record<Mood, string[]> = {
    idle:       ['¡Listo para jugar! 🎮'],
    thinking:   ['¡Memoriza bien la secuencia! 👀', '¡Presta mucha atención! 🧠', '¡Obsérvala con cuidado! 🔍'],
    excited:    ['¡Es tu turno! ¡Tú puedes! 💪', '¡Recuerda el orden! 🎯', '¡Vamos! ¡Repite la secuencia! 🚀'],
    celebrate:  ['¡INCREÍBLE! ¡Lo lograste! 🎉', '¡PERFECTO! ¡Qué memoria! ⭐', '¡BRILLANTE! ¡Sigue así! 🏆'],
    encourage:  ['¡Casi! ¡Inténtalo de nuevo! 💪', '¡No te rindas! ¡Puedes hacerlo! 🌟', '¡Casi! ¡Tú eres capaz! 🎯'],
  };

  confettiPieces = this.generarConfeti();

  estado: Estado = 'inicio';
  secuencia: number[] = [];
  respuestaJugador: number[] = [];
  longitudActual = 3;
  elementoActivo = -1;
  elementoError = -1;
  erroresConsecutivos = 0;

  aciertos = 0;
  errores = 0;
  maxLongitud = 3;
  rondas = 0;
  metricas: ClickMetrica[] = [];
  tiempoInicioInput = 0;

  combo = 0;
  maxCombo = 0;
  showCombo = false;
  showConfetti = false;

  mascotEmoji = '🦊';
  mascotMsg   = '¡Listo para jugar! 🎮';
  mascotMood: Mood = 'idle';

  get secuenciaArray(): number[] {
    return Array.from({ length: this.longitudActual });
  }

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void { this.limpiarTimers(); }

  // ── FLUJO PRINCIPAL ────────────────────────────────

  iniciarJuego(): void {
    this.aciertos = 0;
    this.errores = 0;
    this.maxLongitud = 3;
    this.rondas = 0;
    this.metricas = [];
    this.erroresConsecutivos = 0;
    this.longitudActual = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.nuevaRonda();
  }

  reiniciarJuego(): void { this.iniciarJuego(); }

  private nuevaRonda(): void {
    this.generarSecuencia();
    this.mostrarSecuencia();
  }

  private generarSecuencia(): void {
    this.secuencia = Array.from(
      { length: this.longitudActual },
      () => Math.floor(Math.random() * this.ELEMENTOS.length)
    );
  }

  private mostrarSecuencia(): void {
    this.estado = 'mostrando';
    this.respuestaJugador = [];
    this.elementoActivo = -1;
    this.showCombo = false;
    this.setMascota('thinking');
    this.cdr.detectChanges();

    let delay = 700;

    for (let i = 0; i < this.secuencia.length; i++) {
      const id = this.secuencia[i];
      this.timers.push(setTimeout(() => {
        this.elementoActivo = id;
        this.cdr.detectChanges();
      }, delay));
      delay += 650;
      this.timers.push(setTimeout(() => {
        this.elementoActivo = -1;
        this.cdr.detectChanges();
      }, delay));
      delay += 300;
    }

    this.timers.push(setTimeout(() => {
      this.estado = 'input';
      this.tiempoInicioInput = Date.now();
      this.setMascota('excited');
      this.cdr.detectChanges();
    }, delay + 200));
  }

  // ── INTERACCIÓN ────────────────────────────────────

  clicarElemento(id: number): void {
    if (this.estado !== 'input') return;

    const ms = Date.now() - this.tiempoInicioInput;
    const esperado = this.secuencia[this.respuestaJugador.length];
    const correcto = id === esperado;

    this.metricas.push({ elementId: id, ms, correcto });
    this.respuestaJugador.push(id);

    if (!correcto) {
      this.elementoError = id;
      this.cdr.detectChanges();
      this.timers.push(setTimeout(() => {
        this.elementoError = -1;
        this.cdr.detectChanges();
      }, 450));
      this.manejarError();
      return;
    }

    if (this.respuestaJugador.length === this.secuencia.length) {
      this.manejarAcierto();
    }
  }

  private manejarAcierto(): void {
    this.aciertos++;
    this.rondas++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.erroresConsecutivos = 0;
    this.longitudActual = Math.min(this.longitudActual + 1, 12);
    this.maxLongitud = Math.max(this.maxLongitud, this.longitudActual);

    this.setMascota('celebrate');
    this.showCombo = this.combo >= 2;
    this.dispararConfeti();
    this.estado = 'feedback';
    this.cdr.detectChanges();

    this.timers.push(setTimeout(() => {
      this.showConfetti = false;
      if (this.rondas >= this.MAX_RONDAS) {
        this.estado = 'resultados';
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    }, 1500));
  }

  private manejarError(): void {
    this.errores++;
    this.rondas++;
    this.combo = 0;
    this.erroresConsecutivos++;

    if (this.erroresConsecutivos >= 2) {
      this.longitudActual = Math.max(this.longitudActual - 1, 2);
      this.erroresConsecutivos = 0;
    }

    this.setMascota('encourage');
    this.estado = 'feedback';
    this.cdr.detectChanges();

    this.timers.push(setTimeout(() => {
      if (this.rondas >= this.MAX_RONDAS) {
        this.estado = 'resultados';
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    }, 1500));
  }

  terminarSesion(): void {
    this.limpiarTimers();
    this.estado = 'resultados';
    this.cdr.detectChanges();
  }

  volver(): void { this.router.navigate(['/nino/juegos']); }

  // ── COMPUTED ───────────────────────────────────────

  get puntuacion(): number {
    if (this.rondas === 0) return 0;
    return Math.round((this.aciertos / this.rondas) * 100);
  }

  get trofeoEmoji(): string {
    if (this.puntuacion >= 85) return '🏆';
    if (this.puntuacion >= 65) return '🥈';
    if (this.puntuacion >= 40) return '🥉';
    return '🌟';
  }

  get tituloFinal(): string {
    if (this.puntuacion >= 85) return '¡Memoria de trabajo élite!';
    if (this.puntuacion >= 65) return '¡Muy bien hecho!';
    if (this.puntuacion >= 40) return '¡Buen esfuerzo!';
    return '¡Sigue practicando!';
  }

  get mensajeFinal(): string {
    if (this.puntuacion >= 85) return `¡Alcanzaste secuencias de ${this.maxLongitud} elementos! Tu memoria de trabajo es excelente. 🧠✨`;
    if (this.puntuacion >= 65) return `Lograste secuencias de hasta ${this.maxLongitud} elementos. ¡Tu memoria está mejorando!`;
    if (this.puntuacion >= 40) return `La práctica constante entrena tu cerebro. ¡Inténtalo de nuevo y supera tu récord!`;
    return `¡No te rindas! Cada intento fortalece tu memoria de trabajo. ¡Tú puedes!`;
  }

  // ── HELPERS ────────────────────────────────────────

  private setMascota(mood: Mood): void {
    this.mascotMood = mood;
    const msgs = this.MASCOTA_MSGS[mood];
    this.mascotMsg = msgs[Math.floor(Math.random() * msgs.length)];
    const emojis: Record<Mood, string> = {
      idle: '🦊', thinking: '🦊', excited: '🦊', celebrate: '🦊', encourage: '🦊'
    };
    this.mascotEmoji = emojis[mood];
  }

  private dispararConfeti(): void {
    this.confettiPieces = this.generarConfeti();
    this.showConfetti = true;
    this.timers.push(setTimeout(() => {
      this.showConfetti = false;
      this.cdr.detectChanges();
    }, 2200));
  }

  private generarConfeti() {
    const colores = ['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#34d399','#fb923c','#e879f9'];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left:  Math.random() * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 600,
      dur:   1400 + Math.random() * 800,
      size:  6 + Math.random() * 8,
    }));
  }

  private limpiarTimers(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }
}
