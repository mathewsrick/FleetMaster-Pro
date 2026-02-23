import { prisma } from '../../shared/db.js';

export const findUserByUsername = async (username: string) =>
  prisma.user.findUnique({ where: { username } });

export const findUserByEmail = async (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserByIdentifier = async (identifier: string) =>
  prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });

export const findUserById = async (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const findUserByConfirmationToken = async (confirmationToken: string) =>
  prisma.user.findFirst({ where: { confirmationToken } });

export const findUserByResetToken = async (resetToken: string) =>
  prisma.user.findFirst({ where: { resetToken } });

export const createUser = async (data: any) =>
  prisma.user.create({ data });

export const confirmUser = async (id: string) =>
  prisma.user.update({
    where: { id },
    data: { isConfirmed: true }
  });

export const setResetToken = async (id: string, resetToken: string | null) =>
  prisma.user.update({
    where: { id },
    data: { resetToken }
  });

export const updatePassword = async (id: string, password: string) =>
  prisma.user.update({
    where: { id },
    data: { password }
  });

export const updateLastActivity = async (id: string) =>
  prisma.user.update({
    where: { id },
    data: { lastActivity: new Date() }
  });

export const getActiveSubscription = async (userId: string) =>
  prisma.subscriptionKey.findFirst({
    where: { userId, status: 'active' },
    orderBy: { dueDate: 'desc' }
  });

export const getActiveLicenseOverride = async (userId: string) => {
  return prisma.licenseOverride.findFirst({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Obtiene el plan activo del usuario, verificando tanto subscriptionKey como licenseOverride
 * @param userId - ID del usuario
 * @returns El nombre del plan ('free_trial', 'basico', 'pro', 'enterprise') o 'free_trial' por defecto
 */
export const getUserPlan = async (userId: string): Promise<string> => {
  // Primero verificar si tiene una licencia override activa
  const licenseOverride = await getActiveLicenseOverride(userId);
  if (licenseOverride) {
    return licenseOverride.plan;
  }

  // Si no tiene override, verificar suscripción normal
  const subscription = await getActiveSubscription(userId);
  if (subscription) {
    return subscription.plan;
  }

  // Por defecto, free_trial
  return 'free_trial';
};