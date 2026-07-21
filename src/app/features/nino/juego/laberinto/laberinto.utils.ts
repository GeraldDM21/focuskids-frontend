import { Celda, Direccion, Laberinto, Posicion } from './laberinto.types';

// RF-29: generación y análisis del laberinto. Todo esto corre en el navegador
// (igual que Cascada Numérica genera sus propias operaciones matemáticas);
// el backend solo registra los pasos y guarda el resumen final.

const DELTAS: Record<Direccion, { df: number; dc: number }> = {
  ARRIBA: { df: -1, dc: 0 },
  ABAJO: { df: 1, dc: 0 },
  IZQUIERDA: { df: 0, dc: -1 },
  DERECHA: { df: 0, dc: 1 },
};

const OPUESTA: Record<Direccion, Direccion> = {
  ARRIBA: 'ABAJO',
  ABAJO: 'ARRIBA',
  IZQUIERDA: 'DERECHA',
  DERECHA: 'IZQUIERDA',
};

function paredEnDireccion(celda: Celda, direccion: Direccion): boolean {
  switch (direccion) {
    case 'ARRIBA': return celda.paredes.arriba;
    case 'ABAJO': return celda.paredes.abajo;
    case 'IZQUIERDA': return celda.paredes.izquierda;
    case 'DERECHA': return celda.paredes.derecha;
  }
}

function setPared(celda: Celda, direccion: Direccion, valor: boolean): void {
  switch (direccion) {
    case 'ARRIBA': celda.paredes.arriba = valor; break;
    case 'ABAJO': celda.paredes.abajo = valor; break;
    case 'IZQUIERDA': celda.paredes.izquierda = valor; break;
    case 'DERECHA': celda.paredes.derecha = valor; break;
  }
}

function dentroDeRango(fila: number, col: number, tamano: number): boolean {
  return fila >= 0 && fila < tamano && col >= 0 && col < tamano;
}

/** Crea una cuadrícula tamano×tamano con todas las paredes cerradas. */
function crearCuadricula(tamano: number): Celda[][] {
  const celdas: Celda[][] = [];
  for (let fila = 0; fila < tamano; fila++) {
    const filaCeldas: Celda[] = [];
    for (let col = 0; col < tamano; col++) {
      filaCeldas.push({
        fila, col,
        paredes: { arriba: true, abajo: true, izquierda: true, derecha: true },
      });
    }
    celdas.push(filaCeldas);
  }
  return celdas;
}

/**
 * Genera un laberinto "perfecto" (un único camino posible entre dos celdas
 * cualesquiera, sin ciclos) usando el algoritmo recursivo de backtracking,
 * implementado de forma iterativa con una pila para evitar problemas de
 * recursión en tamaños grandes.
 */
export function generarLaberinto(tamano: number): Laberinto {
  const celdas = crearCuadricula(tamano);
  const visitada: boolean[][] = Array.from({ length: tamano }, () => Array(tamano).fill(false));

  const inicio: Posicion = { fila: 0, col: 0 };
  const meta: Posicion = { fila: tamano - 1, col: tamano - 1 };

  const pila: Posicion[] = [inicio];
  visitada[inicio.fila][inicio.col] = true;

  const direcciones: Direccion[] = ['ARRIBA', 'ABAJO', 'IZQUIERDA', 'DERECHA'];

  while (pila.length > 0) {
    const actual = pila[pila.length - 1];

    const vecinosSinVisitar = direcciones
      .map(direccion => {
        const { df, dc } = DELTAS[direccion];
        const fila = actual.fila + df;
        const col = actual.col + dc;
        return { direccion, fila, col };
      })
      .filter(v => dentroDeRango(v.fila, v.col, tamano) && !visitada[v.fila][v.col]);

    if (vecinosSinVisitar.length === 0) {
      pila.pop();
      continue;
    }

    const elegido = vecinosSinVisitar[Math.floor(Math.random() * vecinosSinVisitar.length)];

    // Derriba la pared entre "actual" y el vecino elegido (perfora el pasaje)
    setPared(celdas[actual.fila][actual.col], elegido.direccion, false);
    setPared(celdas[elegido.fila][elegido.col], OPUESTA[elegido.direccion], false);

    visitada[elegido.fila][elegido.col] = true;
    pila.push({ fila: elegido.fila, col: elegido.col });
  }

  const caminoOptimo = calcularCaminoOptimo(celdas, inicio, meta);

  return { tamano, celdas, inicio, meta, caminoOptimo };
}

/** Vecinos alcanzables desde una celda (solo a través de pasajes ya abiertos). */
function vecinosAlcanzables(celdas: Celda[][], pos: Posicion): Posicion[] {
  const tamano = celdas.length;
  const celda = celdas[pos.fila][pos.col];
  const resultado: Posicion[] = [];

  (['ARRIBA', 'ABAJO', 'IZQUIERDA', 'DERECHA'] as Direccion[]).forEach(direccion => {
    if (paredEnDireccion(celda, direccion)) return;
    const { df, dc } = DELTAS[direccion];
    const fila = pos.fila + df;
    const col = pos.col + dc;
    if (dentroDeRango(fila, col, tamano)) resultado.push({ fila, col });
  });

  return resultado;
}

/** BFS: camino más corto (en número de pasos) entre dos celdas. Vacío si no hay camino. */
export function calcularCaminoOptimo(celdas: Celda[][], inicio: Posicion, meta: Posicion): Posicion[] {
  const tamano = celdas.length;
  const visitado: boolean[][] = Array.from({ length: tamano }, () => Array(tamano).fill(false));
  const previo: (Posicion | null)[][] = Array.from({ length: tamano }, () => Array(tamano).fill(null));

  const cola: Posicion[] = [inicio];
  visitado[inicio.fila][inicio.col] = true;

  while (cola.length > 0) {
    const actual = cola.shift()!;
    if (actual.fila === meta.fila && actual.col === meta.col) break;

    for (const vecino of vecinosAlcanzables(celdas, actual)) {
      if (!visitado[vecino.fila][vecino.col]) {
        visitado[vecino.fila][vecino.col] = true;
        previo[vecino.fila][vecino.col] = actual;
        cola.push(vecino);
      }
    }
  }

  if (!visitado[meta.fila][meta.col]) return []; // sin solución (no debería pasar nunca)

  const camino: Posicion[] = [];
  let actual: Posicion | null = meta;
  while (actual) {
    camino.unshift(actual);
    actual = previo[actual.fila][actual.col];
  }
  return camino;
}

/** Una celda es un callejón sin salida si solo tiene una abertura y no es inicio ni meta. */
export function esCallejonSinSalida(celdas: Celda[][], pos: Posicion, inicio: Posicion, meta: Posicion): boolean {
  if ((pos.fila === inicio.fila && pos.col === inicio.col) || (pos.fila === meta.fila && pos.col === meta.col)) {
    return false;
  }
  const celda = celdas[pos.fila][pos.col];
  let aberturas = 0;
  if (!celda.paredes.arriba) aberturas++;
  if (!celda.paredes.abajo) aberturas++;
  if (!celda.paredes.izquierda) aberturas++;
  if (!celda.paredes.derecha) aberturas++;
  return aberturas <= 1;
}

/** ¿Se puede mover desde `pos` en `direccion`? Devuelve la nueva posición o null si hay pared. */
export function intentarMover(celdas: Celda[][], pos: Posicion, direccion: Direccion): Posicion | null {
  const celda = celdas[pos.fila][pos.col];
  if (paredEnDireccion(celda, direccion)) return null;

  const { df, dc } = DELTAS[direccion];
  const fila = pos.fila + df;
  const col = pos.col + dc;
  if (!dentroDeRango(fila, col, celdas.length)) return null;

  return { fila, col };
}

/**
 * CA-04: intenta cerrar un pasaje abierto elegido al azar, para simular una
 * "pared dinámica" que aparece durante la partida. Nunca cierra un pasaje que
 * forme parte del único camino óptimo restante desde la posición actual del
 * niño hasta la meta, ni uno junto a inicio/meta/posición actual — así el
 * laberinto queda garantizado como resoluble siempre. Devuelve true si logró
 * agregar un obstáculo.
 */
export function agregarObstaculoDinamico(
  celdas: Celda[][],
  posicionActual: Posicion,
  meta: Posicion,
  maxIntentos = 25
): boolean {
  const tamano = celdas.length;
  const direcciones: Direccion[] = ['ARRIBA', 'ABAJO', 'IZQUIERDA', 'DERECHA'];

  const esProtegida = (p: Posicion): boolean =>
    (p.fila === posicionActual.fila && p.col === posicionActual.col) ||
    (p.fila === meta.fila && p.col === meta.col);

  for (let intento = 0; intento < maxIntentos; intento++) {
    const fila = Math.floor(Math.random() * tamano);
    const col = Math.floor(Math.random() * tamano);
    const origen: Posicion = { fila, col };
    if (esProtegida(origen)) continue;

    const celda = celdas[fila][col];
    const abiertas = direcciones.filter(d => !paredEnDireccion(celda, d));
    if (abiertas.length === 0) continue;

    const direccion = abiertas[Math.floor(Math.random() * abiertas.length)];
    const { df, dc } = DELTAS[direccion];
    const destino: Posicion = { fila: fila + df, col: col + dc };
    if (!dentroDeRango(destino.fila, destino.col, tamano) || esProtegida(destino)) continue;

    // Cierra el pasaje temporalmente
    setPared(celda, direccion, true);
    setPared(celdas[destino.fila][destino.col], OPUESTA[direccion], true);

    const sigueResoluble = calcularCaminoOptimo(celdas, posicionActual, meta).length > 0;

    if (sigueResoluble) return true;

    // No era seguro: revertir y probar otra pared
    setPared(celda, direccion, false);
    setPared(celdas[destino.fila][destino.col], OPUESTA[direccion], false);
  }

  return false;
}

/** Tamaño del mapa según el nivel (1..5). CA-02: nivel 1 = 5×5. */
export function tamanoParaNivel(nivel: number): number {
  return 4 + Math.max(1, Math.min(5, nivel));
}

/** CA-04: los obstáculos dinámicos empiezan a partir del nivel 3. */
export function tieneObstaculosDinamicos(nivel: number): boolean {
  return nivel >= 3;
}
