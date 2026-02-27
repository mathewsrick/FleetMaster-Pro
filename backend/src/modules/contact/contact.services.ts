import * as emailService from '../../shared/email.service.js';
import { ENV } from '../../config/env.js';
import { prisma } from '../../shared/db.js';

// 🔒 Validación de email robusta
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// 🔒 Sanitización de inputs
const sanitizeInput = (input: string, maxLength: number = 500): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remover caracteres HTML peligrosos
};

export const sendContactEmail = async (name: string, email: string, message: string) => {
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

  // Buscar todos los superadmins confirmados
  const superadmins = await prisma.user.findMany({
    where: { role: 'SUPERADMIN', isConfirmed: true },
    select: { email: true }
  });
  const superadminEmails = superadmins.map(u => u.email);
  if (superadminEmails.length === 0) {
    throw new Error('No hay superadmins confirmados para notificar');
  }

  // Enviar a todos los superadmins
  return await emailService.sendEmail({
    to: superadminEmails.join(','),
    subject: `Nuevo interesado en FleetMaster Hub: ${sanitizedName}`,
    html: emailService.templates.contactNotification(sanitizedName, email, sanitizedMessage)
  });
};