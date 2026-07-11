import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';

interface Juego {
  nombre: string; tipo: string; descripcion: string; icono: string; color: string;
}
interface Miembro {
  nombre: string; rol: string; iniciales: string; color: string; linkedin: string; destacado?: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- ══ NAVBAR ══ -->
    <nav class="navbar">
      <div class="navbar-inner">
        <a routerLink="/" class="logo">
          <span class="logo-icon">🧠</span>
          <span class="logo-text">FocusKids</span>
        </a>
        <div class="nav-links">
          <a href="#como-funciona">¿Cómo funciona?</a>
          <a href="#juegos">Juegos</a>
          <a href="#para-quien">Para quién</a>
          <a href="#equipo">Equipo</a>
        </div>
        <div class="nav-actions">
          <a routerLink="/auth/login" class="btn-outline">Iniciar sesión</a>
          <a routerLink="/auth/register" class="btn-filled">Comenzar gratis</a>
        </div>
      </div>
    </nav>

    <!-- ══ HERO 3D ══ -->
    <section class="hero">
      <canvas #canvas3d class="hero-canvas"></canvas>
      <div class="hero-gradient"></div>
      <div class="hero-inner">
        <div class="hero-text">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            Neurociencia aplicada a la educación infantil
          </div>
          <h1>Aprendizaje adaptativo para<br><span class="gradient-text">mentes extraordinarias</span></h1>
          <p class="hero-subtitle">FocusKids combina 12 juegos cognitivos diseñados por especialistas con inteligencia artificial adaptativa para apoyar a niños con TDAH y dificultades de aprendizaje.</p>
          <div class="hero-actions">
            <a routerLink="/auth/register" class="btn-hero-primary">
              Comenzar gratis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a routerLink="/auth/login" class="btn-hero-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
              Iniciar sesión
            </a>
          </div>
          <div class="hero-trust">
            <span>✓ Gratis para empezar</span>
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ Datos protegidos</span>
          </div>
        </div>
        <div class="hero-cards-3d">
          <div class="hcard hcard-1"><div class="hcard-icon">🎯</div><div class="hcard-info"><span class="hcard-name">Foco Extremo</span><span class="hcard-tipo">ATENCIÓN</span></div></div>
          <div class="hcard hcard-2"><div class="hcard-icon">🧩</div><div class="hcard-info"><span class="hcard-name">Piezas en Tiempo</span><span class="hcard-tipo">PERCEPCIÓN</span></div></div>
          <div class="hcard hcard-3"><div class="hcard-icon">🔢</div><div class="hcard-info"><span class="hcard-name">Cascada Numérica</span><span class="hcard-tipo">CÁLCULO</span></div></div>
          <div class="hcard hcard-4"><div class="hcard-icon">🎵</div><div class="hcard-info"><span class="hcard-name">Ritmo y Patrón</span><span class="hcard-tipo">MEMORIA</span></div></div>
          <div class="hcard hcard-5"><div class="hcard-icon">🌀</div><div class="hcard-info"><span class="hcard-name">Laberinto Cognitivo</span><span class="hcard-tipo">MEMORIA</span></div></div>
        </div>
      </div>
      <div class="scroll-indicator"><div class="scroll-line"></div><span>Scroll</span></div>
    </section>

    <!-- ══ STATS ══ -->
    <section class="stats">
      <div class="stats-inner">
        <div class="stat-item">
          <div class="stat-icon">🎮</div>
          <span class="stat-number">12</span>
          <span class="stat-label">Juegos cognitivos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon">🧠</div>
          <span class="stat-number">8</span>
          <span class="stat-label">Áreas de desarrollo</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon">⚡</div>
          <span class="stat-number">3</span>
          <span class="stat-label">Niveles adaptativos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon">🤖</div>
          <span class="stat-number">IA</span>
          <span class="stat-label">Motor de dificultad</span>
        </div>
      </div>
    </section>

    <!-- ══ CÓMO FUNCIONA ══ -->
    <section class="how-it-works" id="como-funciona">
      <div class="section-inner">
        <div class="section-header">
          <div class="section-tag">Proceso</div>
          <h2>¿Cómo funciona FocusKids?</h2>
          <p>Tres pasos simples para comenzar un viaje de aprendizaje personalizado</p>
        </div>
        <div class="steps-wrapper">
          <div class="steps-line"></div>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-bubble">01</div>
              <div class="step-body">
                <div class="step-icon-wrap" style="background:linear-gradient(135deg,#4F46E5,#7C3AED)">🧑‍💻</div>
                <h3>Crea el perfil</h3>
                <p>Registra a tu hijo con su información básica y diagnóstico. El sistema configura automáticamente un ambiente personalizado.</p>
              </div>
            </div>
            <div class="step-card">
              <div class="step-bubble">02</div>
              <div class="step-body">
                <div class="step-icon-wrap" style="background:linear-gradient(135deg,#10B981,#059669)">🎮</div>
                <h3>Juega y aprende</h3>
                <p>El niño juega los 12 juegos mientras la IA monitorea su rendimiento y ajusta la dificultad automáticamente en tiempo real.</p>
              </div>
            </div>
            <div class="step-card">
              <div class="step-bubble">03</div>
              <div class="step-body">
                <div class="step-icon-wrap" style="background:linear-gradient(135deg,#F59E0B,#D97706)">📊</div>
                <h3>Monitorea el progreso</h3>
                <p>Padres y docentes reciben reportes detallados, métricas de sesión y alertas automáticas cuando se detecta regresión.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ JUEGOS ══ -->
    <section class="games-section" id="juegos">
      <div class="games-noise"></div>
      <div class="section-inner">
        <div class="section-header">
          <div class="section-tag tag-light">Juegos</div>
          <h2 class="h2-light">12 juegos cognitivos diseñados por especialistas</h2>
          <p class="p-light">Cada juego entrena habilidades específicas respaldadas por neurociencia</p>
        </div>
        <div class="games-grid">
          @for (juego of juegos; track juego.nombre) {
            <div class="game-card"
                 (mousemove)="onCardTilt($event)"
                 (mouseleave)="onCardLeave($event)">
              <div class="card-glow"></div>
              <div class="game-top">
                <span class="game-icon">{{ juego.icono }}</span>
                <span class="game-tipo-badge" [style.background]="juego.color + '33'" [style.color]="juego.color" [style.borderColor]="juego.color + '55'">{{ juego.tipo }}</span>
              </div>
              <h4>{{ juego.nombre }}</h4>
              <p>{{ juego.descripcion }}</p>
              <div class="game-footer" [style.background]="juego.color + '22'">
                <span [style.color]="juego.color">● Activo</span>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ══ PARA QUIÉN ══ -->
    <section class="for-who" id="para-quien">
      <div class="section-inner">
        <div class="section-header">
          <div class="section-tag">Roles</div>
          <h2>Diseñado para toda la comunidad educativa</h2>
          <p>Cada usuario tiene una experiencia adaptada a su necesidad</p>
        </div>
        <div class="roles-grid">
          <div class="role-card role-padre">
            <div class="role-badge-top" style="background:linear-gradient(135deg,#4F46E5,#7C3AED)">👨‍👩‍👧 Padres y tutores</div>
            <ul class="role-features">
              <li><span class="check-box" style="background:#4F46E5">✓</span>Dashboard con resumen de actividad diaria</li>
              <li><span class="check-box" style="background:#4F46E5">✓</span>Gestión de múltiples perfiles de niños</li>
              <li><span class="check-box" style="background:#4F46E5">✓</span>Reportes semanales de progreso cognitivo</li>
              <li><span class="check-box" style="background:#4F46E5">✓</span>Alertas automáticas de regresión</li>
              <li><span class="check-box" style="background:#4F46E5">✓</span>Historial completo de sesiones de juego</li>
            </ul>
            <a routerLink="/auth/register" class="role-cta" style="background:linear-gradient(135deg,#4F46E5,#7C3AED)">Registrarse como padre →</a>
          </div>
          <div class="role-card role-docente">
            <div class="role-badge-top" style="background:linear-gradient(135deg,#10B981,#059669)">👩‍🏫 Docentes</div>
            <ul class="role-features">
              <li><span class="check-box" style="background:#10B981">✓</span>Visión grupal del rendimiento de estudiantes</li>
              <li><span class="check-box" style="background:#10B981">✓</span>Seguimiento por institución y grado</li>
              <li><span class="check-box" style="background:#10B981">✓</span>Reportes exportables para reuniones</li>
              <li><span class="check-box" style="background:#10B981">✓</span>Identificación temprana de dificultades</li>
              <li><span class="check-box" style="background:#10B981">✓</span>Recomendaciones pedagógicas basadas en datos</li>
            </ul>
            <a routerLink="/auth/register" class="role-cta" style="background:linear-gradient(135deg,#10B981,#059669)">Registrarse como docente →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ IA / CIENCIA ══ -->
    <section class="science-section">
      <div class="section-inner science-inner">
        <div class="science-text">
          <div class="section-tag tag-light">Motor IA</div>
          <h2 class="h2-light">Dificultad adaptativa en tiempo real</h2>
          <p class="p-light">Cada sesión genera docenas de métricas cognitivas que alimentan el motor de IA. El sistema detecta patrones, ajusta la dificultad y emite alertas de regresión automáticamente.</p>
          <div class="science-domains">
            <span class="domain-tag">🎯 Atención</span>
            <span class="domain-tag">🧠 Memoria</span>
            <span class="domain-tag">⚡ Velocidad</span>
            <span class="domain-tag">🔢 Cálculo</span>
            <span class="domain-tag">📝 Lenguaje</span>
            <span class="domain-tag">🔬 Lógica</span>
            <span class="domain-tag">👁️ Percepción</span>
            <span class="domain-tag">📖 Lectura</span>
          </div>
        </div>
        <div class="science-cards">
          <div class="sci-card sci-1">
            <span class="sci-num">3</span>
            <span class="sci-lbl">Niveles de dificultad adaptativos por juego</span>
          </div>
          <div class="sci-card sci-2">
            <span class="sci-num">IA</span>
            <span class="sci-lbl">Motor que ajusta dificultad según rendimiento en tiempo real</span>
          </div>
          <div class="sci-card sci-3">
            <span class="sci-num">36+</span>
            <span class="sci-lbl">Parámetros cognitivos monitoreados por sesión</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ EQUIPO ══ -->
    <section class="team-section" id="equipo">
      <div class="section-inner">
        <div class="section-header">
          <div class="section-tag">Equipo</div>
          <h2>Las personas detrás de FocusKids</h2>
          <p>Estudiantes de Ingeniería en Software de UCENFOTEC · 2026</p>
          <div class="caag-brand">
            <img src="caag-logo.png" class="caag-logo" alt="CAAG Solutions">
            <span class="caag-sub">Code Architecture &amp; Application Group</span>
          </div>
        </div>
        <div class="team-grid">
          @for (m of equipo; track m.nombre) {
            <a class="team-card" [class.team-featured]="m.destacado"
               [href]="m.linkedin" target="_blank" rel="noopener noreferrer">
              <div class="team-avatar" [style.background]="'linear-gradient(135deg,' + m.color + 'cc,' + m.color + '66)'">
                <span class="team-iniciales">{{ m.iniciales }}</span>
              </div>
              <div class="team-info">
                <h4>{{ m.nombre }}</h4>
                <span class="team-rol" [style.background]="m.color + '22'" [style.color]="m.color" [style.borderColor]="m.color + '44'">{{ m.rol }}</span>
              </div>
              <div class="team-uni">UCENFOTEC · Ing. Software</div>
              <div class="team-linkedin-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                Ver perfil en LinkedIn
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ══ CTA ══ -->
    <section class="cta-section">
      <div class="cta-noise"></div>
      <div class="cta-inner">
        <div class="cta-badge">🚀 Empiece hoy mismo</div>
        <h2>Su hijo merece la mejor herramienta de aprendizaje</h2>
        <p>Únase a FocusKids y vea la diferencia que hace el aprendizaje verdaderamente personalizado</p>
        <div class="cta-buttons">
          <a routerLink="/auth/register" class="btn-cta-primary">Crear cuenta gratis</a>
          <a routerLink="/auth/login" class="btn-cta-secondary">Ya tengo cuenta</a>
        </div>
      </div>
    </section>

    <!-- ══ FOOTER ══ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="logo"><span class="logo-icon">🧠</span><span class="logo-text">FocusKids</span></div>
          <p>Plataforma de aprendizaje cognitivo adaptativo para niños con TDAH y dificultades de aprendizaje.</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>Plataforma</h4>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#juegos">Los juegos</a>
            <a href="#para-quien">Para quién</a>
            <a href="#equipo">Equipo</a>
          </div>
          <div class="footer-col">
            <h4>Acceso</h4>
            <a routerLink="/auth/login">Iniciar sesión</a>
            <a routerLink="/auth/register">Registrarse</a>
          </div>
          <div class="footer-col">
            <h4>Proyecto</h4>
            <a href="#">UCENFOTEC 2026</a>
            <a href="#">Ing. en Software</a>
            <a href="#equipo">CAAG Solutions</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 FocusKids — Proyecto académico UCENFOTEC. Todos los derechos reservados.</p>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1E293B; }

    /* ── NAVBAR ── */
    .navbar { position: fixed; top:0; left:0; right:0; z-index:1000; background:rgba(5,5,15,0.88); backdrop-filter:blur(18px); border-bottom:1px solid rgba(255,255,255,0.07); }
    .navbar-inner { max-width:1200px; margin:0 auto; padding:0 24px; height:66px; display:flex; align-items:center; gap:32px; }
    .logo { display:flex; align-items:center; gap:8px; text-decoration:none; flex-shrink:0; }
    .logo-icon { font-size:26px; }
    .logo-text { font-size:20px; font-weight:700; color:#818CF8; }
    .nav-links { display:flex; gap:28px; flex:1; }
    .nav-links a { text-decoration:none; color:rgba(255,255,255,0.55); font-size:14px; font-weight:500; transition:color 0.2s; }
    .nav-links a:hover { color:#fff; }
    .nav-actions { display:flex; gap:10px; flex-shrink:0; }
    .btn-outline { padding:8px 18px; border:1.5px solid rgba(255,255,255,0.2); border-radius:8px; color:white; text-decoration:none; font-size:14px; font-weight:500; transition:all 0.2s; }
    .btn-outline:hover { border-color:#818CF8; color:#818CF8; }
    .btn-filled { padding:8px 18px; background:#4F46E5; border-radius:8px; color:white; text-decoration:none; font-size:14px; font-weight:600; transition:all 0.2s; }
    .btn-filled:hover { background:#4338CA; transform:translateY(-1px); }

    /* ── HERO ── */
    .hero { position:relative; min-height:100vh; background:#05050F; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding-top:66px; }
    .hero-canvas { position:absolute; inset:0; width:100%!important; height:100%!important; pointer-events:none; }
    .hero-gradient { position:absolute; inset:0; background: radial-gradient(ellipse 60% 50% at 25% 50%, rgba(79,70,229,0.2) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 75% 40%, rgba(16,185,129,0.1) 0%, transparent 70%); pointer-events:none; }
    .hero-inner { position:relative; z-index:2; max-width:1200px; width:100%; padding:60px 24px; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
    .hero-text { display:flex; flex-direction:column; gap:24px; }
    .hero-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(129,140,248,0.12); border:1px solid rgba(129,140,248,0.3); padding:6px 14px; border-radius:100px; font-size:13px; color:#A5B4FC; width:fit-content; }
    .badge-dot { width:7px; height:7px; background:#10B981; border-radius:50%; animation:pulse-dot 2s infinite; }
    @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.7} }
    .hero-text h1 { font-size:54px; font-weight:800; line-height:1.1; color:white; margin:0; }
    .gradient-text { background:linear-gradient(135deg,#818CF8 0%,#10B981 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .hero-subtitle { font-size:17px; line-height:1.75; color:#94A3B8; margin:0; max-width:480px; }
    .hero-actions { display:flex; gap:14px; align-items:center; }
    .btn-hero-primary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:linear-gradient(135deg,#4F46E5,#7C3AED); color:white; border-radius:12px; text-decoration:none; font-size:16px; font-weight:600; transition:all 0.25s; box-shadow:0 0 30px rgba(79,70,229,0.4); }
    .btn-hero-primary:hover { transform:translateY(-3px); box-shadow:0 0 50px rgba(79,70,229,0.6); }
    .btn-hero-secondary { display:inline-flex; align-items:center; gap:8px; padding:14px 24px; border:1.5px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.85); border-radius:12px; text-decoration:none; font-size:16px; font-weight:500; transition:all 0.2s; }
    .btn-hero-secondary:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.4); }
    .hero-trust { display:flex; gap:20px; flex-wrap:wrap; }
    .hero-trust span { font-size:13px; color:#475569; }
    .hero-cards-3d { position:relative; height:420px; display:flex; align-items:center; justify-content:center; }
    .hcard { position:absolute; display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.06); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.12); border-radius:16px; padding:14px 18px; }
    .hcard-icon { font-size:28px; }
    .hcard-info { display:flex; flex-direction:column; gap:2px; }
    .hcard-name { font-size:14px; font-weight:600; color:white; }
    .hcard-tipo { font-size:10px; font-weight:700; letter-spacing:1px; color:#818CF8; }
    .hcard-1 { top:20px; left:20px; animation:fc1 6s ease-in-out infinite; }
    .hcard-2 { top:70px; right:0; animation:fc2 7s ease-in-out infinite 0.5s; }
    .hcard-3 { top:50%; left:0; transform:translateY(-50%); animation:fc3 5.5s ease-in-out infinite 1s; }
    .hcard-4 { bottom:90px; right:10px; animation:fc4 6.5s ease-in-out infinite 0.3s; }
    .hcard-5 { bottom:20px; left:30px; animation:fc1 7s ease-in-out infinite 1.5s; }
    @keyframes fc1 { 0%,100%{transform:translateY(0) rotate3d(1,1,0,0deg)} 33%{transform:translateY(-16px) rotate3d(1,0,1,4deg)} 66%{transform:translateY(-8px) rotate3d(0,1,1,-3deg)} }
    @keyframes fc2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px) rotate3d(1,1,0,5deg)} }
    @keyframes fc3 { 0%,100%{transform:translateY(-50%)} 50%{transform:translateY(calc(-50% - 14px)) rotate3d(0,1,0,-4deg)} }
    @keyframes fc4 { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-18px) rotate3d(1,1,0,6deg)} }
    .scroll-indicator { position:absolute; bottom:28px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; z-index:2; }
    .scroll-line { width:1.5px; height:36px; background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.35)); animation:scr 2s ease-in-out infinite; }
    @keyframes scr { 0%,100%{opacity:0.4} 50%{opacity:1} }
    .scroll-indicator span { font-size:9px; font-weight:700; letter-spacing:2.5px; color:rgba(255,255,255,0.3); text-transform:uppercase; }

    /* ── STATS ── */
    .stats { background:linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%); border-bottom:1px solid rgba(255,255,255,0.06); }
    .stats-inner { max-width:1200px; margin:0 auto; padding:48px 24px; display:flex; align-items:center; justify-content:center; }
    .stat-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; }
    .stat-icon { font-size:28px; margin-bottom:2px; }
    .stat-number { font-size:46px; font-weight:800; background:linear-gradient(135deg,#818CF8,#10B981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1; }
    .stat-label { font-size:13px; color:#64748B; text-align:center; font-weight:500; }
    .stat-divider { width:1px; height:60px; background:rgba(255,255,255,0.08); }

    /* ── SECTIONS COMMON ── */
    .section-inner { max-width:1200px; margin:0 auto; padding:88px 24px; }
    .section-header { text-align:center; margin-bottom:60px; }
    .section-tag { display:inline-block; background:#EEF2FF; color:#4F46E5; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; padding:4px 14px; border-radius:100px; margin-bottom:14px; }
    .tag-light { background:rgba(129,140,248,0.18); color:#A5B4FC; }
    .section-header h2 { font-size:40px; font-weight:800; color:#0F172A; margin:0 0 12px; }
    .h2-light { color:white!important; }
    .section-header p { font-size:17px; color:#64748B; margin:0; }
    .p-light { color:#64748B!important; }

    /* ── STEPS ── */
    .how-it-works { background:#F8FAFC; }
    .steps-wrapper { position:relative; }
    .steps-line { position:absolute; top:52px; left:calc(16.66% - 0px); right:calc(16.66%); height:2px; background:linear-gradient(90deg,#4F46E5,#10B981,#F59E0B); z-index:0; border-radius:2px; }
    .steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:28px; position:relative; z-index:1; }
    .step-card { display:flex; flex-direction:column; align-items:center; text-align:center; gap:0; }
    .step-bubble { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#4F46E5,#7C3AED); color:white; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; margin-bottom:20px; box-shadow:0 0 0 6px white, 0 0 0 8px #E0E7FF; }
    .step-body { background:white; border-radius:20px; padding:32px 24px; box-shadow:0 4px 24px rgba(0,0,0,0.06); border:1px solid #F1F5F9; display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; transition:transform 0.3s,box-shadow 0.3s; }
    .step-body:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(79,70,229,0.12); }
    .step-icon-wrap { width:60px; height:60px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:30px; }
    .step-card h3 { font-size:20px; font-weight:700; color:#0F172A; margin:0; }
    .step-card p { font-size:14px; color:#64748B; line-height:1.65; margin:0; }

    /* ── GAMES ── */
    .games-section { background:#05050F; position:relative; overflow:hidden; }
    .games-noise { position:absolute; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); opacity:0.5; pointer-events:none; }
    .games-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; position:relative; z-index:1; }
    .game-card { position:relative; overflow:hidden; background:rgba(255,255,255,0.04); border-radius:20px; padding:24px 20px 0; border:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:10px; cursor:default; transform-style:preserve-3d; will-change:transform; transition:border-color 0.2s,box-shadow 0.2s; }
    .card-glow { position:absolute; inset:0; border-radius:20px; background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(129,140,248,0.15) 0%,transparent 55%); opacity:0; transition:opacity 0.3s; pointer-events:none; }
    .game-card:hover { border-color:rgba(129,140,248,0.35); box-shadow:0 0 40px rgba(79,70,229,0.15); }
    .game-card:hover .card-glow { opacity:1; }
    .game-top { display:flex; align-items:center; justify-content:space-between; }
    .game-icon { font-size:32px; }
    .game-tipo-badge { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; padding:3px 9px; border-radius:100px; border:1px solid; }
    .game-card h4 { font-size:15px; font-weight:700; color:white; margin:0; }
    .game-card p { font-size:12.5px; color:#475569; line-height:1.55; margin:0; }
    .game-footer { margin:0 -20px; padding:8px 20px; margin-top:auto; border-top:1px solid rgba(255,255,255,0.06); font-size:11px; font-weight:600; letter-spacing:0.5px; }

    /* ── ROLES ── */
    .for-who { background:#F8FAFC; }
    .roles-grid { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
    .role-card { background:white; border-radius:24px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); border:1px solid #E2E8F0; display:flex; flex-direction:column; transition:transform 0.3s,box-shadow 0.3s; }
    .role-card:hover { transform:translateY(-6px); box-shadow:0 20px 50px rgba(0,0,0,0.1); }
    .role-badge-top { padding:20px 28px; color:white; font-size:18px; font-weight:700; }
    .role-features { list-style:none; padding:24px 28px; margin:0; display:flex; flex-direction:column; gap:14px; flex:1; }
    .role-features li { display:flex; align-items:center; gap:12px; font-size:15px; color:#334155; }
    .check-box { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:6px; color:white; font-size:12px; font-weight:700; flex-shrink:0; }
    .role-cta { display:block; margin:0 28px 28px; text-align:center; padding:13px; border-radius:12px; text-decoration:none; color:white; font-size:15px; font-weight:600; transition:opacity 0.2s,transform 0.2s; }
    .role-cta:hover { opacity:0.9; transform:translateY(-1px); }

    /* ── SCIENCE ── */
    .science-section { background:#05050F; }
    .science-inner { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
    .science-text { display:flex; flex-direction:column; gap:20px; align-items:flex-start; min-width:0; }
    .science-text h2 { font-size:36px; font-weight:800; color:white; margin:0; line-height:1.2; word-break:break-word; }
    .science-text p { font-size:16px; color:#475569; line-height:1.75; margin:0; }
    .science-domains { display:flex; flex-wrap:wrap; gap:10px; }
    .domain-tag { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); color:#64748B; padding:6px 14px; border-radius:100px; font-size:13px; }
    .science-cards { display:flex; flex-direction:column; gap:14px; }
    .sci-card { border-radius:18px; padding:24px 28px; display:flex; align-items:center; gap:18px; }
    .sci-1 { background:rgba(79,70,229,0.14); border:1px solid rgba(79,70,229,0.28); }
    .sci-2 { background:rgba(16,185,129,0.14); border:1px solid rgba(16,185,129,0.28); }
    .sci-3 { background:rgba(245,158,11,0.14); border:1px solid rgba(245,158,11,0.28); }
    .sci-num { font-size:50px; font-weight:800; color:white; flex-shrink:0; line-height:1; }
    .sci-lbl { font-size:14px; color:#64748B; line-height:1.55; }

    /* ── EQUIPO ── */
    .team-section { background:white; }
    .caag-brand { display:flex; flex-direction:column; align-items:center; gap:6px; margin-top:20px; }
    .caag-logo { height:72px; object-fit:contain; border-radius:12px; }
    .caag-sub { font-size:13px; color:#94A3B8; font-weight:500; letter-spacing:0.3px; }
    .team-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
    .team-card { background:#F8FAFC; border-radius:20px; padding:32px 24px; border:1px solid #E2E8F0; display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center; transition:transform 0.3s,box-shadow 0.3s; text-decoration:none; cursor:pointer; }
    .team-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(0,0,0,0.1); border-color:#C7D2FE; }
    .team-featured { background:linear-gradient(135deg,#EEF2FF,#F5F3FF); border-color:#C7D2FE; }
    .team-avatar { position:relative; width:84px; height:84px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .team-iniciales { font-size:28px; font-weight:800; color:white; letter-spacing:-0.5px; }
    .team-crown { position:absolute; top:-12px; right:-4px; font-size:20px; }
    .team-info { display:flex; flex-direction:column; align-items:center; gap:8px; }
    .team-info h4 { font-size:18px; font-weight:700; color:#0F172A; margin:0; }
    .team-rol { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; padding:4px 12px; border-radius:100px; border:1px solid; }
    .team-uni { font-size:12px; color:#94A3B8; font-weight:500; }
    .team-linkedin-hint { display:flex; align-items:center; gap:6px; font-size:12px; color:#4F46E5; font-weight:600; opacity:0; transition:opacity 0.2s; }
    .team-card:hover .team-linkedin-hint { opacity:1; }

    /* ── CTA ── */
    .cta-section { background:linear-gradient(135deg,#312E81 0%,#4F46E5 50%,#7C3AED 100%); position:relative; overflow:hidden; }
    .cta-noise { display:none; }
    .cta-inner { position:relative; z-index:1; max-width:640px; margin:0 auto; padding:80px 40px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:18px; box-sizing:border-box; width:100%; }
    .cta-badge { background:rgba(255,255,255,0.15); color:white; padding:6px 18px; border-radius:100px; font-size:13px; font-weight:600; white-space:nowrap; }
    .cta-inner h2 { font-size:32px; font-weight:800; color:white; margin:0; line-height:1.25; word-break:break-word; }
    .cta-inner p { font-size:16px; color:#C7D2FE; margin:0; line-height:1.65; }
    .cta-buttons { display:flex; gap:14px; flex-wrap:wrap; justify-content:center; }
    .btn-cta-primary { padding:13px 28px; background:white; color:#4338CA; border-radius:12px; text-decoration:none; font-size:15px; font-weight:700; transition:all 0.2s; white-space:nowrap; }
    .btn-cta-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,0.25); }
    .btn-cta-secondary { padding:13px 26px; border:2px solid rgba(255,255,255,0.4); color:white; border-radius:12px; text-decoration:none; font-size:15px; font-weight:600; transition:all 0.2s; white-space:nowrap; }
    .btn-cta-secondary:hover { background:rgba(255,255,255,0.12); }

    /* ── FOOTER ── */
    .footer { background:#020617; }
    .footer-inner { max-width:1200px; margin:0 auto; padding:60px 24px 40px; display:grid; grid-template-columns:1.5fr 1fr; gap:60px; }
    .footer-brand { display:flex; flex-direction:column; gap:12px; }
    .footer-brand p { font-size:14px; color:#1E293B; line-height:1.65; max-width:280px; margin:0; }
    .footer-links { display:grid; grid-template-columns:repeat(3,1fr); gap:32px; }
    .footer-col { display:flex; flex-direction:column; gap:10px; }
    .footer-col h4 { font-size:11px; font-weight:700; color:white; margin:0 0 6px; text-transform:uppercase; letter-spacing:1.5px; }
    .footer-col a { font-size:14px; color:#1E293B; text-decoration:none; transition:color 0.2s; }
    .footer-col a:hover { color:#818CF8; }
    .footer-bottom { max-width:1200px; margin:0 auto; padding:20px 24px; border-top:1px solid #0F172A; }
    .footer-bottom p { font-size:13px; color:#1E293B; margin:0; }
  `]
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas3d') canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationId!: number;
  private mouseX = 0;
  private mouseY = 0;

  private readonly NODE_COUNT = 130;
  private readonly MAX_CONNECTIONS = 450;
  private readonly CONNECTION_DIST = 95;

  private nodePositions!: Float32Array;
  private nodeVelocities!: Float32Array;
  private nodeGeometry!: THREE.BufferGeometry;
  private lineGeometry!: THREE.BufferGeometry;
  private linePositions!: Float32Array;
  private categoryMeshes: THREE.Mesh[] = [];

  juegos: Juego[] = [
    { nombre:'Espejo Mental',       tipo:'ATENCIÓN',   icono:'🪞', color:'#4F46E5', descripcion:'Imita la secuencia de movimientos para entrenar la memoria de trabajo y coordinación visoespacial.' },
    { nombre:'Foco Extremo',        tipo:'ATENCIÓN',   icono:'🎯', color:'#4F46E5', descripcion:'Presiona solo cuando aparece el estímulo objetivo para entrenar la inhibición de respuesta.' },
    { nombre:'Reacción Controlada', tipo:'ATENCIÓN',   icono:'⚡', color:'#4F46E5', descripcion:'Controla impulsos: presiona al ver el objetivo, espera al ver el inhibidor.' },
    { nombre:'Cascada Numérica',    tipo:'CÁLCULO',    icono:'🔢', color:'#059669', descripcion:'Captura números y resuelve operaciones antes de que lleguen al suelo.' },
    { nombre:'Maratón Mental',      tipo:'CÁLCULO',    icono:'🏃', color:'#059669', descripcion:'Resuelve operaciones en cadena contra el tiempo para entrenar velocidad de cálculo.' },
    { nombre:'Laberinto Cognitivo', tipo:'MEMORIA',    icono:'🌀', color:'#7C3AED', descripcion:'Navega el laberinto recordando el camino recorrido para entrenar la memoria espacial.' },
    { nombre:'Ritmo y Patrón',      tipo:'MEMORIA',    icono:'🎵', color:'#7C3AED', descripcion:'Repite secuencias de sonidos y colores para entrenar la memoria auditiva y de trabajo.' },
    { nombre:'Palabras Ocultas',    tipo:'LENGUAJE',   icono:'📝', color:'#EA580C', descripcion:'Encuentra palabras en la grilla de letras para entrenar atención selectiva y vocabulario.' },
    { nombre:'Historia Viva',       tipo:'LECTURA',    icono:'📖', color:'#D97706', descripcion:'Lee y responde preguntas de comprensión inferencial con apoyo de audio.' },
    { nombre:'Piezas en Tiempo',    tipo:'PERCEPCIÓN', icono:'🧩', color:'#0891B2', descripcion:'Completa el rompecabezas antes de que se acabe el tiempo para entrenar la percepción visual.' },
    { nombre:'Mapa Aventura',       tipo:'GEOGRAFÍA',  icono:'🗺️', color:'#65A30D', descripcion:'Explora mapas respondiendo preguntas geográficas para entrenar la memoria a largo plazo.' },
    { nombre:'Lab de Ciencias',     tipo:'LÓGICA',     icono:'🔬', color:'#DB2777', descripcion:'Combina ingredientes para completar experimentos y entrenar el pensamiento lógico.' },
  ];

  equipo: Miembro[] = [
    { nombre:'Gerald Delgado',  rol:'Coordinador General',   iniciales:'GD', color:'#4F46E5', linkedin:'https://www.linkedin.com/', destacado:true },
    { nombre:'Angie',           rol:'Coord. de Desarrollo',  iniciales:'AN', color:'#10B981', linkedin:'https://www.linkedin.com/' },
    { nombre:'Harold',          rol:'Coord. de Desarrollo',  iniciales:'HA', color:'#10B981', linkedin:'https://www.linkedin.com/' },
    { nombre:'Axel',            rol:'Coord. de Calidad',     iniciales:'AX', color:'#F59E0B', linkedin:'https://www.linkedin.com/' },
    { nombre:'Camila',          rol:'Coord. de Soporte',     iniciales:'CA', color:'#DB2777', linkedin:'https://www.linkedin.com/' },
    { nombre:'Anthony',         rol:'Coord. de Soporte',     iniciales:'AT', color:'#DB2777', linkedin:'https://www.linkedin.com/' },
  ];

  ngAfterViewInit(): void {
    this.initThreeJS();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.nodeGeometry?.dispose();
      this.lineGeometry?.dispose();
    }
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;
    const section = canvas.parentElement!;
    const W = section.clientWidth, H = section.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, W/H, 0.1, 1200);
    this.camera.position.z = 380;
    this.nodePositions = new Float32Array(this.NODE_COUNT * 3);
    this.nodeVelocities = new Float32Array(this.NODE_COUNT * 3);
    for (let i = 0; i < this.NODE_COUNT; i++) {
      this.nodePositions[i*3]   = (Math.random()-0.5)*750;
      this.nodePositions[i*3+1] = (Math.random()-0.5)*500;
      this.nodePositions[i*3+2] = (Math.random()-0.5)*250;
      this.nodeVelocities[i*3]   = (Math.random()-0.5)*0.35;
      this.nodeVelocities[i*3+1] = (Math.random()-0.5)*0.35;
      this.nodeVelocities[i*3+2] = (Math.random()-0.5)*0.08;
    }
    this.nodeGeometry = new THREE.BufferGeometry();
    this.nodeGeometry.setAttribute('position', new THREE.BufferAttribute(this.nodePositions, 3));
    this.scene.add(new THREE.Points(this.nodeGeometry, new THREE.PointsMaterial({ color:0x818CF8, size:2.5, sizeAttenuation:true, transparent:true, opacity:0.75 })));
    const ap = new Float32Array(40*3);
    for (let i=0;i<40;i++){ap[i*3]=(Math.random()-0.5)*700;ap[i*3+1]=(Math.random()-0.5)*480;ap[i*3+2]=(Math.random()-0.5)*200;}
    const ag=new THREE.BufferGeometry(); ag.setAttribute('position',new THREE.BufferAttribute(ap,3));
    this.scene.add(new THREE.Points(ag, new THREE.PointsMaterial({color:0x10B981,size:3.5,sizeAttenuation:true,transparent:true,opacity:0.6})));
    const catColors=[0x4F46E5,0x10B981,0xF59E0B,0xDB2777,0x0891B2,0x7C3AED,0xEA580C,0x65A30D];
    catColors.forEach((color,i)=>{
      const r=10+Math.random()*8;
      const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,20),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.85}));
      m.position.set((Math.random()-0.5)*550,(Math.random()-0.5)*360,(Math.random()-0.5)*120);
      this.scene.add(m); this.categoryMeshes.push(m);
      const hm=new THREE.Mesh(new THREE.SphereGeometry(r*2.2,20,20),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.07,side:THREE.BackSide}));
      hm.position.copy(m.position); this.scene.add(hm);
    });
    this.linePositions = new Float32Array(this.MAX_CONNECTIONS*6);
    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute('position',new THREE.BufferAttribute(this.linePositions,3));
    this.scene.add(new THREE.LineSegments(this.lineGeometry,new THREE.LineBasicMaterial({color:0x4F46E5,transparent:true,opacity:0.22})));
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private onMouseMove = (e: MouseEvent): void => {
    this.mouseX = (e.clientX/window.innerWidth - 0.5)*2;
    this.mouseY = (e.clientY/window.innerHeight - 0.5)*2;
  };

  private onResize = (): void => {
    const s=this.canvasRef.nativeElement.parentElement!;
    this.camera.aspect=s.clientWidth/s.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(s.clientWidth,s.clientHeight);
  };

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    for (let i=0;i<this.NODE_COUNT;i++){
      this.nodePositions[i*3]   += this.nodeVelocities[i*3];
      this.nodePositions[i*3+1] += this.nodeVelocities[i*3+1];
      this.nodePositions[i*3+2] += this.nodeVelocities[i*3+2];
      if(Math.abs(this.nodePositions[i*3])>375)   this.nodeVelocities[i*3]*=-1;
      if(Math.abs(this.nodePositions[i*3+1])>250)  this.nodeVelocities[i*3+1]*=-1;
      if(Math.abs(this.nodePositions[i*3+2])>125)  this.nodeVelocities[i*3+2]*=-1;
    }
    (this.nodeGeometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    let li=0;
    for(let i=0;i<this.NODE_COUNT&&li<this.MAX_CONNECTIONS;i++){
      for(let j=i+1;j<this.NODE_COUNT&&li<this.MAX_CONNECTIONS;j++){
        const dx=this.nodePositions[i*3]-this.nodePositions[j*3];
        const dy=this.nodePositions[i*3+1]-this.nodePositions[j*3+1];
        const dz=this.nodePositions[i*3+2]-this.nodePositions[j*3+2];
        if(Math.sqrt(dx*dx+dy*dy+dz*dz)<this.CONNECTION_DIST){
          const b=li*6;
          this.linePositions[b]=this.nodePositions[i*3]; this.linePositions[b+1]=this.nodePositions[i*3+1]; this.linePositions[b+2]=this.nodePositions[i*3+2];
          this.linePositions[b+3]=this.nodePositions[j*3]; this.linePositions[b+4]=this.nodePositions[j*3+1]; this.linePositions[b+5]=this.nodePositions[j*3+2];
          li++;
        }
      }
    }
    this.lineGeometry.setDrawRange(0,li*2);
    (this.lineGeometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    const t=Date.now()*0.001;
    this.categoryMeshes.forEach((m,i)=>{ m.scale.setScalar(1+Math.sin(t*0.8+i*1.2)*0.12); m.position.y+=Math.sin(t*0.5+i)*0.04; });
    this.camera.position.x += (this.mouseX*35 - this.camera.position.x)*0.04;
    this.camera.position.y += (-this.mouseY*25 - this.camera.position.y)*0.04;
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  };

  onCardTilt(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    card.style.transition = 'none';
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    card.style.transform = `perspective(700px) rotateX(${-((y/rect.height)-0.5)*22}deg) rotateY(${((x/rect.width)-0.5)*22}deg) translateZ(14px)`;
    const glow = card.querySelector('.card-glow') as HTMLElement;
    if (glow) { glow.style.setProperty('--mx',(x/rect.width)*100+'%'); glow.style.setProperty('--my',(y/rect.height)*100+'%'); }
  }

  onCardLeave(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
    card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  }
}
