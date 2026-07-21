import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { VolumeControlComponent } from '../../../../shared/game-feedback/volume-control.component';
import { GameFeedbackService, NivelVolumen } from '../../../../shared/game-feedback/game-feedback.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';

type Estado = 'inicio' | 'cuenta' | 'mostrando' | 'input' | 'feedback' | 'resultados';
type Mood   = 'idle' | 'thinking' | 'excited' | 'celebrate' | 'encourage';

interface Elemento { id: number; color: string; colorActivo: string; glow: string; simbolo: string; nombre: string; }
interface ClickMetrica { elementId: number; ms: number; correcto: boolean; }
interface ConfettiPiece { id: number; left: number; color: string; delay: number; dur: number; size: number; }

@Component({
  selector: 'app-espejo-mental',
  standalone: true,
  imports: [CommonModule, GameFeedbackComponent, VolumeControlComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-wrapper">

      <!-- ══ INICIO ══════════════════════════════════════════ -->
      @if (estado === 'inicio') {
        <div class="pantalla-inicio">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>

          <div class="inicio-content">
            <!-- Hero mascota -->
            <div class="hero-mascota">
              <div class="fox-sparkles">
                <span class="sp sp-1">✨</span>
                <span class="sp sp-2">⭐</span>
                <span class="sp sp-3">💫</span>
                <span class="sp sp-4">✨</span>
              </div>
              <div class="fox-ring">
                <div class="fox-avatar">🦊</div>
              </div>
              <div class="fox-bubble-inicio">
                ¡Hola! Soy <strong>Foxy</strong> 🦊<br>
                ¡Tu guía de memoria! ¿Listo para entrenar juntos? 🧠
              </div>
            </div>

            <h1 class="titulo-juego">
              <span class="titulo-grad">Espejo</span><span class="titulo-blanco"> Mental</span>
            </h1>
            <p class="subtitulo-juego">Mira la secuencia de colores y repítela en orden</p>

            <div class="instrucciones-grid">
              <div class="instr-card instr-rojo">
                <span class="instr-num">1</span>
                <div class="instr-emoji">👀</div>
                <div class="instr-text">Mira los colores que se iluminan</div>
              </div>
              <div class="instr-card instr-azul">
                <span class="instr-num">2</span>
                <div class="instr-emoji">👆</div>
                <div class="instr-text">Tócalos en el mismo orden</div>
              </div>
              <div class="instr-card instr-verde">
                <span class="instr-num">3</span>
                <div class="instr-emoji">🚀</div>
                <div class="instr-text">¡Aciertas y la secuencia crece!</div>
              </div>
              <div class="instr-card instr-amarillo">
                <span class="instr-num">4</span>
                <div class="instr-emoji">💪</div>
                <div class="instr-text">2 errores seguidos bajan la dificultad</div>
              </div>
            </div>

            <div class="inicio-footer">
              <button class="btn-empezar" (click)="iniciarJuego()">
                <span>🎮</span> ¡Empezar!
                <span class="btn-shine"></span>
              </button>
              <button class="btn-voz" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar voz' : 'Activar voz'">
                {{ voiceEnabled ? '🔊' : '🔇' }}
              </button>
            </div>

            <div class="volumen-footer">
              <app-volume-control [volumen]="volumenActual" (volumenChange)="onVolumenChange($event)"></app-volume-control>
            </div>
          </div>
        </div>
      }

      <!-- ══ JUEGO ══════════════════════════════════════════ -->
      @if (estado === 'cuenta' || estado === 'mostrando' || estado === 'input' || estado === 'feedback') {
        <div class="pantalla-juego" (click)="saltarSiEsPosible()">

          <app-game-feedback #feedback (incorrectShown)="onIncorrectShown()" (hintRequested)="onHintRequested()"></app-game-feedback>

          @if (showConfetti) {
            <div class="confetti-container">
              @for (p of confettiPieces; track p.id) {
                <div class="confeti"
                  [style.left.%]="p.left" [style.background]="p.color"
                  [style.animation-delay.ms]="p.delay" [style.animation-duration.ms]="p.dur"
                  [style.width.px]="p.size" [style.height.px]="p.size*1.6"></div>
              }
            </div>
          }

          <!-- Header -->
          <div class="game-header">
            <button class="btn-salir" (click)="terminarSesion()">
              <span class="salir-icon">←</span>
              <span class="salir-txt">Salir</span>
            </button>

            <div class="header-centro">
              <div class="progreso-wrap">
                <div class="progreso-barra">
                  <div class="progreso-fill" [style.width.%]="(rondas/MAX_RONDAS)*100"></div>
                </div>
                <span class="progreso-label">{{ rondas }}/{{ MAX_RONDAS }}</span>
              </div>
            </div>

            <div class="header-stats">
              <div class="stat-badge badge-oro">
                <span class="badge-ico">⭐</span>
                <span class="badge-num">{{ aciertos }}</span>
              </div>
              <div class="stat-badge badge-rojo">
                <span class="badge-ico">💔</span>
                <span class="badge-num">{{ errores }}</span>
              </div>
              <button class="btn-voz-hdr" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar' : 'Activar voz'">
                {{ voiceEnabled ? '🔊' : '🔇' }}
              </button>
            </div>
          </div>

          <!-- Mascota prominente -->
          <app-mascot game="espejo" [mood]="mascotMood" [message]="mascotMsg"></app-mascot>

          <!-- Combo -->
          @if (showCombo && combo >= 2) {
            <div class="combo-badge">🔥 ¡Combo x{{ combo }}!</div>
          }

          <!-- Dots de progreso -->
          <div class="nivel-secuencia">
            @for (i of secuenciaArray; track $index) {
              <div class="seq-dot" [class.seq-dot-fill]="$index < respuestaJugador.length"></div>
            }
          </div>

          <!-- Elementos -->
          <div class="elementos-grid" [class.grid-dimmed]="estado === 'cuenta'">
            @for (el of ELEMENTOS; track el.id) {
              <button class="elemento"
                [class.activo]="elementoActivo === el.id"
                [class.error-anim]="elementoError === el.id"
                [class.correcto-highlight]="elementoCorrectoHighlight === el.id"
                [class.pista-highlight]="elementoPista === el.id"
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

          <!-- Cuenta regresiva -->
          @if (estado === 'cuenta') {
            <div class="cuenta-overlay">
              <div class="cuenta-num" [class.cuenta-pop]="cuentaPop">{{ cuentaTexto }}</div>
              <div class="cuenta-sub">{{ cuentaTexto === '¡YA!' ? '¡A recordar!' : '¡Prepárate!' }}</div>
            </div>
          }

        </div>
      }

      <!-- ══ RESULTADOS ══════════════════════════════════════ -->
      @if (estado === 'resultados') {
        <div class="pantalla-resultados">
          <div class="confetti-container">
            @for (p of confettiPieces; track p.id) {
              <div class="confeti"
                [style.left.%]="p.left" [style.background]="p.color"
                [style.animation-delay.ms]="p.delay" [style.animation-duration.ms]="p.dur"
                [style.width.px]="p.size" [style.height.px]="p.size*1.6"></div>
            }
          </div>

          <div class="resultados-card">
            <!-- Fox hero resultado -->
            <div class="fox-resultado-hero">
              <div class="fox-resultado-ring"></div>
              <div class="fox-resultado-face">🦊</div>
              <div class="fox-resultado-trophy">{{ trofeoEmoji }}</div>
            </div>

            <h2 class="resultado-titulo">{{ tituloFinal }}</h2>

            <div class="estrellas">
              <span class="estrella"        [class.estrella-on]="puntuacion >= 40">⭐</span>
              <span class="estrella grande" [class.estrella-on]="puntuacion >= 65">⭐</span>
              <span class="estrella"        [class.estrella-on]="puntuacion >= 85">⭐</span>
            </div>

            <div class="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" class="ring-bg"/>
                <circle cx="60" cy="60" r="50" class="ring-fill"
                  [style.stroke-dasharray]="314"
                  [style.stroke-dashoffset]="314-(314*puntuacion/100)"/>
              </svg>
              <div class="score-texto">
                <div class="score-num">{{ puntuacion }}%</div>
                <div class="score-lbl">precisión</div>
              </div>
            </div>

            <!-- Foxy habla en resultados -->
            <div class="foxy-msg-final">
              <div class="foxy-msg-avatar">🦊</div>
              <div class="foxy-msg-bubble">{{ mensajeFinal }}</div>
            </div>

            <div class="metricas-row">
              <div class="metrica"><div class="m-icon">✅</div><div class="m-val verde">{{ aciertos }}</div><div class="m-lbl">Aciertos</div></div>
              <div class="metrica"><div class="m-icon">❌</div><div class="m-val rojo">{{ errores }}</div><div class="m-lbl">Errores</div></div>
              <div class="metrica"><div class="m-icon">🔗</div><div class="m-val morado">{{ maxLongitud }}</div><div class="m-lbl">Máx. seq.</div></div>
              <div class="metrica"><div class="m-icon">🔥</div><div class="m-val naranja">{{ maxCombo }}</div><div class="m-lbl">Mejor combo</div></div>
            </div>

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
      display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, sans-serif;
      color: white; overflow: hidden; position: relative;
    }

    /* ── Confetti ── */
    .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden; }
    .confeti { position: absolute; top: -20px; border-radius: 3px; animation: caer linear forwards; }
    @keyframes caer { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }

    /* ══ INICIO ══ */
    .pantalla-inicio {
      min-height: 100vh; width: 100%;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }

    .orb { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
    .orb-1 { width: 380px; height: 380px; background: rgba(124,58,237,.22); top: -100px; left: -80px; animation: orbFloat 9s ease-in-out infinite; }
    .orb-2 { width: 300px; height: 300px; background: rgba(79,70,229,.18); bottom: -80px; right: -60px; animation: orbFloat 7s ease-in-out infinite 2s; }
    .orb-3 { width: 200px; height: 200px; background: rgba(167,139,250,.12); top: 40%; right: 8%; animation: orbFloat 11s ease-in-out infinite 4s; }
    @keyframes orbFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-25px) scale(1.08)} }

    .inicio-content {
      position: relative; z-index: 1;
      text-align: center; padding: 24px 24px 40px;
      max-width: 540px; width: 100%;
      animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }

    /* Hero */
    .hero-mascota {
      display: flex; flex-direction: column; align-items: center;
      margin-bottom: 20px; position: relative;
    }
    .fox-sparkles {
      position: absolute; width: 220px; height: 220px;
      top: -20px; left: 50%; transform: translateX(-50%);
      pointer-events: none;
    }
    .sp { position: absolute; font-size: 22px; }
    .sp-1 { top:  4%; left:  0%;  animation: sparkleFloat 2.2s ease-in-out infinite 0s; }
    .sp-2 { top:  0%; right: 4%;  animation: sparkleFloat 1.8s ease-in-out infinite .5s; }
    .sp-3 { bottom: 4%; left: 4%; animation: sparkleFloat 2.5s ease-in-out infinite 1s; }
    .sp-4 { bottom: 0%; right: 0%;animation: sparkleFloat 2.0s ease-in-out infinite 1.5s; }
    @keyframes sparkleFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.7} 50%{transform:translateY(-14px) rotate(20deg);opacity:1} }

    .fox-ring {
      width: 148px; height: 148px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle, rgba(167,139,250,.18), rgba(124,58,237,.08));
      border: 2px solid rgba(167,139,250,.35);
      position: relative;
      box-shadow: 0 0 40px rgba(124,58,237,.3), 0 0 80px rgba(124,58,237,.1);
      animation: ringPulse 2.8s ease-in-out infinite;
    }
    .fox-ring::before {
      content: ''; position: absolute; inset: -10px; border-radius: 50%;
      border: 1.5px solid rgba(167,139,250,.2);
      animation: ringPulse 2.8s ease-in-out infinite .5s;
    }
    .fox-ring::after {
      content: ''; position: absolute; inset: -20px; border-radius: 50%;
      border: 1px solid rgba(167,139,250,.1);
      animation: ringPulse 2.8s ease-in-out infinite 1s;
    }
    @keyframes ringPulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }

    .fox-avatar {
      font-size: 88px; line-height: 1;
      animation: flotar 3s ease-in-out infinite;
      filter: drop-shadow(0 0 24px rgba(167,139,250,.8));
    }

    .fox-bubble-inicio {
      position: relative; margin-top: 14px; max-width: 310px;
      background: white; color: #1e293b;
      border-radius: 20px; padding: 14px 20px;
      font-size: 15px; font-weight: 600; line-height: 1.6;
      box-shadow: 0 8px 32px rgba(0,0,0,.35);
      animation: popIn .4s .4s both cubic-bezier(.34,1.56,.64,1);
    }
    .fox-bubble-inicio::before {
      content: ''; position: absolute;
      top: -10px; left: 50%; transform: translateX(-50%);
      border: 10px solid transparent;
      border-bottom-color: white;
    }

    .titulo-juego { font-size: 44px; font-weight: 900; margin: 20px 0 6px; line-height: 1.1; }
    .titulo-grad { background: linear-gradient(135deg,#a78bfa,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .titulo-blanco { color: white; }
    .subtitulo-juego { font-size: 15px; color: #94a3b8; margin-bottom: 24px; }

    /* Instruction cards */
    .instrucciones-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; text-align: left; }
    .instr-card {
      border: 1.5px solid rgba(255,255,255,.1); border-radius: 16px;
      padding: 16px 14px; position: relative; transition: transform .2s;
    }
    .instr-card:hover { transform: translateY(-3px); }
    .instr-rojo    { border-color: rgba(220,38,38,.55);  background: rgba(220,38,38,.09);  }
    .instr-azul    { border-color: rgba(96,165,250,.55); background: rgba(96,165,250,.09); }
    .instr-verde   { border-color: rgba(74,222,128,.55); background: rgba(74,222,128,.09); }
    .instr-amarillo{ border-color: rgba(251,191,36,.55); background: rgba(251,191,36,.09); }
    .instr-num {
      position: absolute; top: 8px; right: 10px;
      font-size: 10px; font-weight: 800; color: rgba(255,255,255,.28);
    }
    .instr-emoji { font-size: 30px; margin-bottom: 8px; display: block; }
    .instr-rojo     .instr-emoji { filter: drop-shadow(0 0 8px rgba(220,38,38,.9)); }
    .instr-azul     .instr-emoji { filter: drop-shadow(0 0 8px rgba(96,165,250,.9)); }
    .instr-verde    .instr-emoji { filter: drop-shadow(0 0 8px rgba(74,222,128,.9)); }
    .instr-amarillo .instr-emoji { filter: drop-shadow(0 0 8px rgba(251,191,36,.9)); }
    .instr-text { font-size: 13px; color: #cbd5e1; line-height: 1.4; }

    .btn-empezar {
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      color: white; border: none; border-radius: 20px; padding: 18px 52px;
      font-size: 20px; font-weight: 800; cursor: pointer; transition: all .2s;
      box-shadow: 0 8px 32px rgba(124,58,237,.5);
      position: relative; overflow: hidden;
      animation: pulseBtn 2s infinite;
    }
    .btn-empezar:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 16px 40px rgba(124,58,237,.65); animation: none; }
    .btn-shine {
      position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
      animation: shine 2.5s ease-in-out infinite 1s;
    }
    @keyframes shine { 0%{left:-80%} 100%{left:120%} }
    @keyframes pulseBtn {
      0%,100%{ box-shadow:0 8px 32px rgba(124,58,237,.5),0 0 0 0 rgba(124,58,237,.4); }
      50%    { box-shadow:0 8px 32px rgba(124,58,237,.5),0 0 0 14px rgba(124,58,237,0); }
    }

    .inicio-footer { display: flex; align-items: center; justify-content: center; gap: 14px; }

    .btn-voz {
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
      border-radius: 50%; width: 42px; height: 42px;
      font-size: 20px; cursor: pointer; transition: all .2s;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .btn-voz:hover { background: rgba(255,255,255,.2); transform: scale(1.1); }

    /* ══ JUEGO ══ */
    .pantalla-juego { width: 100%; max-width: 520px; padding: 20px 20px 32px; position: relative; }

    /* ── Game header panel ── */
    .game-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 18px; padding: 10px 12px;
      backdrop-filter: blur(10px);
    }

    .btn-salir {
      display: flex; align-items: center; gap: 5px;
      background: rgba(239,68,68,.12); border: 1.5px solid rgba(239,68,68,.3);
      color: #f87171; border-radius: 12px; padding: 7px 12px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      white-space: nowrap; transition: all .2s; flex-shrink: 0;
    }
    .btn-salir:hover { background: rgba(239,68,68,.28); transform: scale(1.05); box-shadow: 0 0 14px rgba(239,68,68,.3); }
    .salir-icon { font-size: 15px; }

    .header-centro { flex: 1; min-width: 0; }
    .progreso-wrap { display: flex; align-items: center; gap: 8px; }
    .progreso-barra { flex: 1; height: 10px; background: rgba(255,255,255,.08); border-radius: 100px; overflow: hidden; }
    .progreso-fill {
      height: 100%; background: linear-gradient(90deg, #a78bfa, #60a5fa);
      border-radius: 100px; transition: width .6s ease;
      box-shadow: 0 0 8px rgba(167,139,250,.6);
    }
    .progreso-label { font-size: 12px; font-weight: 700; color: #94a3b8; white-space: nowrap; }

    .header-stats { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
    .stat-badge {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 11px; border-radius: 20px; border: 1.5px solid;
      cursor: default; transition: transform .15s;
    }
    .badge-oro  { background: rgba(250,204,21,.14); border-color: rgba(250,204,21,.4);  box-shadow: 0 0 10px rgba(250,204,21,.18); }
    .badge-rojo { background: rgba(239,68,68,.14);  border-color: rgba(239,68,68,.35);  box-shadow: 0 0 10px rgba(239,68,68,.18); }
    .badge-ico  { font-size: 17px; line-height: 1; }
    .badge-num  { font-size: 18px; font-weight: 900; color: white; min-width: 18px; text-align: center; }

    .btn-voz-hdr {
      background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.18);
      border-radius: 50%; width: 38px; height: 38px;
      font-size: 18px; cursor: pointer; transition: all .2s; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-voz-hdr:hover { background: rgba(255,255,255,.18); transform: scale(1.1); }

    /* Mascota area */
    .mascota-area { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; min-height: 90px; }

    .fox-game-wrap {
      flex-shrink: 0; position: relative;
      width: 76px; display: flex; align-items: center; justify-content: center;
    }
    .fox-game-avatar {
      font-size: 64px; line-height: 1;
      filter: drop-shadow(0 0 14px rgba(167,139,250,.5));
    }
    .fox-deco-emoji {
      position: absolute; top: -18px; right: -8px;
      font-size: 26px; animation: popIn .3s cubic-bezier(.34,1.56,.64,1);
    }
    .fox-celebrate .fox-game-avatar {
      animation: foxCelebrate .6s cubic-bezier(.34,1.56,.64,1);
      filter: drop-shadow(0 0 20px rgba(251,191,36,.8));
    }
    .fox-encourage .fox-game-avatar { animation: mascotShake .4s ease; }
    @keyframes foxCelebrate { 0%{transform:scale(1)} 40%{transform:scale(1.25) rotate(-8deg)} 70%{transform:scale(0.95) rotate(5deg)} 100%{transform:scale(1)} }

    .burbuja-dialogo {
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
      backdrop-filter: blur(8px);
      border-radius: 4px 18px 18px 18px;
      padding: 14px 18px; font-size: 15px; font-weight: 700; color: #e2e8f0;
      line-height: 1.45; animation: popIn .3s cubic-bezier(.34,1.56,.64,1); flex: 1;
    }
    .burbuja-verde   { background: rgba(34,197,94,.18);  border-color: rgba(34,197,94,.35);  color: #4ade80; }
    .burbuja-naranja { background: rgba(251,146,60,.18); border-color: rgba(251,146,60,.35); color: #fb923c; }
    .burbuja-azul    { background: rgba(96,165,250,.15); border-color: rgba(96,165,250,.3);  color: #93c5fd; }

    .combo-badge { text-align: center; margin-bottom: 10px; font-size: 20px; font-weight: 900; color: #fb923c; text-shadow: 0 0 20px rgba(251,146,60,.7); animation: comboPop .4s cubic-bezier(.34,1.56,.64,1); }

    .nivel-secuencia { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .seq-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.25); transition: all .2s; }
    .seq-dot-fill { background: #a78bfa; border-color: #a78bfa; box-shadow: 0 0 8px rgba(167,139,250,.7); }

    .grid-dimmed { opacity: .35; pointer-events: none; filter: blur(1px); transition: opacity .3s, filter .3s; }

    .elementos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .elemento {
      aspect-ratio: 1; border-radius: 50%; border: 4px solid rgba(255,255,255,.15);
      background: var(--color);
      box-shadow: 0 10px 40px color-mix(in srgb,var(--color) 45%,transparent), inset 0 2px 0 rgba(255,255,255,.3);
      cursor: default; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; transition: transform .12s ease, box-shadow .15s ease, border-color .15s;
      position: relative; overflow: hidden;
    }
    .elemento::after { content: ''; position: absolute; top: 12%; left: 20%; width: 35%; height: 28%; background: rgba(255,255,255,.25); border-radius: 50%; filter: blur(4px); pointer-events: none; }
    .elemento.clickable { cursor: pointer; }
    .elemento.clickable:hover { transform: scale(1.06); border-color: rgba(255,255,255,.5); box-shadow: 0 16px 50px color-mix(in srgb,var(--color) 60%,transparent), inset 0 2px 0 rgba(255,255,255,.35); }
    .elemento.clickable:active { transform: scale(.93); }
    .elemento.activo {
      transform: scale(1.12); background: var(--color-activo); border-color: rgba(255,255,255,.8);
      box-shadow: 0 0 0 8px rgba(255,255,255,.12), 0 0 60px var(--glow), 0 0 120px color-mix(in srgb,var(--glow) 50%,transparent), inset 0 2px 0 rgba(255,255,255,.5);
      animation: pulsoActivo .65s ease;
    }
    .el-simbolo { font-size: 44px; line-height: 1; pointer-events: none; position: relative; z-index: 1; }
    .el-nombre  { font-size: 13px; font-weight: 800; color: rgba(255,255,255,.9); pointer-events: none; position: relative; z-index: 1; text-shadow: 0 1px 4px rgba(0,0,0,.4); }
    .error-anim { animation: errorShake .4s ease !important; border-color: #f87171 !important; box-shadow: 0 0 0 6px rgba(239,68,68,.5) !important; }
    /* CA-03: resalta el elemento correcto en verde por 1.5s tras un fallo */
    .correcto-highlight { border-color: #22c55e !important; box-shadow: 0 0 0 8px rgba(34,197,94,.5), 0 0 40px rgba(34,197,94,.6) !important; animation: correctoPulse 1.5s ease; }
    @keyframes correctoPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    /* CA-03: pista sin penalizar puntaje */
    .pista-highlight { border-color: #fbbf24 !important; box-shadow: 0 0 0 10px rgba(251,191,36,.55), 0 0 50px rgba(251,191,36,.7) !important; animation: pistaBlink .7s ease-in-out; }
    @keyframes pistaBlink { 0%,100% { opacity: 1; } 50% { opacity: .55; } }

    .volumen-footer { margin-top: 18px; display: flex; justify-content: center; }

    .cuenta-overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; z-index: 50;
      background: rgba(15,12,41,.55); backdrop-filter: blur(2px);
      border-radius: 24px; pointer-events: none;
    }
    .cuenta-num {
      font-size: 120px; font-weight: 900; line-height: 1;
      background: linear-gradient(135deg, #a78bfa, #60a5fa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      filter: drop-shadow(0 0 40px rgba(167,139,250,.8));
    }
    .cuenta-num.cuenta-pop { animation: cuentaPop .5s cubic-bezier(.34,1.56,.64,1); }
    .cuenta-sub { font-size: 18px; font-weight: 700; color: rgba(255,255,255,.6); letter-spacing: 2px; text-transform: uppercase; }
    @keyframes cuentaPop { 0%{transform:scale(2.2) rotate(-8deg);opacity:0} 60%{transform:scale(.9) rotate(2deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }

    /* ══ RESULTADOS ══ */
    .pantalla-resultados { padding: 24px; width: 100%; max-width: 480px; position: relative; }
    .resultados-card {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.13);
      border-radius: 32px; padding: 36px 28px 32px; text-align: center;
      backdrop-filter: blur(16px); animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }

    .fox-resultado-hero {
      position: relative; display: inline-flex;
      align-items: center; justify-content: center;
      margin-bottom: 16px; width: 120px; height: 120px;
    }
    .fox-resultado-ring {
      position: absolute; inset: -6px; border-radius: 50%;
      background: conic-gradient(#a78bfa, #60a5fa, #4ade80, #fbbf24, #f87171, #a78bfa);
      animation: spinRing 5s linear infinite; filter: blur(1px);
    }
    .fox-resultado-face {
      font-size: 88px; line-height: 1; position: relative; z-index: 1;
      animation: bounce 2s ease-in-out infinite;
      filter: drop-shadow(0 0 20px rgba(167,139,250,.7));
      background: rgba(15,12,41,.5); border-radius: 50%;
      width: 110px; height: 110px; display: flex; align-items: center; justify-content: center;
    }
    .fox-resultado-trophy {
      position: absolute; top: -10px; right: -10px; z-index: 2;
      font-size: 36px; animation: bounce 1.5s ease-in-out infinite .3s;
    }
    @keyframes spinRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }

    .resultado-titulo { font-size: 24px; font-weight: 900; color: #f1f5f9; margin-bottom: 16px; }
    .estrellas { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 20px; }
    .estrella { font-size: 32px; filter: grayscale(1) opacity(.3); transition: all .4s cubic-bezier(.34,1.56,.64,1); }
    .estrella.grande { font-size: 44px; }
    .estrella.estrella-on { filter: grayscale(0) opacity(1) drop-shadow(0 0 12px rgba(250,204,21,.8)); animation: starPop .5s cubic-bezier(.34,1.56,.64,1) both; }
    .estrellas .estrella:nth-child(2).estrella-on { animation-delay: .15s; }
    .estrellas .estrella:nth-child(3).estrella-on { animation-delay: .3s; }

    .score-ring { position: relative; width: 130px; height: 130px; margin: 0 auto 20px; }
    .score-ring svg { width: 130px; height: 130px; transform: rotate(-90deg); }
    .ring-bg   { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 10; }
    .ring-fill { fill: none; stroke: #a78bfa; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 1.2s ease; }
    .score-texto { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-num { font-size: 30px; font-weight: 900; background: linear-gradient(135deg,#a78bfa,#60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .score-lbl { font-size: 11px; color: #64748b; }

    .foxy-msg-final { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 20px; text-align: left; }
    .foxy-msg-avatar { font-size: 36px; flex-shrink: 0; }
    .foxy-msg-bubble {
      background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
      border-radius: 4px 16px 16px 16px; padding: 10px 14px;
      font-size: 13px; color: #94a3b8; line-height: 1.65; flex: 1;
    }

    .metricas-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 24px; }
    .metrica { background: rgba(255,255,255,.06); border-radius: 14px; padding: 12px 6px; }
    .m-icon { font-size: 18px; margin-bottom: 4px; }
    .m-val  { font-size: 26px; font-weight: 900; line-height: 1; margin-bottom: 2px; }
    .m-lbl  { font-size: 10px; color: #64748b; }
    .m-val.verde  { color: #4ade80; } .m-val.rojo   { color: #f87171; }
    .m-val.morado { color: #c4b5fd; } .m-val.naranja{ color: #fb923c; }

    .btns-final { display: flex; gap: 10px; }
    .btn-repetir { flex: 1; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: white; border: none; border-radius: 14px; padding: 14px 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; }
    .btn-repetir:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,.5); }
    .btn-volver { flex: 1; background: rgba(255,255,255,.07); color: #94a3b8; border: 1px solid rgba(255,255,255,.13); border-radius: 14px; padding: 14px 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; }
    .btn-volver:hover { background: rgba(255,255,255,.13); color: #f1f5f9; }

    /* ── Keyframes comunes ── */
    @keyframes slideUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn      { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes flotar     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes pulsoActivo{ 0%{transform:scale(1)} 40%{transform:scale(1.16)} 70%{transform:scale(1.09)} 100%{transform:scale(1.12)} }
    @keyframes errorShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px) rotate(-3deg)} 40%{transform:translateX(10px) rotate(3deg)} 60%{transform:translateX(-7px) rotate(-2deg)} 80%{transform:translateX(7px) rotate(2deg)} }
    @keyframes mascotShake{ 0%,100%{transform:rotate(0)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(12deg)} }
    @keyframes comboPop   { from{opacity:0;transform:scale(.5) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes starPop    { from{transform:scale(0) rotate(-30deg)} to{transform:scale(1) rotate(0)} }
  `]
})
export class EspejoMentalComponent implements OnInit, OnDestroy {

  readonly ELEMENTOS: Elemento[] = [
    { id: 0, color: '#dc2626', colorActivo: '#ff6b6b', glow: 'rgba(220,38,38,.9)',  simbolo: '🔴', nombre: 'Rojo'     },
    { id: 1, color: '#1d4ed8', colorActivo: '#60a5fa', glow: 'rgba(29,78,216,.9)',  simbolo: '🔵', nombre: 'Azul'     },
    { id: 2, color: '#15803d', colorActivo: '#4ade80', glow: 'rgba(21,128,61,.9)',  simbolo: '🟢', nombre: 'Verde'    },
    { id: 3, color: '#b45309', colorActivo: '#fbbf24', glow: 'rgba(180,83,9,.9)',   simbolo: '🟡', nombre: 'Amarillo' },
  ];

  readonly MAX_RONDAS = 10;
  private readonly TONOS = [261.63, 329.63, 392.00, 523.25];

  readonly MASCOTA_MSGS: Record<Mood, string[]> = {
    idle:      ['¡Listo para jugar! 🎮', '¡Aquí vamos! ✨'],
    thinking:  ['¡Memoriza bien! 👀', '¡Presta atención! 🧠', '¡Fíjate en el orden! 🔍', '¡Concéntrate! 💡', '¡Obsérvame bien! 🌟'],
    excited:   ['¡Es tu turno! ¡Tú puedes! 💪', '¡Recuerda el orden! 🎯', '¡Vamos, campeón! 🚀', '¡Confío en ti! ⭐', '¡Tu cerebro es poderoso! 🧠'],
    celebrate: ['¡INCREÍBLE! ¡Lo lograste! 🎉', '¡PERFECTO! ¡Eres un genio! ⭐', '¡BRILLANTE! ¡Qué memoria! 🏆', '¡GENIAL! ¡Sigue así! 💫', '¡ASOMBROSO! 🦸‍♂️'],
    encourage: ['¡Casi! ¡Inténtalo de nuevo! 💪', '¡No pasa nada! ¡Tú puedes! 🌟', '¡Cada error te enseña algo! 💖', '¡Ánimo! ¡La próxima es tuya! 🌈'],
  };

  estado: Estado = 'inicio';
  secuencia: number[] = [];
  respuestaJugador: number[] = [];
  longitudActual = 3;
  elementoActivo = -1;
  elementoError = -1;
  erroresConsecutivos = 0;

  aciertos = 0; errores = 0; maxLongitud = 3; rondas = 0;
  metricas: ClickMetrica[] = [];
  tiempoInicioInput = 0;
  combo = 0; maxCombo = 0;
  showCombo = false; showConfetti = false;
  confettiPieces: ConfettiPiece[] = this.generarConfeti();

  cuentaTexto = '3';
  cuentaPop = false;

  mascotEmoji = '🦊';
  mascotMsg   = '¡Listo para jugar! 🎮';
  mascotMood: Mood = 'idle';
  voiceEnabled = true;
  private abortado = false;

  // ── Retroalimentación visual/sonora (CA-01..CA-06) ─────────────────────
  @ViewChild('feedback') feedback!: GameFeedbackComponent;
  volumenActual: NivelVolumen = 75;
  elementoCorrectoHighlight = -1; // CA-03: resalta el elemento correcto tras fallo
  elementoPista = -1;             // CA-03: pista sin penalizar puntaje
  private fallosParaPista = 0;    // contador independiente de erroresConsecutivos (dificultad)
  private profileId: number | null = null;
  private skipResolver: (() => void) | null = null;

  get secuenciaArray(): number[] { return Array.from({ length: this.longitudActual }); }

  get mascotDecoEmoji(): string {
    const map: Record<Mood, string> = {
      idle: '', thinking: '👀', excited: '💪', celebrate: '🎉', encourage: '💗'
    };
    return map[this.mascotMood];
  }

  private timers: ReturnType<typeof setTimeout>[] = [];
  private audioCtx: AudioContext | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private feedbackService: GameFeedbackService,
    private childProfileService: ChildProfileService,
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
      this.profileId = state.profileId;
      this.volumenActual = (state.profileVolumen ?? 75) as NivelVolumen;
      this.feedbackService.setVolumen(this.volumenActual);
    });
  }

  ngOnDestroy(): void { this.limpiarTimers(); this.audioCtx?.close(); window.speechSynthesis?.cancel(); }

  // ── Volumen (CA-05) ─────────────────────────────────────────────────────

  onVolumenChange(v: NivelVolumen): void {
    this.volumenActual = v;
    this.feedbackService.setVolumen(v);
    if (this.profileId != null) {
      this.childProfileService.updateVolumen(this.profileId, v).subscribe();
    }
  }

  // ── AUDIO ─────────────────────────────────────────

  private initAudio(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private tocar(freq: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.35, freqFin?: number): void {
    if (!this.audioCtx) return;
    try {
      const osc  = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      if (freqFin) osc.frequency.exponentialRampToValueAtTime(freqFin, this.audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + dur + 0.05);
    } catch (_) {}
  }

  // ── TTS ───────────────────────────────────────────

  toggleVoz(): void { this.voiceEnabled = !this.voiceEnabled; if (!this.voiceEnabled) window.speechSynthesis?.cancel(); }

  private hablar(texto: string, rate = 0.92, pitch = 1.15): Promise<void> {
    if (!this.voiceEnabled || !window.speechSynthesis) return Promise.resolve();
    return new Promise(resolve => {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(texto);
        utt.lang   = 'es-ES';
        utt.volume = 0.9;
        utt.rate   = rate;
        utt.pitch  = pitch;
        utt.onend  = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      } catch (_) { resolve(); }
    });
  }

  private sonarElemento(id: number): void { this.tocar(this.TONOS[id], 0.28, 'sine', 0.4); }
  // Los sonidos de acierto/error del CA-04 ahora los reproduce GameFeedbackService (assets OGG/MP3).
  private sonarTick(): void { this.tocar(440, 0.07, 'triangle', 0.22); }
  private sonarYa(): void {
    this.tocar(880, 0.12, 'sine', 0.45);
    setTimeout(() => this.tocar(1047, 0.18, 'sine', 0.4), 90);
    setTimeout(() => this.tocar(1319, 0.22, 'sine', 0.35), 180);
  }
  private sonarFanfare(): void {
    const notas = this.puntuacion >= 80 ? [523, 659, 784, 880, 1047] : [523, 659, 523];
    notas.forEach((f, i) => setTimeout(() => this.tocar(f, 0.3, 'sine', 0.4), i * 130));
  }

  // ── FLUJO ─────────────────────────────────────────

  iniciarJuego(): void {
    this.initAudio();
    this.abortado = false;
    this.aciertos = 0; this.errores = 0; this.maxLongitud = 3;
    this.rondas = 0; this.metricas = []; this.erroresConsecutivos = 0;
    this.longitudActual = 3; this.combo = 0; this.maxCombo = 0;
    this.nuevaRonda();
  }

  reiniciarJuego(): void { this.iniciarJuego(); }

  private nuevaRonda(): void { this.generarSecuencia(); this.iniciarCuenta(); }

  private generarSecuencia(): void {
    this.secuencia = Array.from({ length: this.longitudActual },
      () => Math.floor(Math.random() * this.ELEMENTOS.length));
  }

  private iniciarCuenta(): void {
    this.estado = 'cuenta';
    this.setMascota('idle');
    this.mostrarCuentaNum('3');
    this.sonarTick();
    this.cdr.detectChanges();

    const pasos = [
      { delay: 900,  texto: '2',    sonido: () => this.sonarTick() },
      { delay: 1800, texto: '1',    sonido: () => this.sonarTick() },
      { delay: 2700, texto: '¡YA!', sonido: () => this.sonarYa()  },
      { delay: 3400, texto: '',     sonido: () => {}, accion: () => this.mostrarSecuencia() },
    ];

    pasos.forEach(p => {
      this.timers.push(setTimeout(() => {
        if (p.texto) this.mostrarCuentaNum(p.texto);
        p.sonido();
        (p as any).accion?.();
        this.cdr.detectChanges();
      }, p.delay));
    });
  }

  private mostrarCuentaNum(texto: string): void {
    this.cuentaTexto = texto;
    this.cuentaPop = false;
    this.cdr.detectChanges();
    setTimeout(() => { this.cuentaPop = true; this.cdr.detectChanges(); }, 10);
    const vozMap: Record<string, string> = { '3': 'Tres', '2': 'Dos', '1': 'Uno', '¡YA!': '¡Ya!' };
    this.hablar(vozMap[texto] ?? texto, 0.85, 1.2);
  }

  private mostrarSecuencia(): void {
    this.estado = 'mostrando';
    this.respuestaJugador = [];
    this.elementoActivo = -1;
    this.showCombo = false;
    this.setMascota('thinking');
    this.cdr.detectChanges();

    let delay = 500;
    for (let i = 0; i < this.secuencia.length; i++) {
      const id = this.secuencia[i];
      this.timers.push(setTimeout(() => {
        this.elementoActivo = id; this.sonarElemento(id); this.cdr.detectChanges();
      }, delay));
      delay += 650;
      this.timers.push(setTimeout(() => {
        this.elementoActivo = -1; this.cdr.detectChanges();
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

  clicarElemento(id: number): void {
    if (this.estado !== 'input') return;
    // CA-01: se marca el inicio justo en el input; el cálculo correcto/incorrecto es 100% local.
    const t0 = this.feedbackService.marcarInicio();
    this.sonarElemento(id);
    const ms       = Date.now() - this.tiempoInicioInput;
    const esperado = this.secuencia[this.respuestaJugador.length];
    const correcto = id === esperado;
    this.metricas.push({ elementId: id, ms, correcto });
    this.respuestaJugador.push(id);

    if (!correcto) {
      this.elementoError = id;
      this.cdr.detectChanges();
      this.timers.push(setTimeout(() => { this.elementoError = -1; this.cdr.detectChanges(); }, 450));
      this.manejarError(esperado);
      this.feedbackService.registrarLatencia(t0);
      return;
    }
    if (this.respuestaJugador.length === this.secuencia.length) {
      this.manejarAcierto();
      this.feedbackService.registrarLatencia(t0);
    }
  }

  private manejarAcierto(): void {
    this.aciertos++; this.rondas++;
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.erroresConsecutivos = 0;
    this.fallosParaPista = 0;
    this.elementoPista = -1;
    // Sube 1 elemento solo cada 2 aciertos seguidos (max 8 para niños)
    if (this.combo > 0 && this.combo % 2 === 0) {
      this.longitudActual = Math.min(this.longitudActual + 1, 8);
    }
    this.maxLongitud = Math.max(this.maxLongitud, this.longitudActual);
    this.showCombo = this.combo >= 2;
    this.feedback.showCorrect(); // CA-02: sonido + borde verde + check + partículas, <=1.2s
    this.estado = 'feedback';
    this.cdr.detectChanges();

    const speechDone = this.setMascota('celebrate');
    const minPausa   = this.crearPausaCancelable(1400);

    Promise.all([speechDone, minPausa]).then(() => {
      if (this.abortado) return;
      this.showConfetti = false;
      if (this.rondas >= this.MAX_RONDAS) {
        this.dispararConfeti(); // celebración solo al terminar la partida completa
        this.estado = 'resultados'; this.sonarFanfare();
        const txt = (this.tituloFinal + '. ' + this.mensajeFinal).replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
        setTimeout(() => this.hablar(txt, 0.88, 1.1), 800);
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    });
  }

  private manejarError(elementoCorrecto: number): void {
    this.errores++; this.rondas++;
    this.combo = 0; this.erroresConsecutivos++;
    this.fallosParaPista++;
    if (this.erroresConsecutivos >= 2) {
      this.longitudActual = Math.max(this.longitudActual - 1, 2);
      this.erroresConsecutivos = 0;
    }
    // CA-03: resalta el elemento correcto en verde por 1.5s
    this.elementoCorrectoHighlight = elementoCorrecto;
    this.timers.push(setTimeout(() => { this.elementoCorrectoHighlight = -1; this.cdr.detectChanges(); }, 1500));

    this.feedback.showIncorrect(undefined, this.fallosParaPista >= 3); // CA-03/CA-04
    this.estado = 'feedback';
    this.cdr.detectChanges();

    const speechDone = this.setMascota('encourage');
    const minPausa   = this.crearPausaCancelable(1400);

    Promise.all([speechDone, minPausa]).then(() => {
      if (this.abortado) return;
      if (this.rondas >= this.MAX_RONDAS) {
        this.estado = 'resultados'; this.sonarFanfare();
        const txt = (this.tituloFinal + '. ' + this.mensajeFinal).replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
        setTimeout(() => this.hablar(txt, 0.88, 1.1), 800);
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    });
  }

  // ── CA-06: skip de la animación de transición entre rondas ─────────────

  /** Crea una pausa que se resuelve sola tras `ms`, o antes si el niño hace clic para saltarla (<100ms). */
  private crearPausaCancelable(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setTimeout(resolve, ms);
      this.skipResolver = () => { clearTimeout(timer); resolve(); };
    });
  }

  saltarSiEsPosible(): void {
    if (this.estado === 'cuenta') {
      this.timers.forEach(t => clearTimeout(t));
      this.timers = [];
      this.mostrarSecuencia();
    } else if (this.estado === 'feedback' && this.skipResolver) {
      const resolver = this.skipResolver;
      this.skipResolver = null;
      resolver();
    }
  }

  onIncorrectShown(): void {
    // El feedback de error ya es visible; el resaltado del elemento correcto
    // se activó al mismo tiempo desde manejarError() (CA-03).
  }

  onHintRequested(): void {
    // CA-03: pista sin penalizar puntaje — resalta brevemente el próximo elemento esperado.
    this.fallosParaPista = 0;
    const esperado = this.secuencia[this.respuestaJugador.length];
    this.elementoPista = esperado;
    this.cdr.detectChanges();
    this.timers.push(setTimeout(() => { this.elementoPista = -1; this.cdr.detectChanges(); }, 700));
  }

  terminarSesion(): void {
    this.limpiarTimers();
    this.dispararConfeti();
    this.estado = 'resultados';
    this.sonarFanfare();
    this.cdr.detectChanges();
    setTimeout(() => this.hablar(this.tituloFinal + '. ' + this.mensajeFinal.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim(), 0.88, 1.1), 800);
  }

  volver(): void { this.router.navigate(['/nino/juegos']); }

  get puntuacion(): number {
    return this.rondas === 0 ? 0 : Math.round((this.aciertos / this.rondas) * 100);
  }
  get trofeoEmoji(): string {
    return this.puntuacion >= 85 ? '🏆' : this.puntuacion >= 65 ? '🥈' : this.puntuacion >= 40 ? '🥉' : '🌟';
  }
  get tituloFinal(): string {
    return this.puntuacion >= 85 ? '¡Memoria de élite!' : this.puntuacion >= 65 ? '¡Muy bien hecho!' : this.puntuacion >= 40 ? '¡Buen esfuerzo!' : '¡Sigue practicando!';
  }
  get mensajeFinal(): string {
    if (this.puntuacion >= 85) return `¡Alcanzaste secuencias de ${this.maxLongitud} elementos! Tu memoria de trabajo es excelente. 🧠✨`;
    if (this.puntuacion >= 65) return `Lograste secuencias de hasta ${this.maxLongitud} elementos. ¡Tu memoria está mejorando! 🌟`;
    if (this.puntuacion >= 40) return `La práctica fortalece tu cerebro. ¡Inténtalo de nuevo y supera tu récord! 💪`;
    return `¡No te rindas! Cada intento entrena tu memoria. ¡Yo sé que puedes! 💖`;
  }

  private setMascota(mood: Mood): Promise<void> {
    this.mascotMood = mood;
    const msgs = this.MASCOTA_MSGS[mood];
    this.mascotMsg = msgs[Math.floor(Math.random() * msgs.length)];
    this.mascotEmoji = '🦊';
    const textoVoz = this.mascotMsg.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
    return this.hablar(textoVoz);
  }

  private dispararConfeti(): void {
    this.confettiPieces = this.generarConfeti();
    this.showConfetti = true;
  }

  private generarConfeti(): ConfettiPiece[] {
    const colores = ['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#34d399','#fb923c','#e879f9'];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i, left: Math.random() * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 500, dur: 1400 + Math.random() * 800,
      size: 6 + Math.random() * 9,
    }));
  }

  private limpiarTimers(): void { this.abortado = true; this.timers.forEach(t => clearTimeout(t)); this.timers = []; }
}
