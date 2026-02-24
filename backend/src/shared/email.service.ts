import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { LOGO_BASE64 } from './logo-base64.js';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  if (!to) return false;
  try {
    const info = await transporter.sendMail({
      from: ENV.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const LOGO_HTML = `
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 14px; border-radius: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">
       <img
          src="data:image/png;base64,${LOGO_BASE64}"
          alt="FleetMaster Hub"
          width="32"
          height="32"
          style="display:block"
       />
    </div>
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 900; color: #1e293b; font-size: 22px; margin-top: 12px; letter-spacing: -0.025em;">FleetMaster <span style="color: #4f46e5;">Hub</span></div>
  </div>
`;

export const templates = {
  welcome: (username: string, token: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155; text-align: center;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">¡Bienvenido a bordo, ${username}!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Gracias por confiar en <strong>FleetMaster Hub</strong> para la gestión de tu flota.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${ENV.FRONTEND_URL}/#/confirm/${token}" style="background-color: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Confirmar mi cuenta</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
  `,
  driverWelcome: (name: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">¡Bienvenido al Equipo, ${name}!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Has sido registrado exitosamente como conductor en FleetMaster Hub.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <h3 style="font-size: 14px; color: #4f46e5; margin-top: 0;">Términos y Condiciones Básicos:</h3>
        <ul style="font-size: 13px; color: #64748b; padding-left: 18px;">
          <li>El vehículo debe mantenerse en óptimas condiciones de limpieza.</li>
          <li>Los pagos de renta deben realizarse antes del vencimiento para evitar moras.</li>
          <li>Cualquier daño o siniestro debe reportarse inmediatamente al administrador.</li>
        </ul>
      </div>
    </div>
  `,
  vehicleAssignment: (name: string, vehicle: any) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">Nuevo Vehículo Asignado</h2>
      <p style="font-size: 16px; line-height: 1.6;">Hola ${name}, se te ha asignado un nuevo vehículo para tu operación.</p>
      <div style="background: #f1f5f9; padding: 32px; border-radius: 20px; text-align: center; margin: 32px 0;">
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Placa del Vehículo</div>
        <div style="font-size: 32px; font-weight: 900; color: #4f46e5; font-family: monospace;">${vehicle.licensePlate}</div>
        <div style="font-size: 14px; font-weight: bold; color: #1e293b; margin-top: 8px;">${vehicle.model} (${vehicle.year})</div>
      </div>
      <p style="font-size: 13px; text-align: center; color: #64748b;">Recuerda realizar la inspección inicial y reportar cualquier novedad.</p>
    </div>
  `,
  adminNewUser: (data: { username: string; email: string; date: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 20px; margin-bottom: 24px;">Nuevo Usuario Registrado</h2>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <p><strong>Usuario:</strong> ${data.username}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Fecha:</strong> ${new Date(data.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      </div>
    </div>
  `,
  passwordReset: (token: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">Recuperación de Acceso</h2>
      <div style="background: #f8fafc; padding: 32px; text-align: center; border-radius: 16px; margin: 32px 0; border: 1px dashed #cbd5e1;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">${token}</span>
      </div>
    </div>
  `,
  paymentConfirmation: (amount: number, date: string, type: string, createdArrear: number, totalDebt: number, pendingArrears: any[]) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <h2 style="color: #15803d; margin: 0; font-size: 20px;">Comprobante de Pago Exitoso</h2>
        <p style="color: #166534; font-size: 14px; margin: 8px 0 0 0;">Tu pago ha sido procesado y registrado correctamente.</p>
      </div>

      <h3 style="color: #1e293b; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">Detalle de la Transacción</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Monto Recibido:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: 800; font-size: 18px;">$${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Concepto:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: 600;">${type === 'renta' ? 'Renta' : 'Abono a Mora'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Fecha de Registro:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b;">${new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
        </tr>
        ${createdArrear > 0 ? `
        <tr>
          <td style="padding: 12px 0; color: #e11d48; font-size: 14px; font-weight: bold;">Nueva Mora Generada:</td>
          <td style="padding: 12px 0; text-align: right; color: #e11d48; font-weight: 800;">$${createdArrear.toLocaleString()}</td>
        </tr>
        ` : ''}
      </table>

      ${totalDebt > 0 ? `
      <div style="margin-top: 40px; padding: 24px; background-color: #fff1f2; border-radius: 20px; border: 1px solid #fecdd3;">
        <h3 style="color: #be123c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0; display: flex; align-items: center;">
          Resumen de Deuda Pendiente
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${pendingArrears.map(a => `
            <tr>
              <td style="padding: 6px 0; color: #9f1239;">Mora del ${new Date(a.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
              <td style="padding: 6px 0; text-align: right; color: #be123c; font-weight: bold;">$${a.amountOwed.toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr style="border-top: 1px solid #fda4af;">
            <td style="padding: 12px 0 0 0; font-weight: 800; color: #9f1239; font-size: 15px;">TOTAL ACUMULADO:</td>
            <td style="padding: 12px 0 0 0; text-align: right; font-weight: 900; color: #e11d48; font-size: 18px;">$${totalDebt.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      ` : `
      <div style="margin-top: 40px; padding: 16px; background-color: #f0fdf4; border-radius: 12px; text-align: center; border: 1px solid #dcfce7;">
        <p style="color: #15803d; font-size: 13px; font-weight: bold; margin: 0;">¡Tu cuenta está al día! No tienes moras pendientes.</p>
      </div>
      `}

      <div style="margin-top: 48px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Este es un comprobante automático generado por FleetMaster Hub.</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">© 2025 FleetMaster Hub System.</p>
      </div>
    </div>
  `,
  paymentFailed: (data: { plan: string; reference: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <h2 style="color: #b91c1c; margin: 0; font-size: 20px;">Pago no procesado</h2>
        <p style="color: #991b1b; font-size: 14px; margin: 8px 0 0 0;">Lamentablemente tu pago para el plan <strong>${data.plan.toUpperCase()}</strong> fue declinado.</p>
      </div>
      <p style="font-size: 14px; color: #64748b; text-align: center;">Referencia: ${data.reference}</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${ENV.APP_URL}/#/pricing-checkout" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Intentar de nuevo</a>
      </div>
    </div>
  `,
  adminPaymentNotification: (data: { user: string; email: string; plan: string; amount: number; reference: string; date: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #4f46e5; border-radius: 16px; padding: 24px; text-align: center; color: white; margin-bottom: 32px;">
        <h2 style="margin: 0; font-size: 20px;">Nuevo Pago Recibido</h2>
        <p style="opacity: 0.8; font-size: 14px; margin-top: 8px;">Una nueva suscripción ha sido activada en la plataforma.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Usuario:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: bold;">${data.user}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Email:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b;">${data.email}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Plan:</td>
          <td style="padding: 12px 0; text-align: right; color: #4f46e5; font-weight: 800; text-transform: uppercase;">${data.plan}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Monto:</td>
          <td style="padding: 12px 0; text-align: right; color: #15803d; font-weight: 800;">$${data.amount.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Referencia:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-family: monospace; font-weight: bold;">${data.reference}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b;">Fecha:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b;">${new Date(data.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
        </tr>
      </table>
    </div>
  `,
  superAdminSubscriptionNotification: (data: { user: string; email: string; plan: string; amount: number; reference: string; date: string; duration: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #dc2626; padding: 48px; border-radius: 24px; color: #334155; background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);">
      ${LOGO_HTML}
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 16px; padding: 24px; text-align: center; color: white; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9;">🔔 NOTIFICACIÓN SUPERADMIN</div>
        <h2 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 900;">Nueva Suscripción Activada</h2>
        <p style="opacity: 0.9; font-size: 13px; margin: 8px 0 0 0;">Un administrador ha pagado o renovado su plan</p>
      </div>

      <div style="background: white; border: 2px solid #fecaca; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 12px; text-transform: uppercase; color: #b91c1c; margin: 0 0 16px 0; letter-spacing: 0.05em; font-weight: 800;">📊 INFORMACIÓN DEL USUARIO</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #fee2e2;">
            <td style="padding: 10px 0; color: #7f1d1d; font-weight: 600;">Usuario:</td>
            <td style="padding: 10px 0; text-align: right; color: #1e293b; font-weight: 800;">${data.user}</td>
          </tr>
          <tr style="border-bottom: 1px solid #fee2e2;">
            <td style="padding: 10px 0; color: #7f1d1d; font-weight: 600;">Email:</td>
            <td style="padding: 10px 0; text-align: right; color: #1e293b; word-break: break-all;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; color: #7f1d1d; font-weight: 600;">Plan:</td>
            <td style="padding: 10px 0 0 0; text-align: right; color: #dc2626; font-weight: 900; text-transform: uppercase; font-size: 16px;">${data.plan}</td>
          </tr>
        </table>
      </div>

      <div style="background: white; border: 2px solid #fecaca; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 12px; text-transform: uppercase; color: #b91c1c; margin: 0 0 16px 0; letter-spacing: 0.05em; font-weight: 800;">💰 DETALLES DEL PAGO</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #fee2e2;">
            <td style="padding: 10px 0; color: #7f1d1d; font-weight: 600;">Monto:</td>
            <td style="padding: 10px 0; text-align: right; color: #15803d; font-weight: 900; font-size: 20px;">$${data.amount.toLocaleString()} COP</td>
          </tr>
          <tr style="border-bottom: 1px solid #fee2e2;">
            <td style="padding: 10px 0; color: #7f1d1d; font-weight: 600;">Duración:</td>
            <td style="padding: 10px 0; text-align: right; color: #1e293b; font-weight: 700; text-transform: uppercase;">${data.duration}</td>
          </tr>
          <tr style="border-bottom: 1px solid #fee2e2;">
            <td style="padding: 10px 0; color: #7f1d1d; font-weight: 600;">Referencia:</td>
            <td style="padding: 10px 0; text-align: right; color: #1e293b; font-family: monospace; font-weight: bold; font-size: 12px;">${data.reference}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; color: #7f1d1d; font-weight: 600;">Fecha:</td>
            <td style="padding: 10px 0 0 0; text-align: right; color: #1e293b;">${new Date(data.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
          </tr>
        </table>
      </div>

      <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 16px; text-align: center;">
        <p style="color: #15803d; font-size: 13px; font-weight: bold; margin: 0;">✅ La suscripción ha sido activada exitosamente</p>
      </div>

      <div style="margin-top: 32px; text-align: center; border-top: 2px solid #fecaca; padding-top: 16px;">
        <p style="font-size: 11px; color: #991b1b; margin: 0; font-weight: 600;">🔐 Este email es exclusivo para SuperAdmin</p>
        <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">© 2025 FleetMaster Hub System.</p>
      </div>
    </div>
  `,
  /* ================= ALERTAS ================= */

  documentExpirationAlert: (data: {
    documentType: string;
    entityName: string;
    daysRemaining: number;
    expirationDate: string;
    isExpired: boolean;
  }) => `
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:auto;padding:48px;border:2px solid ${data.isExpired ? '#dc2626' : '#f59e0b'};border-radius:24px;background:${data.isExpired ? '#fef2f2' : '#fffbeb'};">
      ${LOGO_HTML}
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">${data.isExpired ? '🚨' : '⚠️'}</div>
        <h2 style="color:${data.isExpired ? '#dc2626' : '#f59e0b'};font-size:24px;font-weight:900;margin:0 0 8px 0;">
          ${data.isExpired ? '[URGENTE] DOCUMENTO VENCIDO' : 'ALERTA DE VENCIMIENTO'}
        </h2>
        <p style="color:#64748b;font-size:14px;margin:0;">
          ${data.isExpired ? 'Requiere atención inmediata' : 'Acción requerida próximamente'}
        </p>
      </div>

      <div style="background:white;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid ${data.isExpired ? '#fecaca' : '#fed7aa'};">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px 0;color:#64748b;font-size:13px;font-weight:600;">Documento:</td>
            <td style="padding:12px 0;text-align:right;color:#1e293b;font-weight:800;font-size:14px;">${data.documentType}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px 0;color:#64748b;font-size:13px;font-weight:600;">${data.documentType.includes('Licencia') ? 'Conductor:' : 'Vehículo:'}</td>
            <td style="padding:12px 0;text-align:right;color:#1e293b;font-weight:800;font-size:14px;">${data.entityName}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px 0;color:#64748b;font-size:13px;font-weight:600;">Fecha Vencimiento:</td>
            <td style="padding:12px 0;text-align:right;color:${data.isExpired ? '#dc2626' : '#f59e0b'};font-weight:900;font-size:14px;">${new Date(data.expirationDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0 0;color:#64748b;font-size:13px;font-weight:600;">Estado:</td>
            <td style="padding:12px 0 0 0;text-align:right;">
              <span style="background:${data.isExpired ? '#dc2626' : '#f59e0b'};color:white;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:900;text-transform:uppercase;">
                ${data.isExpired ? `Vencido hace ${Math.abs(data.daysRemaining)} días` : `${data.daysRemaining} días restantes`}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:${data.isExpired ? '#dc2626' : '#f59e0b'};color:white;border-radius:12px;padding:20px;text-align:center;">
        <p style="margin:0;font-size:13px;font-weight:700;">
          ${data.isExpired 
            ? '⚠️ Este documento está vencido. Renuévelo inmediatamente para evitar sanciones y problemas legales.' 
            : '⏰ Recuerde renovar este documento antes de su vencimiento para mantener su flota operativa.'}
        </p>
      </div>

      <div style="margin-top:24px;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">
        <p style="font-size:11px;color:#94a3b8;margin:0;">Este es un recordatorio automático de FleetMaster Hub</p>
        <p style="font-size:11px;color:#94a3b8;margin:4px 0 0 0;">${data.isExpired ? 'Recibirá este email diariamente hasta que el documento sea renovado' : 'Recibirá recordatorios a los 10, 5, 3, 1 días antes del vencimiento y diarios después del vencimiento'}</p>
      </div>
    </div>
  `,

  driverLicenseExpirationAlert: (data: {
    driverName: string;
    daysRemaining: number;
    expirationDate: string;
    isExpired: boolean;
  }) => `
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:auto;padding:48px;border:2px solid ${data.isExpired ? '#dc2626' : '#f59e0b'};border-radius:24px;background:${data.isExpired ? '#fef2f2' : '#fffbeb'};">
      ${LOGO_HTML}
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">${data.isExpired ? '🚨' : '⚠️'}</div>
        <h2 style="color:${data.isExpired ? '#dc2626' : '#f59e0b'};font-size:24px;font-weight:900;margin:0 0 8px 0;">
          ${data.isExpired ? '[URGENTE] LICENCIA VENCIDA' : 'SU LICENCIA ESTÁ POR VENCER'}
        </h2>
        <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0;">
          Hola ${data.driverName}
        </p>
      </div>

      <div style="background:white;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid ${data.isExpired ? '#fecaca' : '#fed7aa'};">
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
          ${data.isExpired 
            ? '⚠️ Su licencia de conducción ha vencido. No está autorizado para conducir vehículos de la flota hasta que la renueve.' 
            : '⏰ Le recordamos que su licencia de conducción está próxima a vencer.'}
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px 0;color:#64748b;font-size:13px;font-weight:600;">Fecha Vencimiento:</td>
            <td style="padding:12px 0;text-align:right;color:${data.isExpired ? '#dc2626' : '#f59e0b'};font-weight:900;font-size:16px;">${new Date(data.expirationDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0 0;color:#64748b;font-size:13px;font-weight:600;">Estado:</td>
            <td style="padding:12px 0 0 0;text-align:right;">
              <span style="background:${data.isExpired ? '#dc2626' : '#f59e0b'};color:white;padding:6px 12px;border-radius:8px;font-size:10px;font-weight:900;text-transform:uppercase;">
                ${data.isExpired ? `Vencida hace ${Math.abs(data.daysRemaining)} días` : `${data.daysRemaining} días restantes`}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:${data.isExpired ? '#dc2626' : '#f59e0b'};color:white;border-radius:12px;padding:20px;text-align:center;">
        <p style="margin:0;font-size:14px;font-weight:700;">
          ${data.isExpired 
            ? '🚫 Contacte a su administrador inmediatamente y proceda con la renovación.' 
            : '📋 Por favor tramite la renovación con anticipación para evitar suspensión de operaciones.'}
        </p>
      </div>

      <div style="margin-top:24px;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">
        <p style="font-size:11px;color:#94a3b8;margin:0;">Recordatorio automático de FleetMaster Hub</p>
      </div>
    </div>
  `,

  /* ================= REPORTES ================= */
  subscriptionExpirationAlert: (data: {
    plan: string;
    daysRemaining: number;
    expirationDate: string;
  }) => `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;padding:48px;border:1px solid #e2e8f0;border-radius:24px;text-align:center;">
      ${LOGO_HTML}
      <h2>Tu plan está por expirar</h2>
      <p>Plan ${data.plan.toUpperCase()}</p>
      <h1>${data.daysRemaining} días</h1>
      <p>Expira el ${new Date(data.expirationDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      <a href="${ENV.APP_URL}/#/pricing-checkout"
         style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
         Renovar ahora
      </a>
    </div>
  `,
  weeklyEnterpriseReport: (stats: any) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #4f46e5; border-radius: 20px; padding: 32px; text-align: center; color: white; margin-bottom: 32px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 900;">Reporte Semanal Enterprise</h2>
        <p style="opacity: 0.8; font-size: 14px; margin-top: 8px;">Consolidado de operación del ${stats.dateRange}</p>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em;">Resumen Financiero</h3>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Recaudado</div>
            <div style="font-size: 18px; font-weight: 900; color: #15803d;">$${stats.income.toLocaleString()}</div>
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Gastado</div>
            <div style="font-size: 18px; font-weight: 900; color: #e11d48;">$${stats.expenses.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
         <div style="font-size: 12px; color: #475569; font-weight: 800;">UTILIDAD NETA DE LA SEMANA</div>
         <div style="font-size: 28px; font-weight: 900; color: #1e293b;">$${stats.net.toLocaleString()}</div>
      </div>

      <div>
        <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em;">Cartera Pendiente</h3>
        <table style="width: 100%; font-size: 14px;">
           <tr style="border-bottom: 1px solid #e2e8f0;">
             <td style="padding: 12px 0;">Total Moras Pendientes:</td>
             <td style="text-align: right; font-weight: 800; color: #be123c;">$${stats.totalDebt.toLocaleString()}</td>
           </tr>
           <tr>
             <td style="padding: 12px 0;">Vehículos Rentados:</td>
             <td style="text-align: right; font-weight: 800;">${stats.activeVehicles} de ${stats.totalVehicles}</td>
           </tr>
        </table>
      </div>

      <div style="margin-top: 40px; padding: 16px; background: #eff6ff; border-radius: 12px; text-align: center; border: 1px solid #dbeafe;">
        <p style="color: #1e40af; font-size: 12px; margin: 0; font-weight: bold;">Este reporte automático es parte de su plan Enterprise.</p>
      </div>
    </div>
  `,
  contactNotification: (name: string, email: string, message: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">Nuevo Mensaje de Contacto</h2>
      <p style="font-size: 16px; line-height: 1.6;">Has recibido un nuevo mensaje desde el landing page de <strong>FleetMaster Hub</strong>.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="font-style: italic; color: #475569;">"${message}"</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático generado por FleetMaster Hub.</p>
    </div>
  `
};