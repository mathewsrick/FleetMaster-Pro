import { v4 as uuid } from 'uuid';
import * as repo from './subscription.repository';

const PLAN_WEIGHTS: Record<string, number> = {
  'free_trial': 0,
  'basico': 1,
  'pro': 2,
  'enterprise': 3
};

export const activate = async (userId: string, keyId: string) => {
  const key = await repo.findKeyById(keyId);
  if (!key) throw new Error('Llave inválida o ya utilizada');

  const currentSub = await repo.findActiveSubscriptionByUserId(userId);
  if (currentSub) {
    const currentWeight = PLAN_WEIGHTS[currentSub.plan] || 0;
    const newWeight = PLAN_WEIGHTS[key.plan] || 0;
    if (newWeight < currentWeight) {
      throw new Error('No puedes adquirir un plan inferior al que ya tienes activo.');
    }
  }

  const days = key.plan === 'free_trial' ? 5 : 30; // Por defecto 30 si es key simple
  const startDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);

  await repo.deactivateUserKeys(userId);
  await repo.bindKeyToUser(userId, keyId);

  return { startDate, dueDate, plan: key.plan };
};

export const purchasePlan = async (userId: string, plan: string, duration: 'monthly' | 'yearly') => {
  const currentSub = await repo.findActiveSubscriptionByUserId(userId);
  
  const currentWeight = currentSub ? (PLAN_WEIGHTS[currentSub.plan] || 0) : 0;
  const newWeight = PLAN_WEIGHTS[plan] || 0;

  if (newWeight < currentWeight) {
    throw new Error(`Tu plan actual (${currentSub?.plan.toUpperCase()}) no permite bajar a ${plan.toUpperCase()}.`);
  }

  const startDate = new Date();
  const dueDate = new Date();
  
  if (duration === 'yearly') {
    dueDate.setFullYear(dueDate.getFullYear() + 1);
  } else {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  // Desactivar planes anteriores
  await repo.deactivateUserKeys(userId);

  // Crear nueva suscripción directamente (Simulando pago exitoso)
  const newSub = {
    id: uuid(),
    userId,
    plan,
    price: 0, // En producción vendría de la pasarela de pago
    startDate: startDate.toISOString(),
    dueDate: dueDate.toISOString(),
    status: 'active' as const
  };

  await repo.createKey(newSub);

  return { 
    plan, 
    dueDate: newSub.dueDate, 
    accessLevel: 'FULL' 
  };
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