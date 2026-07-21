import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacidad',
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
          <div class="logo-badge">🔒</div>
          <h1>Política de Privacidad</h1>
          <p>Última actualización: julio 2026</p>
        </div>

        <div class="legal-body">

          <h2>1. Responsable del tratamiento</h2>
          <p>FocusKids (proyecto académico UCENFOTEC) es responsable del tratamiento de los datos personales recabados a través de esta plataforma. Puede contactarnos en <strong>focuskidscaag@gmail.com</strong>.</p>

          <h2>2. Datos que recopilamos</h2>
          <p>Recopilamos los siguientes datos cuando usted se registra y usa FocusKids:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, correo electrónico, contraseña (cifrada), rol (padre/docente).</li>
            <li><strong>Datos de perfil de padre/tutor:</strong> teléfono (opcional), relación con el niño.</li>
            <li><strong>Datos de perfil de docente:</strong> institución educativa, grado/grupo.</li>
            <li><strong>Perfiles de niños:</strong> nombre, edad, avatar, diagnóstico (opcional), estado activo/inactivo.</li>
            <li><strong>Datos de uso:</strong> sesiones de juego, puntajes, tiempo de sesión, progreso cognitivo.</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Los datos recopilados se usan exclusivamente para:</p>
          <ul>
            <li>Proveer y personalizar la experiencia educativa adaptativa de FocusKids.</li>
            <li>Generar reportes de progreso cognitivo para padres y docentes.</li>
            <li>Enviar notificaciones relacionadas con la cuenta (verificación de correo, alertas de regresión).</li>
            <li>Mejorar los algoritmos de adaptación del contenido educativo.</li>
          </ul>

          <h2>4. Base legal</h2>
          <p>El tratamiento de datos se realiza bajo las siguientes bases legales establecidas en la Ley 8968 de Protección de la Persona frente al tratamiento de sus datos personales (Costa Rica):</p>
          <ul>
            <li>Consentimiento del titular al registrarse en la plataforma.</li>
            <li>Ejecución del contrato de servicio educativo.</li>
            <li>Interés legítimo en la mejora del servicio.</li>
          </ul>

          <h2>5. Datos de menores de edad</h2>
          <p>FocusKids trata datos de menores de edad únicamente bajo el consentimiento y la supervisión del padre, tutor o docente registrado. No recopilamos datos de contacto directo de los menores. Los perfiles infantiles solo pueden ser creados, modificados o eliminados por el adulto responsable de la cuenta.</p>

          <h2>6. Compartición de datos</h2>
          <p>FocusKids no vende, alquila ni comparte datos personales con terceros con fines comerciales. Los datos pueden ser compartidos únicamente en los siguientes casos:</p>
          <ul>
            <li>Con proveedores de servicios técnicos (alojamiento, correo) que actúen como encargados del tratamiento bajo acuerdo de confidencialidad.</li>
            <li>Cuando sea requerido por autoridades competentes conforme a la ley.</li>
          </ul>

          <h2>7. Seguridad de los datos</h2>
          <p>Implementamos medidas técnicas y organizativas para proteger sus datos, incluyendo: cifrado de contraseñas con BCrypt, autenticación mediante JWT, comunicaciones cifradas por HTTPS y acceso restringido a la base de datos. Sin embargo, ningún sistema es completamente invulnerable.</p>

          <h2>8. Retención de datos</h2>
          <p>Conservamos los datos personales mientras la cuenta esté activa o durante el tiempo necesario para cumplir con las finalidades descritas. Puede solicitar la eliminación de su cuenta y datos en cualquier momento.</p>

          <h2>9. Derechos del titular</h2>
          <p>De acuerdo con la Ley 8968, usted tiene derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre usted.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos.</li>
            <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos en ciertos casos.</li>
          </ul>
          <p>Para ejercer estos derechos, escríbanos a <strong>focuskidscaag@gmail.com</strong>.</p>

          <h2>10. Cookies</h2>
          <p>FocusKids utiliza almacenamiento local del navegador (localStorage) para mantener la sesión del usuario. No utilizamos cookies de seguimiento ni publicidad de terceros.</p>

          <h2>11. Cambios en esta política</h2>
          <p>Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos por correo electrónico ante cambios significativos. El uso continuado de la plataforma implica la aceptación de la política vigente.</p>

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
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
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
      color: #4F46E5; margin: 24px 0 8px;
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
      border-top: 1px solid #ede9fe;
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
    .back-btn { color: #4F46E5; background: #ede9fe; }
    .back-btn:hover { background: #ddd6fe; }
    .home-btn { color: white; background: linear-gradient(135deg, #4F46E5, #7C3AED); }
    .home-btn:hover { box-shadow: 0 4px 14px rgba(79,70,229,0.35); }

    @media (max-width: 600px) {
      .legal-body { padding: 24px 20px; }
      .legal-footer { flex-direction: column; padding: 16px 20px 24px; }
      .back-btn, .home-btn { width: 100%; text-align: center; }
    }
  `]
})
export class PrivacidadComponent {}
