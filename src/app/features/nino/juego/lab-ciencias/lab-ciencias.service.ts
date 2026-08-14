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

    narracion:
      '¡Mira lo que pasa! Cuando mezclamos bicarbonato y vinagre hacen un montón de burbujas. ' +
      'Esas burbujas son un gas que puede inflar un globo. ' +
      '¡Ahora inténtalo tú!',

    pregunta: {
      texto: 'Uni explicó que las burbujas son un gas. ¿Cómo se llama ese gas?',
      opciones: [
        { texto: 'Dióxido de carbono', emoji: '💨', correcta: true  },
        { texto: 'Vapor de agua',      emoji: '🌊', correcta: false },
        { texto: 'Fuego',              emoji: '🔥', correcta: false }
      ]
    },

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

    narracion:
      '¡Esto te va a encantar! El aceite y el agua nunca se mezclan, son como enemigos. ' +
      'Si los pones juntos el aceite siempre queda flotando arriba. ' +
      'Si le agregas colorante las gotitas de color bailan entre las dos capas. ¡Parece una lámpara de lava!',

    pregunta: {
      texto: 'Según Uni, ¿por qué el aceite siempre queda arriba del agua?',
      opciones: [
        { texto: 'Porque es menos denso', emoji: '🪶', correcta: true  },
        { texto: 'Porque es más pesado',  emoji: '🏋️', correcta: false },
        { texto: 'Porque tiene color',    emoji: '🎨', correcta: false }
      ]
    },

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

    narracion:
      '¡Observa este truco! Cuando pones sal en agua la sal desaparece... pero no se va. ' +
      'Se esconde dentro del agua. ' +
      'Si el agua se evapora poquito a poquito la sal aparece de nuevo como cristallitos brillantes. ¡Como magia!',

    pregunta: {
      texto: 'Uni explicó que la sal se disuelve. ¿Qué pasa si el agua se evapora?',
      opciones: [
        { texto: 'La sal vuelve como cristales', emoji: '💎', correcta: true  },
        { texto: 'La sal desaparece para siempre', emoji: '👻', correcta: false },
        { texto: 'Se convierte en aceite',         emoji: '🫗', correcta: false }
      ]
    },

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

    narracion:
      '¡El color puede viajar! Si mezclas agua con colorante el color se esparce solito por todo el líquido. ' +
      'Las gotitas de color se mueven entre las gotitas de agua hasta colorearla toda. ' +
      '¡Pruébalo y verás cómo el agua cambia de color!',

    pregunta: {
      texto: 'Según Uni, ¿cómo se llama cuando el colorante se esparce solo por el agua?',
      opciones: [
        { texto: 'Difusión',    emoji: '🌊', correcta: true  },
        { texto: 'Explosión',   emoji: '💥', correcta: false },
        { texto: 'Evaporación', emoji: '☁️', correcta: false }
      ]
    },

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
  },
  {
    id: 'gotas-color-aceite',

    titulo: 'Gotas que no se mezclan',

    objetivo:
      'Logra que el colorante forme gotitas dentro del aceite, sin mezclarse.',

    pista:
      'Busca un líquido resbaloso y algo con color.',

    combinacionesCorrectas: {
      FACIL: [
        'aceite',
        'colorante'
      ],

      MEDIO: [
        'aceite',
        'colorante',
        'agua'
      ],

      DIFICIL: [
        'aceite',
        'colorante',
        'vinagre'
      ],

      EXPERTO: [
        'aceite',
        'colorante',
        'agua',
        'vinagre'
      ]
    },

    resultadoExito:
      '¡El colorante se quedó en gotitas de color flotando en el aceite!',

    emojiResultado: '🫧',

    narracion:
      '¡Mira esto! El colorante está hecho con agua, y el agua y el aceite no se llevan bien. ' +
      'Por eso, en vez de mezclarse, el colorante forma bolitas de color que flotan solitas dentro del aceite. ' +
      '¡Parecen canicas de colores!',

    pregunta: {
      texto: 'Según Uni, ¿por qué el colorante no se mezcla con el aceite?',
      opciones: [
        { texto: 'Porque el colorante lleva agua y el agua no se mezcla con el aceite', emoji: '💧', correcta: true  },
        { texto: 'Porque el colorante es muy pesado',   emoji: '🏋️', correcta: false },
        { texto: 'Porque el aceite está muy frío',      emoji: '🧊', correcta: false }
      ]
    },

    explicacionCientifica: {
      FACIL:
        'El colorante lleva agua adentro. Como el agua y el aceite no se mezclan, el colorante forma gotitas separadas.',

      MEDIO:
        'El agua del colorante y el aceite no se mezclan por ser líquidos distintos. Por eso el colorante flota en gotas dentro del aceite.',

      DIFICIL:
        'El agua (polar) y el aceite (no polar) no se disuelven entre sí, así que el colorante disuelto en agua queda atrapado en pequeñas gotas dentro del aceite.',

      EXPERTO:
        'La incompatibilidad de polaridades impide la miscibilidad; la tensión superficial hace que la fase acuosa coloreada minimice su área de contacto formando gotas esféricas dentro de la fase oleosa.'
    }
  },
  {
    id: 'polvo-desaparece',

    titulo: 'El polvo que desaparece',

    objetivo:
      'Logra que el bicarbonato se disuelva por completo en el agua, sin burbujas.',

    pista:
      'Busca un polvo y un líquido transparente, sin nada ácido.',

    combinacionesCorrectas: {
      FACIL: [
        'bicarbonato',
        'agua'
      ],

      MEDIO: [
        'bicarbonato',
        'agua',
        'sal'
      ],

      DIFICIL: [
        'bicarbonato',
        'agua',
        'colorante'
      ],

      EXPERTO: [
        'bicarbonato',
        'agua',
        'sal',
        'colorante'
      ]
    },

    resultadoExito:
      '¡El bicarbonato se disolvió por completo y el agua sigue tranquila, sin burbujas!',

    emojiResultado: '🥛',

    narracion:
      '¡Esta vez es distinto! Si mezclas bicarbonato solo con agua, el polvito se disuelve despacito y desaparece, ' +
      'pero no aparecen burbujas como cuando lo mezclamos con vinagre. ' +
      'Eso es porque el agua no es un ácido. ¡Uni te reta a comprobarlo!',

    pregunta: {
      texto: 'Uni dijo que esta vez no salieron burbujas. ¿Qué le faltó a la mezcla para burbujear como en el globo?',
      opciones: [
        { texto: 'Un líquido ácido, como el vinagre', emoji: '🧴', correcta: true  },
        { texto: 'Más agua',                          emoji: '💧', correcta: false },
        { texto: 'Agitar más fuerte',                 emoji: '💪', correcta: false }
      ]
    },

    explicacionCientifica: {
      FACIL:
        'El bicarbonato se disuelve en el agua sin hacer burbujas, porque el agua sola no es un ácido.',

      MEDIO:
        'El bicarbonato se separa en partículas muy pequeñas dentro del agua. Sin un ácido como el vinagre, no hay reacción ni burbujas.',

      DIFICIL:
        'Disolverse (mezclarse sin cambiar de sustancia) es distinto de reaccionar (formar una sustancia nueva). Aquí solo hay disolución, por eso no hay gas.',

      EXPERTO:
        'La disolución del bicarbonato en agua es un proceso físico sin reacción ácido-base; solo al introducir un ácido como el ácido acético se libera CO₂ gaseoso.'
    }
  },
  {
    id: 'sal-no-desaparece',

    titulo: 'La sal que no desaparece',

    objetivo:
      'Descubre qué pasa cuando pones sal en aceite en vez de en agua.',

    pista:
      'Busca un cristal blanco y un líquido resbaloso, sin agua.',

    combinacionesCorrectas: {
      FACIL: [
        'sal',
        'aceite'
      ],

      MEDIO: [
        'sal',
        'aceite',
        'colorante'
      ],

      DIFICIL: [
        'sal',
        'aceite',
        'agua'
      ],

      EXPERTO: [
        'sal',
        'aceite',
        'colorante',
        'agua'
      ]
    },

    resultadoExito:
      '¡La sal se quedó hundida en el fondo, no se disolvió en el aceite!',

    emojiResultado: '🧂',

    narracion:
      '¿Recuerdas que la sal desaparecía en el agua? Pues en el aceite pasa algo distinto: ' +
      'los granitos de sal se hunden y se quedan enteros en el fondo, ¡no se disuelven! ' +
      'El aceite no es capaz de esconder la sal como lo hacía el agua.',

    pregunta: {
      texto: '¿Por qué la sal no se disolvió esta vez, si en el agua sí se disolvía?',
      opciones: [
        { texto: 'Porque el aceite no es agua',       emoji: '🫗', correcta: true  },
        { texto: 'Porque la sal cambió de sabor',     emoji: '👅', correcta: false },
        { texto: 'Porque el aceite estaba muy caliente', emoji: '🔥', correcta: false }
      ]
    },

    explicacionCientifica: {
      FACIL:
        'La sal se disuelve en agua, pero no en aceite. Por eso en el aceite se queda hundida como granitos enteros.',

      MEDIO:
        'El aceite no puede separar las partículas de sal como lo hace el agua, así que la sal no se disuelve y se hunde.',

      DIFICIL:
        'La sal es un compuesto iónico que se disuelve en solventes polares como el agua, pero el aceite (no polar) no puede rodear sus iones.',

      EXPERTO:
        'La disolución de un sólido iónico requiere un solvente polar que hidrate los iones; el aceite, al ser no polar, no genera esa interacción y la sal permanece como fase sólida separada.'
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
