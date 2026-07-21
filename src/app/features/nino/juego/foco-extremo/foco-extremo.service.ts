import { Injectable } from '@angular/core';
import { FocoExtremoConfig, Nivel } from './foco-extremo.model';

const SIMBOLOS: string[] = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐸', '🐷', '🐨', '🐵', '🦁'];

const CONFIG_NIVELES: Record<string, [number, number, number]> = {
  FACIL: [1000, 90, 4],
  MEDIO: [850, 90, 5],
  DIFICIL: [700, 80, 6],
  EXPERTO: [550, 70, 8],
};

const RATIO_DISTRACTOR = 0.7;

const ORDEN_NIVELES = ['FACIL', 'MEDIO', 'DIFICIL', 'EXPERTO'];

@Injectable({ providedIn: 'root' })
export class FocoExtremoService {
  getConfigLocal(nivel: string): FocoExtremoConfig {
    const [cadenciaMs, duracionSegundos, cantidadSimbolos] =
      CONFIG_NIVELES[nivel] ?? CONFIG_NIVELES['FACIL'];

    const simbolosNivel = [...SIMBOLOS].sort(() => Math.random() - 0.5).slice(0, cantidadSimbolos);
    const estimuloObjetivo = simbolosNivel[0];
    const poolDistractores = simbolosNivel.slice(1);

    return {
      nivel,
      cadenciaMs,
      duracionSegundos,
      ratioDistractor: RATIO_DISTRACTOR,
      estimuloObjetivo,
      poolDistractores,
    };
  }

  siguienteNivel(nivel: string): Nivel | null {
    const idx = ORDEN_NIVELES.indexOf(nivel);
    return idx >= 0 && idx < ORDEN_NIVELES.length - 1 ? (ORDEN_NIVELES[idx + 1] as Nivel) : null;
  }
}

