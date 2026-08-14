import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { Pais, TipoPregunta } from './mapa-aventura.model';

/**
 * Mapa real (OpenStreetMap vía CARTO, sin etiquetas de texto) que:
 *  - resalta la zona real del país objetivo (geometría real, no una figura decorativa)
 *  - en modo CAPITAL, además coloca un marcador en la capital (sin texto/tooltip)
 *  - hace zoom automático a la región correspondiente al empezar cada pregunta
 * Nunca escribe el nombre del país ni de la capital sobre el mapa: la respuesta
 * nunca se revela ahí. El niño SÍ puede arrastrar y hacer zoom libremente para
 * explorar (dragging/zoom manual habilitados) — cada pregunta nueva vuelve a
 * centrar el mapa automáticamente sin importar dónde lo haya dejado el niño.
 */
@Component({
  selector: 'app-mapa-leaflet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mapa-host-wrap">
      <div class="mapa-host" #mapHost></div>
      @if (cargando) {
        <div class="mapa-cargando">🌍 Cargando mapa…</div>
      }
    </div>
  `,
  styles: [`
    .mapa-host-wrap {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,.12);
      box-shadow: 0 12px 40px rgba(0,0,0,.4);
    }
    .mapa-host { width: 100%; height: 300px; background: #cfe3f0; }
    .mapa-cargando {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(11,35,64,.85); color: #dce7f8; font-size: 14px; font-weight: 700;
    }
    :host ::ng-deep .leaflet-control-attribution {
      font-size: 9px; background: rgba(255,255,255,.75);
    }
  `],
})
export class MapaLeafletComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pais: Pais | null = null;
  @Input() modo: TipoPregunta = 'PAIS';

  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  cargando = true;

  private map: L.Map | null = null;
  private capaResaltado: L.GeoJSON | null = null;
  private marcadorCapital: L.CircleMarker | null = null;
  private geoData: { features: any[] } | null = null;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapHost.nativeElement, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoom: true,
      attributionControl: true,
    }).setView([15, 10], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CARTO',
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(this.map);

    this.cargarGeoData();
  }

  private async cargarGeoData(): Promise<void> {
    try {
      const resp = await fetch('/data/paises-mundo.geo.json');
      this.geoData = await resp.json();
    } finally {
      this.cargando = false;
      this.actualizarMapa();
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.map || !this.geoData) return;
    this.actualizarMapa();
  }

  private actualizarMapa(): void {
    if (!this.map || !this.geoData) return;

    if (this.capaResaltado) { this.map.removeLayer(this.capaResaltado); this.capaResaltado = null; }
    if (this.marcadorCapital) { this.map.removeLayer(this.marcadorCapital); this.marcadorCapital = null; }

    if (!this.pais) return;

    const feature = this.geoData.features.find(f => f.properties?.id === this.pais!.id);
    if (!feature) return;

    this.capaResaltado = L.geoJSON(feature, {
      style: {
        color: '#fbbf24',
        weight: 2.5,
        fillColor: '#fbbf24',
        fillOpacity: 0.35,
      },
      interactive: false,
    }).addTo(this.map);

    const bounds = this.capaResaltado.getBounds();
    if (!bounds.isValid()) return;

    if (this.modo === 'CAPITAL') {
      this.marcadorCapital = L.circleMarker([this.pais.capitalLat, this.pais.capitalLng], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#ef4444',
        fillOpacity: 1,
        interactive: false,
      }).addTo(this.map);
      this.map.flyToBounds(bounds.pad(0.4), { duration: 1.1, maxZoom: 9 });
    } else {
      // Modo PAIS: se aleja un poco más para que se vean los países vecinos
      // (sin nombres) y el niño pueda comparar formas y ubicación relativa.
      this.map.flyToBounds(bounds.pad(1.0), { duration: 1.1, maxZoom: 7 });
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }
}
