import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';

const PaymentResult: React.FC<{ refreshAccount: () => Promise<void> }> = ({ refreshAccount }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING'>('loading');
  const [reference, setReference] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wompiId = params.get('id');

    if (!wompiId) {
      setStatus('ERROR');
      return;
    }

    let count = 0;

    const interval = setInterval(async () => {
      count++;
      setAttempts(count);

      try {
        const res = await db.checkWompiStatus(wompiId);
        setReference(res.reference);

        if (res.status === 'APPROVED') {
          clearInterval(interval);
          setStatus('APPROVED');

          await refreshAccount();

          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }

        if (res.status === 'DECLINED') {
          clearInterval(interval);
          setStatus('DECLINED');
        }

        if (res.status === 'ERROR') {
          clearInterval(interval);
          setStatus('ERROR');
        }

      } catch (err) {
        console.error('Error verificando transacción:', err);
      }

      if (count >= 15) {
        clearInterval(interval);
        setStatus('ERROR');
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [location, navigate, refreshAccount]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl">

        {(status === 'loading' || status === 'PENDING') && (
          <>
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            </div>
            <h2 className="text-2xl font-black mt-6">Procesando tu Plan</h2>
            <p className="text-slate-500 mt-2">Intento {attempts}/15</p>
          </>
        )}

        {status === 'APPROVED' && (
          <>
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-3xl font-black mt-6">¡Plan Activado!</h2>
            <p className="text-slate-500 mt-4">Referencia: {reference}</p>
          </>
        )}

        {status === 'DECLINED' && (
          <>
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto">
              <i className="fa-solid fa-xmark"></i>
            </div>
            <h2 className="text-3xl font-black mt-6">Pago Rechazado</h2>
            <Link to="/pricing-checkout" className="block mt-6 text-indigo-600 font-bold">
              Intentar Nuevamente
            </Link>
          </>
        )}

        {status === 'ERROR' && (
          <>
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 className="text-2xl font-black mt-6">Tiempo agotado</h2>
            <Link to="/dashboard" className="block mt-6 text-indigo-600 font-bold">
              Ir al Dashboard
            </Link>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;