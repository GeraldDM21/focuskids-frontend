import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';

import {
  ConfigLab,
  ExperimentoLab,
  FinalizarLabRequest,
  IngredienteLab,
  IniciarLabResponse,
  LabResultadoResponse,
  NivelLab,
  RegistrarIntentoRequest,
  RegistrarIntentoResponse
} from './lab-ciencias.model';

const INGREDIENTES: IngredienteLab[] = [
  {
    id: 'bicarbonato',
    nombre: 'Bicarbonato',
    emoji: '🥄',
    descripcion: 'Polvo alcalino',
    color: '#E2E8F0'
  },
  {
    id: 'vinagre',
    nombre: 'Vinagre',
    emoji: '🧴',
    descripcion: 'Líquido ácido',
    color: '#FDE68A'
  },
  {
    id: 'agua',
    nombre: 'Agua',
    emoji: '💧',
    descripcion: 'Líquido transparente',
    color: '#7DD3FC'
  },
  {
    id: 'aceite',
    nombre: 'Aceite',
    emoji: '🫗',
    descripcion: 'Líquido que no se mezcla con agua',
    color: '#FBBF24'
  },
  {
    id: 'sal',
    nombre: 'Sal',
    emoji: '🧂',
    descripcion: 'Cristales blancos',
    color: '#F8FAFC'
  },
  {
    id: 'colorante',
    nombre: 'Colorante',
    emoji: '🎨',
    descripcion: 'Da color a los líquidos',
    color: '#F472B6'
  }
];

const EXPERIMENTOS: ExperimentoLab[] = [
  {
    id: 'globo-flotante',

    titulo: 'El globo que se infla',

    objetivo:
      'Encuentra la mezcla que produzca gas para inflar el globo.',

    pista:
      'Busca un polvo y un líquido ácido.',

    combinacionesCorrectas: {
      FACIL: [
        'bicarbonato',
        'vinagre'
      ],

      MEDIO: [
        'bicarbonato',
        'vinagre',
        'colorante'
      ],

      DIFICIL: [
        'bicarbonato',
        'vinagre',
        'agua'
      ],

      EXPERTO: [
        'bicarbonato',
        'vinagre',
        'agua',
        'colorante'
      ]
    },

    resultadoExito:
      '¡Muchas burbujas! El gas producido llena el globo.',

    emojiResultado: '🎈',

    explicacionCientifica: {
      FACIL:
        'El bicarbonato y el vinagre forman burbujas de un gas llamado dióxido de carbono. Ese gas infla el globo.',

      MEDIO:
        'Al mezclar bicarbonato y vinagre ocurre una reacción química que libera dióxido de carbono. El gas ocupa espacio y empuja el globo.',

      DIFICIL:
        'El ácido acético del vinagre reacciona con el bicarbonato de sodio y produce dióxido de carbono, agua y una sal. El CO₂ infla el globo.',

      EXPERTO:
        'Es una reacción ácido-base: el ácido acético transfiere protones al bicarbonato y se forma CO₂ gaseoso, responsable del aumento de volumen.'
    }
  },
  {
    id: 'lava-colores',

    titulo: 'Lámpara de lava',

    objetivo:
      'Crea capas de colores que se mantengan separadas.',

    pista:
      'Prueba dos líquidos que no se mezclen.',

    combinacionesCorrectas: {
      FACIL: [
        'agua',
        'aceite'
      ],

      MEDIO: [
        'agua',
        'aceite',
        'colorante'
      ],

      DIFICIL: [
        'agua',
        'aceite',
        'sal'
      ],

      EXPERTO: [
        'agua',
        'aceite',
        'colorante',
        'sal'
      ]
    },

    resultadoExito:
      '¡Se formaron dos capas que permanecen separadas!',

    emojiResultado: '🌋',

    explicacionCientifica: {
      FACIL:
        'El agua y el aceite no se mezclan. El aceite queda arriba porque es menos denso que el agua.',

      MEDIO:
        'El agua y el aceite tienen propiedades distintas y forman dos capas. El aceite es menos denso y flota sobre el agua.',

      DIFICIL:
        'El agua es polar y el aceite no polar, por eso no se disuelven entre sí. Además, la menor densidad del aceite hace que quede arriba.',

      EXPERTO:
        'La diferencia de polaridad impide la miscibilidad: las moléculas de agua se atraen entre sí y excluyen al aceite; la densidad determina el orden de las fases.'
    }
  },
  {
    id: 'cristales-sal',

    titulo: 'Cristales escondidos',

    objetivo:
      'Prepara una mezcla de la que puedan aparecer cristales.',

    pista:
      'Busca algo que pueda disolverse en un líquido.',

    combinacionesCorrectas: {
      FACIL: [
        'agua',
        'sal'
      ],

      MEDIO: [
        'agua',
        'sal',
        'colorante'
      ],

      DIFICIL: [
        'agua',
        'sal',
        'bicarbonato'
      ],

      EXPERTO: [
        'agua',
        'sal',
        'bicarbonato',
        'colorante'
      ]
    },

    resultadoExito:
      '¡La sal se disolvió! Cuando el agua se evapore podrán aparecer cristales.',

    emojiResultado: '💎',

    explicacionCientifica: {
      FACIL:
        'La sal se disuelve en el agua. Cuando el agua se evapora, la sal vuelve a juntarse y forma cristales.',

      MEDIO:
        'El agua separa las pequeñas partículas de sal. Al evaporarse el agua, esas partículas se ordenan y forman cristales.',

      DIFICIL:
        'Los iones de la sal se hidratan y se dispersan en el agua. Al aumentar la concentración por evaporación, comienza la cristalización.',

      EXPERTO:
        'La disolución separa Na⁺ y Cl⁻ por hidratación. Cuando la solución alcanza sobresaturación, la nucleación y el crecimiento forman una red cristalina.'
    }
  },
  {
    id: 'colores-que-viajan',

    titulo: 'Color viajero',

    objetivo:
      'Haz que un líquido transparente cambie de color.',

    pista:
      'Combina un líquido transparente con algo que tenga pigmento.',

    combinacionesCorrectas: {
      FACIL: [
        'agua',
        'colorante'
      ],

      MEDIO: [
        'agua',
        'colorante',
        'sal'
      ],

      DIFICIL: [
        'agua',
        'colorante',
        'vinagre'
      ],

      EXPERTO: [
        'agua',
        'colorante',
        'vinagre',
        'sal'
      ]
    },

    resultadoExito:
      '¡El color se extendió por toda el agua!',

    emojiResultado: '🌈',

    explicacionCientifica: {
      FACIL:
        'El colorante se reparte poco a poco por el agua hasta colorearla toda.',

      MEDIO:
        'Las partículas del colorante se mueven entre las del agua y se dispersan. Este proceso se llama difusión.',

      DIFICIL:
        'El movimiento aleatorio de las partículas produce difusión desde la zona de mayor concentración hacia las zonas de menor concentración.',

      EXPERTO:
        'La difusión surge del movimiento térmico molecular y reduce los gradientes de concentración hasta aproximarse a una distribución uniforme.'
    }
  }
];

const CONFIG: Record<
  NivelLab,
  {
    ingredientes: number;
    experimentos: number;
    siguiente: NivelLab | null;
  }
> = {
  FACIL: {
    ingredientes: 4,
    experimentos: 2,
    siguiente: 'MEDIO'
  },

  MEDIO: {
    ingredientes: 5,
    experimentos: 3,
    siguiente: 'DIFICIL'
  },

  DIFICIL: {
    ingredientes: 6,
    experimentos: 3,
    siguiente: 'EXPERTO'
  },

  EXPERTO: {
    ingredientes: 6,
    experimentos: 4,
    siguiente: null
  }
};

@Injectable({
  providedIn: 'root'
})
export class LabCienciasService {

  private readonly API =
    `${environment.apiUrl}/juegos/lab-ciencias`;

  constructor(
    private readonly http: HttpClient
  ) {
  }

  generarConfig(
    nivel: NivelLab
  ): ConfigLab {
    const configuracion =
      CONFIG[nivel];

    const experimentos =
      this.mezclarLista(
        EXPERIMENTOS
      ).slice(
        0,
        configuracion.experimentos
      );

    const idsNecesarios =
      new Set<string>();

    experimentos.forEach(
      experimento => {
        const combinacion =
          experimento
            .combinacionesCorrectas[
            nivel
            ];

        combinacion.forEach(
          ingredienteId => {
            idsNecesarios.add(
              ingredienteId
            );
          }
        );
      }
    );

    const necesarios =
      INGREDIENTES.filter(
        ingrediente =>
          idsNecesarios.has(
            ingrediente.id
          )
      );

    const distractores =
      this.mezclarLista(
        INGREDIENTES.filter(
          ingrediente =>
            !idsNecesarios.has(
              ingrediente.id
            )
        )
      );

    const cantidadOpciones =
      nivel === 'FACIL'
        ? 4
        : 6;

    const cantidadDistractores =
      Math.max(
        0,
        cantidadOpciones
        - necesarios.length
      );

    const ingredientes =
      this.mezclarLista([
        ...necesarios,
        ...distractores.slice(
          0,
          cantidadDistractores
        )
      ]);

    return {
      nivel,
      ingredientes,
      experimentos,
      cantidadExperimentos:
      experimentos.length,
      siguiente:
      configuracion.siguiente
    };
  }

  iniciarSesion(
    perfilId: number,
    nivel: NivelLab
  ): Observable<IniciarLabResponse> {
    return this.http.post<IniciarLabResponse>(
      `${this.API}/sesiones`,
      {
        perfilId,
        nivel
      }
    );
  }

  registrarIntento(
    sesionId: number,
    request: RegistrarIntentoRequest
  ): Observable<RegistrarIntentoResponse> {
    return this.http.post<RegistrarIntentoResponse>(
      `${this.API}/sesiones/${sesionId}/intentos`,
      request
    );
  }

  finalizarSesion(
    sesionId: number,
    request: FinalizarLabRequest
  ): Observable<LabResultadoResponse> {
    return this.http.put<LabResultadoResponse>(
      `${this.API}/sesiones/${sesionId}/finalizar`,
      request
    );
  }

  private mezclarLista<T>(
    elementos: readonly T[]
  ): T[] {
    const resultado = [...elementos];

    for (
      let indice = resultado.length - 1;
      indice > 0;
      indice--
    ) {
      const posicionAleatoria =
        Math.floor(
          Math.random() * (indice + 1)
        );

      [
        resultado[indice],
        resultado[posicionAleatoria]
      ] = [
        resultado[posicionAleatoria],
        resultado[indice]
      ];
    }

    return resultado;
  }
}
