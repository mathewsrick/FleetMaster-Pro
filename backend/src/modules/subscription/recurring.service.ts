import { v4 as uuid } from 'uuid';
import { prisma } from '../../shared/db.js';
import * as repo from './subscription.repository.js';
import * as subService from './subscription.service.js';
import * as wompiService from '../wompi/wompi.service.js';
import * as emailService from '../../shared/email.service.js';

const MAX_FAILED_ATTEMPTS = 3;
const RETRY_DELAY_DAYS = 2;

const DURATIONS: subService.SubscriptionDuration[] = ['monthly', 'semiannual', 'yearly'];

export interface CreateRecurringInput {
  plan: string;
  duration: subService.SubscriptionDuration;
  type: 'CARD' | 'NEQUI';
  token: string;
  acceptanceToken: string;
  personalAuthToken: string;
}

/**
 * Crea la suscripción recurrente del usuario:
 * 1. Aplica las mismas reglas de negocio que una compra normal.
 * 2. Tokeniza el método de pago en Wompi (payment source).
 * 3. Guarda la suscripción y dispara el primer cobro.
 */
export const createRecurring = async (userId: string, data: CreateRecurringInput) => {
  const plan = data.plan.toLowerCase();
  const duration = DURATIONS.includes(data.duration) ? data.duration : 'monthly';
  const type = data.type;

  if (type !== 'CARD' && type !== 'NEQUI') {
    throw new Error('Método de pago inválido');
  }

  // Reglas de negocio compartidas con la compra de un plan
  await subService.purchasePlan(userId, plan, duration);

  const existing = await prisma.recurringSubscription.findUnique({ where: { userId } });
  if (existing && (existing.status === 'active' || existing.status === 'past_due')) {
    throw new Error('Ya tienes una suscripción recurrente activa. Cancélala antes de crear una nueva.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuario no encontrado');

  const { amount } = subService.getPlanPricing(plan, duration);

  const paymentSource = await wompiService.createPaymentSource({
    type,
    token: data.token,
    email: user.email,
    acceptanceToken: data.acceptanceToken,
    personalAuthToken: data.personalAuthToken
  });

  if (!paymentSource?.id) {
    throw new Error('Wompi no devolvió la fuente de pago');
  }

  if (paymentSource.status !== 'AVAILABLE') {
    throw new Error(`El método de pago no quedó disponible (estado: ${paymentSource.status}). Intenta de nuevo.`);
  }

  const now = new Date();

  const subscription = await prisma.recurringSubscription.upsert({
    where: { userId },
    update: {
      plan,
      duration,
      amount,
      wompiPaymentSourceId: Number(paymentSource.id),
      paymentMethodType: type,
      status: 'active',
      nextChargeAt: now,
      failedAttempts: 0,
      lastAttemptAt: null,
      canceledAt: null
    },
    create: {
      userId,
      plan,
      duration,
      amount,
      wompiPaymentSourceId: Number(paymentSource.id),
      paymentMethodType: type,
      status: 'active',
      nextChargeAt: now,
      failedAttempts: 0
    }
  });

  const charge = await chargeRecurring(subscription);

  return {
    subscription: await getRecurring(userId),
    transaction: charge.transaction
      ? {
          reference: charge.transaction.reference,
          status: charge.transaction.status
        }
      : null,
    wompiStatus: charge.wompiStatus || null
  };
};

/**
 * Cobra una suscripción recurrente.
 * Idempotente: si ya existe una Transaction PENDING para la sub, no crea otra.
 */
export const chargeRecurring = async (sub: any) => {
  const pending = await prisma.transaction.findFirst({
    where: { recurringSubscriptionId: sub.id, status: 'PENDING' }
  });

  if (pending) {
    return { skipped: true, transaction: pending, wompiStatus: null };
  }

  const user = await prisma.user.findUnique({ where: { id: sub.userId } });
  if (!user) throw new Error('Usuario no encontrado');

  const reference = `FMP-R-${uuid().substring(0, 8).toUpperCase()}`;
  const amount = Number(sub.amount);

  const tx = await prisma.transaction.create({
    data: {
      userId: sub.userId,
      reference,
      amount,
      plan: sub.plan,
      duration: sub.duration,
      status: 'PENDING',
      recurringSubscriptionId: sub.id
    }
  });

  await prisma.recurringSubscription.update({
    where: { id: sub.id },
    data: { lastAttemptAt: new Date() }
  });

  let wompiTx: any;
  try {
    wompiTx = await wompiService.chargePaymentSource({
      paymentSourceId: sub.wompiPaymentSourceId,
      type: sub.paymentMethodType,
      amountInCents: Math.round(amount * 100),
      reference,
      email: user.email
    });
  } catch (error: any) {
    console.error(`[recurring] Error cobrando ${reference}:`, error.message);

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'DECLINED' }
    });

    tx.status = 'DECLINED';
    await handleRecurringResult({ ...tx, status: 'DECLINED' }, 'DECLINED');

    return { skipped: false, transaction: tx, wompiStatus: 'DECLINED', error: error.message };
  }

  if (wompiTx?.id) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { wompiId: String(wompiTx.id) }
    });
    tx.wompiId = String(wompiTx.id);
  }

  const wompiStatus = wompiTx?.status;

  // Si Wompi ya lo rechazó de forma síncrona, procesarlo de inmediato.
  // Si quedó PENDING/APPROVED, el webhook completa el flujo.
  if (wompiStatus === 'DECLINED' || wompiStatus === 'ERROR') {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: wompiStatus, paymentMethod: sub.paymentMethodType }
    });
    tx.status = wompiStatus;
    await handleRecurringResult({ ...tx, status: wompiStatus }, wompiStatus);
  }

  return { skipped: false, transaction: tx, wompiStatus };
};

/**
 * Procesa el resultado de un cobro recurrente (llamado desde el webhook o
 * desde chargeRecurring cuando Wompi responde con error síncrono).
 */
export const handleRecurringResult = async (tx: any, status: string) => {
  if (!tx?.recurringSubscriptionId) return;

  const sub = await prisma.recurringSubscription.findUnique({
    where: { id: tx.recurringSubscriptionId }
  });

  if (!sub) return;

  if (status === 'APPROVED') {
    const currentKey = await repo.findActiveSubscriptionByUserId(tx.userId);

    const newKey = await subService.fulfillPurchase(
      tx.userId,
      tx.plan,
      tx.duration as subService.SubscriptionDuration,
      tx.reference,
      currentKey?.dueDate ? new Date(currentKey.dueDate) : undefined
    );

    await prisma.recurringSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'active',
        failedAttempts: 0,
        nextChargeAt: new Date(newKey.dueDate)
      }
    });

    return;
  }

  const failedAttempts = sub.failedAttempts + 1;
  const suspended = failedAttempts >= MAX_FAILED_ATTEMPTS;

  const user = await prisma.user.findUnique({ where: { id: sub.userId } });

  if (user?.email) {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Pago Recurrente Declinado - FleetMaster Hub',
      html: emailService.templates.paymentFailed({
        plan: sub.plan,
        reference: tx.reference,
        attempt: failedAttempts,
        maxAttempts: MAX_FAILED_ATTEMPTS,
        suspended
      })
    });

    if (suspended) {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Suscripción Suspendida - FleetMaster Hub',
        html: emailService.templates.recurringSuspended({
          plan: sub.plan,
          reference: tx.reference
        })
      });
    }
  }

  if (suspended) {
    await prisma.recurringSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'suspended',
        failedAttempts,
        nextChargeAt: null
      }
    });

    await repo.deactivateUserKeys(sub.userId);
    return;
  }

  const nextChargeAt = new Date();
  nextChargeAt.setDate(nextChargeAt.getDate() + RETRY_DELAY_DAYS);

  await prisma.recurringSubscription.update({
    where: { id: sub.id },
    data: {
      status: 'past_due',
      failedAttempts,
      nextChargeAt
    }
  });
};

export const getRecurring = async (userId: string) => {
  const sub = await prisma.recurringSubscription.findUnique({ where: { userId } });
  if (!sub) return null;

  return {
    ...sub,
    amount: Number(sub.amount)
  };
};

export const cancelRecurring = async (userId: string) => {
  const sub = await prisma.recurringSubscription.findUnique({ where: { userId } });
  if (!sub) throw new Error('No tienes una suscripción recurrente');

  if (sub.status === 'canceled') {
    return { ...sub, amount: Number(sub.amount) };
  }

  const canceled = await prisma.recurringSubscription.update({
    where: { id: sub.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      nextChargeAt: null
    }
  });

  return { ...canceled, amount: Number(canceled.amount) };
};

/**
 * Cobra todas las suscripciones vencidas. Pensado para ejecutarse desde el cron.
 */
export const runDueCharges = async () => {
  const due = await prisma.recurringSubscription.findMany({
    where: {
      status: { in: ['active', 'past_due'] },
      nextChargeAt: { lte: new Date() }
    }
  });

  for (const sub of due) {
    try {
      const result = await chargeRecurring(sub);
      console.log(
        `[recurring] ${sub.plan} de ${sub.userId}: ${
          result.skipped ? 'cobro pendiente ya existente' : `cobro ${result.wompiStatus || 'enviado'}`
        }`
      );
    } catch (error: any) {
      console.error(`[recurring] Error procesando suscripción ${sub.id}:`, error.message);
    }
  }

  return due.length;
};
