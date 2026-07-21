import {
  NumeroCayendo,
  OperacionMatematica,
  OperadorMatematico
} from './cascada-numerica.types';

export function numeroAleatorio(
  minimo: number,
  maximo: number
): number {
  return Math.floor(
    Math.random() *
    (maximo - minimo + 1)
  ) + minimo;
}

export function mezclar<T>(
  elementos: T[]
): T[] {
  const copia = [...elementos];

  for (
    let indice = copia.length - 1;
    indice > 0;
    indice--
  ) {
    const indiceAleatorio =
      numeroAleatorio(0, indice);

    [
      copia[indice],
      copia[indiceAleatorio]
    ] = [
      copia[indiceAleatorio],
      copia[indice]
    ];
  }

  return copia;
}

export function seleccionarOperador(
  nivel: number
): OperadorMatematico {
  if (nivel === 1) {
    return Math.random() < 0.5
      ? '+'
      : '-';
  }

  const operadores:
    OperadorMatematico[] = [
    '+',
    '-',
    '×'
  ];

  return operadores[
    numeroAleatorio(
      0,
      operadores.length - 1
    )
    ];
}

export function obtenerMaximoSumaResta(
  nivel: number
): number {
  switch (nivel) {
    case 1:
      return 10;

    case 2:
      return 20;

    case 3:
      return 35;

    case 4:
      return 50;

    default:
      return 70;
  }
}

export function obtenerMaximoMultiplicacion(
  nivel: number
): number {
  switch (nivel) {
    case 1:
      return 3;

    case 2:
      return 5;

    case 3:
      return 7;

    case 4:
      return 10;

    default:
      return 12;
  }
}

export function generarOperacion(
  nivel: number
): OperacionMatematica {
  const operador =
    seleccionarOperador(nivel);

  let numero1 = 0;
  let numero2 = 0;
  let resultado = 0;

  if (operador === '+') {
    const maximo =
      obtenerMaximoSumaResta(nivel);

    numero1 = numeroAleatorio(
      1,
      maximo
    );

    numero2 = numeroAleatorio(
      1,
      maximo
    );

    resultado = numero1 + numero2;
  }

  if (operador === '-') {
    const maximo =
      obtenerMaximoSumaResta(nivel);

    numero1 = numeroAleatorio(
      2,
      maximo
    );

    /*
     * numero2 nunca será mayor que numero1,
     * evitando resultados negativos.
     */
    numero2 = numeroAleatorio(
      1,
      numero1
    );

    resultado = numero1 - numero2;
  }

  if (operador === '×') {
    const maximo =
      obtenerMaximoMultiplicacion(nivel);

    numero1 = numeroAleatorio(
      2,
      maximo
    );

    numero2 = numeroAleatorio(
      2,
      maximo
    );

    resultado = numero1 * numero2;
  }

  return {
    numero1,
    numero2,
    operador,
    resultado,
    texto:
      `${numero1} ${operador} ${numero2}`
  };
}

export function generarDistractores(
  operacion: OperacionMatematica
): number[] {
  const distractores =
    new Set<number>();

  const candidatos = [
    operacion.resultado - 1,
    operacion.resultado + 1,
    operacion.resultado - 2,
    operacion.resultado + 2,
    operacion.resultado - 5,
    operacion.resultado + 5
  ];

  if (operacion.operador === '×') {
    candidatos.unshift(
      operacion.numero1 *
      Math.max(
        1,
        operacion.numero2 - 1
      )
    );

    candidatos.unshift(
      operacion.numero1 *
      (operacion.numero2 + 1)
    );
  }

  for (const candidato of candidatos) {
    if (
      candidato >= 0 &&
      candidato !== operacion.resultado
    ) {
      distractores.add(candidato);
    }

    if (distractores.size === 2) {
      break;
    }
  }

  while (distractores.size < 2) {
    const variacion =
      numeroAleatorio(-5, 5);

    const candidato =
      operacion.resultado + variacion;

    if (
      candidato >= 0 &&
      candidato !== operacion.resultado
    ) {
      distractores.add(candidato);
    }
  }

  return Array
    .from(distractores)
    .slice(0, 2);
}

export function generarNumerosCayendo(
  operacion: OperacionMatematica,
  velocidadCaidaMs: number
): NumeroCayendo[] {
  const distractores =
    generarDistractores(operacion);

  const numeros: NumeroCayendo[] = [
    {
      id: 1,
      valor: operacion.resultado,
      correcto: true,
      posicionX: 20,
      duracionMs: velocidadCaidaMs,
      seleccionado: false
    },
    {
      id: 2,
      valor: distractores[0],
      correcto: false,
      posicionX: 50,
      duracionMs: velocidadCaidaMs,
      seleccionado: false
    },
    {
      id: 3,
      valor: distractores[1],
      correcto: false,
      posicionX: 80,
      duracionMs: velocidadCaidaMs,
      seleccionado: false
    }
  ];

  const mezclados = mezclar(numeros);
  const posiciones = [20, 50, 80];

  return mezclados.map(
    (numero, indice) => ({
      ...numero,
      posicionX: posiciones[indice]
    })
  );
}
