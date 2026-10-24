import { v4 as uuid } from 'uuid';
import * as repo from './subscription.repository.js';

const PLAN_WEIGHTS: Record<string, number> = {
  'free_trial': 0,
  'basico': 1,
  'pro': 2,
  'enterprise': 3
};

const BASE_PRICES: Record<string, number> = {
  'basico': 15900,
  'pro': 28000,
  'enterprise': 65000
};

export type SubscriptionDuration = 'monthly' | 'semiannual' | 'yearly';

const DURATION_MULTIPLIERS: Record<SubscriptionDuration, number> = {
  monthly: 1,
  semiannual: 5,
  yearly: 10
};

const DURATION_MONTHS: Record<SubscriptionDuration, number> = {
  monthly: 1,
  semiannual: 6,
  yearly: 12
};

/**
 * Precio y meses de un plan según su duración.
 * Fuente única de verdad para los cobros (widget y recurrencia).
 */
export const getPlanPricing = (plan: string, duration: SubscriptionDuration) => {
  const basePrice = plan ? BASE_PRICES[plan.toLowerCase()] : undefined;
  if (!basePrice) throw new Error('Plan inválido');

  const months = DURATION_MONTHS[duration] ?? 1;
  const amount = basePrice * (DURATION_MULTIPLIERS[duration] ?? 1);

  return { amount, months };
};

export const fulfillPurchase = async (
  userId: string,
  plan: string,
  duration: 'monthly' | 'semiannual' | 'yearly',
  transactionRef: string,
  startFrom?: Date
) => {
  const now = new Date();
  const startDate = now;
  // En una renovación, extender desde el vencimiento vigente si aún es futuro
  const baseDate = startFrom && startFrom.getTime() > now.getTime() ? startFrom : now;
  const dueDate = new Date(baseDate);

  const { amount: totalPrice, months: monthsCount } = getPlanPricing(plan, duration);

  dueDate.setMonth(dueDate.getMonth() + monthsCount);

  await repo.deactivateUserKeys(userId);

  const newSub = {
    id: uuid(),
    userId,
    plan: plan.toLowerCase(),
    price: totalPrice, 
    months: monthsCount,
    startDate: startDate.toISOString(),
    dueDate: dueDate.toISOString(),
    status: 'active' as const,
    transactionRef
  };

  await repo.createKey(newSub);
  return newSub;
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

  const days = key.plan === 'free_trial' ? 15 : 30; 
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
  
  if (currentSub && currentSub.dueDate && new Date(currentSub.dueDate) > now) {
    const diff = new Date(currentSub.dueDate).getTime() - now.getTime();
    const diffDays = diff / (1000 * 3600 * 24);
    if (diffDays > 0.1) {
       throw new Error('Ya tienes un plan vigente. Podrás renovar o cambiar de plan cuando el actual expire.');
    }
  }

  const lastPlanWeight = currentSub ? (PLAN_WEIGHTS[currentSub.plan] || 0) : 0;
  const newPlanWeight = PLAN_WEIGHTS[plan] || 0;

  if (lastPlanWeight > 1 && newPlanWeight === 1) {
    throw new Error('Tu cuenta tiene un historial superior. No puedes volver al Plan Básico, elige Pro o Enterprise.');
  }

  // This is now handled asynchronously via Wompi Webhook.
  // The PricingCheckout will call backend to initialize Wompi.
  return { status: 'PENDING_PAYMENT' };
};

export const generateKey = async (plan: string, price: number) => {
  const key = {
    id: uuid(),
    userId: null,
    plan,
    price,
    months: 1,
    startDate: null,
    dueDate: null,
    status: 'active' as const
  };
  await repo.createKey(key);
  return key;
};