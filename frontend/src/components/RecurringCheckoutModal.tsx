import React, { useEffect, useState } from 'react';
import { db } from '@/services/db';
import ResponsiveModal from '@/components/ResponsiveModal';

type Duration = 'monthly' | 'semiannual' | 'yearly';
type PaymentMethod = 'CARD' | 'NEQUI';

interface RecurringCheckoutModalProps {
  isOpen: boolean;
  plan: string | null;
  planLabel?: string;
  amount?: number;
  duration: Duration;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AcceptanceData {
  publicKey: string;
  acceptanceToken: string;
  personalAuthToken: string;
  permalink: string;
}

const WOMPI_API_URL = (import.meta.env.VITE_WOMPI_API_URL || 'https://sandbox.wompi.co/v1').replace(/\/$/, '');

const DURATION_LABEL: Record<Duration, string> = {
  monthly: 'mes',
  semiannual: '6 meses',
  yearly: 'año'
};

const getWompiError = (json: any, statusCode: number): string => {
  const messages = json?.error?.messages;
  if (typeof messages === 'string') return messages;
  if (messages && typeof messages === 'object') {
    const joined = Object.values(messages).flat().filter(Boolean).join(' ');
    if (joined) return joined;
  }
  return json?.error?.reason || `Error de Wompi (${statusCode})`;
};

const RecurringCheckoutModal: React.FC<RecurringCheckoutModalProps> = ({
  isOpen,
  plan,
  planLabel,
  amount,
  duration,
  onClose,
  onSuccess
}) => {
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [acceptance, setAcceptance] = useState<AcceptanceData | null>(null);
  const [loadingAcceptance, setLoadingAcceptance] = useState(false);
  const [acceptanceError, setAcceptanceError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [nequiPhone, setNequiPhone] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPersonalData, setAcceptPersonalData] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; reference?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoadingAcceptance(true);
    setAcceptanceError(null);

    db.getWompiAcceptance()
      .then((data) => {
        if (!active) return;
        setAcceptance({
          publicKey: data.publicKey,
          acceptanceToken: data.acceptanceToken,
          personalAuthToken: data.personalAuthToken,
          permalink: data.permalink
        });
      })
      .catch((err: any) => {
        if (!active) return;
        setAcceptanceError(err?.data?.error || 'No se pudieron cargar los términos de Wompi.');
      })
      .finally(() => {
        if (active) setLoadingAcceptance(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setError(null);
      setStatusMessage(null);
      setProcessing(false);
    }
  }, [isOpen]);

  const wompiRequest = async (path: string, init: RequestInit = {}) => {
    if (!acceptance?.publicKey) {
      throw new Error('Wompi no está configurado.');
    }

    const response = await fetch(`${WOMPI_API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${acceptance.publicKey}`,
        ...(init.headers as Record<string, string> | undefined)
      }
    });

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      // La respuesta de error puede no ser JSON
    }

    if (!response.ok || json?.error) {
      throw new Error(getWompiError(json, response.status));
    }

    return json?.data;
  };

  const createCardToken = async (): Promise<string> => {
    const token = await wompiRequest('/tokens/cards', {
      method: 'POST',
      body: JSON.stringify({
        number: cardNumber.replace(/\s/g, ''),
        cvc,
        exp_month: expMonth,
        exp_year: expYear,
        card_holder: cardHolder
      })
    });

    if (!token?.id) throw new Error('No se pudo tokenizar la tarjeta.');
    return token.id;
  };

  const createNequiToken = async (): Promise<string> => {
    const token = await wompiRequest('/tokens/nequi', {
      method: 'POST',
      body: JSON.stringify({ phone_number: nequiPhone.replace(/\s/g, '') })
    });

    if (!token?.id) throw new Error('No se pudo iniciar el pago con Nequi.');

    setStatusMessage('Aprueba el pago en tu app Nequi...');

    // Polling cada 3 s, máximo 2 minutos
    for (let attempt = 0; attempt < 40; attempt++) {
      const current = await wompiRequest(`/tokens/nequi/${token.id}`, { method: 'GET' });

      if (current?.status === 'APPROVED') {
        setStatusMessage(null);
        return token.id;
      }

      if (current?.status === 'DECLINED') {
        throw new Error('El pago con Nequi fue rechazado.');
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error('Tiempo de espera agotado. No se aprobó el pago en Nequi.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!plan || !acceptance) return;

    if (!acceptTerms || !acceptPersonalData) {
      setError('Debes aceptar los términos y la autorización de datos personales.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = method === 'CARD' ? await createCardToken() : await createNequiToken();

      const response = await db.createRecurringSubscription({
        plan,
        duration,
        type: method,
        token,
        acceptanceToken: acceptance.acceptanceToken,
        personalAuthToken: acceptance.personalAuthToken
      });

      const status = response?.wompiStatus || response?.transaction?.status || 'PENDING';
      setResult({ status, reference: response?.transaction?.reference });
      setStatusMessage(null);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'No se pudo crear la suscripción.');
      setStatusMessage(null);
    } finally {
      setProcessing(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-300 transition-colors';
  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2';

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Suscripción ${planLabel || plan || ''}`}
      subtitle="Se renueva automáticamente"
      maxWidth="lg"
      preventBackdropClose={processing}
    >
      {result ? (
        <div className="text-center py-6">
          {(() => {
            const isApproved = result.status === 'APPROVED';
            const isFailed = result.status === 'DECLINED' || result.status === 'ERROR';

            return (
              <>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto ${isApproved ? 'bg-emerald-50 text-emerald-500' : isFailed ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                  <i className={`fa-solid ${isApproved ? 'fa-check' : isFailed ? 'fa-xmark' : 'fa-clock'}`}></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-6">
                  {isApproved ? '¡Suscripción activada!' : isFailed ? 'No se pudo procesar el pago' : 'Estamos confirmando tu pago'}
                </h3>
                <p className="text-slate-500 text-sm mt-3 max-w-sm mx-auto">
                  {isApproved
                    ? 'Tu plan quedó activo y se renovará automáticamente.'
                    : isFailed
                    ? 'El método de pago fue rechazado. Puedes intentarlo de nuevo con otro medio de pago.'
                    : 'Wompi está procesando el cobro. Te confirmaremos por email y podrás ver el estado en esta página.'}
                </p>
                {result.reference && (
                  <p className="text-[11px] text-slate-400 font-mono mt-4">Referencia: {result.reference}</p>
                )}
                <button
                  onClick={isFailed ? () => setResult(null) : onClose}
                  className="mt-8 w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                >
                  {isFailed ? 'Intentar de nuevo' : 'Cerrar'}
                </button>
              </>
            );
          })()}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total a cobrar</p>
              <p className="text-2xl font-black text-slate-900">
                ${(amount || 0).toLocaleString()}
                <span className="text-xs font-bold text-slate-400"> / {DURATION_LABEL[duration]}</span>
              </p>
            </div>
            <i className="fa-solid fa-arrows-rotate text-indigo-300 text-2xl"></i>
          </div>

          <div className="inline-flex w-full p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setMethod('CARD')}
              className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'CARD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fa-solid fa-credit-card mr-2"></i> Tarjeta
            </button>
            <button
              type="button"
              onClick={() => setMethod('NEQUI')}
              className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'NEQUI' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fa-solid fa-mobile-screen mr-2"></i> Nequi
            </button>
          </div>

          {loadingAcceptance && (
            <p className="text-center text-xs font-bold text-slate-400">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> Cargando términos de Wompi...
            </p>
          )}

          {acceptanceError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl p-4">
              {acceptanceError}
            </div>
          )}

          {method === 'CARD' ? (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Número de tarjeta</label>
                <input
                  className={inputClass}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Titular</label>
                <input
                  className={inputClass}
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Nombre como aparece en la tarjeta"
                  autoComplete="cc-name"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Mes</label>
                  <input
                    className={inputClass}
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    placeholder="12"
                    inputMode="numeric"
                    maxLength={2}
                    autoComplete="cc-exp-month"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Año</label>
                  <input
                    className={inputClass}
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    placeholder="30"
                    inputMode="numeric"
                    maxLength={2}
                    autoComplete="cc-exp-year"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>CVC</label>
                  <input
                    className={inputClass}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="cc-csc"
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                <i className="fa-solid fa-lock mr-1"></i>
                Los datos de tu tarjeta se envían directamente a Wompi. FleetMaster Hub nunca los almacena.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Celular Nequi</label>
                <input
                  className={inputClass}
                  value={nequiPhone}
                  onChange={(e) => setNequiPhone(e.target.value)}
                  placeholder="300 123 4567"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                <i className="fa-solid fa-mobile-screen mr-1"></i>
                Recibirás una notificación en tu app Nequi. Tienes 2 minutos para aprobar el pago.
              </p>
            </div>
          )}

          <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-indigo-600"
                required
              />
              <span className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                Acepto los{' '}
                <a
                  href={acceptance?.permalink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-black underline"
                >
                  términos y condiciones
                </a>{' '}
                del cobro recurrente.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPersonalData}
                onChange={(e) => setAcceptPersonalData(e.target.checked)}
                className="mt-1 w-4 h-4 accent-indigo-600"
                required
              />
              <span className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                Autorizo el tratamiento de mis datos personales para los cobros automáticos.
              </span>
            </label>
          </div>

          {statusMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-2xl p-4 text-center">
              <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> {statusMessage}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl p-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={processing || loadingAcceptance || !acceptance || !acceptTerms || !acceptPersonalData}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-arrows-rotate mr-2"></i>}
            {processing ? 'Procesando...' : 'Suscribirme'}
          </button>
        </form>
      )}
    </ResponsiveModal>
  );
};

export default RecurringCheckoutModal;
