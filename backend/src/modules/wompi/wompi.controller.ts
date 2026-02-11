
import { Request, Response } from 'express';
import { prisma } from '../../shared/db';
import { v4 as uuid } from 'uuid';
import * as wompiService from './wompi.service';
import * as subService from '../subscription/subscription.service';
import { ENV } from '../../config/env';

// Fix: Use any for req and res to bypass express typing conflicts in this environment
export const initializePayment = async (req: any, res: any) => {
  try {
    const { plan, duration } = req.body;
    const userId = req.user.userId;

    // Precios base (deben coincidir con PricingCheckout.tsx)
    const BASE_PRICES: Record<string, number> = {
      'basico': 59900,
      'pro': 95900,
      'enterprise': 145900
    };

    let basePrice = BASE_PRICES[plan.toLowerCase()];
    if (!basePrice) throw new Error('Plan inválido');

    let amount = basePrice;
    if (duration === 'yearly') amount = basePrice * 10;
    else if (duration === 'semiannual') amount = basePrice * 5;

    const amountInCents = amount * 100;
    const reference = `FMP-${uuid().substring(0, 8).toUpperCase()}`;

    // Guardar transacción pendiente en BD
    await prisma.transaction.create({
      data: {
        userId,
        reference,
        amount,
        plan,
        duration,
        status: 'PENDING'
      }
    });

    const signature = wompiService.generateIntegritySignature(reference, amountInCents);

    res.json({
      publicKey: ENV.WOMPI_PUBLIC_KEY,
      currency: 'COP',
      amountInCents,
      reference,
      signature,
      redirectUrl: `${ENV.APP_URL}/#/dashboard`
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Fix: Use any for req and res to bypass express typing conflicts in this environment
export const handleWebhook = async (req: any, res: any) => {
  try {
    const event = req.body;
    const checksum = req.headers['x-event-checksum'] as string;

    if (!wompiService.validateWebhookSignature(event, checksum)) {
      console.error('Invalid Wompi Webhook Signature');
      return res.status(401).end();
    }

    const { transaction } = event.data;
    const { reference, status, id: wompiId, payment_method_type } = transaction;

    const localTx = await prisma.transaction.findUnique({ where: { reference } });
    if (!localTx) return res.status(404).end();

    // Actualizar estado de transacción
    const newStatus = status === 'APPROVED' ? 'APPROVED' : status === 'DECLINED' ? 'DECLINED' : 'ERROR';
    
    await prisma.transaction.update({
      where: { reference },
      data: { 
        status: newStatus,
        wompiId,
        paymentMethod: payment_method_type
      }
    });

    if (status === 'APPROVED') {
      // Activar suscripción
      await subService.fulfillPurchase(localTx.userId, localTx.plan, localTx.duration as any, reference);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).end();
  }
};