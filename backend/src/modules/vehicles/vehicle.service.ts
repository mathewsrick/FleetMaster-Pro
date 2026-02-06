import * as repo from './vehicle.repository';
import * as authRepo from '../auth/auth.repository';

const PLAN_MAX_VEHICLES: Record<string, number> = {
  'free_trial': 1,
  'basico': 3,
  'pro': 6,
  'enterprise': 99999
};

export const getAll = async (userId: string, query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100;
  return await repo.findAll(userId, { page, limit });
};

export const save = async (userId: string, data: any) => {
  const existing = await repo.findById(data.id);
  
  if (!existing) {
    const { total } = await repo.findAll(userId, { page: 1, limit: 1 });
    const subscription = await authRepo.getActiveSubscription(userId);
    const plan = subscription ? subscription.plan : 'free_trial';
    const limit = PLAN_MAX_VEHICLES[plan] || 1;

    if (total >= limit) {
      throw new Error(`Límite alcanzado para el plan ${plan.toUpperCase()}. Máximo: ${limit} vehículos.`);
    }
  }

  const vehicle = {
    ...data,
    userId,
    licensePlate: data.licensePlate?.toUpperCase()
  };

  if (existing) {
    await repo.update(userId, vehicle);
  } else {
    await repo.create(vehicle);
  }
};

export const remove = async (userId: string, id: string) => {
  await repo.remove(userId, id);
};