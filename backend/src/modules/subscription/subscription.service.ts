
import { v4 as uuid } from 'uuid';
import * as repo from './subscription.repository';

const PLAN_WEIGHTS: Record<string, number> = {
  'free_trial': 0,
  'basico': 1,
  'pro': 2,
  'enterprise': 3
};

const PLAN_DURATIONS: Record<string, number> = {
  '1m': 30,
  '6m': 180,
  '12m': 365
};

export const activate = async (userId: string, keyId: string) => {
  const key = await repo.findKeyById(keyId);
  if (!key) throw new Error('Invalid or already used key');

  // Obtener plan actual del usuario para validar "Upgrade only"
  const currentSub = await repo.findActiveSubscriptionByUserId(userId);
  if (currentSub) {
    const currentWeight = PLAN_WEIGHTS[currentSub.plan] || 0;
    const newWeight = PLAN_WEIGHTS[key.plan] || 0;
    if (newWeight < currentWeight) {
      throw new Error('Downgrades are not allowed. You can only upgrade to a higher plan.');
    }
  }

  const days = PLAN_DURATIONS[key.duration || '1m'] || 30;
  const startDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);

  await repo.deactivateUserKeys(userId);
  await repo.bindKeyToUser(userId, keyId);

  return { startDate, dueDate, plan: key.plan };
};

export const generateKey = async (plan: string, price: number) => {
  const key = {
    id: uuid(),
    userId: null,
    plan,
    price,
    startDate: null,
    dueDate: null,
    status: 'active' as const
  };
  await repo.createKey(key);
  return key;
};
