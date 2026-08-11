/**
 * CA-02: regresión lineal simple (mínimos cuadrados) para la línea de
 * tendencia superpuesta sobre la gráfica de tiempo de respuesta.
 *
 * Mismo algoritmo que cr.cenfotec.focuskids_backend.service.IaEvaluacionService
 * (backend), aquí en TypeScript para no depender de una llamada al servidor
 * solo para dibujar la línea de tendencia.
 */
export interface ResultadoRegresion {
  pendiente:  number;
  intercepto: number;
}

/**
 * @param valores serie de valores Y, en orden cronológico (X = índice 1..n)
 */
export function calcularRegresionLineal(valores: number[]): ResultadoRegresion {
  const n = valores.length;
  if (n === 0) return { pendiente: 0, intercepto: 0 };
  if (n === 1) return { pendiente: 0, intercepto: valores[0] };

  const x = valores.map((_, i) => i + 1);
  const y = valores;

  const xMedia = promedio(x);
  const yMedia = promedio(y);

  let numerador = 0;
  let denominador = 0;
  for (let i = 0; i < n; i++) {
    numerador   += (x[i] - xMedia) * (y[i] - yMedia);
    denominador += (x[i] - xMedia) * (x[i] - xMedia);
  }

  const pendiente  = denominador !== 0 ? numerador / denominador : 0;
  const intercepto = yMedia - pendiente * xMedia;

  return { pendiente, intercepto };
}

/** Genera los puntos Y de la recta de tendencia para superponer en el gráfico. */
export function puntosDeTendencia(valores: number[]): number[] {
  const { pendiente, intercepto } = calcularRegresionLineal(valores);
  return valores.map((_, i) => pendiente * (i + 1) + intercepto);
}

function promedio(valores: number[]): number {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}
