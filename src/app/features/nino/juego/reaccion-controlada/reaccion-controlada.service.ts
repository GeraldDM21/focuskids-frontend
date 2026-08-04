import { Injectable } from '@angular/core';
import {
  ComparacionSesion,
  ConfettiPiece,
  DefinicionEstimulo,
  EnsayoResultado,
  MetricasSesion,
  SesionGuardada,
  TipoEstimulo,
} from './reaccion-controlada.model';

const CLAVE_STORAGE = 'reaccion-controlada:ultima-sesion';

//ventanas de respuesta
// - GO: tiempo generoso para presionar tras aparecer la mosca
// - NOGO: 300ms — si presiona dentro de este lapso, es falsa alarma
const VENTANA_GO_MS = 900;
const VENTANA_NOGO_MS = 300;

//intervalo inter-estímulo variable para evitar anticipación
const INTERVALO_MIN_MS = 500;
const INTERVALO_MAX_MS = 1500;

//rango permitido para la frecuencia de estímulos inhibidores
const FRECUENCIA_NOGO_MIN = 0.2;
const FRECUENCIA_NOGO_MAX = 0.4;

export const ESTIMULO_GO: DefinicionEstimulo = { tipo: 'go', emoji: '🪰', label: '¡Atrápala!' };
export const ESTIMULO_NOGO: DefinicionEstimulo = {
  tipo: 'nogo',
  emoji: '🐝',
  label: '¡No la toques!',
};

@Injectable({ providedIn: 'root' })
export class ReaccionControladaService {
  generarIntervaloEstimulo(): number {
    return Math.round(INTERVALO_MIN_MS + Math.random() * (INTERVALO_MAX_MS - INTERVALO_MIN_MS));
  }

  // decide el tipo de estímulo del próximo ensayo según la probabilidad de No-Go vigente.
  decidirTipoEstimulo(probabilidadNoGo: number): TipoEstimulo {
    return Math.random() < probabilidadNoGo ? 'nogo' : 'go';
  }

  obtenerDefinicion(tipo: TipoEstimulo): DefinicionEstimulo {
    return tipo === 'go' ? ESTIMULO_GO : ESTIMULO_NOGO;
  }

  ventanaLimiteMs(tipo: TipoEstimulo): number {
    return tipo === 'go' ? VENTANA_GO_MS : VENTANA_NOGO_MS;
  }

  evaluarEnsayo(
    indice: number,
    tipo: TipoEstimulo,
    presiono: boolean,
    tiempoReaccionMs: number | null,
  ): EnsayoResultado {
    const ventanaLimiteMs = this.ventanaLimiteMs(tipo);
    // GO:   correcto si presionó dentro de la ventana.
    // NOGO: correcto si NO presionó dentro de los 300ms
    const correcto = tipo === 'go' ? presiono : !presiono;

    return {
      indice,
      tipo,
      presiono,
      tiempoReaccionMs,
      correcto,
      ventanaLimiteMs,
      timestamp: Date.now(),
    };
  }

  calcularMetricas(resultados: EnsayoResultado[]): MetricasSesion {
    const ensayosGo = resultados.filter((r) => r.tipo === 'go');
    const ensayosNoGo = resultados.filter((r) => r.tipo === 'nogo');

    const aciertosGo = ensayosGo.filter((r) => r.correcto).length;
    const falsasAlarmasNoGo = ensayosNoGo.filter((r) => r.presiono).length;
    const inhibicionesCorrectas = ensayosNoGo.length - falsasAlarmasNoGo;

    const tasaAciertosGo = ensayosGo.length ? Math.round((aciertosGo / ensayosGo.length) * 100) : 0;
    const tasaFalsasAlarmasNoGo = ensayosNoGo.length
      ? Math.round((falsasAlarmasNoGo / ensayosNoGo.length) * 100)
      : 0;

    const tiemposGo = ensayosGo
      .filter((r) => r.presiono && r.tiempoReaccionMs != null)
      .map((r) => r.tiempoReaccionMs as number);
    const tiempoReaccionPromedioGoMs = tiemposGo.length
      ? Math.round(tiemposGo.reduce((a, b) => a + b, 0) / tiemposGo.length)
      : VENTANA_GO_MS;


    const factorInhibicion = ensayosNoGo.length ? inhibicionesCorrectas / ensayosNoGo.length : 1;
    const ssrtMs = Math.max(
      150,
      Math.round(tiempoReaccionPromedioGoMs * (1.15 - factorInhibicion * 0.6)),
    );

    const indiceImpulsividad = Math.min(
      100,
      Math.max(0, Math.round(tasaFalsasAlarmasNoGo * 0.7 + (100 - tasaAciertosGo) * 0.3)),
    );

    return {
      totalEnsayos: resultados.length,
      ensayosGo: ensayosGo.length,
      ensayosNoGo: ensayosNoGo.length,
      aciertosGo,
      falsasAlarmasNoGo,
      inhibicionesCorrectas,
      tasaAciertosGo,
      tasaFalsasAlarmasNoGo,
      tiempoReaccionPromedioGoMs,
      ssrtMs,
      indiceImpulsividad,
    };
  }

  ajustarFrecuenciaNoGo(indiceImpulsividad: number): number {
    const frecuencia =
      FRECUENCIA_NOGO_MIN +
      (indiceImpulsividad / 100) * (FRECUENCIA_NOGO_MAX - FRECUENCIA_NOGO_MIN);
    return Math.min(FRECUENCIA_NOGO_MAX, Math.max(FRECUENCIA_NOGO_MIN, frecuencia));
  }

  compararConSesionAnterior(
    ssrtActual: number,
    anterior: SesionGuardada | null,
  ): ComparacionSesion {
    if (!anterior) {
      return { huboSesionAnterior: false, mejoraSSRTPorc: 0, mejoraSignificativa: false };
    }
    const mejoraSSRTPorc = Math.round(((anterior.ssrtMs - ssrtActual) / anterior.ssrtMs) * 100);
    return {
      huboSesionAnterior: true,
      mejoraSSRTPorc,
      mejoraSignificativa: mejoraSSRTPorc > 15,
    };
  }

  // TODO: reemplazar por una llamada real al servicio del dashboard del
  guardarSesion(sesion: SesionGuardada): void {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
    } catch {
      /* almacenamiento no disponible: se ignora silenciosamente */
    }
  }

  obtenerSesionAnterior(): SesionGuardada | null {
    try {
      const raw = localStorage.getItem(CLAVE_STORAGE);
      return raw ? (JSON.parse(raw) as SesionGuardada) : null;
    } catch {
      return null;
    }
  }

  enviarMetricasADashboard(metricas: MetricasSesion): void {
    // TODO: conectar con focuskids_backend cuando exista el endpoint de métricas.
    console.log('[ReaccionControlada] Métricas listas para el dashboard:', metricas);
  }

  generarConfeti(): ConfettiPiece[] {
    const colores = ['#4ade80', '#22c55e', '#a3e635', '#fde047', '#38bdf8', '#34d399'];
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 500,
      dur: 1400 + Math.random() * 800,
      size: 6 + Math.random() * 9,
    }));
  }
}
