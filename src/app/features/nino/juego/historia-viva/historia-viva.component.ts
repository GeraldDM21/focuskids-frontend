import { Component, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="game-wrapper">

  <!-- Flash overlay -->
  @if (showFlash) {
    <div class="flash-overlay" [class.flash-verde]="flashVerde" [class.flash-rojo]="!flashVerde"></div>
  }

  <!-- ══ INICIO ══════════════════════════════════════════════════════════ -->
  @if (estado === 'inicio') {
    <div class="pantalla-inicio">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>

      <div class="inicio-content">
        <div class="hero-mascota">
          <div class="fox-sparkles">
            <span class="sp sp-1">📖</span>
            <span class="sp sp-2">✨</span>
            <span class="sp sp-3">⭐</span>
            <span class="sp sp-4">💫</span>
          </div>
          <div class="fox-ring"><div class="fox-avatar">🦊</div></div>
          <div class="fox-bubble-inicio">
            ¡Hola! Soy <strong>Foxy</strong> 🦊<br>
            ¡Hoy te voy a contar una historia increíble! Lee con atención y responde mis preguntas. 📚
          </div>
        </div>

        <h1 class="titulo-juego">
          <span class="titulo-grad">Historia</span><span class="titulo-blanco"> Viva</span>
        </h1>
        <p class="subtitulo-juego">Lee el cuento, escúchalo con audio y responde preguntas de comprensión</p>

        <div class="instrucciones-grid">
          <div class="instr-card instr-azul">
            <span class="instr-num">1</span>
            <div class="instr-emoji">📖</div>
            <div class="instr-text">Lee el micro-relato con calma</div>
          </div>
          <div class="instr-card instr-verde">
            <span class="instr-num">2</span>
            <div class="instr-emoji">🔊</div>
            <div class="instr-text">Puedes escucharlo con el audio</div>
          </div>
          <div class="instr-card instr-morado">
            <span class="instr-num">3</span>
            <div class="instr-emoji">🤔</div>
            <div class="instr-text">Responde 3 preguntas de comprensión</div>
          </div>
          <div class="instr-card instr-naranja">
            <span class="instr-num">4</span>
            <div class="instr-emoji">💡</div>
            <div class="instr-text">Si fallas, recibirás una pista</div>
          </div>
        </div>

        <div class="nivel-indicador">
          <span class="nivel-dot" [class.activo]="nivelActual >= 1">⭐</span>
          <span class="nivel-dot" [class.activo]="nivelActual >= 2">⭐</span>
          <span class="nivel-dot" [class.activo]="nivelActual >= 3">⭐</span>
          <span class="nivel-txt">Nivel {{ nivelActual }}</span>
        </div>

        <div class="inicio-footer">
          <button class="btn-empezar" (click)="iniciarLectura()">
            <span>📖</span> ¡Empezar a leer!
            <span class="btn-shine"></span>
          </button>
          <button class="btn-voz" (click)="toggleVoz()" [title]="voiceEnabled ? 'Silenciar' : 'Activar voz'">
            {{ voiceEnabled ? '🔊' : '🔇' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ LECTURA ══════════════════════════════════════════════════════════ -->
  @if (estado === 'lectura') {
    <div class="pantalla-lectura">

      <!-- Header lectura -->
      <div class="lectura-header">
        <button class="btn-salir" (click)="volver()">← Salir</button>
        <div class="header-titulo">{{ historiaActual?.titulo }}</div>
        <div class="header-nivel">Nivel {{ nivelActual }}</div>
      </div>

      <!-- Mascota -->
      <div class="mascota-area">
        <div class="fox-game-wrap" [class.fox-celebrate]="mascotMood === 'celebrate'">
          <div class="fox-game-avatar">🦊</div>
        </div>
        <div class="burbuja-dialogo" [class.burbuja-azul]="mascotMood === 'thinking'">
          {{ mascotMsg }}
        </div>
      </div>

      <!-- Historia card -->
      <div class="historia-card">
        <div class="historia-titulo">{{ historiaActual?.titulo }}</div>
        @for (parrafo of parrafos; track $index) {
          <p class="historia-parrafo">{{ parrafo }}</p>
        }
      </div>

      <!-- Audio controls -->
      <div class="audio-row">
        @if (!leyendoAudio) {
          <button class="btn-audio" (click)="leerHistoria()">
            🔊 Escuchar el cuento
            @if (usoAudio > 0) { <span class="audio-badge">×{{ usoAudio }}</span> }
          </button>
        } @else {
          <button class="btn-audio btn-audio-stop" (click)="detenerAudio()">
            ⏹ Detener audio
          </button>
        }
        <button class="btn-voz-sm" (click)="toggleVoz()">{{ voiceEnabled ? '🔊' : '🔇' }}</button>
      </div>

      <button class="btn-listo" (click)="iniciarPreguntas()">
        {{ modoRelectura ? 'Continuar respondiendo →' : 'Listo para responder →' }}
      </button>

    </div>
  }

  <!-- ══ PREGUNTA ══════════════════════════════════════════════════════════ -->
  @if (estado === 'pregunta' && historiaActual) {
    <div class="pantalla-pregunta">

      <!-- Header pregunta -->
      <div class="game-header">
        <button class="btn-salir" (click)="volver()">
          <span>←</span> <span>Salir</span>
        </button>
        <div class="header-centro">
          <div class="progreso-wrap">
            <div class="progreso-barra">
              <div class="progreso-fill" [style.width.%]="(preguntaIdx / historiaActual.preguntas.length) * 100"></div>
            </div>
            <span class="progreso-label">{{ preguntaIdx + 1 }}/{{ historiaActual.preguntas.length }}</span>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-badge badge-oro"><span class="badge-ico">⭐</span><span class="badge-num">{{ preguntasCorrectas }}</span></div>
          <div class="stat-badge badge-rojo"><span class="badge-ico">💡</span><span class="badge-num">{{ intentosTotales }}</span></div>
        </div>
      </div>

      <!-- Mascota -->
      <div class="mascota-area mascota-area-sm">
        <div class="fox-game-wrap"
          [class.fox-celebrate]="mascotMood === 'celebrate'"
          [class.fox-encourage]="mascotMood === 'encourage'">
          <div class="fox-game-avatar">🦊</div>
        </div>
        <div class="burbuja-dialogo"
          [class.burbuja-verde]="mascotMood === 'celebrate'"
          [class.burbuja-naranja]="mascotMood === 'encourage'"
          [class.burbuja-azul]="mascotMood === 'thinking'">
          {{ mascotMsg }}
        </div>
      </div>

      <!-- Pregunta -->
      <div class="pregunta-card">
        <div class="pregunta-tipo">{{ tipoLabel }}</div>
        <div class="pregunta-texto">{{ preguntaActual?.texto }}</div>
      </div>

      <!-- Opciones -->
      <div class="opciones-grid">
        @for (op of preguntaActual?.opciones ?? []; track $index) {
          <button class="opcion"
            [class.opcion-correcta]="respondioCorrectamente && respuestaSeleccionada === $index"
            [class.opcion-errada]="opcionesErradas.includes($index)"
            [class.opcion-disabled]="opcionesErradas.includes($index) || respondioCorrectamente === true"
            (click)="seleccionarOpcion($index)">
            <span class="opcion-letra">{{ LETRAS[$index] }}</span>
            <span class="opcion-txt">{{ op }}</span>
          </button>
        }
      </div>

      <!-- Pista -->
      @if (mostrandoPista) {
        <div class="pista-box">
          <div class="pista-header">💡 Pista de Foxy:</div>
          <div class="pista-texto">{{ preguntaActual?.pista }}</div>
        </div>
      }

      <!-- Releer cuento -->
      <div class="releer-section">
        <button class="btn-releer" (click)="toggleReleer()">
          {{ mostrandoTexto ? '▲ Ocultar cuento' : '📖 Releer el cuento' }}
        </button>
        @if (mostrandoTexto) {
          <div class="releer-texto">
            @for (parrafo of parrafos; track $index) {
              <p class="historia-parrafo mini">{{ parrafo }}</p>
            }
          </div>
        }
      </div>

    </div>
  }

  <!-- ══ RESULTADOS ══════════════════════════════════════════════════════════ -->
  @if (estado === 'resultados') {
    <div class="pantalla-resultados">
      <div class="confetti-container">
        @for (p of confettiPieces; track p.id) {
          <div class="confeti"
            [style.left.%]="p.left" [style.background]="p.color"
            [style.animation-delay.ms]="p.delay" [style.animation-duration.ms]="p.dur"
            [style.width.px]="p.size" [style.height.px]="p.size * 1.6"></div>
        }
      </div>

      <div class="resultados-card">
        <!-- Fox resultado -->
        <div class="fox-resultado-hero">
          <div class="fox-resultado-ring"></div>
          <div class="fox-resultado-face">🦊</div>
          <div class="fox-resultado-trophy">{{ trofeoEmoji }}</div>
        </div>

        <h2 class="resultado-titulo">{{ tituloFinal }}</h2>

        <div class="estrellas">
          <span class="estrella"        [class.estrella-on]="puntuacion >= 40">⭐</span>
          <span class="estrella grande" [class.estrella-on]="puntuacion >= 70">⭐</span>
          <span class="estrella"        [class.estrella-on]="puntuacion >= 90">⭐</span>
        </div>

        <div class="score-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" class="ring-bg"/>
            <circle cx="60" cy="60" r="50" class="ring-fill"
              [style.stroke-dasharray]="314"
              [style.stroke-dashoffset]="314 - (314 * puntuacion / 100)"/>
          </svg>
          <div class="score-texto">
            <div class="score-num">{{ puntuacion }}%</div>
            <div class="score-lbl">comprensión</div>
          </div>
        </div>

        <!-- Métricas (CA-04) -->
        <div class="metricas-row">
          <div class="metrica"><div class="m-icon">✅</div><div class="m-val verde">{{ preguntasCorrectas }}/{{ historiaActual?.preguntas?.length }}</div><div class="m-lbl">Correctas</div></div>
          <div class="metrica"><div class="m-icon">⏱️</div><div class="m-val azul">{{ tiempoLecturaFmt }}</div><div class="m-lbl">Lectura</div></div>
          <div class="metrica"><div class="m-icon">🔊</div><div class="m-val morado">{{ usoAudio }}</div><div class="m-lbl">Audio</div></div>
          <div class="metrica"><div class="m-icon">📖</div><div class="m-val naranja">{{ releidasCount }}</div><div class="m-lbl">Relecturas</div></div>
        </div>

        <!-- Inferencias (CA-06) -->
        @if (tiposInferencia.length > 0) {
          <div class="inferencias-section">
            <div class="inf-titulo">Tipos de inferencia:</div>
            @for (t of tiposInferencia; track t.tipo) {
              <div class="inf-row" [class.inf-ok]="!t.errada" [class.inf-mal]="t.errada">
                <span class="inf-icon">{{ t.errada ? '⚠️' : '✅' }}</span>
                <div class="inf-content">
                  <div class="inf-label">{{ t.label }}</div>
                  @if (t.errada) { <div class="inf-tip">{{ t.tip }}</div> }
                </div>
              </div>
            }
          </div>
        }

        <!-- Foxy mensaje -->
        <div class="foxy-msg-final">
          <div class="foxy-msg-avatar">🦊</div>
          <div class="foxy-msg-bubble">{{ mascotMsg }}</div>
        </div>

        <div class="btns-final">
          <button class="btn-repetir" (click)="jugarDeNuevo()">🔄 Jugar de nuevo</button>
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

    /* ── Flash ── */
    .flash-overlay { position: fixed; inset: 0; z-index: 200; pointer-events: none; animation: flashAnim .4s ease forwards; }
    .flash-verde { background: rgba(34,197,94,.28); }
    .flash-rojo  { background: rgba(239,68,68,.28); }
    @keyframes flashAnim { 0%{opacity:1} 100%{opacity:0} }

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
    .orb-1 { width: 340px; height: 340px; background: rgba(79,70,229,.22); top: -80px; left: -60px; animation: orbFloat 9s ease-in-out infinite; }
    .orb-2 { width: 260px; height: 260px; background: rgba(124,58,237,.18); bottom: -60px; right: -40px; animation: orbFloat 7s ease-in-out infinite 2s; }
    @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }

    .inicio-content {
      position: relative; z-index: 1; text-align: center;
      padding: 24px 24px 40px; max-width: 540px; width: 100%;
      animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }

    .hero-mascota { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; position: relative; }
    .fox-sparkles { position: absolute; width: 200px; height: 200px; top: -20px; left: 50%; transform: translateX(-50%); pointer-events: none; }
    .sp { position: absolute; font-size: 20px; }
    .sp-1 { top: 4%; left: 0%;  animation: sparkleFloat 2.2s ease-in-out infinite; }
    .sp-2 { top: 0%; right: 4%; animation: sparkleFloat 1.8s ease-in-out infinite .5s; }
    .sp-3 { bottom: 4%; left: 4%; animation: sparkleFloat 2.5s ease-in-out infinite 1s; }
    .sp-4 { bottom: 0%; right: 0%; animation: sparkleFloat 2s ease-in-out infinite 1.5s; }
    @keyframes sparkleFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.7} 50%{transform:translateY(-14px) rotate(20deg);opacity:1} }

    .fox-ring {
      width: 140px; height: 140px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle, rgba(79,70,229,.18), transparent);
      border: 2px solid rgba(167,139,250,.35); position: relative;
      box-shadow: 0 0 40px rgba(79,70,229,.3);
      animation: ringPulse 2.8s ease-in-out infinite;
    }
    .fox-ring::before { content:''; position:absolute; inset:-10px; border-radius:50%; border:1.5px solid rgba(167,139,250,.2); animation:ringPulse 2.8s ease-in-out infinite .5s; }
    @keyframes ringPulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
    .fox-avatar { font-size: 88px; line-height: 1; animation: flotar 3s ease-in-out infinite; filter: drop-shadow(0 0 24px rgba(167,139,250,.8)); }

    .fox-bubble-inicio {
      position: relative; margin-top: 14px; max-width: 310px;
      background: white; color: #1e293b; border-radius: 20px; padding: 14px 20px;
      font-size: 14px; font-weight: 600; line-height: 1.6;
      box-shadow: 0 8px 32px rgba(0,0,0,.35);
      animation: popIn .4s .4s both cubic-bezier(.34,1.56,.64,1);
    }
    .fox-bubble-inicio::before { content:''; position:absolute; top:-10px; left:50%; transform:translateX(-50%); border:10px solid transparent; border-bottom-color:white; }

    .titulo-juego { font-size: 42px; font-weight: 900; margin: 18px 0 6px; line-height: 1.1; }
    .titulo-grad { background: linear-gradient(135deg,#60a5fa,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .titulo-blanco { color: white; }
    .subtitulo-juego { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }

    .instrucciones-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; text-align: left; }
    .instr-card { border: 1.5px solid rgba(255,255,255,.1); border-radius: 14px; padding: 14px 12px; position: relative; }
    .instr-num { position:absolute; top:8px; right:10px; font-size:10px; font-weight:800; color:rgba(255,255,255,.25); }
    .instr-emoji { font-size: 26px; margin-bottom: 6px; display: block; }
    .instr-text { font-size: 12px; color: #cbd5e1; line-height: 1.4; }
    .instr-azul    { border-color:rgba(96,165,250,.5);  background:rgba(96,165,250,.08); }
    .instr-verde   { border-color:rgba(74,222,128,.5);  background:rgba(74,222,128,.08); }
    .instr-morado  { border-color:rgba(167,139,250,.5); background:rgba(167,139,250,.08); }
    .instr-naranja { border-color:rgba(251,191,36,.5);  background:rgba(251,191,36,.08); }
    .instr-azul    .instr-emoji { filter: drop-shadow(0 0 8px rgba(96,165,250,.8)); }
    .instr-verde   .instr-emoji { filter: drop-shadow(0 0 8px rgba(74,222,128,.8)); }
    .instr-morado  .instr-emoji { filter: drop-shadow(0 0 8px rgba(167,139,250,.8)); }
    .instr-naranja .instr-emoji { filter: drop-shadow(0 0 8px rgba(251,191,36,.8)); }

    .nivel-indicador { display:flex; align-items:center; gap:6px; justify-content:center; margin-bottom:18px; }
    .nivel-dot { font-size:20px; filter: grayscale(1) opacity(.3); transition: all .3s; }
    .nivel-dot.activo { filter: grayscale(0) opacity(1) drop-shadow(0 0 8px rgba(250,204,21,.7)); }
    .nivel-txt { font-size: 14px; font-weight: 700; color: #94a3b8; margin-left: 4px; }

    .inicio-footer { display:flex; align-items:center; justify-content:center; gap:14px; }
    .btn-empezar {
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white;
      border: none; border-radius: 20px; padding: 16px 44px;
      font-size: 18px; font-weight: 800; cursor: pointer; transition: all .2s;
      box-shadow: 0 8px 32px rgba(79,70,229,.5); position: relative; overflow: hidden;
      animation: pulseBtn 2s infinite;
    }
    .btn-empezar:hover { transform: translateY(-4px) scale(1.05); animation: none; }
    .btn-shine { position:absolute; top:0; left:-80%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent); animation: shine 2.5s ease-in-out infinite 1s; }
    @keyframes shine { 0%{left:-80%} 100%{left:120%} }
    @keyframes pulseBtn { 0%,100%{box-shadow:0 8px 32px rgba(79,70,229,.5),0 0 0 0 rgba(79,70,229,.4)} 50%{box-shadow:0 8px 32px rgba(79,70,229,.5),0 0 0 14px rgba(79,70,229,0)} }
    .btn-voz {
      background:rgba(255,255,255,.1); border:1.5px solid rgba(255,255,255,.2);
      border-radius:50%; width:42px; height:42px; font-size:20px; cursor:pointer;
      transition:all .2s; display:flex; align-items:center; justify-content:center;
    }
    .btn-voz:hover { background:rgba(255,255,255,.2); transform:scale(1.1); }

    /* ══ LECTURA ══ */
    .pantalla-lectura { width: 100%; max-width: 600px; padding: 20px 20px 32px; }

    .lectura-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px; padding: 10px 14px; backdrop-filter: blur(10px);
    }
    .btn-salir {
      display: flex; align-items: center; gap: 5px;
      background: rgba(239,68,68,.12); border: 1.5px solid rgba(239,68,68,.3);
      color: #f87171; border-radius: 12px; padding: 7px 12px;
      font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s; flex-shrink: 0;
    }
    .btn-salir:hover { background: rgba(239,68,68,.28); transform: scale(1.04); }
    .header-titulo { flex: 1; font-size: 15px; font-weight: 700; color: #e2e8f0; }
    .header-nivel { font-size: 12px; font-weight: 700; color: #a78bfa; background: rgba(167,139,250,.15); border: 1px solid rgba(167,139,250,.3); border-radius: 12px; padding: 4px 10px; white-space: nowrap; }

    /* Mascota */
    .mascota-area { display:flex; align-items:flex-start; gap:12px; margin-bottom:14px; min-height:72px; }
    .mascota-area-sm { min-height: 64px; margin-bottom: 10px; }
    .fox-game-wrap { flex-shrink:0; position:relative; width:64px; display:flex; align-items:center; justify-content:center; }
    .fox-game-avatar { font-size:56px; line-height:1; filter:drop-shadow(0 0 10px rgba(167,139,250,.4)); }
    .fox-celebrate .fox-game-avatar { animation: foxCelebrate .6s cubic-bezier(.34,1.56,.64,1); }
    .fox-encourage .fox-game-avatar { animation: mascotShake .4s ease; }
    @keyframes foxCelebrate { 0%{transform:scale(1)} 40%{transform:scale(1.2) rotate(-8deg)} 70%{transform:scale(.95) rotate(5deg)} 100%{transform:scale(1)} }
    @keyframes mascotShake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-10deg)} 75%{transform:rotate(10deg)} }
    .burbuja-dialogo {
      background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18);
      backdrop-filter:blur(8px); border-radius:4px 18px 18px 18px;
      padding:12px 16px; font-size:14px; font-weight:700; color:#e2e8f0;
      line-height:1.45; animation:popIn .3s cubic-bezier(.34,1.56,.64,1); flex:1;
    }
    .burbuja-verde   { background:rgba(34,197,94,.18);  border-color:rgba(34,197,94,.35);  color:#4ade80; }
    .burbuja-naranja { background:rgba(251,146,60,.18); border-color:rgba(251,146,60,.35); color:#fb923c; }
    .burbuja-azul    { background:rgba(96,165,250,.15); border-color:rgba(96,165,250,.3);  color:#93c5fd; }

    /* Historia card */
    .historia-card {
      background: rgba(255,255,255,.94); color: #1e293b;
      border-radius: 20px; padding: 22px 24px; margin-bottom: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,.25);
      animation: slideUp .4s ease;
    }
    .historia-titulo { font-size: 18px; font-weight: 800; color: #312e81; margin-bottom: 14px; }
    .historia-parrafo { font-size: 16px; line-height: 1.85; color: #334155; margin-bottom: 12px; }
    .historia-parrafo:last-child { margin-bottom: 0; }
    .historia-parrafo.mini { font-size: 14px; line-height: 1.7; margin-bottom: 10px; }

    /* Audio */
    .audio-row { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .btn-audio {
      flex: 1; display:flex; align-items:center; justify-content:center; gap:8px;
      background:rgba(96,165,250,.15); border:1.5px solid rgba(96,165,250,.4);
      color:#93c5fd; border-radius:14px; padding:10px 18px; font-size:14px; font-weight:700;
      cursor:pointer; transition:all .2s; position:relative;
    }
    .btn-audio:hover { background:rgba(96,165,250,.28); transform:translateY(-1px); }
    .btn-audio-stop { background:rgba(239,68,68,.15); border-color:rgba(239,68,68,.4); color:#f87171; }
    .audio-badge {
      background: rgba(167,139,250,.4); border-radius: 20px; padding: 2px 7px;
      font-size: 11px; font-weight: 800;
    }
    .btn-voz-sm {
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
      border-radius:10px; padding:8px 10px; font-size:16px; cursor:pointer;
      transition:all .2s; flex-shrink:0;
    }
    .btn-voz-sm:hover { background:rgba(255,255,255,.18); }

    .btn-listo {
      width: 100%; background: linear-gradient(135deg,#4f46e5,#7c3aed);
      color: white; border: none; border-radius: 16px; padding: 14px;
      font-size: 16px; font-weight: 800; cursor: pointer; transition: all .2s;
      box-shadow: 0 4px 20px rgba(79,70,229,.4);
    }
    .btn-listo:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,70,229,.55); }

    /* ══ PREGUNTA ══ */
    .pantalla-pregunta { width: 100%; max-width: 540px; padding: 16px 20px 28px; }

    .game-header {
      display:flex; align-items:center; gap:10px; margin-bottom:16px;
      background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
      border-radius:18px; padding:10px 12px; backdrop-filter:blur(10px);
    }
    .header-centro { flex:1; min-width:0; }
    .progreso-wrap { display:flex; align-items:center; gap:8px; }
    .progreso-barra { flex:1; height:10px; background:rgba(255,255,255,.08); border-radius:100px; overflow:hidden; }
    .progreso-fill { height:100%; background:linear-gradient(90deg,#60a5fa,#a78bfa); border-radius:100px; transition:width .6s ease; box-shadow:0 0 8px rgba(96,165,250,.5); }
    .progreso-label { font-size:12px; font-weight:700; color:#94a3b8; white-space:nowrap; }
    .header-stats { display:flex; align-items:center; gap:7px; flex-shrink:0; }
    .stat-badge { display:flex; align-items:center; gap:5px; padding:6px 11px; border-radius:20px; border:1.5px solid; }
    .badge-oro  { background:rgba(250,204,21,.14); border-color:rgba(250,204,21,.4); box-shadow:0 0 10px rgba(250,204,21,.18); }
    .badge-rojo { background:rgba(239,68,68,.14);  border-color:rgba(239,68,68,.35); box-shadow:0 0 10px rgba(239,68,68,.18); }
    .badge-ico { font-size:17px; }
    .badge-num { font-size:18px; font-weight:900; color:white; min-width:18px; text-align:center; }

    .pregunta-card {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.13);
      border-radius: 18px; padding: 16px 18px; margin-bottom: 14px;
    }
    .pregunta-tipo {
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;
      color: #a78bfa; margin-bottom: 8px;
    }
    .pregunta-texto { font-size: 17px; font-weight: 700; color: #f1f5f9; line-height: 1.5; }

    .opciones-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
    .opcion {
      display: flex; align-items: center; gap: 14px;
      background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.12);
      border-radius: 14px; padding: 14px 16px; cursor: pointer;
      transition: all .2s; text-align: left; color: #e2e8f0;
    }
    .opcion:hover:not(.opcion-disabled) { background:rgba(79,70,229,.2); border-color:rgba(167,139,250,.5); transform:translateX(3px); }
    .opcion-letra {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: rgba(167,139,250,.2); border: 1.5px solid rgba(167,139,250,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 900; color: #c4b5fd;
    }
    .opcion-txt { font-size: 14px; font-weight: 600; line-height: 1.4; }
    .opcion-correcta { background:rgba(34,197,94,.2) !important; border-color:rgba(34,197,94,.6) !important; }
    .opcion-correcta .opcion-letra { background:rgba(34,197,94,.3); border-color:#4ade80; color:#4ade80; }
    .opcion-errada { background:rgba(239,68,68,.15) !important; border-color:rgba(239,68,68,.4) !important; cursor:not-allowed !important; }
    .opcion-errada .opcion-letra { background:rgba(239,68,68,.25); border-color:#f87171; color:#f87171; }
    .opcion-disabled { cursor: not-allowed !important; }

    .pista-box {
      background: rgba(251,191,36,.12); border: 1.5px solid rgba(251,191,36,.35);
      border-radius: 14px; padding: 14px 16px; margin-bottom: 12px;
      animation: slideUp .3s ease;
    }
    .pista-header { font-size: 12px; font-weight: 800; color: #fbbf24; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
    .pista-texto { font-size: 14px; color: #fde68a; line-height: 1.55; }

    .releer-section { border-top: 1px solid rgba(255,255,255,.08); padding-top: 12px; }
    .btn-releer {
      background:none; border:none; color:#94a3b8; font-size:13px; font-weight:600;
      cursor:pointer; transition:color .2s; padding: 4px 0;
    }
    .btn-releer:hover { color: #60a5fa; }
    .releer-texto {
      background:rgba(255,255,255,.92); color:#334155;
      border-radius:14px; padding:16px; margin-top:10px;
      animation:slideUp .3s ease;
    }

    /* ══ RESULTADOS ══ */
    .pantalla-resultados { padding:24px; width:100%; max-width:480px; position:relative; }
    .resultados-card {
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.13);
      border-radius:32px; padding:32px 24px 28px; text-align:center;
      backdrop-filter:blur(16px); animation:slideUp .5s cubic-bezier(.34,1.56,.64,1);
    }
    .fox-resultado-hero { position:relative; display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; width:110px; height:110px; }
    .fox-resultado-ring { position:absolute; inset:-6px; border-radius:50%; background:conic-gradient(#a78bfa,#60a5fa,#4ade80,#fbbf24,#f87171,#a78bfa); animation:spinRing 5s linear infinite; filter:blur(1px); }
    .fox-resultado-face { font-size:80px; line-height:1; position:relative; z-index:1; animation:bounce 2s ease-in-out infinite; filter:drop-shadow(0 0 16px rgba(167,139,250,.7)); background:rgba(15,12,41,.5); border-radius:50%; width:100px; height:100px; display:flex; align-items:center; justify-content:center; }
    .fox-resultado-trophy { position:absolute; top:-10px; right:-10px; z-index:2; font-size:30px; animation:bounce 1.5s ease-in-out infinite .3s; }
    @keyframes spinRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }

    .resultado-titulo { font-size:22px; font-weight:900; color:#f1f5f9; margin-bottom:14px; }
    .estrellas { display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:16px; }
    .estrella { font-size:28px; filter:grayscale(1) opacity(.3); transition:all .4s cubic-bezier(.34,1.56,.64,1); }
    .estrella.grande { font-size:40px; }
    .estrella.estrella-on { filter:grayscale(0) opacity(1) drop-shadow(0 0 10px rgba(250,204,21,.8)); animation:starPop .5s cubic-bezier(.34,1.56,.64,1) both; }
    .estrellas .estrella:nth-child(2).estrella-on { animation-delay:.15s; }
    .estrellas .estrella:nth-child(3).estrella-on { animation-delay:.3s; }

    .score-ring { position:relative; width:120px; height:120px; margin:0 auto 18px; }
    .score-ring svg { width:120px; height:120px; transform:rotate(-90deg); }
    .ring-bg   { fill:none; stroke:rgba(255,255,255,.08); stroke-width:10; }
    .ring-fill { fill:none; stroke:#60a5fa; stroke-width:10; stroke-linecap:round; transition:stroke-dashoffset 1.2s ease; }
    .score-texto { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .score-num { font-size:26px; font-weight:900; background:linear-gradient(135deg,#60a5fa,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .score-lbl { font-size:10px; color:#64748b; }

    .metricas-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
    .metrica { background:rgba(255,255,255,.06); border-radius:12px; padding:10px 4px; }
    .m-icon { font-size:16px; margin-bottom:3px; }
    .m-val { font-size:18px; font-weight:900; line-height:1; margin-bottom:2px; }
    .m-lbl { font-size:9px; color:#64748b; }
    .m-val.verde  { color:#4ade80; } .m-val.azul   { color:#60a5fa; }
    .m-val.morado { color:#c4b5fd; } .m-val.naranja{ color:#fb923c; }

    .inferencias-section { background:rgba(255,255,255,.04); border-radius:14px; padding:14px; margin-bottom:16px; text-align:left; }
    .inf-titulo { font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
    .inf-row { display:flex; align-items:flex-start; gap:8px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05); }
    .inf-row:last-child { border-bottom: none; }
    .inf-icon { font-size:16px; flex-shrink:0; margin-top:1px; }
    .inf-label { font-size:13px; font-weight:700; color:#e2e8f0; }
    .inf-tip { font-size:11px; color:#94a3b8; margin-top:2px; line-height:1.4; }
    .inf-ok .inf-label { color:#4ade80; }
    .inf-mal .inf-label { color:#fbbf24; }

    .foxy-msg-final { display:flex; align-items:flex-start; gap:10px; margin-bottom:18px; text-align:left; }
    .foxy-msg-avatar { font-size:32px; flex-shrink:0; }
    .foxy-msg-bubble { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); border-radius:4px 14px 14px 14px; padding:10px 14px; font-size:13px; color:#94a3b8; line-height:1.6; flex:1; }

    .btns-final { display:flex; gap:10px; }
    .btn-repetir { flex:1; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border:none; border-radius:14px; padding:13px 8px; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-repetir:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(79,70,229,.5); }
    .btn-volver { flex:1; background:rgba(255,255,255,.07); color:#94a3b8; border:1px solid rgba(255,255,255,.13); border-radius:14px; padding:13px 8px; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-volver:hover { background:rgba(255,255,255,.13); color:#f1f5f9; }

    /* ── Keyframes ── */
    @keyframes slideUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn      { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes flotar     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes starPop    { from{transform:scale(0) rotate(-30deg)} to{transform:scale(1) rotate(0)} }
  `]
})
export class HistoriaVivaComponent implements OnDestroy {

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
  mascotMsg  = '¡Hola! Hoy te voy a contar una historia increíble 📖';
  mascotMood: Mood = 'idle';

  // ── Audio ───────────────────────────────────────────────────────────────────
  voiceEnabled = true;
  leyendoAudio = false;

  // ── Flash / confetti ────────────────────────────────────────────────────────
  showFlash  = false;
  flashVerde = true;
  confettiPieces: { id:number; left:number; color:string; delay:number; dur:number; size:number }[] = [];

  private audioCtx: AudioContext | null = null;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

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

    this.respuestaSeleccionada = idx;
    const correcto = idx === (this.preguntaActual?.correcta ?? -1);
    this.respondioCorrectamente = correcto;

    if (correcto) {
      this.preguntasCorrectas++;
      this.setMascota('celebrate', this.pick(['¡CORRECTO! ¡Eres genial! 🎉', '¡Perfecto! ¡Lo sabías! ⭐', '¡Muy bien! ¡Sigue así! 🏆']));
      this.tocarAcierto();
      this.mostrarFlash(true);
      this.cdr.detectChanges();

      const speech = this.hablar('¡Correcto!');
      const pause  = new Promise<void>(r => setTimeout(r, 1200));
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
      this.tocarError();
      this.mostrarFlash(false);
      this.cdr.detectChanges();
      this.hablar('¡Casi! Lee la pista.');
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

  private tocarAcierto(): void { [523, 659, 784].forEach((f,i) => setTimeout(() => this.tocar(f, 0.18, 'sine', 0.35), i * 80)); }
  private tocarError():   void { this.tocar(200, 0.15, 'sawtooth', 0.25); setTimeout(() => this.tocar(160, 0.2, 'sawtooth', 0.2), 120); }
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
  }

  private mostrarFlash(verde: boolean): void {
    this.flashVerde = verde; this.showFlash = true; this.cdr.detectChanges();
    setTimeout(() => { this.showFlash = false; this.cdr.detectChanges(); }, 420);
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
