import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChildProfileService } from '../perfiles/child-profile.service';
import { ChildProfile, ChildProfileRequest, AVATAR_EMOJIS } from '../perfiles/child-profile.model';

const AVATAR_MAP: Record<string, string> = {
  fox:'🦊', frog:'🐸', lion:'🦁', panda:'🐼', koala:'🐨',
  unicorn:'🦄', dog:'🐶', cat:'🐱', rabbit:'🐰', tiger:'🐯',
  bear:'🐻', mouse:'🐭'
};

@Component({
  selector: 'app-padre-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="root">

  <!-- ══ SIDEBAR ══ -->
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-ico">🎮</span>
      <span class="brand-txt">FocusKids</span>
    </div>

    <nav class="nav">
      <p class="nav-section">PRINCIPAL</p>
      <button class="nav-item" [class.active]="tab==='inicio'"    (click)="tab='inicio'">    <span>🏠</span>Inicio</button>
      <button class="nav-item" [class.active]="tab==='progreso'"  (click)="tab='progreso'">  <span>📊</span>Progreso</button>
      <button class="nav-item" [class.active]="tab==='logros'"    (click)="tab='logros'">    <span>🏆</span>Logros</button>
      <button class="nav-item" [class.active]="tab==='actividad'" (click)="tab='actividad'"> <span>📅</span>Actividad</button>

      <p class="nav-section">GESTIÓN</p>
      <button class="nav-item" [class.active]="tab==='hijos'"  (click)="tab='hijos'">  <span>👨‍👧‍👦</span>Mis hijos</button>
      <button class="nav-item" [class.active]="tab==='notif'"  (click)="tab='notif'">  <span>🔔</span>Notificaciones</button>
      <button class="nav-item" [class.active]="tab==='config'" (click)="tab='config'"> <span>⚙️</span>Configuración</button>
    </nav>

    <div class="sidebar-user">
      <div class="su-avatar">{{ parentInitial }}</div>
      <div class="su-info">
        <div class="su-name">{{ parentName }}</div>
        <div class="su-role">Padre / Tutor</div>
      </div>
    </div>
  </aside>

  <!-- ══ MAIN ══ -->
  <div class="main">

    <!-- Topbar -->
    <header class="topbar">
      <h1 class="topbar-title">{{ topbarTitle }}</h1>
      <div class="topbar-right">
        @if (tab === 'inicio' && selectedPerfil) {
          <div class="child-chip" (click)="showMenu=!showMenu">
            {{ avatarFn(selectedPerfil.avatar) }} {{ selectedPerfil.nombre }}, {{ selectedPerfil.edad }} años
            @if (perfiles.length > 1) { <span>▾</span> }
            @if (showMenu && perfiles.length > 1) {
              <div class="child-menu">
                @for (p of perfiles; track p.id) {
                  <button (click)="selectPerfil(p);$event.stopPropagation()">
                    {{ avatarFn(p.avatar) }} {{ p.nombre }}
                  </button>
                }
              </div>
            }
          </div>
        }
        @if (tab === 'hijos') {
          <button class="btn-new-perfil" (click)="openCreate()">+ Nuevo perfil</button>
        }
        <button class="icon-btn" title="Notificaciones">🔔</button>
        <button class="icon-btn" title="Cerrar sesión" (click)="auth.logout()">⎋</button>
      </div>
    </header>

    <!-- ══ CONTENIDO POR TAB ══ -->
    <div class="content">

      @if (loading) {
        <div class="loader"><div class="spinner"></div></div>
      }

      <!-- ── INICIO ── -->
      @if (!loading && tab === 'inicio') {
        @if (perfiles.length === 0) {
          <div class="empty">
            <div style="font-size:64px">👨‍👧</div>
            <h2>Aún no has agregado ningún hijo</h2>
            <p>Crea el primer perfil para ver su progreso aquí</p>
            <button class="btn-primary" (click)="tab='hijos'">+ Crear perfil</button>
          </div>
        }
        @if (selectedPerfil) {
          <!-- Profile card -->
          <div class="profile-card">
            <div class="pc-avatar">{{ avatarFn(selectedPerfil.avatar) }}</div>
            <div class="pc-info">
              <div class="pc-name">{{ selectedPerfil.nombre }}</div>
              <div class="pc-meta">{{ selectedPerfil.edad }} años{{ selectedPerfil.diagnostico ? ' · ' + selectedPerfil.diagnostico : '' }}</div>
              <div class="pc-xp-lbl">XP: {{ xpActual }} / {{ xpMax }} (Nivel {{ nivel }})</div>
              <div class="pc-xp-track"><div class="pc-xp-fill" [style.width.%]="xpPct"></div></div>
            </div>
            <div class="pc-chips">
              <div class="pc-chip"><div class="pc-chip-val">{{ racha }}</div><div class="pc-chip-lbl">Racha días</div></div>
              <div class="pc-chip"><div class="pc-chip-val">{{ logros }}</div><div class="pc-chip-lbl">Logros</div></div>
              <div class="pc-chip"><div class="pc-chip-val">{{ precision }}%</div><div class="pc-chip-lbl">Precisión</div></div>
            </div>
          </div>

          <!-- Stats row -->
          <div class="stats-row">
            <div class="stat-card"><div class="stat-ico">🎮</div><div class="stat-num">{{ partidas }}</div><div class="stat-lbl">Partidas esta semana</div></div>
            <div class="stat-card"><div class="stat-ico">⏱️</div><div class="stat-num">{{ tiempoJuego }}</div><div class="stat-lbl">Tiempo de juego</div></div>
            <div class="stat-card"><div class="stat-ico">📈</div><div class="stat-num green">{{ mejora }}</div><div class="stat-lbl">Mejora esta semana</div></div>
            <div class="stat-card"><div class="stat-ico">⭐</div><div class="stat-num">{{ puntos | number }}</div><div class="stat-lbl">Puntos totales</div></div>
          </div>

          <!-- Chart + panel -->
          <div class="bottom-row">
            <div class="chart-card">
              <h3 class="card-title">Actividad de la semana</h3>
              <div class="chart-body">
                <div class="chart-bars">
                  @for (d of actividad; track d.dia) {
                    <div class="bar-col">
                      <div class="bar-outer"><div class="bar-inner" [style.height.%]="(d.valor/maxAct)*100"></div></div>
                      <div class="bar-label">{{ d.dia }}</div>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="right-col">
              <div class="panel-card">
                <h3 class="card-title">Juegos por rendimiento</h3>
                @for (j of juegosPorRendimiento; track j.nombre) {
                  <div class="jr-row">
                    <div class="jr-ico" [style.background]="j.color+'1a'">{{ j.icono }}</div>
                    <div class="jr-data">
                      <div class="jr-name">{{ j.nombre }}</div>
                      <div class="jr-track"><div class="jr-fill" [style.width.%]="j.pct" [style.background]="j.color"></div></div>
                    </div>
                    <div class="jr-pct" [style.color]="j.color">{{ j.pct }}%</div>
                  </div>
                }
              </div>
              <div class="alert-card">
                <div class="alert-title">⚠️ Área de atención</div>
                <div class="alert-body">{{ areaAtencion }}</div>
              </div>
              <div class="panel-card">
                <h3 class="card-title">Última actividad</h3>
                @for (a of ultimaActividad; track a.hora) {
                  <div class="ua-row">
                    <span class="ua-ico">🕐</span>
                    <span class="ua-hora">{{ a.hora }}</span>
                    <span class="ua-juego">{{ a.juego }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }

      <!-- ── MIS HIJOS ── -->
      @if (!loading && tab === 'hijos') {
        @if (errorMsg) {
          <div class="alert-error">{{ errorMsg }} <button (click)="errorMsg=''">×</button></div>
        }
        <div class="hijos-grid">
          @for (p of perfiles; track p.id) {
            <div class="hijo-card" [class.inactivo]="!p.activo">
              @if (!p.activo) { <span class="badge-inactivo">Desactivado</span> }
              <div class="hijo-avatar">{{ avatarFn(p.avatar) }}</div>
              <div class="hijo-nombre">{{ p.nombre }}</div>
              <div class="hijo-edad">{{ p.edad }} años</div>
              @if (p.diagnostico) { <div class="hijo-diag">{{ p.diagnostico }}</div> }
              <div class="hijo-actions">
                <button class="hbtn hbtn-jugar" (click)="jugar(p)" [disabled]="!p.activo">▶ Jugar</button>
                <button class="hbtn hbtn-edit"  (click)="openEdit(p)">✏️</button>
                <button class="hbtn hbtn-tog"   (click)="toggleActivo(p)">{{ p.activo ? '⏸' : '▶' }}</button>
                <button class="hbtn hbtn-del"   (click)="pedirEliminar(p)">🗑</button>
              </div>
            </div>
          }
          <!-- Tarjeta añadir -->
          <div class="hijo-card hijo-add" (click)="openCreate()">
            <div class="hijo-avatar add-ico">＋</div>
            <div class="hijo-nombre">Nuevo perfil</div>
            <div class="hijo-edad">Agregar hijo</div>
          </div>
        </div>
      }

      <!-- ── OTROS TABS ── -->
      @if (!loading && tab !== 'inicio' && tab !== 'hijos') {
        <div class="proximamente">
          <div style="font-size:56px">🚧</div>
          <h2>Próximamente</h2>
          <p>Esta sección estará disponible en una próxima versión.</p>
        </div>
      }

    </div><!-- /content -->
  </div><!-- /main -->

  <!-- ══ MODAL PERFIL ══ -->
  @if (showModal) {
    <div class="overlay" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2 class="modal-title">{{ isEditing ? 'Editar perfil' : 'Nuevo perfil' }}</h2>
        @if (formError) { <div class="form-error">{{ formError }}</div> }

        <div class="form-group">
          <label>Nombre del niño *</label>
          <input class="form-input" type="text" [(ngModel)]="form.nombre" placeholder="Ej: Mateo" maxlength="100"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Edad</label>
            <input class="form-input" type="number" [(ngModel)]="form.edad" placeholder="Ej: 7" min="1" max="18"/>
          </div>
          <div class="form-group">
            <label>Condición (opcional)</label>
            <input class="form-input" type="text" [(ngModel)]="form.diagnostico" placeholder="Ej: TDAH leve"/>
          </div>
        </div>

        <div class="form-group">
          <label>Avatar</label>
          <div class="avatar-grid">
            @for (av of avatars; track av) {
              <button type="button" class="av-opt" [class.av-sel]="form.avatar === av"
                (click)="form.avatar = av">{{ avatarFn(av) }}</button>
            }
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeModal()">Cancelar</button>
          <button class="btn-save"   (click)="guardar()">{{ isEditing ? 'Guardar cambios' : 'Crear perfil' }}</button>
        </div>
      </div>
    </div>
  }

  <!-- ══ MODAL ELIMINAR ══ -->
  @if (showDeleteModal) {
    <div class="overlay">
      <div class="modal modal-sm">
        <div style="font-size:48px;text-align:center;margin-bottom:12px">⚠️</div>
        <h2 class="modal-title">Eliminar perfil</h2>
        <p class="delete-msg">Se eliminarán todos los datos de progreso de <strong>{{ perfilAEliminar?.nombre }}</strong>. Esta acción no se puede deshacer.</p>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="cancelarEliminar()">Cancelar</button>
          <button class="btn-danger" (click)="confirmarEliminar()">Sí, eliminar</button>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .root { display:flex; height:100vh; overflow:hidden; font-family:'Inter',-apple-system,sans-serif; background:#EEE9FF; }

    /* ── Sidebar ── */
    .sidebar { width:162px; flex-shrink:0; background:#1E1A6E; display:flex; flex-direction:column; padding:22px 0 16px; overflow-y:auto; }
    .brand { display:flex; align-items:center; gap:8px; padding:0 16px 20px; border-bottom:1px solid rgba(255,255,255,.07); }
    .brand-ico { font-size:20px; }
    .brand-txt { font-size:15px; font-weight:800; color:white; }
    .nav { flex:1; padding:12px 10px; }
    .nav-section { font-size:9px; font-weight:700; letter-spacing:1.4px; color:rgba(255,255,255,.28); padding:14px 8px 6px; text-transform:uppercase; }
    .nav-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,.48); font-size:12.5px; font-weight:600; cursor:pointer; text-align:left; transition:all .15s; margin-bottom:2px; }
    .nav-item span { font-size:15px; flex-shrink:0; }
    .nav-item:hover { background:rgba(255,255,255,.07); color:rgba(255,255,255,.85); }
    .nav-item.active { background:rgba(139,92,246,.35); color:white; }
    .sidebar-user { margin-top:auto; padding:14px 12px 0; border-top:1px solid rgba(255,255,255,.07); display:flex; align-items:center; gap:9px; }
    .su-avatar { width:34px; height:34px; border-radius:50%; flex-shrink:0; background:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:white; }
    .su-name { font-size:11.5px; font-weight:700; color:white; }
    .su-role { font-size:10px; color:rgba(255,255,255,.38); }

    /* ── Main ── */
    .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }

    /* Topbar */
    .topbar { background:white; padding:14px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E4DEFF; flex-shrink:0; }
    .topbar-title { font-size:18px; font-weight:800; color:#1E1B4B; }
    .topbar-right  { display:flex; align-items:center; gap:10px; }
    .child-chip { display:flex; align-items:center; gap:6px; background:#F3F0FF; border:1.5px solid #C4B5FD; border-radius:20px; padding:6px 14px; font-size:12.5px; font-weight:700; color:#5B21B6; cursor:pointer; position:relative; white-space:nowrap; }
    .child-menu { position:absolute; top:calc(100% + 6px); right:0; background:white; border:1px solid #E4DEFF; border-radius:12px; padding:6px; min-width:150px; box-shadow:0 8px 24px rgba(0,0,0,.1); z-index:300; }
    .child-menu button { display:block; width:100%; padding:8px 12px; text-align:left; background:none; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; color:#334155; }
    .child-menu button:hover { background:#F3F0FF; }
    .btn-new-perfil { background:#5B21B6; color:white; border:none; border-radius:12px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-new-perfil:hover { background:#4C1D95; }
    .icon-btn { background:#F3F0FF; border:1.5px solid #DDD6FE; border-radius:10px; width:36px; height:36px; font-size:16px; cursor:pointer; transition:all .2s; }
    .icon-btn:hover { background:#EDE9FE; }

    /* Content */
    .content { flex:1; overflow-y:auto; padding:20px 22px 32px; display:flex; flex-direction:column; gap:16px; }

    /* Loader / Empty / Próximamente */
    .loader { display:flex; justify-content:center; align-items:center; flex:1; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #DDD6FE; border-top-color:#7C3AED; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty, .proximamente { display:flex; flex-direction:column; align-items:center; gap:14px; padding:60px; text-align:center; }
    .empty h2, .proximamente h2 { font-size:20px; font-weight:800; color:#1E1B4B; }
    .empty p,  .proximamente p  { color:#64748B; }
    .btn-primary { background:#5B21B6; color:white; border:none; border-radius:12px; padding:12px 28px; font-size:14px; font-weight:700; cursor:pointer; }

    /* ── INICIO tab ── */
    .profile-card { background:white; border-radius:18px; padding:18px 20px; display:flex; align-items:center; gap:16px; box-shadow:0 2px 14px rgba(91,33,182,.07); }
    .pc-avatar { width:62px; height:62px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#818CF8,#4F46E5); display:flex; align-items:center; justify-content:center; font-size:34px; }
    .pc-info { flex:1; min-width:0; }
    .pc-name  { font-size:17px; font-weight:800; color:#1E1B4B; }
    .pc-meta  { font-size:12px; color:#64748B; margin:3px 0 8px; }
    .pc-xp-lbl { font-size:10.5px; color:#94A3B8; margin-bottom:5px; }
    .pc-xp-track { height:7px; background:#EEE9FF; border-radius:100px; overflow:hidden; max-width:240px; }
    .pc-xp-fill  { height:100%; background:linear-gradient(90deg,#6366F1,#C4B5FD); border-radius:100px; }
    .pc-chips { display:flex; gap:8px; flex-shrink:0; }
    .pc-chip { background:#F5F3FF; border:1.5px solid #DDD6FE; border-radius:12px; padding:10px 14px; text-align:center; min-width:70px; }
    .pc-chip-val { font-size:20px; font-weight:900; color:#4F46E5; line-height:1; }
    .pc-chip-lbl { font-size:10px; color:#94A3B8; margin-top:3px; white-space:nowrap; }
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .stat-card { background:white; border-radius:16px; padding:18px 16px; text-align:center; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .stat-ico { font-size:26px; margin-bottom:8px; }
    .stat-num { font-size:24px; font-weight:900; color:#1E1B4B; margin-bottom:4px; }
    .stat-lbl { font-size:10.5px; color:#94A3B8; }
    .green    { color:#16A34A; }
    .bottom-row { display:flex; gap:14px; align-items:flex-start; }
    .chart-card { flex:1; background:white; border-radius:18px; padding:18px 20px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .card-title { font-size:13px; font-weight:800; color:#1E1B4B; margin-bottom:16px; }
    .chart-body { padding-top:4px; }
    .chart-bars { display:flex; align-items:flex-end; justify-content:space-between; height:160px; gap:6px; padding-bottom:28px; position:relative; }
    .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; }
    .bar-outer { flex:1; width:100%; background:#F3F0FF; border-radius:8px 8px 0 0; display:flex; align-items:flex-end; overflow:hidden; margin-bottom:8px; }
    .bar-inner { width:100%; background:linear-gradient(to top,#6366F1,#A5B4FC); border-radius:8px 8px 0 0; transition:height .8s ease; }
    .bar-label { font-size:10.5px; color:#94A3B8; font-weight:600; position:absolute; bottom:0; }
    .right-col { width:240px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }
    .panel-card { background:white; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(91,33,182,.06); }
    .jr-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid #F3F0FF; }
    .jr-row:last-child { border-bottom:none; }
    .jr-ico { width:32px; height:32px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:17px; }
    .jr-data { flex:1; min-width:0; }
    .jr-name { font-size:11.5px; font-weight:700; color:#334155; margin-bottom:5px; }
    .jr-track { height:5px; background:#F3F0FF; border-radius:100px; overflow:hidden; }
    .jr-fill  { height:100%; border-radius:100px; transition:width .8s ease; }
    .jr-pct   { font-size:12.5px; font-weight:800; flex-shrink:0; min-width:32px; text-align:right; }
    .alert-card { background:#FFFBEB; border:1.5px solid #FCD34D; border-radius:14px; padding:14px; }
    .alert-title { font-size:11.5px; font-weight:800; color:#92400E; margin-bottom:6px; }
    .alert-body  { font-size:11.5px; color:#78350F; line-height:1.55; }
    .ua-row  { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #F3F0FF; }
    .ua-row:last-child { border-bottom:none; }
    .ua-ico  { font-size:14px; flex-shrink:0; }
    .ua-hora { font-size:10.5px; color:#94A3B8; flex-shrink:0; min-width:72px; }
    .ua-juego{ font-size:12px; font-weight:700; color:#4F46E5; }

    /* ── MIS HIJOS tab ── */
    .alert-error { background:#fde8e8; color:#c0524a; border-left:4px solid #c0524a; border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:13px; }
    .alert-error button { background:none; border:none; color:#c0524a; font-size:18px; cursor:pointer; }
    .hijos-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:20px; }
    .hijo-card { background:white; border-radius:20px; padding:24px 16px 18px; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow:0 4px 18px rgba(91,33,182,.08); position:relative; transition:transform .2s, box-shadow .2s; border:2px solid transparent; cursor:default; }
    .hijo-card:not(.hijo-add):not(.inactivo):hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(91,33,182,.14); border-color:#C4B5FD; }
    .hijo-card.inactivo { opacity:.55; filter:grayscale(30%); }
    .hijo-card.hijo-add { border:2.5px dashed #C4B5FD; background:rgba(243,240,255,.5); cursor:pointer; }
    .hijo-card.hijo-add:hover { background:#F3F0FF; transform:translateY(-3px); }
    .badge-inactivo { position:absolute; top:12px; right:12px; background:#7C3AED; color:white; font-size:10px; font-weight:800; padding:3px 9px; border-radius:20px; text-transform:uppercase; }
    .hijo-avatar { width:80px; height:80px; background:linear-gradient(135deg,#A78BFA,#7C3AED); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:44px; margin-bottom:4px; }
    .hijo-add .hijo-avatar { background:#EDE9FF; color:#A78BFA; font-size:36px; }
    .hijo-nombre { font-size:17px; font-weight:800; color:#1E1B4B; text-align:center; }
    .hijo-edad   { font-size:12px; color:#64748B; font-weight:600; }
    .hijo-diag   { font-size:11px; color:#A78BFA; background:#F3F0FF; padding:3px 10px; border-radius:20px; font-weight:700; }
    .hijo-actions { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; justify-content:center; }
    .hbtn { border:none; border-radius:10px; padding:6px 12px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
    .hbtn:hover { transform:scale(1.05); }
    .hbtn-jugar { background:linear-gradient(135deg,#6366F1,#4F46E5); color:white; flex:1; }
    .hbtn-jugar:disabled { background:#E8E4F4; color:#94A3B8; cursor:not-allowed; }
    .hbtn-edit  { background:#EDE9FF; color:#5B21B6; width:34px; padding:6px; }
    .hbtn-tog   { background:#FEF9C3; color:#92400E; width:34px; padding:6px; }
    .hbtn-del   { background:#FEE2E2; color:#B91C1C; width:34px; padding:6px; }

    /* ── Modales ── */
    .overlay { position:fixed; inset:0; background:rgba(30,27,78,.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
    .modal { background:white; border-radius:24px; padding:36px 40px; width:100%; max-width:440px; box-shadow:0 20px 60px rgba(30,27,78,.2); }
    .modal-sm { max-width:360px; text-align:center; }
    .modal-title { font-size:22px; font-weight:900; color:#1E1B4B; margin-bottom:20px; text-align:center; }
    .form-error { background:#fde8e8; color:#c0524a; border-radius:10px; padding:10px 14px; font-size:13px; font-weight:700; margin-bottom:16px; }
    .form-group { margin-bottom:18px; }
    .form-group label { display:block; font-size:13px; font-weight:800; color:#1E1B4B; margin-bottom:7px; }
    .form-input { width:100%; padding:12px 16px; border:2px solid #E4DEFF; border-radius:12px; font-size:15px; font-family:inherit; color:#1E1B4B; outline:none; }
    .form-input:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.12); }
    .form-row { display:flex; gap:14px; }
    .form-row .form-group { flex:1; }
    .avatar-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
    .av-opt { font-size:28px; width:48px; height:48px; border:2.5px solid transparent; border-radius:12px; background:#F3F0FF; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; line-height:1; }
    .av-opt:hover { transform:scale(1.1); }
    .av-opt.av-sel { border-color:#7C3AED; background:#EDE9FF; }
    .modal-footer { display:flex; gap:10px; margin-top:24px; justify-content:flex-end; }
    .btn-cancel { background:#F3F0FF; color:#5B21B6; border:2px solid #DDD6FE; border-radius:12px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-save   { background:linear-gradient(135deg,#7C3AED,#4F46E5); color:white; border:none; border-radius:12px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-save:hover { box-shadow:0 6px 20px rgba(124,58,237,.4); }
    .btn-danger { background:#B91C1C; color:white; border:none; border-radius:12px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .delete-msg { font-size:14px; color:#64748B; line-height:1.6; margin-bottom:4px; }
    .delete-msg strong { color:#1E1B4B; }
  `]
})
export class PadreDashboardComponent implements OnInit {

  parentName = '';
  tab        = 'inicio';
  showMenu   = false;
  loading    = true;
  errorMsg   = '';

  // Perfiles
  perfiles:       ChildProfile[] = [];
  selectedPerfil: ChildProfile | null = null;

  // Modal perfil
  showModal  = false;
  isEditing  = false;
  editingId: number | null = null;
  form: ChildProfileRequest = { nombre:'', avatar:'fox', edad:null, diagnostico:null };
  formError  = '';
  avatars    = AVATAR_EMOJIS;

  // Modal eliminar
  showDeleteModal = false;
  perfilAEliminar: ChildProfile | null = null;

  // Stats mock
  racha       = 7;
  logros      = 12;
  precision   = 85;
  xpActual    = 680;
  xpMax       = 1000;
  nivel       = 7;
  partidas    = 47;
  tiempoJuego = '3.2h';
  mejora      = '+12%';
  puntos      = 1240;
  areaAtencion = 'Muestra dificultad en Laberinto Cognitivo. Se recomienda más práctica esta semana.';

  actividad = [
    {dia:'Lun',valor:65},{dia:'Mar',valor:80},{dia:'Mié',valor:45},
    {dia:'Jue',valor:90},{dia:'Vie',valor:70},{dia:'Sáb',valor:55},{dia:'Dom',valor:30}
  ];
  juegosPorRendimiento = [
    {nombre:'Espejo Mental', icono:'🪞', pct:92, color:'#7C3AED'},
    {nombre:'Historia Viva', icono:'📖', pct:78, color:'#D97706'},
    {nombre:'Cascada Núm.',  icono:'🔢', pct:65, color:'#059669'},
    {nombre:'Laberinto',     icono:'🌀', pct:55, color:'#2563EB'},
  ];
  ultimaActividad = [
    {hora:'Hoy, 15:30',  juego:'Espejo Mental'},
    {hora:'Hoy, 14:12',  juego:'Historia Viva'},
    {hora:'Ayer, 16:00', juego:'Cascada Numérica'},
  ];

  constructor(
    public  auth:                AuthService,
    private childProfileService: ChildProfileService,
    private router:              Router,
    private cdr:                 ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.parentName = user.nombre || user.email || 'Padre';
      this.loadPerfiles(user.usuarioId);
    }
  }

  private loadPerfiles(uid: number): void {
    this.loading = true;
    this.childProfileService.getProfiles(uid).subscribe({
      next: data => {
        this.perfiles       = data;
        this.selectedPerfil = data.find(p => p.activo) ?? data[0] ?? null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  selectPerfil(p: ChildProfile): void {
    this.selectedPerfil = p; this.showMenu = false;
    this.areaAtencion = `${p.nombre} muestra dificultad en Laberinto. Se recomienda más práctica esta semana.`;
    this.cdr.detectChanges();
  }

  // ── Perfil CRUD ──
  openCreate(): void {
    this.isEditing = false; this.editingId = null;
    this.form = {nombre:'', avatar:'fox', edad:null, diagnostico:null};
    this.formError = ''; this.showModal = true; this.cdr.detectChanges();
  }

  openEdit(p: ChildProfile): void {
    this.isEditing = true; this.editingId = p.id;
    this.form = {nombre:p.nombre, avatar:p.avatar, edad:p.edad, diagnostico:p.diagnostico};
    this.formError = ''; this.showModal = true; this.cdr.detectChanges();
  }

  guardar(): void {
    if (!this.form.nombre.trim()) { this.formError = 'El nombre es obligatorio.'; return; }
    const uid = this.auth.user()!.usuarioId;
    const req: ChildProfileRequest = {
      nombre: this.form.nombre.trim(), avatar: this.form.avatar,
      edad: this.form.edad, diagnostico: this.form.diagnostico?.trim() || null
    };
    if (this.isEditing && this.editingId) {
      this.childProfileService.updateProfile(this.editingId, req, uid).subscribe({
        next: () => { this.showModal = false; this.loadPerfiles(uid); },
        error: e  => { this.formError = e.error?.message || 'Error al guardar.'; this.cdr.detectChanges(); }
      });
    } else {
      this.childProfileService.createProfile(req, uid).subscribe({
        next: () => { this.showModal = false; this.loadPerfiles(uid); },
        error: e  => { this.formError = e.error?.message || 'Error al crear.'; this.cdr.detectChanges(); }
      });
    }
  }

  toggleActivo(p: ChildProfile): void {
    const uid = this.auth.user()!.usuarioId;
    this.childProfileService.toggleStatus(p.id, uid).subscribe({
      next: () => this.loadPerfiles(uid),
      error: () => { this.errorMsg = 'Error al cambiar estado.'; this.cdr.detectChanges(); }
    });
  }

  pedirEliminar(p: ChildProfile): void {
    this.perfilAEliminar = p; this.showDeleteModal = true; this.cdr.detectChanges();
  }

  confirmarEliminar(): void {
    if (!this.perfilAEliminar) return;
    const uid = this.auth.user()!.usuarioId;
    this.childProfileService.deleteProfile(this.perfilAEliminar.id, uid).subscribe({
      next: () => { this.showDeleteModal = false; this.perfilAEliminar = null; this.loadPerfiles(uid); },
      error: () => { this.errorMsg = 'Error al eliminar.'; this.showDeleteModal = false; this.cdr.detectChanges(); }
    });
  }

  cancelarEliminar(): void { this.showDeleteModal = false; this.perfilAEliminar = null; this.cdr.detectChanges(); }
  closeModal(): void { this.showModal = false; this.cdr.detectChanges(); }

  jugar(p: ChildProfile): void {
    const uid = this.auth.user()!.usuarioId;
    this.childProfileService.switchProfile(p.id, uid).subscribe({
      next: () => this.router.navigate(['/nino/juegos']),
      error: () => { this.errorMsg = 'No se pudo cambiar el perfil.'; this.cdr.detectChanges(); }
    });
  }

  avatarFn(key?: string | null): string { return AVATAR_MAP[key ?? 'fox'] ?? '🦊'; }

  get xpPct():         number { return Math.round((this.xpActual / this.xpMax) * 100); }
  get maxAct():        number { return Math.max(...this.actividad.map(a => a.valor)); }
  get parentInitial(): string { return this.parentName.charAt(0).toUpperCase() || 'P'; }
  get topbarTitle():   string {
    const map: Record<string,string> = {
      inicio:'Dashboard de ' + (this.selectedPerfil?.nombre ?? '…'),
      hijos:'Mis hijos', progreso:'Progreso', logros:'Logros',
      actividad:'Actividad', notif:'Notificaciones', config:'Configuración'
    };
    return map[this.tab] ?? 'FocusKids';
  }
}
