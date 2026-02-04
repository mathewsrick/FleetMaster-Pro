import * as repo from './vehicle.repository';
import * as authRepo from '../auth/auth.repository';

const PLAN_MAX_VEHICLES: Record<string, number> = {
  'free_trial': 1,
  'basico': 3,
  'pro': 6,
  'enterprise': 99999
};

export const getAll = async (userId: string) => {
  return await repo.findAll(userId);
};

export const save = async (userId: string, data: any) => {
  const existing = await repo.findById(data.id);

  if (!existing) {
    // Validar límite del plan al crear nuevo
    const userVehicles = await repo.findAll(userId);
    const subscription = await authRepo.getActiveSubscription(userId);
    const plan = subscription ? subscription.plan : 'free_trial';
    const limit = PLAN_MAX_VEHICLES[plan] || 1;

    if (userVehicles.length >= limit) {
      throw new Error(`Limit reached for plan ${plan.toUpperCase()}. Max: ${limit} vehicles.`);
    }
  }

  const vehicle = { ...data, userId };
  if (existing) {
    await repo.update(userId, vehicle);
  } else {
    await repo.create(vehicle);
  }
};

export const remove = async (userId: string, id: string) => {
  await repo.remove(userId, id);
};
