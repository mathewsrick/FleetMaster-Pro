import crypto from 'crypto';
import { ENV } from '../../config/env.js';

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
  if (!integrityKey) {
    throw new Error('WOMPI_INTEGRITY_SECRET no está definido');
  }

  const chain = `${reference}${amountInCents}${currency}${integrityKey}`;
  const hash = crypto
    .createHash('sha256')
    .update(chain)
    .digest('hex');
  return hash;
};

const getPrivateKey = (): string => {
  if (!ENV.WOMPI_PRIVATE_KEY) {
    throw new Error('WOMPI_PRIVATE_KEY no está definido');
  }
  return ENV.WOMPI_PRIVATE_KEY;
};

const getWompiError = (json: any, statusCode: number): string => {
  const messages = json?.error?.messages;
  if (typeof messages === 'string') return messages;
  if (messages && typeof messages === 'object') {
    const joined = Object.values(messages)
      .flat()
      .filter(Boolean)
      .join(' ');
    if (joined) return joined;
  }
  return json?.error?.reason || `Error de Wompi (${statusCode})`;
};

const wompiRequest = async (
  path: string,
  init: RequestInit = {},
  requireAuth = true
): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined)
  };

  if (requireAuth) {
    headers.Authorization = `Bearer ${getPrivateKey()}`;
  }

  const response = await fetch(`${ENV.WOMPI_API_URL}${path}`, {
    ...init,
    headers
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    // Algunas respuestas de error no traen body JSON
  }

  if (!response.ok || json?.error) {
    throw new Error(getWompiError(json, response.status));
  }

  return json;
};

export interface AcceptanceTokens {
  acceptanceToken: string;
  personalAuthToken: string;
  permalink: string;
}

export const getAcceptanceTokens = async (): Promise<AcceptanceTokens> => {
  const json = await wompiRequest(
    `/merchants/${ENV.WOMPI_PUBLIC_KEY}`,
    { method: 'GET' },
    false
  );

  const data = json?.data || {};

  const acceptanceToken = data?.presigned_acceptance?.acceptance_token || '';
  const personalAuthToken = data?.presigned_personal_data_auth?.acceptance_token || '';

  if (!acceptanceToken) {
    throw new Error('Wompi no devolvió el token de aceptación');
  }

  return {
    acceptanceToken,
    personalAuthToken,
    permalink: data?.presigned_acceptance?.permalink || ''
  };
};

export type PaymentSourceType = 'CARD' | 'NEQUI';

export interface CreatePaymentSourceData {
  type: PaymentSourceType;
  token: string;
  email: string;
  acceptanceToken: string;
  personalAuthToken: string;
}

export const createPaymentSource = async (data: CreatePaymentSourceData): Promise<any> => {
  const json = await wompiRequest('/payment_sources', {
    method: 'POST',
    body: JSON.stringify({
      type: data.type,
      token: data.token,
      customer_email: data.email,
      acceptance_token: data.acceptanceToken,
      accept_personal_auth: data.personalAuthToken
    })
  });

  return json?.data;
};

export interface ChargePaymentSourceData {
  paymentSourceId: number;
  type: PaymentSourceType;
  amountInCents: number;
  reference: string;
  email: string;
}

export const chargePaymentSource = async (data: ChargePaymentSourceData): Promise<any> => {
  const signature = generateIntegritySignature(data.reference, data.amountInCents);

  const payload: Record<string, any> = {
    amount_in_cents: data.amountInCents,
    currency: 'COP',
    signature,
    customer_email: data.email,
    reference: data.reference,
    payment_source_id: data.paymentSourceId,
    recurrent: true
  };

  if (data.type === 'CARD') {
    payload.payment_method = { installments: 1 };
  }

  const json = await wompiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return json?.data;
};

/**
 * Webhook validation:
 * SHA256(event.data.transaction.id + event.data.transaction.status + event.data.transaction.amount_in_cents + event.timestamp + webhookSecret)
 */
export const validateWebhookSignature = (event: any, checksum: string): boolean => {
  const transaction = event.data.transaction;
  const chain = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${event.timestamp}${ENV.WOMPI_WEBHOOK_SECRET}`;
  const generated = crypto.createHash('sha256').update(chain).digest('hex');
  return generated === checksum;
};
