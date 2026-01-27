import { v4 as uuid } from 'uuid';
import * as repo from './subscription.repository';

const PLANS: Record<string, number> = {
  '1m': 30,
  '6m': 180,
  '12m': 365
};

export const activate = async (userId: string, keyId: string) => {
  const key = await repo.findKeyById(keyId);
  if (!key) {
    throw new Error('Invalid or already used key');
  }

  if (key.userId && key.userId !== userId) {
    throw new Error('Key already bound to another user');
  }

  const days = PLANS[key.plan];
  if (!days) {
    throw new Error('Invalid plan');
  }

  const startDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);

  await repo.deactivateUserKeys(userId);
  await repo.bindKeyToUser(userId, keyId);

  return {
    startDate,
    dueDate
  };
};

export const generateKey = async (plan: string, price: number) => {
  if (!PLANS[plan]) throw new Error('Invalid plan');

  const now = new Date();
  const due = new Date();
  due.setDate(due.getDate() + PLANS[plan]);

  const key = {
    id: uuid(),
    userId: null,
    plan,
    price,
    startDate: now,
    dueDate: due,
    status: 'active' as const
  };

  await repo.createKey(key);
  return key;
};
