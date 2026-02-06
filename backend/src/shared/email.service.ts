import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

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

const LOGO_HTML = `
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 14px; border-radius: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">
       <img
          src="${ENV.APP_URL}/public/assets/truck-fast-solid-full.png"
          alt="FleetMaster Pro"
          width="32"
          height="32"
          style="display:block"
       />
    </div>
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 900; color: #1e293b; font-size: 22px; margin-top: 12px; letter-spacing: -0.025em;">FleetMaster <span style="color: #4f46e5;">Pro</span></div>
  </div>
`;

export const templates = {
  welcome: (username: string, token: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">¡Bienvenido a bordo, ${username}!</h2>
      <p style="font-size: 16px; line-height: 1.6; text-align: center;">Gracias por confiar en <strong>FleetMaster Pro</strong> para la gestión de tu flota.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${ENV.APP_URL}/#/confirm/${token}" style="background-color: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Confirmar mi cuenta</a>
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
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 12px 0; color: #64748b;">Monto:</td><td style="text-align: right; font-weight: 800;">$${amount.toLocaleString()}</td></tr>
        <tr><td style="padding: 12px 0; color: #64748b;">Fecha:</td><td style="text-align: right;">${date}</td></tr>
      </table>
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
  `
};