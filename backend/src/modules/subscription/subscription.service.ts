import { v4 as uuid } from 'uuid';
import * as repo from './subscription.repository';
import { PLAN_LIMITS } from '../auth/auth.service';
import { PlanType } from '../../../../types';

const PLAN_WEIGHTS: Record<string, number> = {
  'free_trial': 0,
  'basico': 1,
  'pro': 2,
  'enterprise': 3
};

const BASE_PRICES: Record<string, number> = {
  'basico': 59900,
  'pro': 95900,
  'enterprise': 145900
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

export const purchasePlan = async (userId: string, plan: string, duration: 'monthly' | 'semiannual' | 'yearly') => {
  const currentSub = await repo.findActiveSubscriptionByUserId(userId);
  
  const now = new Date();
  
  // 1. Si el plan actual NO ha expirado (dueDate > now), bloquear nueva compra
  if (currentSub && currentSub.dueDate && new Date(currentSub.dueDate) > now) {
    const diff = new Date(currentSub.dueDate).getTime() - now.getTime();
    const diffDays = diff / (1000 * 3600 * 24);
    if (diffDays > 0.1) {
       throw new Error('Ya tienes un plan vigente. Podrás renovar o cambiar de plan cuando el actual expire.');
    }
  }

  // 2. Lógica de jerarquía
  const lastPlanWeight = currentSub ? (PLAN_WEIGHTS[currentSub.plan] || 0) : 0;
  const newPlanWeight = PLAN_WEIGHTS[plan] || 0;

  if (lastPlanWeight > 1 && newPlanWeight === 1) {
    throw new Error('Tu cuenta tiene un historial superior. No puedes volver al Plan Básico, elige Pro o Enterprise.');
  }

  const startDate = new Date();
  const dueDate = new Date();
  
  let daysAdded = 30;
  let monthsCount = 1;
  let totalPrice = BASE_PRICES[plan] || 0;

  if (duration === 'yearly') {
    dueDate.setFullYear(dueDate.getFullYear() + 1);
    daysAdded = 365;
    monthsCount = 12;
    totalPrice = (BASE_PRICES[plan] || 0) * 10; // 2 meses gratis
  } else if (duration === 'semiannual') {
    dueDate.setMonth(dueDate.getMonth() + 6);
    daysAdded = 180;
    monthsCount = 6;
    totalPrice = (BASE_PRICES[plan] || 0) * 5; // 1 mes gratis
  } else {
    dueDate.setMonth(dueDate.getMonth() + 1);
    daysAdded = 30;
    monthsCount = 1;
    totalPrice = BASE_PRICES[plan] || 0;
  }

  await repo.deactivateUserKeys(userId);

  const newSub = {
    id: uuid(),
    userId,
    plan,
    price: totalPrice, 
    months: monthsCount,
    startDate: startDate.toISOString(),
    dueDate: dueDate.toISOString(),
    status: 'active' as const
  };

  await repo.createKey(newSub);

  return { 
    plan, 
    dueDate: newSub.dueDate, 
    accessLevel: 'FULL',
    limits: PLAN_LIMITS[plan as PlanType],
    daysRemaining: daysAdded
  };
};

export const generateKey = async (plan: string, price: number) => {
  const key = {
    id: uuid(),
    userId: null,
    plan,
    price,
    months: 1, // Por defecto 1 para llaves generadas manualmente
    startDate: null,
    dueDate: null,
    status: 'active' as const
  };
  await repo.createKey(key);
  return key;
};