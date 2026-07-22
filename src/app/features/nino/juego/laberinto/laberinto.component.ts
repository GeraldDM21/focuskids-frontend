import { Component, OnInit, OnDestroy, ViewChild, HostListener, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GameFeedbackComponent } from '../../../../shared/game-feedback/game-feedback.component';
import { VolumeControlComponent } from '../../../../shared/game-feedback/volume-control.component';
import { GameFeedbackService, NivelVolumen } from '../../../../shared/game-feedback/game-feedback.service';
import { ChildProfileService } from '../../../padre/perfiles/child-profile.service';
import { MascotComponent } from '../../../../shared/components/mascot/mascot.component';
import { LaberintoCognitivoService } from '../../../../core/services/laberinto-cognitivo.service';

import { Celda, Direccion, EstadoJuego, Laberinto, Mood, Posicion } from './laberinto.types';
import {
  agregarObstaculoDinamico,
  esCallejonSinSalida,
  generarLaberinto,
  intentarMover,
  tamanoParaNivel,
  tieneObstaculosDinamicos,
} from './laberinto.utils';

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

      <!-- ══ INICIO ══════════════════════════════════════════ -->
      @if (estado === 'inicio') {
        <div class="pantalla-inicio">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>

          <div class="inicio-content">
            <div class="hero-mascota">
              <div class="fox-ring"><div class="fox-avatar">🐱</div></div>
              <div class="fox-bubble-inicio">
                ¡Hola! Soy <strong>Michi</strong> 🐱<br>
                ¡Vamos a planificar el camino antes de movernos! 🧩
              </div>
            </div>

            <h1 class="titulo-juego">
              <span class="titulo-grad">Laberinto</span><span class="titulo-blanco"> Cognitivo</span>
            </h1>
            <p class="subtitulo-juego">Memoriza el camino, planifica tu ruta y llega a la meta</p>

            <div class="instrucciones-grid">
              <div class="instr-card instr-cyan">
                <span class="instr-num">1</span>
                <div class="instr-emoji">👀</div>
                <div class="instr-text">Mira el laberinto completo 3 segundos antes de moverte</div>
              </div>
              <div class="instr-card instr-azul">
                <span class="instr-num">2</span>
                <div class="instr-emoji">⌨️</div>
                <div class="instr-text">Muévete con las flechas o deslizando el dedo</div>
              </div>
              <div class="instr-card instr-verde">
                <span class="instr-num">3</span>
                <div class="instr-emoji">🎯</div>
                <div class="instr-text">Entre menos pasos de más uses, más sube la dificultad</div>
              </div>
              <div class="instr-card instr-amarillo">
                <span class="instr-num">4</span>
                <div class="instr-emoji">🧱</div>
                <div class="instr-text">Desde el nivel 3 aparecen paredes nuevas mientras juegas</div>
              </div>
            </div>

            <div class="inicio-footer">
              <button class="btn-empezar" (click)="iniciarJuego()">
                <span>🧩</span> ¡Empezar!
                <span class="btn-shine"></span>
              </button>
            </div>

            <div class="volumen-footer">
              <app-volume-control [volumen]="volumenActual" (volumenChange)="onVolumenChange($event)"></app-volume-control>
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
          <div class="resultados-card">
            <div class="fox-resultado-hero">
              <div class="fox-resultado-ring"></div>
              <div class="fox-resultado-face">🐱</div>
              <div class="fox-resultado-trophy">{{ trofeoEmoji }}</div>
            </div>

            <h2 class="resultado-titulo">{{ tituloFinal }}</h2>

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
              <div class="foxy-msg-avatar">🐱</div>
              <div class="foxy-msg-bubble">{{ mensajeFinal }}</div>
            </div>

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
    .orb { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
    .orb-1 { width: 340px; height: 340px; background: rgba(6,182,212,.22); top: -80px; left: -60px; animation: orbFloat 9s ease-in-out infinite; }
    .orb-2 { width: 260px; height: 260px; background: rgba(20,184,166,.18); bottom: -60px; right: -40px; animation: orbFloat 7s ease-in-out infinite 2s; }
    @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }

    .inicio-content { position: relative; z-index: 1; text-align: center; padding: 24px 24px 40px; max-width: 540px; width: 100%; animation: slideUp .5s cubic-bezier(.34,1.56,.64,1); }

    .hero-mascota { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
    .fox-ring {
      width: 140px; height: 140px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle, rgba(6,182,212,.2), rgba(6,182,212,.05));
      border: 2px solid rgba(6,182,212,.4);
      box-shadow: 0 0 40px rgba(6,182,212,.3);
      animation: ringPulse 2.8s ease-in-out infinite;
    }
    @keyframes ringPulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
    .fox-avatar { font-size: 84px; line-height: 1; animation: flotar 3s ease-in-out infinite; filter: drop-shadow(0 0 24px rgba(6,182,212,.8)); }

    .fox-bubble-inicio {
      position: relative; margin-top: 14px; max-width: 320px;
      background: white; color: #0f172a; border-radius: 20px; padding: 14px 20px;
      font-size: 14px; font-weight: 600; line-height: 1.6;
      box-shadow: 0 8px 32px rgba(0,0,0,.35);
      animation: popIn .4s .4s both cubic-bezier(.34,1.56,.64,1);
    }
    .fox-bubble-inicio::before { content:''; position:absolute; top:-10px; left:50%; transform:translateX(-50%); border:10px solid transparent; border-bottom-color:white; }

    .titulo-juego { font-size: 40px; font-weight: 900; margin: 18px 0 6px; line-height: 1.1; }
    .titulo-grad { background: linear-gradient(135deg,#22d3ee,#0891b2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .titulo-blanco { color: white; }
    .subtitulo-juego { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }

    .instrucciones-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; text-align: left; }
    .instr-card { border: 1.5px solid rgba(255,255,255,.1); border-radius: 14px; padding: 14px 12px; position: relative; }
    .instr-num { position:absolute; top:8px; right:10px; font-size:10px; font-weight:800; color:rgba(255,255,255,.25); }
    .instr-emoji { font-size: 26px; margin-bottom: 6px; display: block; }
    .instr-text { font-size: 12px; color: #cbd5e1; line-height: 1.4; }
    .instr-cyan     { border-color:rgba(34,211,238,.5); background:rgba(34,211,238,.08); }
    .instr-azul     { border-color:rgba(96,165,250,.5); background:rgba(96,165,250,.08); }
    .instr-verde    { border-color:rgba(74,222,128,.5); background:rgba(74,222,128,.08); }
    .instr-amarillo { border-color:rgba(251,191,36,.5); background:rgba(251,191,36,.08); }

    .inicio-footer { display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom: 8px; }
    .btn-empezar {
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg,#0891b2,#0e7490); color: white;
      border: none; border-radius: 20px; padding: 16px 44px;
      font-size: 18px; font-weight: 800; cursor: pointer; transition: all .2s;
      box-shadow: 0 8px 32px rgba(8,145,178,.5); position: relative; overflow: hidden;
      animation: pulseBtn 2s infinite;
    }
    .btn-empezar:hover { transform: translateY(-4px) scale(1.05); animation: none; }
    .btn-shine { position:absolute; top:0; left:-80%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent); animation: shine 2.5s ease-in-out infinite 1s; }
    @keyframes shine { 0%{left:-80%} 100%{left:120%} }
    @keyframes pulseBtn { 0%,100%{box-shadow:0 8px 32px rgba(8,145,178,.5),0 0 0 0 rgba(8,145,178,.4)} 50%{box-shadow:0 8px 32px rgba(8,145,178,.5),0 0 0 14px rgba(8,145,178,0)} }

    .volumen-footer { display: flex; justify-content: center; }

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
    .fox-resultado-ring { position:absolute; inset:-6px; border-radius:50%; background:conic-gradient(#22d3ee,#0891b2,#4ade80,#fbbf24,#22d3ee); animation:spinRing 5s linear infinite; filter:blur(1px); }
    .fox-resultado-face { font-size:80px; line-height:1; position:relative; z-index:1; animation:bounce 2s ease-in-out infinite; filter:drop-shadow(0 0 16px rgba(34,211,238,.7)); background:rgba(11,32,39,.5); border-radius:50%; width:100px; height:100px; display:flex; align-items:center; justify-content:center; }
    .fox-resultado-trophy { position:absolute; top:-10px; right:-10px; z-index:2; font-size:30px; animation:bounce 1.5s ease-in-out infinite .3s; }
    @keyframes spinRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }

    .resultado-titulo { font-size:22px; font-weight:900; color:#f1f5f9; margin-bottom:16px; }

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
    .foxy-msg-avatar { font-size:32px; flex-shrink:0; }
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
  `]
})
export class LaberintoComponent implements OnInit, OnDestroy {

  readonly MAX_RONDAS = 6;
  private readonly UMBRAL_EFICIENCIA_SUBIDA = 1.30; // CA-06
  private readonly MOVS_ENTRE_OBSTACULOS = 3; // CA-04: cada cuántos pasos puede aparecer una pared nueva

  estado: EstadoJuego = 'inicio';
  laberinto: Laberinto | null = null;
  posicionJugador: Posicion = { fila: 0, col: 0 };

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

  mascotMsg = '¡Listo para planificar! 🧩';
  mascotMood: Mood = 'idle';

  volumenActual: NivelVolumen = 75;
  errorBackend: string | null = null;

  private celdaObstaculoReciente: Posicion | null = null;
  private tiempoInicioJugando = 0;
  private tiempoInicioSesion = 0;
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
  ) {}

  ngOnInit(): void {
    this.childProfileService.activeProfile$.subscribe(state => {
      this.profileId = state.profileId;
      this.volumenActual = (state.profileVolumen ?? 75) as NivelVolumen;
      this.feedbackService.setVolumen(this.volumenActual);
    });
  }

  ngOnDestroy(): void {
    this.limpiarTimers();
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
    this.nivelActual = 1;
    this.nivelMaximoAlcanzado = 1;
    this.pasosUsadosTotal = 0;
    this.pasosOptimosTotal = 0;
    this.callejonesSinSalidaTotal = 0;
    this.planificoEnPrimerMovimiento = null;
    this.pasoGlobalCounter = 0;
    this.errorBackend = null;
    this.tiempoInicioSesion = Date.now();

    if (this.profileId == null) {
      this.sesionBackendId = null;
      this.comenzarRonda();
      return;
    }

    this.laberintoService.iniciarSesion(this.profileId).subscribe({
      next: respuesta => {
        this.sesionBackendId = respuesta.sesionId;
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
    this.laberinto = generarLaberinto(this.tamanoActual);
    this.posicionJugador = { ...this.laberinto.inicio };
    this.pasosRondaActual = 0;
    this.callejonesRondaActual = 0;
    this.celdaObstaculoReciente = null;

    this.setMascota('idle');
    this.iniciarDespliegue();
  }

  private iniciarDespliegue(): void {
    this.estado = 'despliegue';
    this.despliegueSegundosRestantes = 3; // CA-01: 3 segundos completos antes de poder moverse
    this.cdr.detectChanges();

    this.despliegueInterval = setInterval(() => {
      this.despliegueSegundosRestantes--;
      this.cdr.detectChanges();

      if (this.despliegueSegundosRestantes <= 0) {
        if (this.despliegueInterval) clearInterval(this.despliegueInterval);
        this.despliegueInterval = null;
        this.estado = 'jugando';
        this.tiempoInicioJugando = Date.now();
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
    this.pasosRondaActual++;
    this.pasoGlobalCounter++;

    const esCallejon = esCallejonSinSalida(this.laberinto.celdas, nuevaPos, this.laberinto.inicio, this.laberinto.meta);
    if (esCallejon) {
      this.callejonesRondaActual++;
      this.callejonesSinSalidaTotal++;
      this.setMascota('encourage');
    }

    this.registrarPasoBackend(direccion, nuevaPos, esCallejon);

    // CA-04: cada cierto número de pasos puede aparecer una pared nueva (nunca sobre el camino disponible)
    if (this.obstaculosActivos && this.pasosRondaActual % this.MOVS_ENTRE_OBSTACULOS === 0) {
      const agregado = agregarObstaculoDinamico(this.laberinto.celdas, this.posicionJugador, this.laberinto.meta);
      if (agregado) this.mostrarObstaculoReciente();
    }

    const llegoALaMeta = nuevaPos.fila === this.laberinto.meta.fila && nuevaPos.col === this.laberinto.meta.col;
    if (llegoALaMeta) {
      this.manejarRondaCompletada();
    } else {
      this.cdr.detectChanges();
    }
  }

  private mostrarObstaculoReciente(): void {
    // Solo un efecto visual breve; no se identifica la celda exacta para no dar pistas de más.
    this.celdaObstaculoReciente = { ...this.posicionJugador };
    this.timers.push(setTimeout(() => {
      this.celdaObstaculoReciente = null;
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
    this.cdr.detectChanges();

    if (this.sesionBackendId == null) return;

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
    return !!this.celdaObstaculoReciente && celda.fila === this.celdaObstaculoReciente.fila && celda.col === this.celdaObstaculoReciente.col;
  }

  private setMascota(mood: Mood): void {
    this.mascotMood = mood;
    const msgs = MASCOTA_MSGS[mood];
    this.mascotMsg = msgs[Math.floor(Math.random() * msgs.length)];
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
