import { Component, OnInit, OnDestroy, ViewChild, HostListener, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { VolumeControlComponent } from '../../../../shared/game-feedback/volume-control.component';
import { GameFeedbackService, NivelVolumen } from '../../../../shared/game-feedback/game-feedback.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';
import { LaberintoCognitivoService } from '../../../../core/services/laberinto-cognitivo.service';
import { SesionJuegoService } from '../../../../core/services/sesion-juego.service';

import { Celda, Direccion, EstadoJuego, Laberinto, Mood, Posicion, RondaHistorial } from './laberinto.types';
import {
  agregarObstaculoDinamico,
  calcularCaminoOptimo,
  esCallejonSinSalida,
  generarLaberinto,
  intentarMover,
  ObstaculoDinamico,
  tamanoParaNivel,
  tieneObstaculosDinamicos,
  tieneMultiplesCaminos,
} from './laberinto.utils';
import { sinEmojis as sinEmojisUtil } from '../../../../shared/utils/tts-texto.util';

const MASCOTA_MSGS: Record<Mood, string[]> = {
  idle: ['¡Listo para planificar! 🧩', '¡Vamos a pensar juntos! 🐱'],
  thinking: ['¡Memoriza el camino! 👀', '¡Fíjate en los callejones! 🔍', '¡Piensa antes de moverte! 🧠'],
  excited: ['¡Ya puedes moverte! 🏃', '¡Adelante, con calma! ⭐', '¡Elige bien tu ruta! 🎯'],
  celebrate: ['¡LLEGASTE A LA META! 🎉', '¡Excelente planificación! 🏆', '¡Qué buena ruta! 💫'],
  encourage: ['¡Callejón sin salida! Vuelve atrás 💪', '¡No pasa nada, sigue explorando! 🌟'],
};

@Component({
  selector: 'app-laberinto',
  standalone: true,
  imports: [CommonModule, GameFeedbackComponent, VolumeControlComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-wrapper">

      <!-- ── Fondo animado (persistente en todos los estados) ─────────────── -->
      <div class="lc-dots" aria-hidden="true"></div>
      <div class="lc-bg-orb lc-o1" aria-hidden="true"></div>
      <div class="lc-bg-orb lc-o2" aria-hidden="true"></div>
      <div class="lc-bg-orb lc-o3" aria-hidden="true"></div>
      <div class="lc-bg" aria-hidden="true">
        <span class="lc-p lc-p1">△</span><span class="lc-p lc-p2">◻</span>
        <span class="lc-p lc-p3">✦</span><span class="lc-p lc-p4">◈</span>
        <span class="lc-p lc-p5">✧</span><span class="lc-p lc-p6">◇</span>
        <span class="lc-p lc-p7">❖</span><span class="lc-p lc-p8">◻</span>
      </div>

      <!-- ══ INICIO ══════════════════════════════════════════ -->
      @if (estado === 'inicio') {
        <div class="pantalla-inicio">
          <img class="bg-escena" src="/mascotas/michi-escena.png" alt="Escena de Michi en el laberinto">
          <div class="inicio-velo"></div>

          <button class="btn-volver-inicio" (click)="volver()">← Volver</button>

          <!-- Michi explica las instrucciones desde su burbuja -->
          <div class="michi-habla">
            <div class="habla-bubble">
              <p class="habla-saludo">¡Hola! Soy <strong>Michi</strong> 🐱</p>
              <p class="habla-intro">Para jugar Laberinto Cognitivo:</p>
              <div class="habla-pasos">
                <div class="habla-paso"><span class="h-ico">👀</span><span>Memoriza el laberinto 3 segundos</span></div>
                <div class="habla-paso"><span class="h-ico">⌨️</span><span>Muévete con flechas o el dedo</span></div>
                <div class="habla-paso"><span class="h-ico">🎯</span><span>Menos pasos de más = mayor dificultad</span></div>
                <div class="habla-paso"><span class="h-ico">🧱</span><span>Desde nivel 3: ¡cuidado con quedar atrapado!</span></div>
              </div>
              <p class="habla-animo">¡Yo te ayudo! ✨</p>
            </div>
            <div class="habla-tail"></div>
          </div>

          <!-- Panel derecho — solo título y botón -->
          <div class="inicio-panel">
            <h1 class="titulo-juego">
              <span class="titulo-grad">Laberinto</span><span class="titulo-blanco"> Cognitivo</span>
            </h1>
            <p class="subtitulo-juego">Memoriza el camino, planifica tu ruta y llega a la meta</p>

            <button class="btn-empezar" (click)="iniciarJuego()">
              🧩 ¡Empezar!
              <span class="btn-shine"></span>
            </button>

            <div class="volumen-footer">
              <app-volume-control [volumen]="volumenActual" (volumenChange)="onVolumenChange($event)"></app-volume-control>
              <button class="btn-voz" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar a Michi' : 'Activar voz de Michi'">
                {{ voiceEnabled ? '🔊' : '🔇' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ══ JUEGO ══════════════════════════════════════════ -->
      @if (estado === 'despliegue' || estado === 'jugando' || estado === 'feedback') {
        <div class="pantalla-juego">

          <app-game-feedback #feedback></app-game-feedback>
          <app-mascot game="laberinto" [mood]="mascotMood" [message]="mascotMsg"></app-mascot>

          <!-- Header -->
          <div class="game-header">
            <button class="btn-salir" (click)="terminarSesion()">
              <span class="salir-icon">←</span>
              <span class="salir-txt">Salir</span>
            </button>

            <div class="header-centro">
              <div class="progreso-wrap">
                <div class="progreso-barra">
                  <div class="progreso-fill" [style.width.%]="(rondaActual/MAX_RONDAS)*100"></div>
                </div>
                <span class="progreso-label">Ronda {{ rondaActual }}/{{ MAX_RONDAS }}</span>
              </div>
            </div>

            <div class="header-stats">
              <div class="stat-badge badge-nivel">
                <span class="badge-ico">⭐</span>
                <span class="badge-num">Nivel {{ nivelActual }}</span>
              </div>
              <div class="stat-badge badge-rojo">
                <span class="badge-ico">🚧</span>
                <span class="badge-num">{{ callejonesRondaActual }}</span>
              </div>
              <button class="btn-voz-hdr" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar a Michi' : 'Activar voz de Michi'">
                {{ voiceEnabled ? '🔊' : '🔇' }}
              </button>
            </div>
          </div>

          <!-- Cuenta de despliegue (CA-01) -->
          @if (estado === 'despliegue') {
            <div class="despliegue-banner">
              <span class="despliegue-num">{{ despliegueSegundosRestantes }}</span>
              <span class="despliegue-txt">¡Memoriza el camino! Aún no puedes moverte…</span>
            </div>
          }
          @if (estado === 'jugando') {
            <div class="jugando-banner">Usa las flechas del teclado o desliza el dedo</div>
          }

          <!-- Laberinto -->
          @if (laberinto; as lab) {
            <div class="laberinto-contenedor"
              [style.--tamano]="tamanoActual"
              [style.--cell-size.px]="tamanoCelda"
              (touchstart)="onTouchStart($event)"
              (touchend)="onTouchEnd($event)">
              <div class="laberinto-grid" [class.grid-bloqueado]="estado !== 'jugando'">
                @for (fila of lab.celdas; track $index) {
                  @for (celda of fila; track celda.col) {
                    <div class="celda"
                      [class.pared-arriba]="celda.paredes.arriba"
                      [class.pared-abajo]="celda.paredes.abajo"
                      [class.pared-izquierda]="celda.paredes.izquierda"
                      [class.pared-derecha]="celda.paredes.derecha"
                      [class.celda-inicio]="esInicio(celda)"
                      [class.celda-meta]="esMeta(celda)"
                      [class.celda-obstaculo-nuevo]="esObstaculoReciente(celda)">
                      @if (esMeta(celda)) { <span class="celda-icono">🏁</span> }
                      @if (esJugadorAqui(celda)) { <span class="celda-jugador">🐱</span> }
                    </div>
                  }
                }
              </div>
            </div>
          }

        </div>
      }

      <!-- ══ RESULTADOS ══════════════════════════════════════ -->
      @if (estado === 'resultados') {
        <div class="pantalla-resultados">
          @if (confettiActivo) {
            <div class="confetti-container" aria-hidden="true">
              @for (p of confettiPiezas; track p.id) {
                <div class="confeti" [style.left.%]="p.left" [style.background]="p.color"
                  [style.animation-delay.s]="p.delay" [style.animation-duration.s]="p.dur"
                  [style.width.px]="p.size" [style.height.px]="p.size*1.6"></div>
              }
            </div>
          }
          <div class="resultados-card">
            <div class="fox-resultado-hero">
              <img class="foxy-resultado-img" src="mascotas/michi-portrait.png" alt="Michi">
              <div class="fox-resultado-trophy">{{ trofeoEmoji }}</div>
            </div>

            <h2 class="resultado-titulo">{{ tituloFinal }}</h2>

            <div class="estrellas">
              <span class="estrella"        [class.estrella-on]="eficienciaTotal >= 40">⭐</span>
              <span class="estrella grande" [class.estrella-on]="eficienciaTotal >= 65">⭐</span>
              <span class="estrella"        [class.estrella-on]="eficienciaTotal >= 85">⭐</span>
            </div>

            <div class="score-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" class="ring-bg"/>
                <circle cx="60" cy="60" r="50" class="ring-fill"
                  [style.stroke-dasharray]="314"
                  [style.stroke-dashoffset]="314-(314*eficienciaTotal/100)"/>
              </svg>
              <div class="score-texto">
                <div class="score-num">{{ eficienciaTotal }}%</div>
                <div class="score-lbl">eficiencia</div>
              </div>
            </div>

            <div class="metricas-row">
              <div class="metrica"><div class="m-icon">👣</div><div class="m-val azul">{{ pasosUsadosTotal }}</div><div class="m-lbl">Pasos usados</div></div>
              <div class="metrica"><div class="m-icon">🎯</div><div class="m-val verde">{{ pasosOptimosTotal }}</div><div class="m-lbl">Pasos óptimos</div></div>
              <div class="metrica"><div class="m-icon">🚧</div><div class="m-val naranja">{{ callejonesSinSalidaTotal }}</div><div class="m-lbl">Callejones</div></div>
              <div class="metrica"><div class="m-icon">🧠</div><div class="m-val morado">{{ planificoEnPrimerMovimiento ? 'Sí' : 'No' }}</div><div class="m-lbl">Planificó antes</div></div>
            </div>

            <div class="foxy-msg-final">
              <img class="foxy-msg-avatar-img" src="mascotas/michi-portrait.png" alt="Michi">
              <div class="foxy-msg-bubble">{{ mensajeFinal }}</div>
            </div>

            @if (historialRondas.length > 0) {
              <div class="rutas-section">
                <h3 class="rutas-titulo">🗺️ Tu camino vs. el camino más rápido</h3>
                <div class="rutas-leyenda">
                  <span class="leyenda-item"><span class="leyenda-swatch swatch-optimo"></span>Camino más rápido</span>
                  <span class="leyenda-item"><span class="leyenda-swatch swatch-jugador"></span>Tu camino</span>
                  <span class="leyenda-item"><span class="leyenda-swatch swatch-ambos"></span>Coinciden</span>
                </div>
                <div class="rutas-scroll">
                  @for (h of historialRondas; track h.numeroRonda) {
                    <div class="ruta-card">
                      <div class="ruta-card-header">Ronda {{ h.numeroRonda }} · Nivel {{ h.nivel }} · {{ h.pasosUsados }}/{{ h.pasosOptimos }} pasos</div>
                      <div class="ruta-grid" [style.--tamano]="h.tamano">
                        @for (fila of h.celdas; track $index) {
                          @for (celda of fila; track celda.col) {
                            <div class="ruta-celda"
                              [class.pared-arriba]="celda.paredes.arriba"
                              [class.pared-abajo]="celda.paredes.abajo"
                              [class.pared-izquierda]="celda.paredes.izquierda"
                              [class.pared-derecha]="celda.paredes.derecha"
                              [class.ruta-optimo]="enCaminoOptimo(h, celda)"
                              [class.ruta-jugador]="enRecorridoJugador(h, celda)"
                              [class.ruta-inicio]="esInicioHistorial(h, celda)"
                              [class.ruta-meta]="esMetaHistorial(h, celda)">
                              @if (esMetaHistorial(h, celda)) { <span class="ruta-icono">🏁</span> }
                            </div>
                          }
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            @if (errorBackend) {
              <div class="error-backend">{{ errorBackend }}</div>
            }

            <div class="btns-final">
              <button class="btn-repetir" (click)="reiniciarJuego()">🔄 Jugar de nuevo</button>
              <button class="btn-volver" (click)="volver()">← Volver</button>
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
      background: linear-gradient(160deg, #0b2027 0%, #123138 50%, #0d2429 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, sans-serif;
      color: white; overflow: hidden; position: relative;
    }

    /* ══ INICIO ══ */
    .pantalla-inicio { min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }

    .bg-escena {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: left center; z-index: 0;
      /* La escena, al cubrir por ancho, no se recortaba horizontalmente con
         object-position (Michi quedaba flotando cerca del centro). Este
         zoom+paneo con transform-origin a la derecha de Michi lo empuja hacia
         el borde izquierdo. Valores ajustados (probados renderizando la
         transformación real sobre la imagen) para que el tamaño de Michi y
         del fondo se mantengan igual que antes — solo cambia la posición. */
      transform-origin: 90% 52%;
      animation: bgZoomMichi 24s ease-in-out infinite alternate;
    }
    @keyframes bgZoomMichi { from { transform: scale(1.30) translate(0,0); } to { transform: scale(1.34) translate(-.5%, .3%); } }
    .inicio-velo {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(
        to right,
        transparent 0%,
        transparent 26%,
        rgba(9,26,31,.65) 40%,
        rgba(9,26,31,.9) 54%,
        rgba(9,26,31,.96) 100%
      );
    }

    /* Botón volver fijo arriba-izquierda (mismo patrón que Espejo Mental) */
    .btn-volver-inicio {
      position: absolute; top: 24px; left: 24px; z-index: 4;
      padding: 10px 16px; border: 1px solid rgba(255,255,255,.2); border-radius: 14px;
      background: rgba(8,14,30,.7); color: #dce7f8; font-size: 14px; font-weight: 700;
      cursor: pointer; backdrop-filter: blur(10px); transition: transform .2s ease, background .2s ease;
    }
    .btn-volver-inicio:hover { transform: translateY(-2px); background: rgba(255,255,255,.12); }

    .inicio-panel {
      position: absolute; z-index: 2; left: 50%; top: 50%; transform: translateY(-50%);
      width: 48%; max-width: 500px;
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 28px 32px; background: rgba(9,26,31,.45); backdrop-filter: blur(4px);
      border-radius: 28px; animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }

    /* Burbuja de Michi con instrucciones */
    .michi-habla {
      position: absolute; left: 19%; top: 4%; transform: translateX(-50%); z-index: 3;
      width: 300px; animation: popIn .5s .3s both cubic-bezier(.34,1.56,.64,1);
    }
    .habla-bubble {
      background: rgba(255,255,255,0.97); border: 3px solid #22d3ee; border-radius: 22px;
      padding: 18px 20px 14px; color: #0f172a; box-shadow: 0 8px 40px rgba(8,145,178,.4);
    }
    .habla-saludo { font-size: 17px; font-weight: 800; margin: 0 0 6px; }
    .habla-intro { font-size: 13px; font-weight: 700; color: #0e7490; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .5px; }
    .habla-pasos { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .habla-paso { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #0f172a; }
    .h-ico { font-size: 20px; flex-shrink: 0; }
    .habla-animo { font-size: 14px; font-weight: 700; color: #0891b2; margin: 0; text-align: right; }
    .habla-tail {
      width: 0; height: 0; border-left: 16px solid transparent; border-right: 16px solid transparent;
      border-top: 22px solid #22d3ee; margin: 0 auto; position: relative;
    }
    .habla-tail::after {
      content: ''; position: absolute; top: -25px; left: -12px;
      width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent;
      border-top: 18px solid rgba(255,255,255,.97);
    }

    .titulo-juego { font-size: 40px; font-weight: 900; margin: 0 0 8px; line-height: 1.1; }
    .titulo-grad { background: linear-gradient(135deg,#22d3ee,#0891b2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .titulo-blanco { color: white; }
    .subtitulo-juego { font-size: 14px; color: #94a3b8; margin-bottom: 24px; }

    .btn-empezar {
      display: inline-flex; align-items: center; gap: 10px; justify-content: center; width: 100%;
      background: linear-gradient(135deg,#0891b2,#0e7490); color: white;
      border: none; border-radius: 20px; padding: 16px 44px;
      font-size: 18px; font-weight: 800; cursor: pointer; transition: all .2s;
      box-shadow: 0 8px 32px rgba(8,145,178,.5); position: relative; overflow: hidden;
      animation: pulseBtn 2s infinite; margin-bottom: 18px;
    }
    .btn-empezar:hover { transform: translateY(-4px) scale(1.05); animation: none; }
    .btn-shine { position:absolute; top:0; left:-80%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent); animation: shine 2.5s ease-in-out infinite 1s; }
    @keyframes shine { 0%{left:-80%} 100%{left:120%} }
    @keyframes pulseBtn { 0%,100%{box-shadow:0 8px 32px rgba(8,145,178,.5),0 0 0 0 rgba(8,145,178,.4)} 50%{box-shadow:0 8px 32px rgba(8,145,178,.5),0 0 0 14px rgba(8,145,178,0)} }

    .volumen-footer { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-voz {
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
      border-radius: 50%; width: 42px; height: 42px; font-size: 20px; cursor: pointer; transition: all .2s;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .btn-voz:hover { background: rgba(255,255,255,.2); transform: scale(1.1); }

    /* ══ JUEGO ══ */
    .pantalla-juego { width: 100%; max-width: 560px; padding: 20px 20px 32px; position: relative; }

    .game-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
      border-radius: 18px; padding: 10px 12px; backdrop-filter: blur(10px);
    }
    .btn-salir {
      display: flex; align-items: center; gap: 5px;
      background: rgba(239,68,68,.12); border: 1.5px solid rgba(239,68,68,.3);
      color: #f87171; border-radius: 12px; padding: 7px 12px;
      font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s; flex-shrink: 0;
    }
    .btn-salir:hover { background: rgba(239,68,68,.28); transform: scale(1.05); }
    .header-centro { flex: 1; min-width: 0; }
    .progreso-wrap { display: flex; align-items: center; gap: 8px; }
    .progreso-barra { flex: 1; height: 10px; background: rgba(255,255,255,.08); border-radius: 100px; overflow: hidden; }
    .progreso-fill { height: 100%; background: linear-gradient(90deg,#22d3ee,#0891b2); border-radius: 100px; transition: width .6s ease; }
    .progreso-label { font-size: 12px; font-weight: 700; color: #94a3b8; white-space: nowrap; }
    .header-stats { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
    .stat-badge { display: flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 20px; border: 1.5px solid; }
    .badge-nivel { background: rgba(34,211,238,.14); border-color: rgba(34,211,238,.4); }
    .badge-rojo  { background: rgba(239,68,68,.14); border-color: rgba(239,68,68,.35); }
    .badge-ico { font-size: 15px; }
    .badge-num { font-size: 13px; font-weight: 900; color: white; }
    .btn-voz-hdr {
      background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.18);
      border-radius: 50%; width: 34px; height: 34px;
      font-size: 15px; cursor: pointer; transition: all .2s; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-voz-hdr:hover { background: rgba(255,255,255,.18); transform: scale(1.1); }

    .despliegue-banner, .jugando-banner {
      text-align: center; margin-bottom: 14px; padding: 10px 14px; border-radius: 14px;
      font-weight: 700; font-size: 14px;
    }
    .despliegue-banner {
      background: rgba(251,191,36,.14); border: 1.5px solid rgba(251,191,36,.4); color: #fde68a;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .despliegue-num { font-size: 22px; font-weight: 900; color: #fbbf24; }
    .jugando-banner { background: rgba(34,211,238,.1); border: 1.5px solid rgba(34,211,238,.3); color: #a5f3fc; }

    .laberinto-contenedor { display: flex; justify-content: center; margin-top: 6px; touch-action: none; }
    .laberinto-grid {
      display: grid;
      grid-template-columns: repeat(var(--tamano), var(--cell-size));
      grid-template-rows: repeat(var(--tamano), var(--cell-size));
      background: rgba(255,255,255,.04);
      border-radius: 10px;
      transition: opacity .2s;
    }
    .grid-bloqueado { opacity: .92; }

    .celda {
      position: relative;
      border: 2px solid transparent;
      display: flex; align-items: center; justify-content: center;
      box-sizing: border-box;
    }
    .pared-arriba    { border-top-color: #0891b2; }
    .pared-abajo     { border-bottom-color: #0891b2; }
    .pared-izquierda { border-left-color: #0891b2; }
    .pared-derecha   { border-right-color: #0891b2; }

    .celda-inicio { background: rgba(34,211,238,.08); }
    .celda-meta   { background: rgba(74,222,128,.14); }
    .celda-icono { font-size: calc(var(--cell-size) * 0.5); line-height: 1; }
    .celda-jugador { font-size: calc(var(--cell-size) * 0.55); line-height: 1; animation: jugadorPop .2s ease; z-index: 2; }
    @keyframes jugadorPop { from { transform: scale(0.6); } to { transform: scale(1); } }

    .celda-obstaculo-nuevo { animation: obstaculoFlash .8s ease; }
    @keyframes obstaculoFlash {
      0% { background: rgba(239,68,68,.55); }
      100% { background: transparent; }
    }

    /* ══ RESULTADOS ══ */
    .pantalla-resultados { padding: 24px; width: 100%; max-width: 480px; position: relative; }
    .resultados-card {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.13);
      border-radius: 32px; padding: 32px 24px 28px; text-align: center;
      backdrop-filter: blur(16px); animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }
    .fox-resultado-hero { position:relative; display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; width:110px; height:110px; }
    .foxy-resultado-img { width:120px; height:auto; filter:drop-shadow(0 0 20px rgba(34,211,238,.6)); animation:bounce 2s ease-in-out infinite; -webkit-mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); }
    .estrellas { display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:18px; }
    .estrella { font-size:30px; filter:grayscale(1) opacity(.3); transition:all .4s cubic-bezier(.34,1.56,.64,1); }
    .estrella.grande { font-size:42px; }
    .estrella.estrella-on { filter:grayscale(0) opacity(1) drop-shadow(0 0 12px rgba(250,204,21,.8)); animation:uniStarPop .5s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes uniStarPop { from{transform:scale(0) rotate(-30deg)} to{transform:scale(1) rotate(0)} }
    .fox-resultado-trophy { position:absolute; top:-10px; right:-10px; z-index:2; font-size:30px; animation:bounce 1.5s ease-in-out infinite .3s; }
    @keyframes spinRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }

    .resultado-titulo { font-size:22px; font-weight:900; color:#f1f5f9; margin-bottom:16px; }

    /* ══ Comparación de caminos (resultados) ══ */
    .rutas-section { margin-top: 20px; text-align: left; }
    .rutas-titulo { font-size: 14px; font-weight: 800; color: #f1f5f9; margin-bottom: 10px; text-align: center; }
    .rutas-leyenda { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
    .leyenda-item { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; font-weight: 600; }
    .leyenda-swatch { width: 12px; height: 12px; border-radius: 4px; display: inline-block; }
    .swatch-optimo  { background: rgba(34,211,238,.55); }
    .swatch-jugador { background: rgba(249,115,22,.55); }
    .swatch-ambos   { background: rgba(74,222,128,.65); }

    .rutas-scroll { display: flex; gap: 14px; overflow-x: auto; padding: 4px 2px 10px; scroll-snap-type: x mandatory; }
    .ruta-card { flex: 0 0 auto; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 14px; padding: 10px; scroll-snap-align: start; }
    .ruta-card-header { font-size: 10px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; text-align: center; white-space: nowrap; }

    .ruta-grid {
      display: grid;
      grid-template-columns: repeat(var(--tamano), 14px);
      grid-template-rows: repeat(var(--tamano), 14px);
      background: rgba(255,255,255,.03);
      border-radius: 6px;
    }
    .ruta-celda { position: relative; border: 1px solid transparent; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
    .ruta-celda.pared-arriba    { border-top-color: rgba(8,145,178,.5); }
    .ruta-celda.pared-abajo     { border-bottom-color: rgba(8,145,178,.5); }
    .ruta-celda.pared-izquierda { border-left-color: rgba(8,145,178,.5); }
    .ruta-celda.pared-derecha   { border-right-color: rgba(8,145,178,.5); }
    .ruta-celda.ruta-optimo  { background: rgba(34,211,238,.5); }
    .ruta-celda.ruta-jugador { background: rgba(249,115,22,.5); }
    .ruta-celda.ruta-optimo.ruta-jugador { background: rgba(74,222,128,.65); }
    .ruta-celda.ruta-inicio { box-shadow: inset 0 0 0 1px rgba(34,211,238,.9); }
    .ruta-celda.ruta-meta   { box-shadow: inset 0 0 0 1px rgba(74,222,128,.9); }
    .ruta-icono { font-size: 9px; line-height: 1; }

    .score-ring { position:relative; width:120px; height:120px; margin:0 auto 18px; }
    .score-ring svg { width:120px; height:120px; transform:rotate(-90deg); }
    .ring-bg   { fill:none; stroke:rgba(255,255,255,.08); stroke-width:10; }
    .ring-fill { fill:none; stroke:#22d3ee; stroke-width:10; stroke-linecap:round; transition:stroke-dashoffset 1.2s ease; }
    .score-texto { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .score-num { font-size:26px; font-weight:900; background:linear-gradient(135deg,#22d3ee,#0891b2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .score-lbl { font-size:10px; color:#64748b; }

    .metricas-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
    .metrica { background:rgba(255,255,255,.06); border-radius:12px; padding:10px 4px; }
    .m-icon { font-size:16px; margin-bottom:3px; }
    .m-val { font-size:16px; font-weight:900; line-height:1; margin-bottom:2px; }
    .m-lbl { font-size:9px; color:#64748b; }
    .m-val.verde { color:#4ade80; } .m-val.azul { color:#60a5fa; }
    .m-val.morado { color:#c4b5fd; } .m-val.naranja { color:#fb923c; }

    .foxy-msg-final { display:flex; align-items:flex-start; gap:10px; margin-bottom:16px; text-align:left; }
    .foxy-msg-avatar-img { width:48px; height:auto; flex-shrink:0; filter:drop-shadow(0 0 8px rgba(34,211,238,.5)); -webkit-mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); mask-image:radial-gradient(ellipse 82% 90% at 50% 52%, black 55%, transparent 100%); }
    /* ── Confetti ─────────────────────────────────────────────────────────── */
    .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 100; overflow: hidden; }
    .confeti { position: absolute; top: -20px; border-radius: 3px; animation: caer linear forwards; }
    @keyframes caer { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
    .foxy-msg-bubble { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); border-radius:4px 14px 14px 14px; padding:10px 14px; font-size:13px; color:#94a3b8; line-height:1.6; flex:1; }

    .error-backend { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); color: #fca5a5; border-radius: 10px; padding: 8px 12px; font-size: 12px; margin-bottom: 14px; }

    .btns-final { display:flex; gap:10px; }
    .btn-repetir { flex:1; background:linear-gradient(135deg,#0891b2,#0e7490); color:white; border:none; border-radius:14px; padding:13px 8px; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-repetir:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(8,145,178,.5); }
    .btn-volver { flex:1; background:rgba(255,255,255,.07); color:#94a3b8; border:1px solid rgba(255,255,255,.13); border-radius:14px; padding:13px 8px; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-volver:hover { background:rgba(255,255,255,.13); color:#f1f5f9; }

    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn   { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes flotar  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

    /* ── Grilla de puntos (patrón de laberinto) — distintivo de este juego ── */
    .lc-dots {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: radial-gradient(rgba(34,211,238,.09) 1.5px, transparent 1.5px);
      background-size: 34px 34px;
      animation: lcDotsFade 22s ease-in-out infinite;
    }
    @keyframes lcDotsFade { 0%,100%{opacity:.55} 50%{opacity:1} }
    /* ══ FONDO ANIMADO — LABERINTO COGNITIVO ══════════════════════════════ */
    .lc-bg-orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; animation: lcOrbPulse 10s ease-in-out infinite; }
    .lc-o1 { width: 480px; height: 480px; top: -150px; left: -100px; background: radial-gradient(circle, rgba(34,211,238,.3), transparent 70%); animation-delay: 0s; }
    .lc-o2 { width: 360px; height: 360px; bottom: -120px; right: -90px; background: radial-gradient(circle, rgba(8,145,178,.25), transparent 70%); animation-delay: 4s; }
    .lc-o3 { width: 260px; height: 260px; top: 42%; left: 60%; background: radial-gradient(circle, rgba(103,232,249,.18), transparent 70%); animation-delay: 8s; }
    @keyframes lcOrbPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
    .lc-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .lc-p { position: absolute; font-size: 20px; color: rgba(103,232,249,.2); animation: lcPFloat var(--d,13s) ease-in-out infinite var(--dl,0s); }
    @keyframes lcPFloat { 0%,100%{transform:translateY(0) rotate(-2deg);opacity:.1;} 50%{transform:translateY(-22px) rotate(5deg);opacity:.25;} }
    .lc-p1{top:7%;left:10%;--d:11s;--dl:0s;} .lc-p2{top:22%;left:87%;--d:14s;--dl:2s;} .lc-p3{top:57%;left:5%;--d:10s;--dl:4s;}
    .lc-p4{top:74%;left:78%;--d:13s;--dl:1s;font-size:24px;} .lc-p5{top:38%;left:48%;--d:9s;--dl:5s;font-size:14px;}
    .lc-p6{top:13%;left:63%;--d:16s;--dl:3s;font-size:16px;} .lc-p7{top:84%;left:31%;--d:12s;--dl:7s;} .lc-p8{top:47%;left:92%;--d:15s;--dl:6s;font-size:18px;}
  `]
})
export class LaberintoComponent implements OnInit, OnDestroy {

  readonly MAX_RONDAS = 6;
  private readonly UMBRAL_EFICIENCIA_SUBIDA = 1.30; // CA-06

  estado: EstadoJuego = 'inicio';
  laberinto: Laberinto | null = null;
  posicionJugador: Posicion = { fila: 0, col: 0 };
  /** Todas las celdas por las que ha pasado el niño en la ronda actual, en orden (incluye vueltas atrás). */
  recorridoJugador: Posicion[] = [];
  /** Una foto por cada ronda ya jugada — camino óptimo vs. camino real — para mostrar en resultados. */
  historialRondas: RondaHistorial[] = [];

  nivelActual = 1;
  tamanoActual = 5;
  rondaActual = 1;
  obstaculosActivos = false;

  despliegueSegundosRestantes = 3;
  callejonesRondaActual = 0;
  private pasosRondaActual = 0;
  private pasoGlobalCounter = 0;

  // Acumulados de toda la sesión (varias rondas) — CA-05
  pasosUsadosTotal = 0;
  pasosOptimosTotal = 0;
  callejonesSinSalidaTotal = 0;
  planificoEnPrimerMovimiento: boolean | null = null;
  private nivelMaximoAlcanzado = 1;
  /** Cuántas veces se quedó sin ninguna ruta a la meta y tuvo que reintentar el mapa (nuevo mecanismo de CA-04). */
  vecesAtrapadoTotal = 0;

  mascotMsg = '¡Listo para planificar! 🧩';
  confettiActivo = false;
  confettiPiezas = Array.from({length:60},(_,i)=>({
    id:i, left:Math.random()*100,
    color:['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#c084fc','#34d399','#fb923c'][i%8],
    delay:Math.random()*2, dur:2.5+Math.random()*2, size:8+Math.random()*8
  }));
  mascotMood: Mood = 'idle';

  volumenActual: NivelVolumen = 75;
  errorBackend: string | null = null;

  /** Voz de Michi (TTS), mismo mecanismo que Espejo Mental/Historia Viva: independiente del control de sonido/volumen. */
  voiceEnabled = true;
  private michiVoice: SpeechSynthesisVoice | null = null;

  private readonly JUEGO_ID = 4;
  private nivelRecomendadoNumero: number | null = null;
  private celdaObstaculoReciente: Posicion | null = null;
  private celdaObstaculoRecienteDestino: Posicion | null = null;
  private tiempoInicioJugando = 0;
  private tiempoInicioSesion = 0;
  private tiempoInicioMovimiento = 0;
  private sesionBackendId: number | null = null;
  private profileId: number | null = null;
  private touchInicio: { x: number; y: number } | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private despliegueInterval: ReturnType<typeof setInterval> | null = null;

  @ViewChild('feedback') feedback!: GameFeedbackComponent;

  get tamanoCelda(): number {
    // Mantiene el laberinto dentro de un ancho razonable sin importar el tamaño
    return Math.max(32, Math.min(56, Math.floor(400 / this.tamanoActual)));
  }

  get eficienciaTotal(): number {
    if (this.pasosUsadosTotal === 0) return 0;
    return Math.round(Math.min(100, (this.pasosOptimosTotal / this.pasosUsadosTotal) * 100));
  }

  get trofeoEmoji(): string {
    return this.eficienciaTotal >= 85 ? '🏆' : this.eficienciaTotal >= 65 ? '🥈' : this.eficienciaTotal >= 40 ? '🥉' : '🌟';
  }

  get tituloFinal(): string {
    return this.eficienciaTotal >= 85 ? '¡Planificador experto!' : this.eficienciaTotal >= 65 ? '¡Muy buena planificación!' : this.eficienciaTotal >= 40 ? '¡Buen esfuerzo!' : '¡Sigue practicando!';
  }

  get mensajeFinal(): string {
    if (this.eficienciaTotal >= 85) return `Completaste ${this.rondaActual} laberintos usando casi siempre el camino más corto. ¡Tu planificación es excelente! 🧠✨`;
    if (this.eficienciaTotal >= 65) return `Resolviste los laberintos con buena eficiencia. ¡Sigue practicando para planificar aún mejor! 🌟`;
    return `Cada laberinto entrena tu capacidad de planificar antes de actuar. ¡Inténtalo de nuevo! 💪`;
  }

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private feedbackService: GameFeedbackService,
    private childProfileService: ChildProfileService,
    private laberintoService: LaberintoCognitivoService,
    private sesionJuegoService: SesionJuegoService,
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
      this.profileId = state.profileId;
      this.volumenActual = (state.profileVolumen ?? 75) as NivelVolumen;
      this.feedbackService.setVolumen(this.volumenActual);
      // Precargar nivel recomendado por IA (CA-03)
      if (state.profileId) {
        this.sesionJuegoService.obtenerRecomendacion(state.profileId, this.JUEGO_ID)
          .subscribe(rec => {
            if (rec?.nivelRecomendado?.nivel) {
              const mapa: Record<string, number> = { FACIL: 1, MEDIO: 2, DIFICIL: 3, EXPERTO: 4 };
              this.nivelRecomendadoNumero = mapa[rec.nivelRecomendado.nivel] ?? null;
            }
          });
      }
    });

    this.cargarVozMichi();
    this.hablar('¡Hola! Soy Michi. Vamos a planificar el camino antes de movernos.');
  }

  ngOnDestroy(): void {
    this.limpiarTimers();
    window.speechSynthesis?.cancel();
  }

  // ── Voz de Michi (TTS) — mismo mecanismo usado en Espejo Mental/Historia Viva ──

  toggleVoz(): void {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) window.speechSynthesis?.cancel();
  }

  private cargarVozMichi(): void {
    const seleccionar = () => {
      const voces = window.speechSynthesis?.getVoices() ?? [];
      // Prioridad: voces en español disponibles en Windows/Mac/Android (mismo orden que Espejo Mental)
      const candidatas = [
        voces.find(v => v.name.includes('Sabina')),
        voces.find(v => v.name.includes('Paulina')),
        voces.find(v => v.name.includes('Monica')),
        voces.find(v => v.name.includes('Helena')),
        voces.find(v => v.name.includes('Laura')),
        voces.find(v => v.name.includes('Elvira')),
        voces.find(v => v.lang === 'es-MX'),
        voces.find(v => v.lang === 'es-ES'),
        voces.find(v => v.lang.startsWith('es')),
      ];
      this.michiVoice = candidatas.find(v => !!v) ?? null;
    };
    if (window.speechSynthesis?.getVoices().length) {
      seleccionar();
    } else {
      window.speechSynthesis?.addEventListener('voiceschanged', seleccionar, { once: true });
    }
  }

  private hablar(texto: string, rate = 0.92, pitch = 1.3): void {
    if (!this.voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(texto);
      if (this.michiVoice) {
        utt.voice = this.michiVoice;
        utt.lang = this.michiVoice.lang;
      } else {
        utt.lang = 'es-ES';
      }
      utt.volume = 0.9;
      utt.rate = rate;
      utt.pitch = pitch;
      window.speechSynthesis.speak(utt);
    } catch { /* TTS no disponible en este navegador: no bloquea el juego */ }
  }

  // ── Volumen (consistente con el resto de juegos) ────────────────────────

  onVolumenChange(v: NivelVolumen): void {
    this.volumenActual = v;
    this.feedbackService.setVolumen(v);
    if (this.profileId != null) {
      this.childProfileService.updateVolumen(this.profileId, v).subscribe();
    }
  }

  // ── Flujo principal ──────────────────────────────────────────────────────

  iniciarJuego(): void {
    this.rondaActual = 1;
    this.nivelActual = this.nivelRecomendadoNumero ?? 1;
    this.nivelMaximoAlcanzado = 1;
    this.pasosUsadosTotal = 0;
    this.pasosOptimosTotal = 0;
    this.callejonesSinSalidaTotal = 0;
    this.planificoEnPrimerMovimiento = null;
    this.vecesAtrapadoTotal = 0;
    this.pasoGlobalCounter = 0;
    this.errorBackend = null;
    this.historialRondas = [];
    this.tiempoInicioSesion = Date.now();

    if (this.profileId == null) {
      this.sesionBackendId = null;
      this.comenzarRonda();
      return;
    }

    this.laberintoService.iniciarSesion(this.profileId).subscribe({
      next: respuesta => {
        this.sesionBackendId = respuesta.sesionId;
        this.sesionJuegoService.comenzarTracking(respuesta.sesionId);  // CA-04
        this.comenzarRonda();
      },
      error: () => {
        // No bloquea el juego: se sigue jugando localmente sin persistir en el backend.
        this.sesionBackendId = null;
        this.errorBackend = 'No se pudo conectar con el servidor; jugarás sin guardar el progreso.';
        this.comenzarRonda();
      }
    });
  }

  reiniciarJuego(): void { this.iniciarJuego(); }

  private comenzarRonda(): void {
    this.tamanoActual = tamanoParaNivel(this.nivelActual);
    this.obstaculosActivos = tieneObstaculosDinamicos(this.nivelActual);
    // A partir de nivel 3 el laberinto deja de ser "perfecto": se agregan
    // rutas alternas además del camino óptimo (ver tieneMultiplesCaminos).
    this.laberinto = generarLaberinto(this.tamanoActual, tieneMultiplesCaminos(this.nivelActual));
    this.posicionJugador = { ...this.laberinto.inicio };
    this.recorridoJugador = [{ ...this.laberinto.inicio }];
    this.pasosRondaActual = 0;
    this.callejonesRondaActual = 0;
    this.celdaObstaculoReciente = null;
    this.celdaObstaculoRecienteDestino = null;

    this.setMascota('idle');
    this.iniciarDespliegue();
  }

  /**
   * CA-01: tiempo para memorizar el laberinto antes de poder moverse. Antes
   * era fijo en 3s sin importar el tamaño del mapa (5×5 en nivel 1 hasta
   * 9×9 en nivel 5): en los laberintos grandes no alcanzaba para memorizar
   * la ruta real, lo que forzaba a "adivinar" y terminaba marcando muchos
   * callejones sin salida que se sentían como errores injustos. Ahora crece
   * con el tamaño: 3s en el tamaño mínimo, +1s por cada fila/columna extra.
   */
  private calcularSegundosDespliegue(): number {
    return 3 + Math.max(0, this.tamanoActual - 5);
  }

  private iniciarDespliegue(): void {
    this.estado = 'despliegue';
    this.confettiActivo = false;
    this.despliegueSegundosRestantes = this.calcularSegundosDespliegue(); // CA-01
    this.cdr.detectChanges();

    this.despliegueInterval = setInterval(() => {
      this.despliegueSegundosRestantes--;
      this.cdr.detectChanges();

      if (this.despliegueSegundosRestantes <= 0) {
        if (this.despliegueInterval) clearInterval(this.despliegueInterval);
        this.despliegueInterval = null;
        this.estado = 'jugando';
        this.tiempoInicioJugando = Date.now();
        this.tiempoInicioMovimiento = Date.now();
        this.sesionJuegoService.marcarElementoAparece();  // CA-08
        this.setMascota('excited');
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  // ── Movimiento ────────────────────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  onKeydown(evento: KeyboardEvent): void {
    const mapa: Record<string, Direccion> = {
      ArrowUp: 'ARRIBA', ArrowDown: 'ABAJO', ArrowLeft: 'IZQUIERDA', ArrowRight: 'DERECHA',
    };
    const direccion = mapa[evento.key];
    if (!direccion) return;
    if (this.estado !== 'jugando') return;
    evento.preventDefault();
    this.mover(direccion);
  }

  onTouchStart(evento: TouchEvent): void {
    const t = evento.touches[0];
    this.touchInicio = { x: t.clientX, y: t.clientY };
  }

  onTouchEnd(evento: TouchEvent): void {
    if (!this.touchInicio || this.estado !== 'jugando') return;
    const t = evento.changedTouches[0];
    const dx = t.clientX - this.touchInicio.x;
    const dy = t.clientY - this.touchInicio.y;
    this.touchInicio = null;

    const UMBRAL_PX = 24;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < UMBRAL_PX) return;

    const direccion: Direccion = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'DERECHA' : 'IZQUIERDA')
      : (dy > 0 ? 'ABAJO' : 'ARRIBA');

    this.mover(direccion);
  }

  private mover(direccion: Direccion): void {
    if (!this.laberinto || this.estado !== 'jugando') return;

    // CA-03: solo se mide en el primer movimiento de la ronda 1 de la sesión
    if (this.rondaActual === 1 && this.pasosRondaActual === 0 && this.planificoEnPrimerMovimiento === null) {
      const inactividadMs = Date.now() - this.tiempoInicioJugando;
      this.planificoEnPrimerMovimiento = inactividadMs >= 2000;
    }

    const nuevaPos = intentarMover(this.laberinto.celdas, this.posicionJugador, direccion);
    if (!nuevaPos) return; // hay pared: no cuenta como paso

    this.posicionJugador = nuevaPos;
    this.recorridoJugador.push({ ...nuevaPos });
    this.pasosRondaActual++;
    this.pasoGlobalCounter++;

    const esCallejon = esCallejonSinSalida(this.laberinto.celdas, nuevaPos, this.laberinto.inicio, this.laberinto.meta);
    if (esCallejon) {
      this.callejonesRondaActual++;
      this.callejonesSinSalidaTotal++;
      this.setMascota('encourage');
    }

    // CA-05 / CA-07: track response time and click position
    const msMovimiento = Date.now() - this.tiempoInicioMovimiento;
    this.sesionJuegoService.trackRespuestaMs(msMovimiento);
    this.sesionJuegoService.trackClick(
      nuevaPos.col * this.tamanoCelda,
      nuevaPos.fila * this.tamanoCelda,
      direccion,
      !esCallejon
    );
    this.tiempoInicioMovimiento = Date.now();

    this.registrarPasoBackend(direccion, nuevaPos, esCallejon);

    // CA-04 (rediseño): la pared nueva ya no aparece cada N pasos al azar en
    // cualquier parte del mapa — aparece como consecuencia directa de un
    // error (entrar a un callejón sin salida), cerca de donde ocurrió. Ya no
    // está garantizado que el laberinto siga siendo resoluble: si el niño se
    // tarda en salir del callejón, su propia entrada se puede cerrar.
    let obstaculo: ObstaculoDinamico | null = null;
    if (this.obstaculosActivos && esCallejon) {
      obstaculo = agregarObstaculoDinamico(this.laberinto.celdas, nuevaPos, this.laberinto.meta);
      if (obstaculo) this.mostrarObstaculoReciente(obstaculo);
    }

    const llegoALaMeta = nuevaPos.fila === this.laberinto.meta.fila && nuevaPos.col === this.laberinto.meta.col;
    if (llegoALaMeta) {
      this.manejarRondaCompletada();
      return;
    }

    // Si el obstáculo que acaba de aparecer dejó al niño sin ninguna ruta
    // posible hacia la meta, se pierde este laberinto: se avisa y se
    // reintenta con un mapa nuevo del mismo nivel, en vez de dejarlo
    // bloqueado para siempre.
    if (obstaculo && calcularCaminoOptimo(this.laberinto.celdas, this.posicionJugador, this.laberinto.meta).length === 0) {
      this.manejarAtrapado();
      return;
    }

    this.cdr.detectChanges();
  }

  /** Se quedó sin ninguna ruta posible a la meta: pierde este mapa y reintenta con uno nuevo del mismo nivel. */
  private manejarAtrapado(): void {
    this.vecesAtrapadoTotal++;
    this.estado = 'feedback';
    this.mascotMood = 'encourage';
    this.mascotMsg = '¡Uy, te quedaste sin salida! 🧱 Vamos con un mapa nuevo';
    this.hablar(this.sinEmojis(this.mascotMsg));
    this.feedback.showIncorrect('¡Sin salida! Nuevo intento 🔄');
    this.cdr.detectChanges();

    this.timers.push(setTimeout(() => {
      this.comenzarRonda(); // mismo nivel y ronda, laberinto nuevo
    }, 1600));
  }

  private mostrarObstaculoReciente(obstaculo: { origen: Posicion; destino: Posicion }): void {
    // Resalta las dos celdas del pasaje que realmente se acaba de cerrar (antes
    // siempre se resaltaba la celda del jugador, sin importar dónde había
    // aparecido el obstáculo de verdad — por eso se sentía sin sentido).
    this.celdaObstaculoReciente = { ...obstaculo.origen };
    this.celdaObstaculoRecienteDestino = { ...obstaculo.destino };
    this.timers.push(setTimeout(() => {
      this.celdaObstaculoReciente = null;
      this.celdaObstaculoRecienteDestino = null;
      this.cdr.detectChanges();
    }, 800));
  }

  private registrarPasoBackend(direccion: Direccion, pos: Posicion, esCallejon: boolean): void {
    if (this.sesionBackendId == null) return;

    this.laberintoService.registrarPaso(this.sesionBackendId, {
      numeroPaso: this.pasoGlobalCounter,
      direccion,
      posicionX: pos.col,
      posicionY: pos.fila,
      esCallejonSinSalida: esCallejon,
      tiempoDesdeInicioMs: Date.now() - this.tiempoInicioJugando,
      nivel: this.nivelActual,
    }).subscribe({
      next: () => { /* registrado; no bloquea el juego */ },
      error: () => { /* se ignora: el juego sigue funcionando localmente */ },
    });
  }

  private manejarRondaCompletada(): void {
    if (!this.laberinto) return;

    const pasosOptimos = Math.max(1, this.laberinto.caminoOptimo.length - 1);
    this.pasosUsadosTotal += this.pasosRondaActual;
    this.pasosOptimosTotal += pasosOptimos;
    this.nivelMaximoAlcanzado = Math.max(this.nivelMaximoAlcanzado, this.nivelActual);

    // Foto de esta ronda para la pantalla de resultados (antes de que
    // comenzarRonda() genere un laberinto nuevo y sobrescriba this.laberinto).
    this.historialRondas.push({
      numeroRonda: this.rondaActual,
      nivel: this.nivelActual,
      tamano: this.laberinto.tamano,
      celdas: this.laberinto.celdas,
      inicio: this.laberinto.inicio,
      meta: this.laberinto.meta,
      caminoOptimo: this.laberinto.caminoOptimo,
      recorridoJugador: this.recorridoJugador,
      pasosUsados: this.pasosRondaActual,
      pasosOptimos,
    });

    const fueEficiente = this.pasosRondaActual <= pasosOptimos * this.UMBRAL_EFICIENCIA_SUBIDA;

    this.estado = 'feedback';
    this.setMascota('celebrate');
    this.feedback.showCorrect();
    this.cdr.detectChanges();

    this.timers.push(setTimeout(() => {
      if (fueEficiente) {
        this.nivelActual = Math.min(5, this.nivelActual + 1); // CA-06 / CA-02
      }

      if (this.rondaActual >= this.MAX_RONDAS) {
        this.finalizarSesion();
      } else {
        this.rondaActual++;
        this.comenzarRonda();
      }
    }, 1300));
  }

  private finalizarSesion(): void {
    this.estado = 'resultados';
    this.confettiActivo = true;
    this.hablar(this.sinEmojis(this.tituloFinal + '. ' + this.mensajeFinal), 0.9, 1.2);
    this.cdr.detectChanges();

    if (this.sesionBackendId == null) return;

    // CA-03: fire-and-forget metrics finalization
    this.sesionJuegoService.finalizarSesion(
      this.sesionBackendId,
      this.eficienciaTotal,
      this.pasosUsadosTotal,
      this.pasosOptimosTotal
    );

    this.laberintoService.finalizarSesion(this.sesionBackendId, {
      rondasCompletadas: this.rondaActual,
      pasosUsadosTotal: this.pasosUsadosTotal,
      pasosOptimosTotal: this.pasosOptimosTotal,
      tiempoResolucionMsTotal: Date.now() - this.tiempoInicioSesion,
      callejonesSinSalidaVisitadosTotal: this.callejonesSinSalidaTotal,
      planificoEnPrimerMovimiento: this.planificoEnPrimerMovimiento ?? false,
      nivelMaximoAlcanzado: this.nivelMaximoAlcanzado,
    }).subscribe({
      next: () => { /* resumen guardado */ },
      error: () => {
        this.errorBackend = 'La partida terminó, pero no se pudo guardar el resumen.';
        this.cdr.detectChanges();
      }
    });
  }

  terminarSesion(): void {
    this.limpiarTimers();
    this.finalizarSesion();
  }

  volver(): void { this.router.navigate(['/nino/juegos']); }

  // ── Helpers de plantilla ─────────────────────────────────────────────────

  esInicio(celda: Celda): boolean {
    return !!this.laberinto && celda.fila === this.laberinto.inicio.fila && celda.col === this.laberinto.inicio.col;
  }

  esMeta(celda: Celda): boolean {
    return !!this.laberinto && celda.fila === this.laberinto.meta.fila && celda.col === this.laberinto.meta.col;
  }

  esJugadorAqui(celda: Celda): boolean {
    return celda.fila === this.posicionJugador.fila && celda.col === this.posicionJugador.col;
  }

  esObstaculoReciente(celda: Celda): boolean {
    const esOrigen = !!this.celdaObstaculoReciente
      && celda.fila === this.celdaObstaculoReciente.fila && celda.col === this.celdaObstaculoReciente.col;
    const esDestino = !!this.celdaObstaculoRecienteDestino
      && celda.fila === this.celdaObstaculoRecienteDestino.fila && celda.col === this.celdaObstaculoRecienteDestino.col;
    return esOrigen || esDestino;
  }

  // ── Comparación de caminos (pantalla de resultados) ───────────────────────

  private posicionEnLista(lista: Posicion[], fila: number, col: number): boolean {
    return lista.some(p => p.fila === fila && p.col === col);
  }

  /** La celda forma parte del camino más corto posible (BFS) de esa ronda. */
  enCaminoOptimo(historial: RondaHistorial, celda: Celda): boolean {
    return this.posicionEnLista(historial.caminoOptimo, celda.fila, celda.col);
  }

  /** La celda fue realmente visitada por el niño en esa ronda (incluye vueltas atrás y callejones). */
  enRecorridoJugador(historial: RondaHistorial, celda: Celda): boolean {
    return this.posicionEnLista(historial.recorridoJugador, celda.fila, celda.col);
  }

  esInicioHistorial(historial: RondaHistorial, celda: Celda): boolean {
    return celda.fila === historial.inicio.fila && celda.col === historial.inicio.col;
  }

  esMetaHistorial(historial: RondaHistorial, celda: Celda): boolean {
    return celda.fila === historial.meta.fila && celda.col === historial.meta.col;
  }

  private setMascota(mood: Mood): void {
    this.mascotMood = mood;
    const msgs = MASCOTA_MSGS[mood];
    this.mascotMsg = msgs[Math.floor(Math.random() * msgs.length)];
    this.hablar(this.sinEmojis(this.mascotMsg));
  }

  /** Quita emojis antes de mandar el texto al sintetizador de voz (mismo criterio que Espejo Mental). */
  private sinEmojis(texto: string): string {
    return sinEmojisUtil(texto);
  }

  private limpiarTimers(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    if (this.despliegueInterval) {
      clearInterval(this.despliegueInterval);
      this.despliegueInterval = null;
    }
  }
}
