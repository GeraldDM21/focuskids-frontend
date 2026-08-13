import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NotificacionesService, NotificacionAlerta } from '../../services/notificaciones.service';

const INTERVALO_REFRESCO_MS = 30000; // CA-01: "tiempo real" vía polling ligero

/**
 * Historia: "Notificaciones in-app de alertas de regresión cognitiva".
 *
 * CA-01: campana con badge numérico de no leídas, se actualiza sola o al recargar.
 * CA-02: al hacer clic despliega un panel lateral con la lista de alertas.
 * CA-03: "Ver detalle" navega al historial del niño con las sesiones resaltadas.
 * CA-04: cada alerta se puede marcar como leída; las leídas quedan accesibles
 *        en "Ver alertas anteriores".
 * CA-05: si [notificacionesActivas]=false, el badge no se muestra (las
 *        alertas se siguen consultando/registrando en BD igual).
 */
@Component({
  selector: 'app-campana-notificaciones',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="campana-wrap">
      <button class="campana-btn" title="Notificaciones" (click)="togglePanel()">
        <span class="campana-ico">🔔</span>
        <!-- CA-01 / CA-05: badge numérico, oculto si el usuario desactivó las notificaciones in-app -->
        @if (notificacionesActivas && noLeidas.length > 0) {
          <span class="campana-badge">{{ noLeidas.length > 9 ? '9+' : noLeidas.length }}</span>
        }
      </button>

      @if (panelAbierto) {
        <div class="campana-overlay" (click)="togglePanel()"></div>
        <div class="campana-panel">
          <div class="cp-header">
            <h3 class="cp-title">🔔 Notificaciones</h3>
            <button class="cp-close" (click)="togglePanel()">×</button>
          </div>

          @if (cargando) {
            <div class="cp-loading"><div class="cp-spinner"></div></div>
          } @else if (visibles.length === 0) {
            <div class="cp-empty">
              <span style="font-size:36px">🔔</span>
              <p>
                {{ mostrarAnteriores ? 'No tienes notificaciones.' : 'No tienes alertas nuevas.' }}
              </p>
            </div>
          } @else {
            <div class="cp-list">
              @for (n of visibles; track n.id) {
                <div class="cp-item" [class.cp-item-leida]="n.leida">
                  <div class="cp-item-dot" [class.cp-item-dot-nueva]="!n.leida"></div>
                  <div class="cp-item-body">
                    @if (n.ninoPerfil || n.juego) {
                      <div class="cp-item-meta">
                        @if (n.ninoPerfil) {
                          <span class="cp-chip">{{ n.ninoPerfil.nombre }}</span>
                        }
                        @if (n.juego) {
                          <span class="cp-chip cp-chip-juego">{{ n.juego.nombre }}</span>
                        }
                      </div>
                    }
                    <div class="cp-item-msg">{{ n.mensaje }}</div>
                    <div class="cp-item-fecha">{{ formatFecha(n.fecha) }}</div>
                    <div class="cp-item-acciones">
                      @if (n.ninoPerfil && n.juego) {
                        <button class="cp-btn cp-btn-detalle" (click)="verDetalle(n)">
                          Ver detalle
                        </button>
                      }
                      @if (!n.leida) {
                        <button class="cp-btn cp-btn-leida" (click)="marcarLeida(n)">
                          ✓ Marcar leída
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <div class="cp-footer">
            <button class="cp-link" (click)="toggleAnteriores()">
              {{ mostrarAnteriores ? 'Ver solo no leídas' : 'Ver alertas anteriores' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .campana-wrap {
        position: relative;
      }
      .campana-btn {
        position: relative;
        background: none;
        border: none;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      .campana-btn:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .campana-ico {
        font-size: 20px;
      }
      .campana-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 800;
        min-width: 16px;
        height: 16px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        border: 2px solid white;
      }
      .campana-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.35);
        z-index: 40;
      }
      .campana-panel {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: 380px;
        max-width: 92vw;
        background: white;
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
        z-index: 41;
        display: flex;
        flex-direction: column;
        animation: slide-in 0.18s ease-out;
      }
      @keyframes slide-in {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      .cp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        border-bottom: 1px solid #e2e8f0;
      }
      .cp-title {
        margin: 0;
        font-size: 16px;
        color: #1e293b;
      }
      .cp-close {
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        color: #64748b;
        line-height: 1;
      }
      .cp-loading {
        display: flex;
        justify-content: center;
        padding: 40px 0;
      }
      .cp-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid #e2e8f0;
        border-top-color: #4f46e5;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .cp-empty {
        text-align: center;
        color: #94a3b8;
        padding: 48px 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }
      .cp-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 14px;
      }
      .cp-item {
        display: flex;
        gap: 10px;
        padding: 14px 6px;
        border-bottom: 1px solid #f1f5f9;
      }
      .cp-item-leida {
        opacity: 0.55;
      }
      .cp-item-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #cbd5e1;
        margin-top: 6px;
        flex-shrink: 0;
      }
      .cp-item-dot-nueva {
        background: #ef4444;
      }
      .cp-item-body {
        flex: 1;
        min-width: 0;
      }
      .cp-item-meta {
        display: flex;
        gap: 6px;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }
      .cp-chip {
        font-size: 11px;
        font-weight: 700;
        background: #eef2ff;
        color: #4338ca;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .cp-chip-juego {
        background: #fef3c7;
        color: #92400e;
      }
      .cp-item-msg {
        font-size: 13px;
        color: #334155;
        line-height: 1.5;
      }
      .cp-item-fecha {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
      }
      .cp-item-acciones {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
      .cp-btn {
        font-size: 11.5px;
        font-weight: 700;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        border: none;
      }
      .cp-btn-detalle {
        background: #4f46e5;
        color: white;
      }
      .cp-btn-leida {
        background: #f1f5f9;
        color: #475569;
      }
      .cp-footer {
        border-top: 1px solid #e2e8f0;
        padding: 12px 20px;
      }
      .cp-link {
        background: none;
        border: none;
        color: #4f46e5;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }
    `,
  ],
})
export class CampanaNotificacionesComponent implements OnInit, OnDestroy {
  // CA-05: controlado por la preferencia del padre/docente (perfil > notificaciones in-app).
  @Input() notificacionesActivas = true;
  // Ruta base para "Ver detalle" (CA-03): '/padre/historial' o '/docente/historial'.
  @Input() historialBasePath = '/padre/historial';

  private _usuarioId!: number;
  @Input() set usuarioId(id: number) {
    this._usuarioId = id;
    if (id) this.cargar();
  }
  get usuarioId(): number {
    return this._usuarioId;
  }

  notificaciones: NotificacionAlerta[] = [];
  panelAbierto = false;
  mostrarAnteriores = false;
  cargando = false;

  private intervalo?: ReturnType<typeof setInterval>;

  constructor(
    private notificacionesService: NotificacionesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // CA-01: refresco periódico para simular "tiempo real" sin websockets.
    this.intervalo = setInterval(() => this.cargar(), INTERVALO_REFRESCO_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  get noLeidas(): NotificacionAlerta[] {
    return this.notificaciones.filter((n) => !n.leida);
  }

  get visibles(): NotificacionAlerta[] {
    return this.mostrarAnteriores ? this.notificaciones : this.noLeidas;
  }

  cargar(): void {
    if (!this.usuarioId) return;
    this.cargando = this.notificaciones.length === 0;
    this.notificacionesService
      .getNotificaciones(this.usuarioId)
      .pipe(catchError(() => of([])))
      .subscribe((data) => {
        this.notificaciones = data;
        this.cargando = false;
        this.cdr.detectChanges();
      });
  }

  togglePanel(): void {
    this.panelAbierto = !this.panelAbierto;
    if (this.panelAbierto) this.cargar();
  }

  toggleAnteriores(): void {
    this.mostrarAnteriores = !this.mostrarAnteriores;
    this.cdr.detectChanges();
  }

  // CA-04: marcar una alerta puntual como leída.
  marcarLeida(n: NotificacionAlerta): void {
    this.notificacionesService
      .marcarLeida(n.id)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        n.leida = true;
        this.cdr.detectChanges();
      });
  }

  // CA-03: navega al historial del niño en ese juego, con las sesiones de
  // la regresión resaltadas, y cierra el panel.
  verDetalle(n: NotificacionAlerta): void {
    if (!n.ninoPerfil) return;
    this.panelAbierto = false;
    this.router.navigate([this.historialBasePath, n.ninoPerfil.id], {
      queryParams: {
        nombre: n.ninoPerfil.nombre,
        juego: n.juego?.id ?? null,
        resaltar: n.sesionesResaltadas ?? null,
      },
    });
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
