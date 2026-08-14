import { Injectable } from '@angular/core';
import {
  ComparacionSesion,
  ConfettiPiece,
  DefinicionEstimulo,
  EnsayoResultado,
  EstimuloEnVuelo,
  MetricasSesion,
  SesionGuardada,
  TipoEstimulo,
} from './reaccion-controlada.model';

const CLAVE_STORAGE = 'reaccion-controlada:ultima-sesion';

const INTERVALO_MIN_MS = 700;
const INTERVALO_MAX_MS = 1700;

const FRECUENCIA_NOGO_MIN = 0.2;
const FRECUENCIA_NOGO_MAX = 0.4;

const VUELO_MIN_MS = 1600;
const VUELO_MAX_MS = 3000;

const GRACIA_RESPUESTA_MS = 150;
const TIEMPO_REACCION_FALLBACK_MS = 900;

export const ESTIMULO_GO: DefinicionEstimulo = { tipo: 'go', emoji: '🐝', label: '¡Atrápala!' };
export const ESTIMULO_NOGO: DefinicionEstimulo = {
  tipo: 'nogo',
  emoji: '🪰',
  label: '¡No la toques!',
};

@Injectable({ providedIn: 'root' })
export class ReaccionControladaService {
  generarIntervaloEstimulo(): number {
    return Math.round(INTERVALO_MIN_MS + Math.random() * (INTERVALO_MAX_MS - INTERVALO_MIN_MS));
  }

  decidirTipoEstimulo(probabilidadNoGo: number): TipoEstimulo {
    return Math.random() < probabilidadNoGo ? 'nogo' : 'go';
  }

  obtenerEstimuloEnVuelo(tipo: TipoEstimulo): EstimuloEnVuelo {
    const base = tipo === 'go' ? ESTIMULO_GO : ESTIMULO_NOGO;
    return {
      ...base,
      top: 10 + Math.random() * 62,
      duracionMs: Math.round(VUELO_MIN_MS + Math.random() * (VUELO_MAX_MS - VUELO_MIN_MS)),
      direccion: Math.random() < 0.5 ? 'ltr' : 'rtl',
    };
  }

  ventanaRespuestaMs(estimulo: EstimuloEnVuelo): number {
    return estimulo.duracionMs + GRACIA_RESPUESTA_MS;
  }

  evaluarEnsayo(
    indice: number,
    tipo: TipoEstimulo,
    presiono: boolean,
    tiempoReaccionMs: number | null,
    ventanaLimiteMs: number,
  ): EnsayoResultado {
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
      : TIEMPO_REACCION_FALLBACK_MS;

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

  guardarSesion(sesion: SesionGuardada): void {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
    } catch {
      /* noop */
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
    console.log('[ReaccionControlada] Métricas listas para el dashboard:', metricas);
  }

  generarConfeti(): ConfettiPiece[] {
    const colores = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#d97706', '#b45309'];
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
