import * as emailService from '../../shared/email.service';
import { ENV } from '../../config/env';
// 🔒 Validación de email robusta
const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};
// 🔒 Sanitización de inputs
const sanitizeInput = (input, maxLength = 500) => {
    return input
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, ''); // Remover caracteres HTML peligrosos
};
export const sendContactEmail = async (name, email, message) => {
    // Validaciones
    if (!isValidEmail(email)) {
        throw new Error('Email inválido');
    }
    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedMessage = sanitizeInput(message, 1000);
    if (sanitizedName.length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    if (sanitizedMessage.length < 10) {
        throw new Error('El mensaje debe tener al menos 10 caracteres');
    }
    // Notificamos al administrador (o al correo de soporte configurado)
    const supportEmail = process.env.SUPPORT_EMAIL || ENV.SMTP_FROM.match(/<(.*)>/)?.[1] || ENV.SMTP_USER;
    return await emailService.sendEmail({
        to: supportEmail,
        subject: `Nuevo interesado en FleetMaster Hub: ${sanitizedName}`,
        html: emailService.templates.contactNotification(sanitizedName, email, sanitizedMessage)
    });
};
