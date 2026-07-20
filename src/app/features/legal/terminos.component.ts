import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="legal-page">
      <div class="bg-decor" aria-hidden="true">
        <span class="blob blob-1"></span>
        <span class="blob blob-2"></span>
      </div>

      <div class="legal-card">
        <div class="legal-header">
          <div class="logo-badge">📋</div>
          <h1>Términos de Servicio</h1>
          <p>Última actualización: julio 2026</p>
        </div>

        <div class="legal-body">

          <h2>1. Aceptación de los términos</h2>
          <p>Al registrarse y utilizar FocusKids, usted acepta quedar vinculado por estos Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no deberá utilizar la plataforma.</p>

          <h2>2. Descripción del servicio</h2>
          <p>FocusKids es una plataforma educativa digital que ofrece juegos cognitivos adaptativos diseñados para apoyar a niños con TDAH y dificultades de aprendizaje. La plataforma está destinada a padres, tutores y docentes que deseen supervisar el progreso cognitivo de los menores a su cargo.</p>

          <h2>3. Registro y cuentas</h2>
          <p>Para acceder a las funcionalidades de FocusKids debe crear una cuenta con información veraz y actualizada. Es su responsabilidad mantener la confidencialidad de sus credenciales. No debe compartir su cuenta con terceros ni permitir que menores accedan a la sección de administración.</p>

          <h2>4. Uso apropiado</h2>
          <p>Usted se compromete a utilizar FocusKids exclusivamente con fines educativos y de acuerdo con la legislación aplicable en Costa Rica. Queda prohibido:</p>
          <ul>
            <li>Usar la plataforma para actividades ilícitas o que perjudiquen a terceros.</li>
            <li>Intentar acceder de forma no autorizada a otras cuentas o sistemas.</li>
            <li>Reproducir, distribuir o modificar el contenido de la plataforma sin autorización escrita.</li>
            <li>Recopilar datos de otros usuarios sin su consentimiento.</li>
          </ul>

          <h2>5. Datos de menores</h2>
          <p>FocusKids maneja datos de menores de edad únicamente con el consentimiento expreso del padre, tutor o docente responsable. Los perfiles de niños son gestionados exclusivamente por los adultos registrados. Cumplimos con la Ley de Protección de la Persona frente al tratamiento de sus datos personales (Ley 8968) de Costa Rica.</p>

          <h2>6. Propiedad intelectual</h2>
          <p>Todo el contenido de FocusKids, incluyendo juegos, diseños, textos, imágenes y código fuente, es propiedad del equipo de FocusKids (proyecto académico UCENFOTEC) y está protegido por las leyes de propiedad intelectual aplicables. No se concede ninguna licencia implícita sobre dicho contenido.</p>

          <h2>7. Disponibilidad del servicio</h2>
          <p>FocusKids es un proyecto académico en desarrollo y puede presentar interrupciones, actualizaciones o cambios sin previo aviso. No garantizamos disponibilidad continua del servicio.</p>

          <h2>8. Limitación de responsabilidad</h2>
          <p>FocusKids no se responsabiliza por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la plataforma. El servicio se provee "tal como está" sin garantías de ningún tipo.</p>

          <h2>9. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios serán notificados por correo electrónico o mediante aviso en la plataforma. El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.</p>

          <h2>10. Contacto</h2>
          <p>Para consultas sobre estos Términos puede escribirnos a <strong>focuskidscaag@gmail.com</strong>.</p>

        </div>

        <div class="legal-footer">
          <a routerLink="/auth/register" class="back-btn">← Volver al registro</a>
          <a routerLink="/" class="home-btn">Ir al inicio</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 16px;
      background: linear-gradient(160deg, #eaf6ff 0%, #f1ecff 55%, #fff6e8 100%);
      position: relative;
      overflow: hidden;
    }

    .bg-decor { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .blob { position: absolute; border-radius: 50%; opacity: 0.45; }
    .blob-1 { width: 300px; height: 300px; background: #cff3ea; top: -80px; left: -80px; }
    .blob-2 { width: 200px; height: 200px; background: #ffe1ce; bottom: -60px; right: -60px; }

    .legal-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 720px;
      background: #ffffff;
      border-radius: 28px;
      box-shadow: 0 14px 40px rgba(30, 154, 133, 0.14);
      overflow: hidden;
    }

    .legal-header {
      text-align: center;
      padding: 40px 32px 24px;
      background: linear-gradient(135deg, #1e9a85, #3fd6be);
      color: white;
    }
    .logo-badge { font-size: 40px; margin-bottom: 12px; }
    .legal-header h1 {
      font-family: 'Baloo 2', 'Quicksand', sans-serif;
      font-size: 28px; font-weight: 800; margin: 0 0 4px;
    }
    .legal-header p {
      font-family: 'Quicksand', sans-serif;
      font-size: 13px; opacity: 0.85; margin: 0;
    }

    .legal-body {
      padding: 32px 40px;
      font-family: 'Quicksand', sans-serif;
      color: #33415c;
      line-height: 1.7;
    }
    .legal-body h2 {
      font-family: 'Baloo 2', 'Quicksand', sans-serif;
      font-size: 16px; font-weight: 700;
      color: #1e9a85; margin: 24px 0 8px;
    }
    .legal-body h2:first-child { margin-top: 0; }
    .legal-body p { font-size: 14px; margin: 0 0 4px; color: #4a5568; }
    .legal-body ul { margin: 8px 0 4px; padding-left: 20px; }
    .legal-body li { font-size: 14px; color: #4a5568; margin-bottom: 4px; }

    .legal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 40px 32px;
      border-top: 1px solid #e8f5f2;
      gap: 12px;
    }
    .back-btn, .home-btn {
      font-family: 'Quicksand', sans-serif;
      font-size: 14px; font-weight: 700;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 12px;
      transition: all .2s;
    }
    .back-btn { color: #1e9a85; background: #e8f5f2; }
    .back-btn:hover { background: #cff3ea; }
    .home-btn { color: white; background: linear-gradient(135deg, #1e9a85, #3fd6be); }
    .home-btn:hover { box-shadow: 0 4px 14px rgba(30,154,133,0.35); }

    @media (max-width: 600px) {
      .legal-body { padding: 24px 20px; }
      .legal-footer { flex-direction: column; padding: 16px 20px 24px; }
      .back-btn, .home-btn { width: 100%; text-align: center; }
    }
  `]
})
export class TerminosComponent {}
