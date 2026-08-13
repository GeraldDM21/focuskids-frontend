// ── Tipos ──────────────────────────────────────────────────

export type Dificultad = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type Continente = 'América' | 'Europa' | 'Asia' | 'África' | 'Oceanía';
export type TipoPregunta = 'PAIS' | 'CAPITAL';

export interface Pais {
  id: string;        // codigo ISO 3166-1 alpha-3 (ej. 'MEX')
  cca2: string;       // codigo ISO 3166-1 alpha-2 en minuscula, para la bandera (ej. 'mx')
  nombre: string;
  capital: string;
  capitalLat: number; // coordenadas reales de la capital
  capitalLng: number;
  continente: Continente;
  dificultad: Dificultad;
  datoCurioso: string;
}

export interface Pregunta {
  pais: Pais;
  tipo: TipoPregunta;
  opciones: string[]; // 4 opciones (1 correcta + 3 distractoras), texto a mostrar
}

// ── Carga del banco de paises (CA: incluir todos los paises del mundo) ──
// Los datos reales (nombre, capital, coordenadas y la geometria del mapa)
// se generaron una sola vez a partir de fuentes publicas abiertas y se
// guardaron como archivos estaticos en /public/data/. El juego no llama
// ninguna API externa mientras se juega.

interface PaisRaw {
  id: string;
  cca2: string;
  nombre: string;
  capital: string;
  capitalLat: number;
  capitalLng: number;
  continente: string;
  dificultad: Dificultad;
  datoCurioso: string;
}

const CONTINENTE_MAP: Record<string, Continente> = {
  America: 'América',
  Europa: 'Europa',
  Asia: 'Asia',
  Africa: 'África',
  Oceania: 'Oceanía',
};

export async function cargarPaises(): Promise<Pais[]> {
  const resp = await fetch('/data/paises-mundo.json');
  const raw: PaisRaw[] = await resp.json();
  return raw.map(r => ({
    ...r,
    continente: CONTINENTE_MAP[r.continente] ?? (r.continente as Continente),
  }));
}

// ── Lógica pura (sin estado, sin Angular) ─────────────────

/**
 * Elige `cantidad` distractores para `objetivo`, dando prioridad a países
 * parecidos (mismo continente y dificultad) antes que a cualquiera del
 * pool completo — para que las 4 opciones tengan sentido geográfico y
 * ningún distractor sea absurdamente fácil de descartar.
 */
function elegirDistractores(objetivo: Pais, pool: Pais[], cantidad: number): Pais[] {
  const candidatos = pool.filter(p => p.id !== objetivo.id);
  const elegidos: Pais[] = [];
  const usados = new Set<string>();

  const agregarDe = (lista: Pais[]) => {
    const barajado = [...lista].sort(() => Math.random() - 0.5);
    for (const p of barajado) {
      if (elegidos.length >= cantidad) break;
      if (usados.has(p.id)) continue;
      elegidos.push(p);
      usados.add(p.id);
    }
  };

  agregarDe(candidatos.filter(p => p.continente === objetivo.continente && p.dificultad === objetivo.dificultad));
  agregarDe(candidatos.filter(p => p.continente === objetivo.continente));
  agregarDe(candidatos.filter(p => p.dificultad === objetivo.dificultad));
  agregarDe(candidatos);

  return elegidos;
}

// Arma las 4 opciones de nombres de país (1 correcta + 3 distractoras).
export function generarOpcionesPais(pais: Pais, pool: Pais[]): string[] {
  const distractores = elegirDistractores(pais, pool, 3).map(p => p.nombre);
  return [pais.nombre, ...distractores].sort(() => Math.random() - 0.5);
}

// Arma las 4 opciones de capitales (1 correcta + 3 distractoras).
export function generarOpcionesCapital(pais: Pais, pool: Pais[]): string[] {
  const distractores = elegirDistractores(pais, pool, 3).map(p => p.capital);
  return [pais.capital, ...distractores].sort(() => Math.random() - 0.5);
}

// "Bolsa" de países sin repetición inmediata: se van sacando al azar del
// pool disponible (ya filtrado por dificultad elegida) hasta agotarlo; si
// se agota antes de terminar la sesión, se vuelve a llenar sin repetir el
// último país mostrado.
export class BolsaPaises {
  private disponibles: Pais[] = [];
  private ultimoId: string | null = null;

  constructor(private pool: Pais[]) {
    this.rellenar();
  }

  private rellenar(): void {
    this.disponibles = [...this.pool].sort(() => Math.random() - 0.5);
  }

  siguiente(): Pais {
    if (this.disponibles.length === 0) this.rellenar();

    let idx = this.disponibles.findIndex(p => p.id !== this.ultimoId);
    if (idx === -1) idx = 0;

    const [pais] = this.disponibles.splice(idx, 1);
    this.ultimoId = pais.id;
    return pais;
  }
}

// Arma una pregunta completa (país + tipo + opciones).
export function generarPregunta(pais: Pais, tipo: TipoPregunta, poolCompleto: Pais[]): Pregunta {
  return {
    pais,
    tipo,
    opciones: tipo === 'CAPITAL'
      ? generarOpcionesCapital(pais, poolCompleto)
      : generarOpcionesPais(pais, poolCompleto),
  };
}
