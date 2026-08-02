// ── Tipos ──────────────────────────────────────────────────

export type Dificultad = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type Continente = 'América' | 'Europa' | 'Asia' | 'África' | 'Oceanía';
export type TipoPregunta = 'UBICACION' | 'CAPITAL';

export interface Pais {
  id: string;
  nombre: string;
  capital: string;
  continente: Continente;
  dificultad: Dificultad;
  x: number; // posición horizontal en el mapa, en % (0-100)
  y: number; // posición vertical en el mapa, en % (0-100)
  datoCurioso: string;
}

export interface Pregunta {
  pais: Pais;
  tipo: TipoPregunta;
  opciones?: string[]; // solo cuando tipo === 'CAPITAL' (4 capitales, una correcta)
}

// ── Banco de países (CA-01, CA-02) ────────────────────────
// x/y ya convertidos desde latitud/longitud real a porcentaje
// sobre el mapa (proyección simple), para ubicar los pines.

export const PAISES: Pais[] = [
  { id: 'brasil', nombre: 'Brasil', capital: 'Brasília', continente: 'América', dificultad: 'FACIL', x: 36.7, y: 58.8,
    datoCurioso: 'El río Amazonas, que pasa por Brasil, transporta más agua que los siguientes 7 ríos más grandes del mundo juntos.' },
  { id: 'espana', nombre: 'España', capital: 'Madrid', continente: 'Europa', dificultad: 'FACIL', x: 49.0, y: 27.6,
    datoCurioso: 'España tiene la tercera mayor cantidad de sitios declarados Patrimonio de la Humanidad por la UNESCO.' },
  { id: 'francia', nombre: 'Francia', capital: 'París', continente: 'Europa', dificultad: 'FACIL', x: 50.6, y: 22.8,
    datoCurioso: 'Francia es el país más visitado del mundo por turistas cada año.' },
  { id: 'japon', nombre: 'Japón', capital: 'Tokio', continente: 'Asia', dificultad: 'FACIL', x: 88.8, y: 30.2,
    datoCurioso: 'En Japón hay más de 5 millones de máquinas expendedoras, una de las mayores cantidades del mundo.' },
  { id: 'mexico', nombre: 'México', capital: 'Ciudad de México', continente: 'América', dificultad: 'FACIL', x: 22.5, y: 39.2,
    datoCurioso: 'México le regaló al mundo el chocolate: los aztecas ya lo preparaban hace más de mil años.' },
  { id: 'eeuu', nombre: 'Estados Unidos', capital: 'Washington D. C.', continente: 'América', dificultad: 'FACIL', x: 28.6, y: 28.4,
    datoCurioso: 'El Gran Cañón en Estados Unidos es tan grande que se podrían meter varias ciudades enteras dentro.' },
  { id: 'italia', nombre: 'Italia', capital: 'Roma', continente: 'Europa', dificultad: 'FACIL', x: 53.5, y: 26.7,
    datoCurioso: 'En Italia se inventó la pizza, ¡y en Nápoles todavía discuten cuál es la receta original!' },
  { id: 'china', nombre: 'China', capital: 'Pekín', continente: 'Asia', dificultad: 'FACIL', x: 82.3, y: 27.8,
    datoCurioso: 'La Gran Muralla China mide más de 21.000 kilómetros de largo.' },

  { id: 'egipto', nombre: 'Egipto', capital: 'El Cairo', continente: 'África', dificultad: 'MEDIO', x: 58.7, y: 33.3,
    datoCurioso: 'Las pirámides de Guiza en Egipto tienen más de 4.500 años y siguen sorprendiendo a los científicos.' },
  { id: 'australia', nombre: 'Australia', capital: 'Canberra', continente: 'Oceanía', dificultad: 'MEDIO', x: 91.4, y: 69.6,
    datoCurioso: 'En Australia hay más canguros que personas.' },
  { id: 'rusia', nombre: 'Rusia', capital: 'Moscú', continente: 'Europa', dificultad: 'MEDIO', x: 60.4, y: 19.0,
    datoCurioso: 'Rusia es tan grande que abarca 11 husos horarios distintos.' },
  { id: 'india', nombre: 'India', capital: 'Nueva Delhi', continente: 'Asia', dificultad: 'MEDIO', x: 71.4, y: 34.1,
    datoCurioso: 'El Taj Mahal en India fue construido por un emperador en honor a su esposa.' },
  { id: 'canada', nombre: 'Canadá', capital: 'Ottawa', continente: 'América', dificultad: 'MEDIO', x: 29.0, y: 24.8,
    datoCurioso: 'Canadá tiene más lagos que todo el resto del mundo junto.' },
  { id: 'sudafrica', nombre: 'Sudáfrica', capital: 'Pretoria', continente: 'África', dificultad: 'MEDIO', x: 57.8, y: 64.3,
    datoCurioso: 'Sudáfrica tiene tres capitales distintas: una para cada poder del gobierno.' },

  { id: 'mongolia', nombre: 'Mongolia', capital: 'Ulán Bator', continente: 'Asia', dificultad: 'DIFICIL', x: 79.7, y: 23.4,
    datoCurioso: 'Mongolia es uno de los países con menos densidad de población del mundo: hay más caballos que personas.' },
  { id: 'kenia', nombre: 'Kenia', capital: 'Nairobi', continente: 'África', dificultad: 'DIFICIL', x: 60.2, y: 50.7,
    datoCurioso: 'En Kenia ocurre la Gran Migración: millones de ñus cruzan la sabana cada año.' },
  { id: 'portugal', nombre: 'Portugal', capital: 'Lisboa', continente: 'Europa', dificultad: 'DIFICIL', x: 47.5, y: 28.5,
    datoCurioso: 'Portugal tiene la librería más antigua del mundo todavía en funcionamiento, desde 1732.' },
  { id: 'noruega', nombre: 'Noruega', capital: 'Oslo', continente: 'Europa', dificultad: 'DIFICIL', x: 53.0, y: 16.7,
    datoCurioso: 'En el norte de Noruega el sol no se pone durante semanas enteras en verano.' },
  { id: 'nuevazelanda', nombre: 'Nueva Zelanda', capital: 'Wellington', continente: 'Oceanía', dificultad: 'DIFICIL', x: 98.6, y: 72.9,
    datoCurioso: 'En Nueva Zelanda viven más ovejas que personas: casi 6 por cada habitante.' },
  { id: 'peru', nombre: 'Perú', capital: 'Lima', continente: 'América', dificultad: 'DIFICIL', x: 28.6, y: 56.7,
    datoCurioso: 'Machu Picchu, en Perú, fue construido por los incas sin usar ruedas ni animales de carga.' },
];

// ── Lógica pura (sin estado, sin Angular) ─────────────────

// CA-02: para la pregunta de capital, arma 4 opciones (1 correcta + 3 distractoras)
export function generarOpcionesCapital(pais: Pais, todos: Pais[] = PAISES): string[] {
  const otras = todos
    .filter(p => p.id !== pais.id)
    .map(p => p.capital)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return [pais.capital, ...otras].sort(() => Math.random() - 0.5);
}

// CA-04: motor de dificultad adaptativa según racha de aciertos/errores.
// 2 aciertos seguidos suben de nivel; 2 errores seguidos bajan de nivel.
export function siguienteDificultad(
  actual: Dificultad,
  rachaAciertos: number,
  rachaErrores: number
): Dificultad {
  const orden: Dificultad[] = ['FACIL', 'MEDIO', 'DIFICIL'];
  const idx = orden.indexOf(actual);

  if (rachaAciertos > 0 && rachaAciertos % 2 === 0) {
    return orden[Math.min(idx + 1, orden.length - 1)];
  }
  if (rachaErrores >= 2) {
    return orden[Math.max(idx - 1, 0)];
  }
  return actual;
}

// CA-06: "bolsa" de países sin repetición inmediata. Se van sacando al azar
// del pool disponible hasta agotarlo; si se agota antes de terminar la
// sesión, se vuelve a llenar (para sesiones largas) sin repetir el último.
export class BolsaPaises {
  private disponibles: Pais[] = [];
  private ultimoId: string | null = null;

  constructor(private pool: Pais[] = PAISES) {
    this.rellenar();
  }

  private rellenar(): void {
    this.disponibles = [...this.pool].sort(() => Math.random() - 0.5);
  }

  // Saca el siguiente país, preferentemente de la dificultad pedida.
  // Si no hay ninguno de esa dificultad disponible, toma cualquiera.
  siguiente(dificultad: Dificultad): Pais {
    if (this.disponibles.length === 0) this.rellenar();

    let idx = this.disponibles.findIndex(
      p => p.dificultad === dificultad && p.id !== this.ultimoId
    );
    if (idx === -1) idx = this.disponibles.findIndex(p => p.id !== this.ultimoId);
    if (idx === -1) idx = 0;

    const [pais] = this.disponibles.splice(idx, 1);
    this.ultimoId = pais.id;
    return pais;
  }
}

// Arma una pregunta completa (país + tipo + opciones si aplica).
// El tipo alterna entre ubicación y capital para variar la dinámica (CA-02).
export function generarPregunta(pais: Pais, tipo: TipoPregunta): Pregunta {
  return {
    pais,
    tipo,
    opciones: tipo === 'CAPITAL' ? generarOpcionesCapital(pais) : undefined,
  };
}
