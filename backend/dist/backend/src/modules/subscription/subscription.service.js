import { v4 as uuid } from 'uuid';
import * as repo from './subscription.repository';
const PLAN_WEIGHTS = {
    'free_trial': 0,
    'basico': 1,
    'pro': 2,
    'enterprise': 3
};
const BASE_PRICES = {
    'basico': 59900,
    'pro': 95900,
    'enterprise': 145900
};
export const fulfillPurchase = async (userId, plan, duration, transactionRef) => {
    const startDate = new Date();
    const dueDate = new Date();
    let monthsCount = 1;
    let totalPrice = BASE_PRICES[plan.toLowerCase()] || 0;
    if (duration === 'yearly') {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        monthsCount = 12;
        totalPrice = (BASE_PRICES[plan.toLowerCase()] || 0) * 10;
    }
    else if (duration === 'semiannual') {
        dueDate.setMonth(dueDate.getMonth() + 6);
        monthsCount = 6;
        totalPrice = (BASE_PRICES[plan.toLowerCase()] || 0) * 5;
    }
    else {
        dueDate.setMonth(dueDate.getMonth() + 1);
        monthsCount = 1;
        totalPrice = BASE_PRICES[plan.toLowerCase()] || 0;
    }
    await repo.deactivateUserKeys(userId);
    const newSub = {
        id: uuid(),
        userId,
        plan: plan.toLowerCase(),
        price: totalPrice,
        months: monthsCount,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'active',
        transactionRef
    };
    await repo.createKey(newSub);
    return newSub;
};
export const activate = async (userId, keyId) => {
    const key = await repo.findKeyById(keyId);
    if (!key)
        throw new Error('Llave inválida o ya utilizada');
    const currentSub = await repo.findActiveSubscriptionByUserId(userId);
    if (currentSub) {
        const currentWeight = PLAN_WEIGHTS[currentSub.plan] || 0;
        const newWeight = PLAN_WEIGHTS[key.plan] || 0;
        if (newWeight < currentWeight) {
            throw new Error('No puedes adquirir un plan inferior al que ya tienes activo.');
        }
    }
    const days = key.plan === 'free_trial' ? 5 : 30;
    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    await repo.deactivateUserKeys(userId);
    await repo.bindKeyToUser(userId, keyId);
    return { startDate, dueDate, plan: key.plan };
};
export const purchasePlan = async (userId, plan, duration) => {
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
export const generateKey = async (plan, price) => {
    const key = {
        id: uuid(),
        userId: null,
        plan,
        price,
        months: 1,
        startDate: null,
        dueDate: null,
        status: 'active'
    };
    await repo.createKey(key);
    return key;
};
//# sourceMappingURL=subscription.service.js.map