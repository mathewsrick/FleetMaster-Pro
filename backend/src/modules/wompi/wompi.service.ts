import crypto from 'crypto';
import { ENV } from '../../config/env';

/**
 * Wompi Integrity Signature:
 * SHA256(reference + amountInCents + currency + integritySecret)
 */
export const generateIntegritySignature = (
  reference: string,
  amountInCents: number,
  currency: string = 'COP'
): string => {

  const integrityKey = process.env.WOMPI_INTEGRITY_SECRET;

  console.log('INTEGRITY DIRECT:', integrityKey);
  console.log('TYPE:', typeof integrityKey);

  if (!integrityKey) {
    throw new Error('WOMPI_INTEGRITY_SECRET no está definido');
  }

  const chain = `${reference}${amountInCents}${currency}${integrityKey}`;

  console.log('STRING TO HASH:', chain);

  const hash = crypto
    .createHash('sha256')
    .update(chain)
    .digest('hex');

  console.log('HASH:', hash);

  return hash;
};

/**
 * Webhook validation:
 * SHA256(event.data.transaction.id + event.data.transaction.status + event.data.transaction.amount_in_cents + event.timestamp + webhookSecret)
 */
export const validateWebhookSignature = (event: any, checksum: string): boolean => {
  const { transaction } = event.data;
  const chain = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${event.timestamp}${ENV.WOMPI_WEBHOOK_SECRET}`;
  const generated = crypto.createHash('sha256').update(chain).digest('hex');
  return generated === checksum;
};
