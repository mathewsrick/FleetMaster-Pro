import { v4 as uuid } from 'uuid';
import * as repo from './driver.repository';
import * as authRepo from '../auth/auth.repository';

const PLAN_MAX_DRIVERS: Record<string, number> = {
  'free_trial': 1,
  'basico': 5,
  'pro': 10,
  'enterprise': 99999
};

export const getAll = async (userId: string) => {
  return await repo.findAll(userId);
};

export const create = async (userId: string, data: any) => {
  const userDrivers = await repo.findAll(userId);
  const subscription = await authRepo.getActiveSubscription(userId);
  const plan = subscription ? subscription.plan : 'free_trial';
  const limit = PLAN_MAX_DRIVERS[plan] || 1;

  if (userDrivers.length >= limit) {
    throw new Error(`Limit reached for plan ${plan.toUpperCase()}. Max: ${limit} drivers.`);
  }

  const driver = { id: uuid(), userId, ...data };
  await repo.create(driver);
  return driver;
};

export const update = async (userId: string, id: string, data: any) => {
  await repo.update(userId, id, data);
};

export const remove = async (userId: string, id: string) => {
  await repo.unassignVehicles(userId, id);
  await repo.remove(userId, id);
};
