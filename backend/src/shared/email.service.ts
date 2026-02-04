
import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465, // true for 465, false for other ports
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
    // En desarrollo, no bloqueamos el flujo si falla el correo
    return false;
  }
};

export const templates = {
  welcome: (username: string, token: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
      <h2 style="color: #4f46e5;">¡Bienvenido a FleetMaster Pro!</h2>
      <p>Hola <strong>${username}</strong>,</p>
      <p>Gracias por unirte a la plataforma líder en gestión de flotas. Para activar tu cuenta y comenzar tu trial, por favor confirma tu correo electrónico:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${ENV.APP_URL}/#/confirm/${token}" style="background-color: #4f46e5; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">Confirmar Cuenta</a>
      </div>
      <p style="font-size: 12px; color: #666;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
  `,
  passwordReset: (token: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
      <h2 style="color: #4f46e5;">Recuperación de Contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${token}</span>
      </div>
      <p style="font-size: 12px; color: #666;">Este código expirará en 24 horas.</p>
    </div>
  `,
  paymentConfirmation: (amount: number, date: string, type: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
      <h2 style="color: #10b981;">Confirmación de Pago Recibido</h2>
      <p>Se ha registrado un nuevo ingreso en tu sistema:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Monto:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Concepto:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${type === 'canon' ? 'Canon Semanal' : 'Abono a Mora'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Fecha:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${date}</td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #666;">FleetMaster Pro - Tu flota bajo control.</p>
    </div>
  `
};
