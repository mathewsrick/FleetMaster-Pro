import { prisma } from '../../shared/db';
import { v4 as uuid } from 'uuid';
import * as wompiService from './wompi.service';
import * as subService from '../subscription/subscription.service';
import * as emailService from '../../shared/email.service';
import { ENV } from '../../config/env';
export const initializePayment = async (req, res) => {
    try {
        const { plan, duration } = req.body;
        const userId = req.user.userId;
        const BASE_PRICES = {
            'basico': 59900,
            'pro': 95900,
            'enterprise': 145900
        };
        let basePrice = BASE_PRICES[plan.toLowerCase()];
        if (!basePrice)
            throw new Error('Plan inválido');
        let amount = basePrice;
        if (duration === 'yearly')
            amount = basePrice * 10;
        else if (duration === 'semiannual')
            amount = basePrice * 5;
        const amountInCents = amount * 100;
        const reference = `FMP-${uuid().substring(0, 8).toUpperCase()}`;
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
            // Redirigir explícitamente a la página de resultados
            redirectUrl: `${ENV.APP_URL}/#/payment-result`
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const verifyTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const tx = await prisma.transaction.findUnique({
            where: { wompiId: id }
        });
        if (!tx)
            return res.status(404).json({ error: 'No encontrada' });
        res.json({
            status: tx.status,
            reference: tx.reference
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const handleWebhook = async (req, res) => {
    try {
        const raw = req.body.toString();
        const event = JSON.parse(raw);
        const checksum = req.headers['x-event-checksum'];
        // Validar firma usando el objeto ya parseado
        if (!wompiService.validateWebhookSignature(event, checksum)) {
            console.log('❌ Firma inválida');
            return res.status(401).end();
        }
        // Solo procesar eventos de actualización
        if (event.event !== 'transaction.updated') {
            console.log('Evento ignorado:', event.event);
            return res.status(200).end();
        }
        if (!event?.data || !event.data?.transaction) {
            console.log('Evento sin transaction:', event);
            return res.status(200).end();
        }
        const transaction = event.data.transaction;
        if (!transaction)
            return res.status(200).end();
        const { reference, status, id: wompiId, payment_method_type, amount_in_cents, currency } = transaction;
        await prisma.$transaction(async (tx) => {
            const localTx = await tx.transaction.findUnique({
                where: { reference },
                include: { user: true }
            });
            if (!localTx)
                return;
            // 🔐 VALIDACIÓN ANTIFRAUDE
            if (amount_in_cents !== localTx.amount * 100) {
                throw new Error('Monto alterado');
            }
            if (currency !== 'COP') {
                throw new Error('Moneda inválida');
            }
            // 🛡️ IDPOTENCIA FUERTE
            // Si ya fue aprobado, no hacer nada
            if (localTx.status === 'APPROVED')
                return;
            // Si ya existe wompiId en otra transacción → intento de replay
            const existingWompi = await tx.transaction.findUnique({
                where: { wompiId }
            });
            if (existingWompi && existingWompi.reference !== reference) {
                throw new Error('Replay attack detectado');
            }
            const newStatus = status === 'APPROVED'
                ? 'APPROVED'
                : status === 'DECLINED'
                    ? 'DECLINED'
                    : 'ERROR';
            await tx.transaction.update({
                where: { reference },
                data: {
                    status: newStatus,
                    wompiId: String(wompiId),
                    paymentMethod: payment_method_type
                }
            });
            if (status === 'APPROVED') {
                await subService.fulfillPurchase(localTx.userId, localTx.plan, localTx.duration, reference);
                // Notificar al SuperAdmin
                const adminEmail = process.env.SUPPORT_EMAIL || 'admin@fleetmaster.pro';
                await emailService.sendEmail({
                    to: adminEmail,
                    subject: `[ALERTA] Nuevo Pago Aprobado - ${localTx.user.username}`,
                    html: emailService.templates.adminPaymentNotification({
                        user: localTx.user.username,
                        email: localTx.user.email,
                        plan: localTx.plan,
                        amount: Number(localTx.amount),
                        reference: localTx.reference,
                        date: new Date().toLocaleString()
                    })
                });
            }
        });
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Webhook Error:', error.message);
        res.status(500).end();
    }
};
