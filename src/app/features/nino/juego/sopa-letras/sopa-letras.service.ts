import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { SopaLetrasConfig, SopaLetrasSesionRequest } from './sopa-letras.model';

// Listas de palabras por tema (sin acentos para la grilla)
const PALABRAS: Record<string, string[]> = {
  CIENCIAS: [
    'ALGA', 'ROCA', 'RAIZ', 'LUNA', 'LARVA', 'MUSGO', 'VAPOR', 'CALOR', 'NIEVE', 'ARBOL',
    'PLANTA', 'CELULA', 'TEJIDO', 'REPTIL', 'INSECTO', 'MINERAL', 'HABITAT', 'ENERGIA', 'OXIGENO', 'ESPECIE',
    'VITAMINA', 'MAMIFERO', 'ORGANISMO', 'VERTEBRADO', 'ECOSISTEMA'
  ],
  GEOGRAFIA: [
    'ISLA', 'LAGO', 'CABO', 'MAPA', 'NILO', 'DELTA', 'COSTA', 'SELVA', 'BAHIA', 'MONTE',
    'OCEANO', 'VOLCAN', 'SIERRA', 'GLACIAR', 'DESIERTO', 'LLANURA', 'MESETA', 'LATITUD', 'EUROPA', 'AFRICA',
    'CONTINENTE', 'CORDILLERA', 'PENINSULA', 'LONGITUD', 'ECUADOR'
  ],
  MATEMATICAS: [
    'SUMA', 'AREA', 'CONO', 'CUBO', 'RESTO', 'PRIMO', 'PLANO', 'ANGULO',
    'CIRCULO', 'FRACCION', 'DECIMAL', 'VECTOR', 'MATRIZ', 'NUMERO', 'COCIENTE',
    'PERIMETRO', 'TRIANGULO', 'ECUACION', 'PORCENTAJE', 'HIPOTENUSA'
  ]
};

// Configuracion por nivel: gridSize, cantidadPalabras, tiempoSegundos, maxLetras
const CONFIG_NIVELES: Record<string, [number, number, number, number]> = {
  FACIL:   [8,  5, 120, 6],
  MEDIO:   [10, 6, 100, 8],
  DIFICIL: [12, 7,  90, 10],
  EXPERTO: [15, 8,  75, 15]
};

const ORDEN_NIVELES = ['FACIL', 'MEDIO', 'DIFICIL', 'EXPERTO'];

@Injectable({ providedIn: 'root' })
export class SopaLetrasService {

  private readonly API = `${environment.apiUrl}/sopa-letras`;

  constructor(private http: HttpClient) {}

  // Rastrea las palabras ya usadas por tema para no repetirlas entre niveles
  private usadasPorTema: Map<string, Set<string>> = new Map();

  resetearPalabrasUsadas(tema?: string): void {
    if (tema) this.usadasPorTema.delete(tema);
    else this.usadasPorTema.clear();
  }

  // Genera la configuracion localmente sin repetir palabras del mismo tema
  getConfigLocal(tema: string, nivel: string): SopaLetrasConfig {
    const [gridSize, count, tiempo, maxLetras] = CONFIG_NIVELES[nivel] ?? CONFIG_NIVELES['FACIL'];

    if (!this.usadasPorTema.has(tema)) this.usadasPorTema.set(tema, new Set());
    const usadas = this.usadasPorTema.get(tema)!;

    const todasValidas = (PALABRAS[tema] ?? PALABRAS['CIENCIAS'])
      .filter(p => p.length >= 4 && p.length <= maxLetras && p.length <= gridSize);

    // Si ya no quedan palabras nuevas, reinicia el historial del tema
    let disponibles = todasValidas.filter(p => !usadas.has(p));
    if (disponibles.length < count) { usadas.clear(); disponibles = todasValidas; }

    const palabras = [...disponibles].sort(() => Math.random() - 0.5).slice(0, count);
    palabras.forEach(p => usadas.add(p));

    const idx = ORDEN_NIVELES.indexOf(nivel);
    const nivelSiguiente = idx >= 0 && idx < ORDEN_NIVELES.length - 1
      ? ORDEN_NIVELES[idx + 1] : null;

    return { tema, nivel, gridSize, palabras, tiempoSegundos: tiempo, nivelSiguiente };
  }

  // Guarda los resultados en el backend (fallo silencioso si no hay conexion)
  guardarSesion(request: SopaLetrasSesionRequest): void {
    this.http.post(`${this.API}/sesion`, request).subscribe({ error: () => {} });
  }
}
