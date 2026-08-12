import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { Juego, NivelDificultad } from '../../../../core/models/juego.model';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';

type Estado = 'inicio' | 'cuenta' | 'mostrando' | 'input' | 'feedback' | 'resultados';
type Mood   = 'idle' | 'thinking' | 'excited' | 'celebrate' | 'encourage';

interface Elemento { id: number; color: string; colorActivo: string; glow: string; simbolo: string; nombre: string; }
interface ClickMetrica { elementId: number; ms: number; correcto: boolean; }
interface ConfettiPiece { id: number; left: number; color: string; delay: number; dur: number; size: number; }

@Component({
  selector: 'app-ritmo-patron',
  standalone: true,
  imports: [CommonModule, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-wrapper">

      <!-- ── Fondo animado (persistente en todos los estados) ─────────────── -->
      <div class="rp-bg-orb rp-o1" aria-hidden="true"></div>
      <div class="rp-bg-orb rp-o2" aria-hidden="true"></div>
      <div class="rp-bg-orb rp-o3" aria-hidden="true"></div>
      <div class="rp-eq" aria-hidden="true">
        <div class="rp-bar rp-b1"></div><div class="rp-bar rp-b2"></div>
        <div class="rp-bar rp-b3"></div><div class="rp-bar rp-b4"></div>
        <div class="rp-bar rp-b5"></div><div class="rp-bar rp-b6"></div>
        <div class="rp-bar rp-b7"></div><div class="rp-bar rp-b8"></div>
        <div class="rp-bar rp-b9"></div><div class="rp-bar rp-b10"></div>
      </div>

      <!-- Flash overlay -->
      @if (showFlash) {
        <div class="flash-overlay" [class.flash-verde]="flashVerde" [class.flash-rojo]="!flashVerde"></div>
      }

      <!-- INICIO -->
      @if (estado === 'inicio') {
        <div class="pantalla-inicio">
          <img class="bg-escena" src="mascotas/bongo-escena.png" alt="Escenario de ritmo de Bongo">
          <div class="inicio-velo"></div>

          <button type="button" class="btn-volver-inicio" (click)="volver()">← Volver</button>

          <!-- Bongo explica las instrucciones desde su burbuja -->
          <div class="bongo-habla">
            <div class="habla-bubble">
              <p class="habla-saludo">¡Hola! Soy <strong>Bongo</strong> 🥁</p>
              <p class="habla-intro">Para jugar Ritmo y Patrón:</p>
              <div class="habla-pasos">
                <div class="habla-paso"><span class="h-ico">👂</span><span>Escucha los instrumentos que suenan</span></div>
                <div class="habla-paso"><span class="h-ico">👆</span><span>Tócalos en el mismo orden</span></div>
                <div class="habla-paso"><span class="h-ico">🚀</span><span>¡Aciertas y el ritmo crece!</span></div>
              </div>
              <p class="habla-animo">¡A escuchar y repetir! ✨</p>
            </div>
            <div class="habla-tail"></div>
          </div>

          <!-- Panel derecho — título y botón -->
          <div class="inicio-panel">
            <h1 class="titulo-juego">
              <span class="titulo-grad">Ritmo</span><span class="titulo-blanco"> y Patrón</span>
            </h1>
            <p class="subtitulo-juego">Escucha la secuencia de sonidos y repítela en orden</p>

            <button class="btn-empezar" (click)="iniciarJuego()">
              <span>🥁</span> ¡Empezar!
              <span class="btn-shine"></span>
            </button>

            <div class="volumen-footer">
              <button class="btn-voz" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar a Bongo' : 'Activar voz de Bongo'">
                {{ voiceEnabled ? '🔊' : '🔇' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- JUEGO -->
      @if (estado === 'cuenta' || estado === 'mostrando' || estado === 'input' || estado === 'feedback') {
        <div class="pantalla-juego">

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

          <app-mascot [game]="'ritmo'" [mood]="mascotMood" [message]="mascotMsg"></app-mascot>

          @if (showCombo && combo >= 2) {
            <div class="combo-badge">🔥 ¡Combo x{{ combo }}!</div>
          }

          <div class="nivel-secuencia">
            @for (i of secuenciaArray; track $index) {
              <div class="seq-dot" [class.seq-dot-fill]="$index < respuestaJugador.length"></div>
            }
          </div>

          <div class="elementos-grid" [class.grid-dimmed]="estado === 'cuenta'">
            @for (el of elementosDisponibles; track el.id) {
              <button class="elemento"
                [class.activo]="elementoActivo === el.id"
                [class.error-anim]="elementoError === el.id"
                [class.clickable]="estado === 'input'"
                [style.--color]="el.color"
                [style.--color-activo]="el.colorActivo"
                [style.--glow]="el.glow"
                [disabled]="estado !== 'input'"
                (click)="clicarElemento($event, el.id)">
                <span class="el-simbolo">{{ el.simbolo }}</span>
                <span class="el-nombre">{{ el.nombre }}</span>
              </button>
            }
          </div>

          @if (estado === 'cuenta') {
            <div class="cuenta-overlay">
              <div class="cuenta-num" [class.cuenta-pop]="cuentaPop">{{ cuentaTexto }}</div>
              <div class="cuenta-sub">{{ cuentaTexto === '¡YA!' ? '¡A recordar!' : '¡Prepárate!' }}</div>
            </div>
          }

        </div>
      }

      <!-- RESULTADOS -->
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
            <div class="fox-resultado-hero">
              <img class="foxy-resultado-img" src="mascotas/bongo-portrait.png" alt="Bongo">
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

            <div class="foxy-msg-final">
              <img class="foxy-msg-avatar-img" src="mascotas/bongo-portrait.png" alt="Bongo">
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

    .flash-overlay { position: fixed; inset: 0; z-index: 200; pointer-events: none; animation: flashAnim .4s ease forwards; }
    .flash-verde { background: rgba(34,197,94,.28); }
    .flash-rojo  { background: rgba(239,68,68,.28); }
    @keyframes flashAnim { 0%{opacity:1} 100%{opacity:0} }

    .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden; }
    .confeti { position: absolute; top: -20px; border-radius: 3px; animation: caer linear forwards; }
    @keyframes caer { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }

    /* ══ INICIO — cinematográfico (mismo patrón que Espejo Mental / Laberinto / Maratón Mental / Piezas en Tiempo / Mapa Aventura) ══ */
    .pantalla-inicio {
      min-height: 100vh; width: 100%;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }

    .bg-escena {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center center; z-index: 0;
      transform-origin: 115% 48%;
      animation: bgZoomBongo 24s ease-in-out infinite alternate;
    }
    @keyframes bgZoomBongo {
      from { transform: scale(1.30) translate(0,0); }
      to   { transform: scale(1.34) translate(-.5%, .3%); }
    }

    .inicio-velo {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(
        to right,
        transparent 0%,
        transparent 26%,
        rgba(15,12,41,.65) 40%,
        rgba(15,12,41,.9) 54%,
        rgba(15,12,41,.96) 100%
      );
    }

    .btn-volver-inicio {
      position: absolute; top: 24px; left: 24px; z-index: 4;
      padding: 10px 16px; border: 1px solid rgba(255,255,255,.2); border-radius: 14px;
      background: rgba(8,14,30,.7); color: #dce7f8; font-size: 14px; font-weight: 700;
      cursor: pointer; backdrop-filter: blur(10px); transition: transform .2s ease, background .2s ease;
    }
    .btn-volver-inicio:hover { transform: translateY(-2px); background: rgba(255,255,255,.12); }

    /* Burbuja de Bongo con instrucciones */
    .bongo-habla {
      position: absolute; left: 4%; bottom: 6%; z-index: 3;
      width: 300px; display: flex; flex-direction: column-reverse; align-items: flex-end;
      animation: popInBongo .5s .3s both cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes popInBongo { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
    .habla-bubble {
      background: rgba(255,255,255,0.97); border: 3px solid #a78bfa; border-radius: 22px;
      padding: 18px 20px 14px; color: #1e1b4b; box-shadow: 0 8px 40px rgba(124,58,237,.4);
    }
    .habla-saludo { font-size: 17px; font-weight: 800; margin: 0 0 6px; }
    .habla-intro  { font-size: 13px; font-weight: 700; color: #7c3aed; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .5px; }
    .habla-pasos  { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .habla-paso   { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #1e1b4b; }
    .h-ico        { font-size: 20px; flex-shrink: 0; }
    .habla-animo  { font-size: 14px; font-weight: 700; color: #6d28d9; margin: 0; text-align: right; }
    .habla-tail {
      width: 0; height: 0; border-left: 16px solid transparent; border-right: 16px solid transparent;
      border-bottom: 22px solid #a78bfa; margin: 0 28px 0 0; position: relative;
    }
    .habla-tail::after {
      content: ''; position: absolute; bottom: -25px; left: -12px;
      width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent;
      border-bottom: 18px solid rgba(255,255,255,.97);
    }

    .inicio-panel {
      position: absolute; z-index: 2; left: 50%; top: 50%; transform: translateY(-50%);
      width: 48%; max-width: 480px; max-height: 90vh; overflow-y: auto;
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 28px 32px; background: rgba(15,12,41,.5); backdrop-filter: blur(4px);
      border-radius: 28px; animation: slideUpBongo .5s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes slideUpBongo { from { opacity: 0; transform: translateY(-50%) translateY(20px); } to { opacity: 1; transform: translateY(-50%) translateY(0); } }

    .titulo-juego { font-size: 40px; font-weight: 900; margin: 0 0 8px; line-height: 1.1; }
    .titulo-grad { background: linear-gradient(135deg,#a78bfa,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .titulo-blanco { color: white; }
    .subtitulo-juego { font-size: 15px; color: #94a3b8; margin-bottom: 26px; }

    .btn-empezar {
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      color: white; border: none; border-radius: 20px; padding: 18px 52px;
      font-size: 20px; font-weight: 800; cursor: pointer; transition: all .2s;
      box-shadow: 0 8px 32px rgba(124,58,237,.5);
      position: relative; overflow: hidden;
      animation: pulseBtn 2s infinite;
      width: 100%; justify-content: center; margin-bottom: 16px;
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

    .volumen-footer { display: flex; align-items: center; justify-content: center; gap: 14px; }

    .btn-voz {
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
      border-radius: 50%; width: 42px; height: 42px;
      font-size: 20px; cursor: pointer; transition: all .2s;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .btn-voz:hover { background: rgba(255,255,255,.2); transform: scale(1.1); }

    .pantalla-juego { width: 100%; max-width: 520px; padding: 20px 20px 32px; position: relative; }

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

    .elementos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .elemento {
      aspect-ratio: 1; border-radius: 50%; border: 4px solid rgba(255,255,255,.15);
      background: var(--color);
      box-shadow: 0 10px 40px color-mix(in srgb,var(--color) 45%,transparent), inset 0 2px 0 rgba(255,255,255,.3);
      cursor: default; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; transition: transform .12s ease, box-shadow .15s ease, border-color .15s;
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
    .el-simbolo { font-size: 36px; line-height: 1; pointer-events: none; position: relative; z-index: 1; }
    .el-nombre  { font-size: 11px; font-weight: 800; color: rgba(255,255,255,.9); pointer-events: none; position: relative; z-index: 1; text-shadow: 0 1px 4px rgba(0,0,0,.4); }
    .error-anim { animation: errorShake .4s ease !important; border-color: #f87171 !important; box-shadow: 0 0 0 6px rgba(239,68,68,.5) !important; }

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
    .foxy-resultado-img {
      width: 120px; height: auto;
      filter: drop-shadow(0 0 20px rgba(167,139,250,.6));
      animation: bounce 2s ease-in-out infinite;
      -webkit-mask-image: radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%);
      mask-image: radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%);
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
    .foxy-msg-avatar-img { width:48px; height:auto; flex-shrink:0; filter:drop-shadow(0 0 8px rgba(167,139,250,.5)); -webkit-mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); }
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

    @keyframes slideUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn      { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes pulsoActivo{ 0%{transform:scale(1)} 40%{transform:scale(1.16)} 70%{transform:scale(1.09)} 100%{transform:scale(1.12)} }
    @keyframes errorShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px) rotate(-3deg)} 40%{transform:translateX(10px) rotate(3deg)} 60%{transform:translateX(-7px) rotate(-2deg)} 80%{transform:translateX(7px) rotate(2deg)} }
    @keyframes mascotShake{ 0%,100%{transform:rotate(0)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(12deg)} }
    @keyframes comboPop   { from{opacity:0;transform:scale(.5) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes starPop    { from{transform:scale(0) rotate(-30deg)} to{transform:scale(1) rotate(0)} }

    /* ══ FONDO ANIMADO — RITMO Y PATRÓN ═══════════════════════════════════ */
    .rp-bg-orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; animation: rpOrbPulse 10s ease-in-out infinite; }
    .rp-o1 { width: 500px; height: 500px; top: -160px; left: -110px; background: radial-gradient(circle, rgba(167,139,250,.32), transparent 70%); animation-delay: 0s; }
    .rp-o2 { width: 370px; height: 370px; bottom: -130px; right: -90px; background: radial-gradient(circle, rgba(96,165,250,.25), transparent 70%); animation-delay: 4s; }
    .rp-o3 { width: 270px; height: 270px; top: 40%; left: 58%; background: radial-gradient(circle, rgba(232,121,249,.18), transparent 70%); animation-delay: 8s; }
    @keyframes rpOrbPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
    /* ── Barras de ecualizador — distintivo de este juego ────────────────── */
    .rp-eq {
      position: fixed; bottom: 0; left: 0; right: 0; height: 100px;
      display: flex; align-items: flex-end; justify-content: center; gap: 5px;
      padding: 0 18%; pointer-events: none; z-index: 0;
    }
    .rp-bar {
      flex: 1; border-radius: 3px 3px 0 0;
      background: linear-gradient(180deg, rgba(167,139,250,.12), rgba(96,165,250,.06));
      animation: rpBarPulse var(--d,4s) ease-in-out infinite var(--dl,0s);
    }
    @keyframes rpBarPulse { 0%,100%{height:14px} 50%{height:var(--h,50px)} }
    .rp-b1  {--d:4.2s;--dl:0s;   --h:38px}  .rp-b2  {--d:3.1s;--dl:.4s;  --h:62px}
    .rp-b3  {--d:5.0s;--dl:.8s;  --h:45px}  .rp-b4  {--d:3.8s;--dl:1.2s; --h:78px}
    .rp-b5  {--d:4.5s;--dl:.6s;  --h:55px}  .rp-b6  {--d:3.4s;--dl:1.8s; --h:70px}
    .rp-b7  {--d:5.2s;--dl:.2s;  --h:42px}  .rp-b8  {--d:3.9s;--dl:1.0s; --h:65px}
    .rp-b9  {--d:4.7s;--dl:1.4s; --h:50px}  .rp-b10 {--d:3.6s;--dl:.5s;  --h:58px}
  `]
})
export class RitmoPatronComponent implements OnInit, OnDestroy {

  readonly ELEMENTOS: Elemento[] = [
    { id: 0, color: '#dc2626', colorActivo: '#ff6b6b', glow: 'rgba(220,38,38,.9)',  simbolo: '🥁', nombre: 'Tambor'    },
    { id: 1, color: '#d97706', colorActivo: '#fbbf24', glow: 'rgba(217,119,6,.9)',  simbolo: '🪇', nombre: 'Maracas'   },
    { id: 2, color: '#1d4ed8', colorActivo: '#60a5fa', glow: 'rgba(29,78,216,.9)',  simbolo: '🔔', nombre: 'Campana'   },
    { id: 3, color: '#7c3aed', colorActivo: '#a78bfa', glow: 'rgba(124,58,237,.9)', simbolo: '🎹', nombre: 'Xilófono'  },
    { id: 4, color: '#15803d', colorActivo: '#4ade80', glow: 'rgba(21,128,61,.9)',  simbolo: '🪘', nombre: 'Pandereta' },
    { id: 5, color: '#db2777', colorActivo: '#f472b6', glow: 'rgba(219,39,119,.9)',simbolo: '🎺', nombre: 'Trompeta'  },
  ];

  readonly MAX_RONDAS = 10;

  readonly MASCOTA_MSGS: Record<Mood, string[]> = {
    idle:      ['¡Listo para tocar! 🥁', '¡Aquí vamos! ✨'],
    thinking:  ['¡Escucha bien! 👂', '¡Presta atención al ritmo! 🎧', '¡Fíjate en el orden! 🔍', '¡Concéntrate! 🎵', '¡Escúchame bien! 🌟'],
    excited:   ['¡Es tu turno! ¡Tú puedes! 💪', '¡Recuerda el ritmo! 🎯', '¡Vamos, campeón! 🚀', '¡Confío en ti! ⭐', '¡Tu oído es poderoso! 🎶'],
    celebrate: ['¡INCREÍBLE! ¡Lo lograste! 🎉', '¡PERFECTO! ¡Qué buen oído! ⭐', '¡BRILLANTE! ¡Qué ritmo! 🏆', '¡GENIAL! ¡Sigue así! 💫', '¡ASOMBROSO! 🐵'],
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
  showFlash = false;
  flashVerde = true;

  mascotMsg  = '¡Listo para tocar! 🥁';
  mascotMood: Mood = 'idle';
  voiceEnabled = true;
  private abortado = false;

  // Motor adaptativo (CA-05: varia tempo y cantidad de botones disponibles)
  botonesActivos = 4;
  private tempoBase = 650;
  get elementosDisponibles(): Elemento[] { return this.ELEMENTOS.slice(0, this.botonesActivos); }

  private perfilId: number | null = null;
  private juegoActual: Juego | null = null;
  private nivelActual: NivelDificultad | null = null;
  private sesionId: number | null = null;

  get secuenciaArray(): number[] { return Array.from({ length: this.longitudActual }); }

  private timers: ReturnType<typeof setTimeout>[] = [];
  private audioCtx: AudioContext | null = null;
  private ruidoBuffer: AudioBuffer | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sesionJuegoService: SesionJuegoService,
    private profileService: ChildProfileService,
  ) {}

  ngOnInit(): void {
    this.cargarVozBongo();
    this.hablar('¡Hola! Soy Bongo. Vamos a escuchar y repetir el ritmo.');

    this.profileService.activeProfile$.subscribe(state => {
      this.perfilId = state.profileId;
    });
    this.cargarJuegoYNivel();
  }

  ngOnDestroy(): void { this.limpiarTimers(); this.audioCtx?.close(); window.speechSynthesis?.cancel(); }

  private cargarJuegoYNivel(): void {
    this.sesionJuegoService.listarJuegosActivos().subscribe(juegos => {
      const juego = juegos.find(j => j.nombre === 'Ritmo y Patrón');
      if (!juego) return;
      this.juegoActual = juego;
      this.sesionJuegoService.obtenerNiveles(juego.id).subscribe(niveles => {
        this.nivelActual = niveles.find(n => n.nivel === 'FACIL') ?? niveles[0] ?? null;
        // Preseleccionar nivel recomendado por IA (CA-03)
        if (this.perfilId && niveles.length > 0) {
          this.sesionJuegoService.obtenerRecomendacion(this.perfilId, juego.id)
            .subscribe(rec => {
              if (rec?.nivelRecomendado?.id) {
                const match = niveles.find(n => n.id === rec.nivelRecomendado.id);
                if (match) { this.nivelActual = match; }
              }
              this.cdr.detectChanges();
            });
        } else {
          this.cdr.detectChanges();
        }
      });
    });
  }

  private initAudio(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.ruidoBuffer = this.crearRuidoBuffer();
    }
  }

  private crearRuidoBuffer(): AudioBuffer {
    const ctx = this.audioCtx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
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

  private tocarRuido(dur: number, vol = 0.3, filtroFreq = 1200): void {
    if (!this.audioCtx || !this.ruidoBuffer) return;
    try {
      const src    = this.audioCtx.createBufferSource();
      const filtro = this.audioCtx.createBiquadFilter();
      const gain   = this.audioCtx.createGain();
      src.buffer = this.ruidoBuffer;
      filtro.type = 'highpass'; filtro.frequency.value = filtroFreq;
      src.connect(filtro); filtro.connect(gain); gain.connect(this.audioCtx.destination);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      src.start(this.audioCtx.currentTime);
      src.stop(this.audioCtx.currentTime + dur);
    } catch (_) {}
  }

  toggleVoz(): void { this.voiceEnabled = !this.voiceEnabled; if (!this.voiceEnabled) window.speechSynthesis?.cancel(); }

  private bongoVoice: SpeechSynthesisVoice | null = null;

  /** Selecciona la voz de Bongo (mismo patrón que Michi/Koby/Tigre/Buddy). */
  private cargarVozBongo(): void {
    const seleccionar = () => {
      const voces = window.speechSynthesis?.getVoices() ?? [];
      const candidatas = [
        voces.find(v => /jorge|diego|juan/i.test(v.name) && v.lang.startsWith('es')),
        voces.find(v => v.lang === 'es-MX'),
        voces.find(v => v.lang === 'es-ES'),
        voces.find(v => v.lang.startsWith('es')),
      ];
      this.bongoVoice = candidatas.find(v => !!v) ?? null;
    };
    if (window.speechSynthesis?.getVoices().length) {
      seleccionar();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = seleccionar;
    }
  }

  private hablar(texto: string, rate = 0.92, pitch = 1.15): Promise<void> {
    if (!this.voiceEnabled || !window.speechSynthesis || !texto) return Promise.resolve();
    return new Promise(resolve => {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(texto);
        if (this.bongoVoice) {
          utt.voice = this.bongoVoice;
          utt.lang  = this.bongoVoice.lang;
        } else {
          utt.lang = 'es-ES';
        }
        utt.volume = 0.9;
        utt.rate   = rate;
        utt.pitch  = pitch;
        utt.onend  = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      } catch (_) { resolve(); }
    });
  }

  /** Quita emojis antes de mandar el texto al sintetizador de voz (mismo criterio que Espejo Mental/Michi/Koby/Tigre/Buddy). */
  private sinEmojis(texto: string): string {
    return texto.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
  }

  // Cada instrumento tiene su propia sintesis (percusion real: golpe/ruido, no solo tonos puros)
  private sonarElemento(id: number): void {
    switch (id) {
      case 0: // Tambor: golpe grave con caida de frecuencia
        this.tocar(150, 0.22, 'triangle', 0.5, 45);
        break;
      case 1: // Maracas: ruido filtrado corto
        this.tocarRuido(0.12, 0.32, 1800);
        break;
      case 2: // Campana: armonicos tipo campana
        this.tocar(880, 0.5, 'sine', 0.3);
        this.tocar(1318, 0.4, 'sine', 0.15);
        break;
      case 3: // Xilófono: tono corto y brillante
        this.tocar(659.25, 0.28, 'triangle', 0.4);
        break;
      case 4: // Pandereta: ruido + tintineo agudo
        this.tocarRuido(0.15, 0.22, 2500);
        this.tocar(1500, 0.1, 'sine', 0.15);
        break;
      case 5: // Trompeta: tono con ataque tipo metal
        this.tocar(392, 0.3, 'sawtooth', 0.22);
        break;
    }
  }

  private sonarAcierto(): void {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tocar(f, 0.18, 'sine', 0.35), i * 75));
  }
  private sonarError(): void {
    this.tocar(220, 0.12, 'sawtooth', 0.3);
    setTimeout(() => this.tocar(180, 0.22, 'sawtooth', 0.25, 140), 100);
  }
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

  iniciarJuego(): void {
    this.initAudio();
    this.abortado = false;
    this.aciertos = 0; this.errores = 0; this.maxLongitud = 3;
    this.rondas = 0; this.metricas = []; this.erroresConsecutivos = 0;
    this.longitudActual = 3; this.combo = 0; this.maxCombo = 0;
    this.botonesActivos = 4; this.tempoBase = 650;

    // Backend: abre la sesion de juego (igual patron que SesionController. iniciar)
    if (this.perfilId && this.juegoActual && this.nivelActual) {
      this.sesionJuegoService.iniciarSesion({
        perfilId: this.perfilId,
        juegoId: this.juegoActual.id,
        nivelId: this.nivelActual.id,
      }).subscribe(sesion => {
        this.sesionId = sesion.id ?? null;
        if (sesion.id) this.sesionJuegoService.comenzarTracking(sesion.id);  // CA-04
      });
    }

    this.nuevaRonda();
  }

  reiniciarJuego(): void { this.iniciarJuego(); }

  private nuevaRonda(): void { this.generarSecuencia(); this.iniciarCuenta(); }

  private generarSecuencia(): void {
    this.secuencia = Array.from({ length: this.longitudActual },
      () => Math.floor(Math.random() * this.botonesActivos));
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

    // El tempo baja (mas rapido) segun combo, simulando el "motor" que varia velocidad (CA-05)
    const tempo = Math.max(this.tempoBase - this.combo * 20, 350);
    let delay = 500;
    for (let i = 0; i < this.secuencia.length; i++) {
      const id = this.secuencia[i];
      this.timers.push(setTimeout(() => {
        this.elementoActivo = id; this.sonarElemento(id); this.cdr.detectChanges();
      }, delay));
      delay += tempo;
      this.timers.push(setTimeout(() => {
        this.elementoActivo = -1; this.cdr.detectChanges();
      }, delay));
      delay += Math.round(tempo * 0.46);
    }

    this.timers.push(setTimeout(() => {
      this.estado = 'input';
      this.tiempoInicioInput = Date.now();
      this.sesionJuegoService.marcarElementoAparece();  // CA-08
      this.setMascota('excited');
      this.cdr.detectChanges();
    }, delay + 200));
  }

  clicarElemento(event: MouseEvent, id: number): void {
    if (this.estado !== 'input') return;
    this.sonarElemento(id);
    const ms       = Date.now() - this.tiempoInicioInput;
    const esperado = this.secuencia[this.respuestaJugador.length];
    const correcto = id === esperado;
    this.metricas.push({ elementId: id, ms, correcto });
    this.respuestaJugador.push(id);
    this.sesionJuegoService.trackClick(event.clientX, event.clientY, this.ELEMENTOS[id].nombre, correcto);  // CA-07/08/09

    if (!correcto) {
      this.elementoError = id;
      this.cdr.detectChanges();
      this.timers.push(setTimeout(() => { this.elementoError = -1; this.cdr.detectChanges(); }, 450));
      this.manejarError();
      return;
    }
    if (this.respuestaJugador.length === this.secuencia.length) this.manejarAcierto();
  }

  private manejarAcierto(): void {
    const msRonda = this.metricas[this.metricas.length - 1]?.ms;
    if (msRonda !== undefined) this.sesionJuegoService.trackRespuestaMs(msRonda);  // CA-05

    this.aciertos++; this.rondas++;
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.erroresConsecutivos = 0;
    // Sube 1 sonido cada 2 aciertos seguidos (max 8) — mismo criterio que Espejo Mental
    if (this.combo > 0 && this.combo % 2 === 0) {
      this.longitudActual = Math.min(this.longitudActual + 1, 8);
    }
    // El motor tambien habilita mas instrumentos disponibles a medida que el nino avanza (CA-05)
    if (this.combo > 0 && this.combo % 3 === 0) {
      this.botonesActivos = Math.min(this.botonesActivos + 1, this.ELEMENTOS.length);
    }
    this.maxLongitud = Math.max(this.maxLongitud, this.longitudActual);
    this.showCombo = this.combo >= 2;
    this.sonarAcierto();
    this.mostrarFlash(true);
    this.dispararConfeti();
    this.estado = 'feedback';
    this.cdr.detectChanges();

    const speechDone = this.setMascota('celebrate');
    const minPausa   = new Promise<void>(r => setTimeout(r, 1400));

    Promise.all([speechDone, minPausa]).then(() => {
      if (this.abortado) return;
      this.showConfetti = false;
      if (this.rondas >= this.MAX_RONDAS) {
        this.finalizarPartida();
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    });
  }

  private manejarError(): void {
    const msRonda = this.metricas[this.metricas.length - 1]?.ms;
    if (msRonda !== undefined) this.sesionJuegoService.trackRespuestaMs(msRonda);  // CA-05

    this.errores++; this.rondas++;
    this.combo = 0; this.erroresConsecutivos++;
    if (this.erroresConsecutivos >= 2) {
      this.longitudActual = Math.max(this.longitudActual - 1, 2);
      this.botonesActivos = Math.max(this.botonesActivos - 1, 3);
      this.erroresConsecutivos = 0;
    }
    this.sonarError();
    this.mostrarFlash(false);
    this.estado = 'feedback';
    this.cdr.detectChanges();

    const speechDone = this.setMascota('encourage');
    const minPausa   = new Promise<void>(r => setTimeout(r, 1400));

    Promise.all([speechDone, minPausa]).then(() => {
      if (this.abortado) return;
      if (this.rondas >= this.MAX_RONDAS) {
        this.finalizarPartida();
      } else {
        this.nuevaRonda();
      }
      this.cdr.detectChanges();
    });
  }

  private finalizarPartida(): void {
    this.estado = 'resultados'; this.sonarFanfare();
    const txt = this.sinEmojis(this.tituloFinal + '. ' + this.mensajeFinal);
    setTimeout(() => this.hablar(txt, 0.88, 1.1), 800);

    // CA-03: fire-and-forget con 3 reintentos + localStorage fallback
    if (this.sesionId) {
      this.sesionJuegoService.finalizarSesion(this.sesionId, this.puntuacion, this.aciertos + this.errores, this.aciertos);
      this.sesionId = null;
    }
  }

  terminarSesion(): void {
    this.limpiarTimers();
    this.dispararConfeti();
    this.estado = 'resultados';
    this.sonarFanfare();
    this.cdr.detectChanges();
    setTimeout(() => this.hablar(this.sinEmojis(this.tituloFinal + '. ' + this.mensajeFinal), 0.88, 1.1), 800);

    if (this.sesionId) {
      this.sesionJuegoService.finalizarSesion(this.sesionId, this.puntuacion, this.aciertos + this.errores, this.aciertos);
      this.sesionId = null;
    }
  }

  volver(): void { this.router.navigate(['/nino/juegos']); }

  get puntuacion(): number {
    return this.rondas === 0 ? 0 : Math.round((this.aciertos / this.rondas) * 100);
  }
  get trofeoEmoji(): string {
    return this.puntuacion >= 85 ? '🏆' : this.puntuacion >= 65 ? '🥈' : this.puntuacion >= 40 ? '🥉' : '🌟';
  }
  get tituloFinal(): string {
    return this.puntuacion >= 85 ? '¡Oído de música!' : this.puntuacion >= 65 ? '¡Muy bien hecho!' : this.puntuacion >= 40 ? '¡Buen esfuerzo!' : '¡Sigue practicando!';
  }
  get mensajeFinal(): string {
    if (this.puntuacion >= 85) return `¡Alcanzaste ritmos de ${this.maxLongitud} sonidos! Tu memoria auditiva es excelente. 🎶✨`;
    if (this.puntuacion >= 65) return `Lograste ritmos de hasta ${this.maxLongitud} sonidos. ¡Tu oído está mejorando! 🌟`;
    if (this.puntuacion >= 40) return `La práctica afina tu oído. ¡Inténtalo de nuevo y supera tu récord! 💪`;
    return `¡No te rindas! Cada intento entrena tu memoria auditiva. ¡Yo sé que puedes! 💖`;
  }

  private setMascota(mood: Mood): Promise<void> {
    this.mascotMood = mood;
    const msgs = this.MASCOTA_MSGS[mood];
    this.mascotMsg = msgs[Math.floor(Math.random() * msgs.length)];
    return this.hablar(this.sinEmojis(this.mascotMsg));
  }

  private mostrarFlash(verde: boolean): void {
    this.flashVerde = verde;
    this.showFlash = true;
    this.cdr.detectChanges();
    this.timers.push(setTimeout(() => { this.showFlash = false; this.cdr.detectChanges(); }, 420));
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
