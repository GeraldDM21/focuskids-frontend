import { Component, OnDestroy, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { Juego, NivelDificultad } from '../../../../core/models/juego.model';
import { MascotComponent, MascotMood } from '../../../../shared/components/mascot/mascot.component';
import { BolsaPaises, Dificultad, Pais, PAISES, Pregunta, TipoPregunta, generarPregunta, siguienteDificultad } from './mapa-aventura.model';

// 'resultados' se conecta en el Paso 4.
type Estado = 'inicio' | 'jugando' | 'resultados';
interface ConfettiPiece { id: number; left: number; color: string; delay: number; dur: number; size: number; }

const MAX_PREGUNTAS = 10;
const TIEMPO_MAX_MS = 8 * 60 * 1000; // CA-05: maximo 8 minutos

@Component({
  selector: 'app-mapa-aventura',
  standalone: true,
  imports: [CommonModule, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-wrapper">

      <!-- ── Fondo animado (persistente en todos los estados) ─────────────── -->
      <div class="ma-grid" aria-hidden="true"></div>
      <div class="ma-bg-orb ma-o1" aria-hidden="true"></div>
      <div class="ma-bg-orb ma-o2" aria-hidden="true"></div>
      <div class="ma-bg-orb ma-o3" aria-hidden="true"></div>
      <div class="ma-bg" aria-hidden="true">
        <span class="ma-p ma-p1">★</span><span class="ma-p ma-p2">⊕</span>
        <span class="ma-p ma-p3">◎</span><span class="ma-p ma-p4">△</span>
        <span class="ma-p ma-p5">⊗</span><span class="ma-p ma-p6">✦</span>
        <span class="ma-p ma-p7">☆</span><span class="ma-p ma-p8">⊕</span>
      </div>

      <!-- ══ INICIO ══════════════════════════════════════════ -->
      @if (estado === 'inicio') {
        <div class="pantalla-inicio">
          <img class="bg-escena" src="mascotas/buddy-escena.png" alt="Mapa del mundo de Buddy">
          <div class="inicio-velo"></div>

          <button type="button" class="btn-volver-inicio" (click)="volver()">← Volver</button>

          <!-- Buddy explica las instrucciones desde su burbuja -->
          <div class="buddy-habla">
            <div class="habla-bubble">
              <p class="habla-saludo">¡Hola! Soy <strong>Buddy</strong> 🐶</p>
              <p class="habla-intro">Para jugar Mapa Aventura:</p>
              <div class="habla-pasos">
                <div class="habla-paso"><span class="h-ico">🗺️</span><span>Explora el mapa y toca los países</span></div>
                <div class="habla-paso"><span class="h-ico">❓</span><span>Responde dónde está o su capital</span></div>
                <div class="habla-paso"><span class="h-ico">⏱️</span><span>10 preguntas en 8 minutos</span></div>
              </div>
              <p class="habla-animo">¡Vamos a explorar! ✨</p>
            </div>
            <div class="habla-tail"></div>
          </div>

          <!-- Panel derecho — título y botón -->
          <div class="inicio-panel">
            <h1 class="titulo-juego">
              <span class="titulo-grad">Mapa</span><span class="titulo-blanco"> Aventura</span>
            </h1>
            <p class="subtitulo-juego">Explora el mapa y responde preguntas sobre países del mundo</p>

            <button class="btn-empezar" (click)="iniciarJuego()">
              <span>🧭</span> ¡Empezar!
              <span class="btn-shine"></span>
            </button>

            <div class="volumen-footer">
              <button class="btn-voz" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar a Buddy' : 'Activar voz de Buddy'">
                {{ voiceEnabled ? '🔊' : '🔇' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ══ JUGANDO ═════════════════════════════════════════ -->
      @if (estado === 'jugando') {
        <div class="pantalla-juego">

          <div class="game-header">
            <button class="btn-salir" (click)="terminarSesion()">
              <span class="salir-icon">←</span>
              <span class="salir-txt">Salir</span>
            </button>

            <div class="header-centro">
              <div class="progreso-wrap">
                <div class="progreso-barra">
                  <div class="progreso-fill" [style.width.%]="(rondas/MAX_PREGUNTAS)*100"></div>
                </div>
                <span class="progreso-label">{{ rondas }}/{{ MAX_PREGUNTAS }}</span>
              </div>
              <span class="timer-label" [class.timer-urgente]="tiempoRestanteMs < 60000">⏱️ {{ tiempoFormateado }}</span>
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

          <app-mascot [game]="'juego10'" [mood]="mascotMood" [message]="mascotMsg"></app-mascot>

          <div class="pregunta-box" [class.pregunta-correcta]="resultado === 'correcto'" [class.pregunta-incorrecta]="resultado === 'incorrecto'">
            {{ tituloPregunta }}
          </div>

          <!-- Mapa SVG estilizado -->
          <div class="mapa-wrap">
            <svg viewBox="0 0 1000 500" class="mapa-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="oceano" cx="50%" cy="40%" r="75%">
                  <stop offset="0%" stop-color="#1e5f8c"/>
                  <stop offset="100%" stop-color="#0c3a5e"/>
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="1000" height="500" fill="url(#oceano)"/>

              <!-- Lineas de cuadricula estilo mapa antiguo -->
              @for (i of [1,2,3,4,5,6,7]; track i) {
                <line [attr.x1]="i*125" y1="0" [attr.x2]="i*125" y2="500" stroke="rgba(255,255,255,.06)" stroke-width="1" stroke-dasharray="4 6"/>
              }
              @for (i of [1,2,3]; track i) {
                <line x1="0" [attr.y1]="i*125" x2="1000" [attr.y2]="i*125" stroke="rgba(255,255,255,.06)" stroke-width="1" stroke-dasharray="4 6"/>
              }

              <!-- Continentes estilizados (silueta decorativa, no politica) -->
              <g fill="#3f8f5f" opacity=".85">
                <ellipse cx="185" cy="140" rx="130" ry="95"/>
                <ellipse cx="270" cy="230" rx="90" ry="80"/>
                <ellipse cx="150" cy="260" rx="80" ry="70"/>
              </g>
              <g fill="#4fae70" opacity=".85">
                <ellipse cx="290" cy="520" rx="0" ry="0"/>
                <ellipse cx="300" cy="480" rx="95" ry="70"/>
                <ellipse cx="320" cy="580" rx="70" ry="80"/>
                <ellipse cx="290" cy="650" rx="60" ry="70"/>
              </g>
              <g fill="#5aa845" opacity=".85">
                <ellipse cx="510" cy="150" rx="80" ry="65"/>
                <ellipse cx="570" cy="120" rx="65" ry="55"/>
              </g>
              <g fill="#c99a4d" opacity=".85">
                <ellipse cx="540" cy="330" rx="90" ry="80"/>
                <ellipse cx="590" cy="420" rx="75" ry="70"/>
                <ellipse cx="560" cy="480" rx="60" ry="55"/>
              </g>
              <g fill="#4f9e8f" opacity=".85">
                <ellipse cx="720" cy="160" rx="110" ry="90"/>
                <ellipse cx="830" cy="130" rx="90" ry="70"/>
                <ellipse cx="900" cy="220" rx="80" ry="90"/>
                <ellipse cx="760" cy="280" rx="85" ry="70"/>
              </g>
              <g fill="#c9834d" opacity=".85">
                <ellipse cx="900" cy="620" rx="80" ry="55"/>
                <ellipse cx="970" cy="660" rx="45" ry="35"/>
              </g>

              <!-- Brujula decorativa -->
              <g transform="translate(920,60)" opacity=".5">
                <circle r="34" fill="none" stroke="#fbbf24" stroke-width="2"/>
                <line x1="0" y1="-28" x2="0" y2="28" stroke="#fbbf24" stroke-width="1.5"/>
                <line x1="-28" y1="0" x2="28" y2="0" stroke="#fbbf24" stroke-width="1.5"/>
                <text x="0" y="-36" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="900">N</text>
              </g>

              <!-- Pines de paises -->
              @for (pais of PAISES; track pais.id) {
                <g class="pin-group"
                   [class.pin-resaltado]="esPaisResaltado(pais)"
                   [class.pin-correcto]="pinResultado[pais.id] === 'correcto'"
                   [class.pin-incorrecto]="pinResultado[pais.id] === 'incorrecto'"
                   [class.pin-clickable]="preguntaActual?.tipo === 'UBICACION' && !respondido"
                   [attr.transform]="'translate(' + (pais.x*10) + ',' + (pais.y*5) + ')'"
                   (click)="clicPin(pais, $event)">
                  <circle class="pin-halo" r="16"/>
                  <circle class="pin-punto" r="8"/>
                  <text class="pin-label" y="-16" text-anchor="middle">{{ pais.nombre }}</text>
                </g>
              }
            </svg>
          </div>

          <!-- Opciones de capital (solo tipo CAPITAL) -->
          @if (preguntaActual?.tipo === 'CAPITAL') {
            <div class="opciones-grid">
              @for (op of preguntaActual!.opciones!; track op) {
                <button class="opcion-btn"
                  [class.correcta]="respondido && op === preguntaActual!.pais.capital"
                  [class.incorrecta]="respondido && op === opcionElegida && op !== preguntaActual!.pais.capital"
                  [disabled]="respondido"
                  (click)="clicOpcion(op, $event)">
                  {{ op }}
                </button>
              }
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
            <div class="fox-resultado-hero">
              <img class="foxy-resultado-img" src="mascotas/Buddy-portrait.png" alt="Buddy">
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
              <img class="foxy-msg-avatar-img" src="mascotas/Buddy-portrait.png" alt="Buddy">
              <div class="foxy-msg-bubble">{{ mensajeFinal }}</div>
            </div>

            <div class="metricas-row">
              <div class="metrica"><div class="m-icon">✅</div><div class="m-val verde">{{ aciertos }}</div><div class="m-lbl">Aciertos</div></div>
              <div class="metrica"><div class="m-icon">❌</div><div class="m-val rojo">{{ errores }}</div><div class="m-lbl">Errores</div></div>
              <div class="metrica"><div class="m-icon">🌍</div><div class="m-val morado">{{ paisesExplorados.size }}</div><div class="m-lbl">Explorados</div></div>
              <div class="metrica"><div class="m-icon">⏱️</div><div class="m-val naranja">{{ tiempoUsadoFormateado }}</div><div class="m-lbl">Tiempo</div></div>
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
      background: linear-gradient(160deg, #0b2340 0%, #123a5e 45%, #0a3d2e 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, sans-serif;
      color: white; overflow: hidden; position: relative;
    }

    /* ══ INICIO — cinematográfico (mismo patrón que Espejo Mental / Laberinto / Maratón Mental / Piezas en Tiempo) ══ */
    .pantalla-inicio { min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }

    .bg-escena {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center center; z-index: 0;
      /* Valores verificados renderizando la transformación real sobre la imagen
         (mismo método usado para Michi/Koby/Tigre): Buddy, centrado en la imagen
         original, queda de cuerpo completo y despejado del panel. */
      transform-origin: 115% 48%;
      animation: bgZoomBuddy 24s ease-in-out infinite alternate;
    }
    @keyframes bgZoomBuddy {
      from { transform: scale(1.30) translate(0,0); }
      to   { transform: scale(1.34) translate(-.5%, .3%); }
    }

    .inicio-velo {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(
        to right,
        transparent 0%,
        transparent 26%,
        rgba(11,35,64,.65) 40%,
        rgba(11,35,64,.9) 54%,
        rgba(11,35,64,.96) 100%
      );
    }

    .btn-volver-inicio {
      position: absolute; top: 24px; left: 24px; z-index: 4;
      padding: 10px 16px; border: 1px solid rgba(255,255,255,.2); border-radius: 14px;
      background: rgba(8,14,30,.7); color: #dce7f8; font-size: 14px; font-weight: 700;
      cursor: pointer; backdrop-filter: blur(10px); transition: transform .2s ease, background .2s ease;
    }
    .btn-volver-inicio:hover { transform: translateY(-2px); background: rgba(255,255,255,.12); }

    /* Burbuja de Buddy con instrucciones */
    .buddy-habla {
      position: absolute; left: 4%; bottom: 6%; z-index: 3;
      width: 300px; display: flex; flex-direction: column-reverse; align-items: flex-end;
      animation: popInBuddy .5s .3s both cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes popInBuddy { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
    .habla-bubble {
      background: rgba(255,255,255,0.97); border: 3px solid #60a5fa; border-radius: 22px;
      padding: 18px 20px 14px; color: #0b2340; box-shadow: 0 8px 40px rgba(96,165,250,.4);
    }
    .habla-saludo { font-size: 17px; font-weight: 800; margin: 0 0 6px; }
    .habla-intro  { font-size: 13px; font-weight: 700; color: #2563eb; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .5px; }
    .habla-pasos  { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .habla-paso   { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #0b2340; }
    .h-ico        { font-size: 20px; flex-shrink: 0; }
    .habla-animo  { font-size: 14px; font-weight: 700; color: #059669; margin: 0; text-align: right; }
    .habla-tail {
      width: 0; height: 0; border-left: 16px solid transparent; border-right: 16px solid transparent;
      border-bottom: 22px solid #60a5fa; margin: 0 28px 0 0; position: relative;
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
      padding: 28px 32px; background: rgba(11,35,64,.5); backdrop-filter: blur(4px);
      border-radius: 28px; animation: slideUpBuddy .5s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes slideUpBuddy { from { opacity: 0; transform: translateY(-50%) translateY(20px); } to { opacity: 1; transform: translateY(-50%) translateY(0); } }

    .titulo-juego { font-size: 40px; font-weight: 900; margin: 0 0 8px; line-height: 1.1; }
    .titulo-grad { background: linear-gradient(135deg,#60a5fa,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .titulo-blanco { color: white; }
    .subtitulo-juego { font-size: 15px; color: #94a3b8; margin-bottom: 26px; }

    .btn-empezar {
      display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg,#2563eb,#059669);
      color: white; border: none; border-radius: 20px; padding: 18px 52px; font-size: 20px; font-weight: 800;
      cursor: pointer; transition: all .2s; box-shadow: 0 8px 32px rgba(37,99,235,.5);
      position: relative; overflow: hidden; animation: pulseBtn 2s infinite;
      width: 100%; justify-content: center; margin-bottom: 16px;
    }
    .btn-empezar:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 16px 40px rgba(37,99,235,.65); animation: none; }
    .btn-shine { position: absolute; top: 0; left: -80%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent); animation: shine 2.5s ease-in-out infinite 1s; }
    @keyframes shine { 0%{left:-80%} 100%{left:120%} }
    @keyframes pulseBtn { 0%,100%{ box-shadow:0 8px 32px rgba(37,99,235,.5),0 0 0 0 rgba(37,99,235,.4); } 50%{ box-shadow:0 8px 32px rgba(37,99,235,.5),0 0 0 14px rgba(37,99,235,0); } }
    .volumen-footer { display: flex; align-items: center; justify-content: center; gap: 14px; }
    .btn-voz { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); border-radius: 50%; width: 42px; height: 42px; font-size: 20px; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .btn-voz:hover { background: rgba(255,255,255,.2); transform: scale(1.1); }

    /* ══ JUGANDO ══ */
    .pantalla-juego { width: 100%; max-width: 640px; padding: 16px 16px 32px; position: relative; }

    .game-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 18px; padding: 10px 12px; backdrop-filter: blur(10px); }
    .btn-salir { display: flex; align-items: center; gap: 5px; background: rgba(239,68,68,.12); border: 1.5px solid rgba(239,68,68,.3); color: #f87171; border-radius: 12px; padding: 7px 12px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all .2s; flex-shrink: 0; }
    .btn-salir:hover { background: rgba(239,68,68,.28); transform: scale(1.05); }

    .header-centro { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .progreso-wrap { display: flex; align-items: center; gap: 8px; width: 100%; max-width: 200px; }
    .progreso-barra { flex: 1; height: 7px; border-radius: 4px; background: rgba(255,255,255,.12); overflow: hidden; }
    .progreso-fill { height: 100%; background: linear-gradient(90deg,#2563eb,#34d399); border-radius: 4px; transition: width .3s ease; }
    .progreso-label { font-size: 11px; font-weight: 800; color: #94a3b8; white-space: nowrap; }
    .timer-label { font-size: 12px; font-weight: 800; color: #93c5fd; }
    .timer-urgente { color: #f87171; animation: parpadea 1s infinite; }
    @keyframes parpadea { 0%,100%{opacity:1} 50%{opacity:.4} }

    .header-stats { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
    .stat-badge { display: flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 20px; border: 1.5px solid; }
    .badge-oro  { background: rgba(250,204,21,.14); border-color: rgba(250,204,21,.4); }
    .badge-rojo { background: rgba(239,68,68,.14);  border-color: rgba(239,68,68,.35); }
    .badge-ico  { font-size: 17px; line-height: 1; }
    .badge-num  { font-size: 18px; font-weight: 900; color: white; min-width: 18px; text-align: center; }
    .btn-voz-hdr { background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.18); border-radius: 50%; width: 38px; height: 38px; font-size: 18px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

    .pregunta-box {
      text-align: center; font-size: 16px; font-weight: 800; color: #e2e8f0;
      background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.12);
      border-radius: 16px; padding: 12px 16px; margin-bottom: 12px; transition: all .3s;
    }
    .pregunta-correcta   { background: rgba(34,197,94,.16); border-color: rgba(34,197,94,.4); color: #86efac; }
    .pregunta-incorrecta { background: rgba(239,68,68,.16); border-color: rgba(239,68,68,.4); color: #fca5a5; }

    .mapa-wrap { border-radius: 20px; overflow: hidden; border: 2px solid rgba(255,255,255,.12); box-shadow: 0 12px 40px rgba(0,0,0,.4); margin-bottom: 14px; }
    .mapa-svg { width: 100%; height: auto; display: block; }

    .pin-group { cursor: default; }
    .pin-clickable { cursor: pointer; }
    .pin-halo { fill: rgba(96,165,250,.25); transition: all .2s; }
    .pin-punto { fill: #60a5fa; stroke: white; stroke-width: 2.5; transition: all .2s; }
    .pin-label { fill: white; font-size: 15px; font-weight: 800; opacity: 0; transition: opacity .2s; pointer-events: none; paint-order: stroke; stroke: rgba(0,0,0,.6); stroke-width: 3px; }
    .pin-clickable:hover .pin-halo { fill: rgba(96,165,250,.45); }
    .pin-clickable:hover .pin-punto { r: 10px; }
    .pin-clickable:hover .pin-label { opacity: 1; }
    .pin-resaltado .pin-halo { fill: rgba(251,191,36,.4); animation: pinPulso 1s ease-in-out infinite; }
    .pin-resaltado .pin-punto { fill: #fbbf24; }
    .pin-resaltado .pin-label { opacity: 1; }
    .pin-correcto .pin-punto { fill: #22c55e; }
    .pin-correcto .pin-halo { fill: rgba(34,197,94,.5); }
    .pin-correcto .pin-label { opacity: 1; }
    .pin-incorrecto .pin-punto { fill: #ef4444; }
    .pin-incorrecto .pin-halo { fill: rgba(239,68,68,.5); }
    .pin-incorrecto .pin-label { opacity: 1; }
    @keyframes pinPulso { 0%,100%{ r:16px } 50%{ r:20px } }

    .opciones-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .opcion-btn {
      background: rgba(255,255,255,.07); border: 2px solid rgba(255,255,255,.14); color: white;
      border-radius: 14px; padding: 14px 10px; font-size: 14.5px; font-weight: 700; cursor: pointer; transition: all .15s;
    }
    .opcion-btn:not([disabled]):hover { background: rgba(255,255,255,.14); transform: translateY(-2px); }
    .opcion-btn[disabled] { cursor: default; }
    .opcion-btn.correcta { background: rgba(34,197,94,.25); border-color: #22c55e; color: #86efac; }
    .opcion-btn.incorrecta { background: rgba(239,68,68,.25); border-color: #ef4444; color: #fca5a5; }

    .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden; }
    .confeti { position: absolute; top: -20px; border-radius: 3px; animation: caer linear forwards; }
    @keyframes caer { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }

    .pantalla-resultados { padding: 24px; width: 100%; max-width: 480px; position: relative; }
    .resultados-card {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.13);
      border-radius: 32px; padding: 36px 28px 32px; text-align: center;
      backdrop-filter: blur(16px); animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }

    .fox-resultado-hero { position: relative; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; width: 120px; height: 120px; }
    .foxy-resultado-img {
      width:120px; height:auto;
      filter:drop-shadow(0 0 20px rgba(96,165,250,.6));
      animation:bounce 2s ease-in-out infinite;
      -webkit-mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%);
      mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%);
    }
    .fox-resultado-trophy { position: absolute; top: -10px; right: -10px; z-index: 2; font-size: 36px; animation: bounce 1.5s ease-in-out infinite .3s; }
    @keyframes spinRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

    .resultado-titulo { font-size: 24px; font-weight: 900; color: #f1f5f9; margin-bottom: 16px; }
    .estrellas { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 20px; }
    .estrella { font-size: 32px; filter: grayscale(1) opacity(.3); transition: all .4s cubic-bezier(.34,1.56,.64,1); }
    .estrella.grande { font-size: 44px; }
    .estrella.estrella-on { filter: grayscale(0) opacity(1) drop-shadow(0 0 12px rgba(250,204,21,.8)); animation: starPop .5s cubic-bezier(.34,1.56,.64,1) both; }
    .estrellas .estrella:nth-child(2).estrella-on { animation-delay: .15s; }
    .estrellas .estrella:nth-child(3).estrella-on { animation-delay: .3s; }
    @keyframes starPop { 0%{transform:scale(0) rotate(-30deg)} 60%{transform:scale(1.3) rotate(10deg)} 100%{transform:scale(1) rotate(0)} }

    .score-ring { position: relative; width: 130px; height: 130px; margin: 0 auto 20px; }
    .score-ring svg { width: 130px; height: 130px; transform: rotate(-90deg); }
    .ring-bg   { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 10; }
    .ring-fill { fill: none; stroke: #60a5fa; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 1.2s ease; }
    .score-texto { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-num { font-size: 30px; font-weight: 900; background: linear-gradient(135deg,#60a5fa,#34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .score-lbl { font-size: 11px; color: #64748b; }

    .foxy-msg-final { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 20px; text-align: left; }
    .foxy-msg-avatar-img { width:48px; height:auto; flex-shrink:0; filter:drop-shadow(0 0 8px rgba(96,165,250,.5)); -webkit-mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); }
    .foxy-msg-bubble { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 12px 14px; font-size: 13.5px; color: #cbd5e1; line-height: 1.5; flex: 1; }

    .metricas-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 24px; }
    .metrica { background: rgba(255,255,255,.06); border-radius: 14px; padding: 12px 6px; }
    .m-icon { font-size: 18px; margin-bottom: 4px; }
    .m-val  { font-size: 22px; font-weight: 900; line-height: 1; margin-bottom: 2px; }
    .m-lbl  { font-size: 10px; color: #64748b; }
    .m-val.verde  { color: #4ade80; } .m-val.rojo   { color: #f87171; }
    .m-val.morado { color: #93c5fd; } .m-val.naranja{ color: #fb923c; }

    .btns-final { display: flex; gap: 10px; }
    .btn-repetir { flex: 1; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 14px; padding: 14px 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; }
    .btn-repetir:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,.5); }
    .btn-volver { flex: 1; background: rgba(255,255,255,.07); color: #94a3b8; border: 1px solid rgba(255,255,255,.13); border-radius: 14px; padding: 14px 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; }
    .btn-volver:hover { background: rgba(255,255,255,.13); color: #f1f5f9; }

    @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

    /* ── Grilla de coordenadas — distintivo de este juego ───────────────── */
    .ma-grid {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(96,165,250,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(96,165,250,.04) 1px, transparent 1px);
      background-size: 60px 60px;
      animation: maGridFade 20s ease-in-out infinite;
    }
    @keyframes maGridFade { 0%,100%{opacity:.6} 50%{opacity:1} }
    /* ══ FONDO ANIMADO — MAPA AVENTURA ════════════════════════════════════ */
    .ma-bg-orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; animation: maOrbPulse 10s ease-in-out infinite; }
    .ma-o1 { width: 500px; height: 500px; top: -160px; left: -110px; background: radial-gradient(circle, rgba(96,165,250,.28), transparent 70%); animation-delay: 0s; }
    .ma-o2 { width: 370px; height: 370px; bottom: -130px; right: -90px; background: radial-gradient(circle, rgba(52,211,153,.22), transparent 70%); animation-delay: 4s; }
    .ma-o3 { width: 270px; height: 270px; top: 40%; left: 58%; background: radial-gradient(circle, rgba(45,212,191,.18), transparent 70%); animation-delay: 8s; }
    @keyframes maOrbPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
    .ma-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .ma-p { position: absolute; font-size: 20px; color: rgba(147,197,253,.2); animation: maPFloat var(--d,13s) ease-in-out infinite var(--dl,0s); }
    @keyframes maPFloat { 0%,100%{transform:translateY(0) rotate(-2deg);opacity:.1;} 50%{transform:translateY(-22px) rotate(5deg);opacity:.25;} }
    .ma-p1{top:7%;left:10%;--d:11s;--dl:0s;} .ma-p2{top:22%;left:87%;--d:14s;--dl:2s;} .ma-p3{top:57%;left:5%;--d:10s;--dl:4s;}
    .ma-p4{top:74%;left:78%;--d:13s;--dl:1s;font-size:24px;} .ma-p5{top:38%;left:48%;--d:9s;--dl:5s;font-size:14px;}
    .ma-p6{top:13%;left:63%;--d:16s;--dl:3s;font-size:16px;} .ma-p7{top:84%;left:31%;--d:12s;--dl:7s;} .ma-p8{top:47%;left:92%;--d:15s;--dl:6s;font-size:18px;}
  `]
})
export class MapaAventuraComponent implements OnInit, OnDestroy {

  readonly PAISES = PAISES;
  readonly MAX_PREGUNTAS = MAX_PREGUNTAS;

  estado: Estado = 'inicio';
  voiceEnabled = true;

  // Backend
  private perfilId: number | null = null;
  private juegoActual: Juego | null = null;
  private nivelActual: NivelDificultad | null = null;
  private sesionId: number | null = null;

  // Motor de preguntas
  private bolsa = new BolsaPaises();
  preguntaActual: Pregunta | null = null;
  private dificultadActual: Dificultad = 'FACIL';
  private rachaAciertos = 0;
  private rachaErrores = 0;
  paisesExplorados = new Set<string>();

  // Estado de la ronda
  rondas = 0;
  aciertos = 0;
  errores = 0;
  respondido = false;
  resultado: 'correcto' | 'incorrecto' | null = null;
  opcionElegida: string | null = null;
  pinResultado: Record<string, 'correcto' | 'incorrecto'> = {};

  mascotMsg = '';
  mascotMood: MascotMood = 'idle';

  // Temporizador (CA-05)
  tiempoRestanteMs = TIEMPO_MAX_MS;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  private tiempoInicioPregunta = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private audioCtx: AudioContext | null = null;

  get tituloPregunta(): string {
    if (!this.preguntaActual) return '';
    return this.preguntaActual.tipo === 'UBICACION'
      ? `🐶 ¿Dónde está ${this.preguntaActual.pais.nombre}?`
      : `🐶 ¿Cuál es la capital de ${this.preguntaActual.pais.nombre}?`;
  }

  get tiempoFormateado(): string {
    const totalSeg = Math.max(0, Math.ceil(this.tiempoRestanteMs / 1000));
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  }

  esPaisResaltado(pais: Pais): boolean {
    return !!this.preguntaActual && this.preguntaActual.tipo === 'CAPITAL' && this.preguntaActual.pais.id === pais.id;
  }

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sesionJuegoService: SesionJuegoService,
    private profileService: ChildProfileService,
  ) {}

  ngOnInit(): void {
    this.cargarVozBuddy();
    this.hablar('¡Hola! Soy Buddy. Vamos a explorar el mapa del mundo.');

    this.profileService.activeProfile$.subscribe(state => {
      this.perfilId = state.profileId;
    });
    this.cargarJuegoYNivel();
  }

  ngOnDestroy(): void {
    this.limpiarTimers();
    this.audioCtx?.close();
    window.speechSynthesis?.cancel();
  }

  private cargarJuegoYNivel(): void {
    this.sesionJuegoService.listarJuegosActivos().subscribe(juegos => {
      const juego = juegos.find(j => j.nombre === 'Mapa Aventura');
      if (!juego) return;
      this.juegoActual = juego;
      this.sesionJuegoService.obtenerNiveles(juego.id).subscribe(niveles => {
        this.nivelActual = niveles.find(n => n.nivel === 'FACIL') ?? niveles[0] ?? null;
        this.cdr.detectChanges();
      });
    });
  }

  toggleVoz(): void {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) window.speechSynthesis?.cancel();
  }

  // ── AUDIO / VOZ ───────────────────────────────────
  private buddyVoice: SpeechSynthesisVoice | null = null;

  /** Selecciona la voz de Buddy (mismo patrón que Michi/Koby/Tigre). */
  private cargarVozBuddy(): void {
    const seleccionar = () => {
      const voces = window.speechSynthesis?.getVoices() ?? [];
      const candidatas = [
        voces.find(v => /jorge|diego|juan/i.test(v.name) && v.lang.startsWith('es')),
        voces.find(v => v.lang === 'es-MX'),
        voces.find(v => v.lang === 'es-ES'),
        voces.find(v => v.lang.startsWith('es')),
      ];
      this.buddyVoice = candidatas.find(v => !!v) ?? null;
    };
    if (window.speechSynthesis?.getVoices().length) {
      seleccionar();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = seleccionar;
    }
  }

  /** Quita emojis antes de mandar el texto al sintetizador de voz (mismo criterio que Espejo Mental/Michi/Koby/Tigre). */
  private sinEmojis(texto: string): string {
    return texto.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
  }

  private initAudio(): void {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private tocar(freq: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.35, freqFin?: number): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
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
  private sonarAcierto(): void { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tocar(f, 0.18, 'sine', 0.35), i * 75)); }
  private sonarError(): void { this.tocar(220, 0.12, 'sawtooth', 0.3); setTimeout(() => this.tocar(180, 0.22, 'sawtooth', 0.25, 140), 100); }

  private hablar(texto: string, rate = 0.95, pitch = 1.0): Promise<void> {
    if (!this.voiceEnabled || !window.speechSynthesis || !texto) return Promise.resolve();
    return new Promise(resolve => {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(texto);
        if (this.buddyVoice) {
          utt.voice = this.buddyVoice;
          utt.lang = this.buddyVoice.lang;
        } else {
          utt.lang = 'es-ES';
        }
        utt.volume = 0.9; utt.rate = rate; utt.pitch = pitch;
        utt.onend = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
      } catch (_) { resolve(); }
    });
  }

  private setMascota(mood: MascotMood, msg: string): void {
    this.mascotMood = mood;
    this.mascotMsg = msg;
    this.hablar(this.sinEmojis(msg));
  }

  // ── FLUJO ─────────────────────────────────────────

  iniciarJuego(): void {
    this.initAudio();
    this.rondas = 0; this.aciertos = 0; this.errores = 0;
    this.rachaAciertos = 0; this.rachaErrores = 0;
    this.dificultadActual = 'FACIL';
    this.paisesExplorados.clear();
    this.pinResultado = {};
    this.tiempoRestanteMs = TIEMPO_MAX_MS;

    if (this.perfilId && this.juegoActual && this.nivelActual) {
      this.sesionJuegoService.iniciarSesion({
        perfilId: this.perfilId,
        juegoId: this.juegoActual.id,
        nivelId: this.nivelActual.id,
      }).subscribe({
        next: sesion => {
          this.sesionId = sesion.id;
          this.sesionJuegoService.comenzarTracking(sesion.id);
        },
        error: () => this.sesionId = null
      });
    }

    this.estado = 'jugando';
    this.iniciarTemporizador();
    this.nuevaPregunta();
  }

  private iniciarTemporizador(): void {
    this.limpiarTimerReloj();
    this.timerInterval = setInterval(() => {
      this.tiempoRestanteMs -= 1000;
      if (this.tiempoRestanteMs <= 0) {
        this.tiempoRestanteMs = 0;
        this.limpiarTimerReloj();
        this.terminarSesion();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private limpiarTimerReloj(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private nuevaPregunta(): void {
    this.respondido = false;
    this.resultado = null;
    this.opcionElegida = null;

    const pais = this.bolsa.siguiente(this.dificultadActual);
    const tipo: TipoPregunta = Math.random() < 0.5 ? 'UBICACION' : 'CAPITAL';
    this.preguntaActual = generarPregunta(pais, tipo);
    this.paisesExplorados.add(pais.id);
    this.tiempoInicioPregunta = Date.now();
    this.sesionJuegoService.marcarElementoAparece();

    this.setMascota('thinking', this.tituloPregunta);
    this.cdr.detectChanges();
  }

  clicPin(pais: Pais, event: MouseEvent): void {
    if (this.respondido || !this.preguntaActual || this.preguntaActual.tipo !== 'UBICACION') return;
    const correcto = pais.id === this.preguntaActual.pais.id;
    this.pinResultado[pais.id] = correcto ? 'correcto' : 'incorrecto';
    if (!correcto) this.pinResultado[this.preguntaActual.pais.id] = 'correcto';
    this.responder(correcto, event);
  }

  clicOpcion(capital: string, event: MouseEvent): void {
    if (this.respondido || !this.preguntaActual || this.preguntaActual.tipo !== 'CAPITAL') return;
    this.opcionElegida = capital;
    const correcto = capital === this.preguntaActual.pais.capital;
    this.responder(correcto, event);
  }

  // CA-03/07/08/09: registra la respuesta con métricas de click y tiempo.
  private responder(correcto: boolean, event?: MouseEvent): void {
    this.respondido = true;
    this.resultado = correcto ? 'correcto' : 'incorrecto';
    this.rondas++;

    const ms = Date.now() - this.tiempoInicioPregunta;
    this.sesionJuegoService.trackRespuestaMs(ms);
    if (this.preguntaActual) {
      this.sesionJuegoService.trackClick(
        event?.clientX ?? 0,
        event?.clientY ?? 0,
        this.preguntaActual.pais.id,
        correcto,
      );
    }

    if (correcto) {
      this.aciertos++; this.rachaAciertos++; this.rachaErrores = 0;
      this.sonarAcierto();
      this.setMascota('celebrate', `¡Correcto! 🎉 ${this.preguntaActual!.pais.datoCurioso}`);
    } else {
      this.errores++; this.rachaErrores++; this.rachaAciertos = 0;
      this.sonarError();
      const correcta = this.preguntaActual!.tipo === 'CAPITAL' ? this.preguntaActual!.pais.capital : this.preguntaActual!.pais.nombre;
      this.setMascota('encourage', `¡Casi! Era ${correcta}. ${this.preguntaActual!.pais.datoCurioso}`);
    }

    // CA-04: motor de dificultad adaptativa segun racha
    this.dificultadActual = siguienteDificultad(this.dificultadActual, this.rachaAciertos, this.rachaErrores);
    this.cdr.detectChanges();

    this.timers.push(setTimeout(() => {
      if (this.rondas >= this.MAX_PREGUNTAS) {
        this.terminarSesion();
      } else {
        this.pinResultado = {};
        this.nuevaPregunta();
      }
    }, 3200));
  }

  terminarSesion(): void {
    this.limpiarTimers();
    this.estado = 'resultados';
    this.dispararConfeti();
    this.sonarFanfare();
    this.cdr.detectChanges();

    const txt = this.sinEmojis(this.tituloFinal + '. ' + this.mensajeFinal);
    setTimeout(() => this.hablar(txt), 800);

    // CA-03: fire-and-forget, guarda métricas de la sesión
    if (this.sesionId) {
      this.sesionJuegoService.finalizarSesion(this.sesionId, this.puntuacion, this.rondas, this.aciertos);
    }
  }

  reiniciarJuego(): void { this.iniciarJuego(); }
  volver(): void { this.router.navigate(['/nino/juegos']); }

  get puntuacion(): number {
    return this.rondas === 0 ? 0 : Math.round((this.aciertos / this.rondas) * 100);
  }
  get trofeoEmoji(): string {
    return this.puntuacion >= 85 ? '🏆' : this.puntuacion >= 65 ? '🥈' : this.puntuacion >= 40 ? '🥉' : '🌟';
  }
  get tituloFinal(): string {
    return this.puntuacion >= 85 ? '¡Explorador experto!' : this.puntuacion >= 65 ? '¡Muy bien hecho!' : this.puntuacion >= 40 ? '¡Buen esfuerzo!' : '¡Sigue explorando!';
  }
  get mensajeFinal(): string {
    if (this.puntuacion >= 85) return `¡Exploraste ${this.paisesExplorados.size} países y acertaste casi todo! Tu memoria geográfica es excelente. 🌍✨`;
    if (this.puntuacion >= 65) return `Exploraste ${this.paisesExplorados.size} países y respondiste muy bien. ¡Sigue así! 🌟`;
    if (this.puntuacion >= 40) return `Cada país que exploras suma. ¡Inténtalo de nuevo y descubre más! 💪`;
    return `¡No te rindas! Cada país que visitas te ayuda a aprender más del mundo. 💖`;
  }

  get tiempoUsadoFormateado(): string {
    const usadoMs = TIEMPO_MAX_MS - this.tiempoRestanteMs;
    const totalSeg = Math.max(0, Math.floor(usadoMs / 1000));
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  }

  private sonarFanfare(): void {
    const notas = this.puntuacion >= 80 ? [523, 659, 784, 880, 1047] : [523, 659, 523];
    notas.forEach((f, i) => setTimeout(() => this.tocar(f, 0.3, 'sine', 0.4), i * 130));
  }

  confettiPieces: ConfettiPiece[] = [];
  showConfetti = false;

  private dispararConfeti(): void {
    this.confettiPieces = this.generarConfeti();
    this.showConfetti = true;
  }

  private generarConfeti(): ConfettiPiece[] {
    const colores = ['#60a5fa','#34d399','#fbbf24','#f87171','#4ade80','#93c5fd','#fb923c','#2dd4bf'];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i, left: Math.random() * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 500, dur: 1400 + Math.random() * 800,
      size: 6 + Math.random() * 9,
    }));
  }

  private limpiarTimers(): void {
    this.timers.forEach(t => clearTimeout(t)); this.timers = [];
    this.limpiarTimerReloj();
  }
}
