import { EstimuloColor, EstimuloConteo, OpcionColor } from './maraton-mental.model';

// Paleta fija de colores para la Tarea B (Identificar Color). Hay 7 definidos
// para poder ofrecer hasta 6 opciones (EXPERTO) más el objetivo sin repetir.
export const PALETA_COLORES: OpcionColor[] = [
  { id: 'rojo', nombre: 'Rojo', hex: '#ef4444' },
  { id: 'azul', nombre: 'Azul', hex: '#3b82f6' },
  { id: 'verde', nombre: 'Verde', hex: '#22c55e' },
  { id: 'amarillo', nombre: 'Amarillo', hex: '#eab308' },
  { id: 'morado', nombre: 'Morado', hex: '#a855f7' },
  { id: 'naranja', nombre: 'Naranja', hex: '#f97316' },
  { id: 'rosado', nombre: 'Rosado', hex: '#ec4899' },
];

// Emojis para la Tarea A (Contar Objetos). Se elige uno al azar por ronda.
const EMOJIS_CONTEO = ['⭐', '🍎', '🐟', '🎈', '🔵', '🍀'];

export function numeroAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function mezclar<T>(elementos: T[]): T[] {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = numeroAleatorio(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ── Tarea A: Contar Objetos ────────────────────────────────────────────────
export function generarEstimuloConteo(
  objetosMin: number,
  objetosMax: number,
  opciones: number
): EstimuloConteo {
  const cantidad = numeroAleatorio(objetosMin, objetosMax);
  const emoji = EMOJIS_CONTEO[numeroAleatorio(0, EMOJIS_CONTEO.length - 1)];

  const candidatos = new Set<number>([cantidad]);
  // Distractores cercanos al valor real, siempre >= 1 y distintos entre sí.
  let intento = 1;
  while (candidatos.size < opciones && intento < 30) {
    const variacion = numeroAleatorio(-3, 3) || 1;
    const candidato = cantidad + variacion;
    if (candidato >= 1) candidatos.add(candidato);
    intento++;
  }

  return {
    emoji,
    cantidad,
    opciones: mezclar(Array.from(candidatos)).slice(0, opciones),
  };
}

// ── Tarea B: Identificar Color ─────────────────────────────────────────────
export function generarEstimuloColor(opciones: number): EstimuloColor {
  const barajados = mezclar(PALETA_COLORES);
  const objetivo = barajados[0];
  const restantes = barajados.slice(1, Math.max(0, opciones - 1));

  return {
    objetivo,
    opciones: mezclar([objetivo, ...restantes]),
  };
}

// Reduce en un tramo la dificultad de la Tarea A (CA-05), sin bajar de un mínimo jugable.
export function reducirConfigConteo(objetosMin: number, objetosMax: number, opciones: number) {
  return {
    objetosMin: Math.max(1, objetosMin - 1),
    objetosMax: Math.max(objetosMin + 1, objetosMax - 2),
    opciones: Math.max(3, opciones - 1),
  };
}

// Reduce en un tramo la dificultad de la Tarea B (CA-05).
export function reducirConfigColor(opciones: number) {
  return Math.max(3, opciones - 1);
}
