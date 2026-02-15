import { v4 as uuid } from 'uuid';
import * as repo from './driver.repository.js';
import * as authRepo from '../auth/auth.repository.js';
import * as emailService from '@/shared/email.service.js';

const PLAN_MAX_DRIVERS: Record<string, number> = {
  'free_trial': 1,
  'basico': 5,
  'pro': 10,
  'enterprise': 99999
};

export const getAll = async (userId: string, query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 100, 100); // 🔒 Límite máximo de 100
  return await repo.findAll(userId, { page, limit });
};

export const create = async (userId: string, data: any) => {
  const { total } = await repo.findAll(userId, { page: 1, limit: 1 });
  const subscription = await authRepo.getActiveSubscription(userId);
  const plan = subscription ? subscription.plan : 'free_trial';
  const limit = PLAN_MAX_DRIVERS[plan] || 1;

  if (total >= limit) {
    throw {
      code: 'PLAN_LIMIT_DRIVERS',
      message: `Límite alcanzado para el plan ${plan.toUpperCase()}. Máximo: ${limit} conductores.`,
    };
  }

  const driver = { id: uuid(), userId, ...data };
  await repo.create(driver);

  // Alerta automática: Bienvenida al conductor
  if (driver.email) {
    await emailService.sendEmail({
      to: driver.email,
      subject: `¡Bienvenido a bordo! - Términos y Condiciones FleetMaster Hub`,
      html: emailService.templates.driverWelcome(`${driver.firstName} ${driver.lastName}`)
    });
  }

  return driver;
};

export const update = async (userId: string, id: string, data: any) => {
  await repo.update(userId, id, data);
};

export const remove = async (userId: string, id: string) => {
  await repo.unassignVehicles(userId, id);
  await repo.remove(userId, id);
};