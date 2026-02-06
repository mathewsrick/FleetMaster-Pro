import * as emailService from '../../shared/email.service';
import { ENV } from '../../config/env';

export const sendContactEmail = async (name: string, email: string, message: string) => {
  // Notificamos al administrador (o al correo de soporte configurado)
  const supportEmail = process.env.SUPPORT_EMAIL || ENV.SMTP_FROM.match(/<(.*)>/)?.[1] || ENV.SMTP_USER;

  return await emailService.sendEmail({
    to: supportEmail,
    subject: `Nuevo interesado en FleetMaster Hub: ${name}`,
    html: emailService.templates.contactNotification(name, email, message)
  });
};