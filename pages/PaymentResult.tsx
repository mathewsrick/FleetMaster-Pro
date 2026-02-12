import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';
import Swal from 'sweetalert2';

const PaymentResult: React.FC<{ refreshAccount: () => Promise<void> }> = ({ refreshAccount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING'>('loading');
  const [reference, setReference] = useState('');
  const [attempts, setAttempts] = useState(0);
  const pollingInterval = useRef<any>(null);

  const verifyStatus = async (wompiId: string) => {
    try {
      const res = await db.checkWompiStatus(wompiId);
      setReference(res.reference);

      if (res.status === 'APPROVED') {
        setStatus('APPROVED');
        clearInterval(pollingInterval.current);

        // 🔐 Actualización crítica del LocalStorage
        try {
          const newState = await db.refreshAuth();
          console.log("Sesión sincronizada con nuevo plan:", newState.accountStatus?.plan);
          await refreshAccount();
          console.log("LLAMANDO refreshAccount");

          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } catch (e) {
          console.error("Error al refrescar sesión post-pago", e);
        }
      } else if (res.status === 'DECLINED') {
        setStatus('DECLINED');
        clearInterval(pollingInterval.current);
      } else if (res.status === 'ERROR') {
        setStatus('ERROR');
        clearInterval(pollingInterval.current);
      } else {
        // Sigue en PENDING, el polling continuará
        setStatus('PENDING');
      }
    } catch (err) {
      console.error("Error verificando transacción:", err);
      // No cortamos el polling en el primer error de red
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wompiId = params.get('id');

    if (!wompiId) {
      setStatus('ERROR');
      return;
    }

    // Iniciamos Polling (Cada 3 segundos hasta 15 intentos ~ 45 segundos)
    let count = 0;
    pollingInterval.current = setInterval(() => {
      count++;
      setAttempts(count);
      verifyStatus(wompiId);
      
      if (count >= 15) {
        clearInterval(pollingInterval.current);
        if (status === 'loading' || status === 'PENDING') {
          setStatus('ERROR');
        }
      }
    }, 3000);

    // Verificación inmediata inicial
    verifyStatus(wompiId);

    return () => clearInterval(pollingInterval.current);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        
        {(status === 'loading' || status === 'PENDING') && (
          <div className="space-y-6">
            <div className="relative">
               <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                 <i className="fa-solid fa-circle-notch fa-spin"></i>
               </div>
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-indigo-600 uppercase">Intento {attempts}/15</span>
               </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Procesando tu Plan</h2>
            <p className="text-slate-500 font-medium">Estamos esperando la confirmación de la entidad bancaria. Por favor, no cierres esta ventana.</p>
            <div className="flex justify-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></div>
            </div>
          </div>
        )}

        {status === 'APPROVED' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg shadow-emerald-100 ring-8 ring-emerald-50/50">
              <i className="fa-solid fa-check"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">¡Plan Activado!</h2>
              <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-1">Transacción Aprobada</p>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">
              Tu suscripción ha sido sincronizada. Estamos preparándolo todo para tu regreso al dashboard.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Referencia de Pago</p>
               <p className="font-mono font-bold text-slate-700">{reference}</p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { navigate('/dashboard'); window.location.reload(); }}
                className="block w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Entrar ahora mismo
              </button>
            </div>
          </div>
        )}

        {status === 'DECLINED' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-rose-100">
              <i className="fa-solid fa-xmark"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900">Pago Rechazado</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Wompi nos informa que la transacción no pudo ser procesada. Revisa los fondos o intenta con otro medio.
            </p>
            <div className="pt-6 space-y-4">
              <Link to="/pricing-checkout" className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95">Intentar Nuevamente</Link>
              <Link to="/dashboard" className="block w-full text-slate-400 font-bold hover:text-slate-600 transition-colors">Volver al Dashboard</Link>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Tiempo de espera agotado</h2>
            <p className="text-slate-500 font-medium">El banco está tardando más de lo habitual en responder. Tu plan se activará automáticamente en cuanto recibamos la confirmación.</p>
            <div className="pt-6">
              <Link to="/dashboard" className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl transition-all">Ir al Dashboard por ahora</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;