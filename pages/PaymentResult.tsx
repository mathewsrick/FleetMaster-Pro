import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';

const PaymentResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'APPROVED' | 'DECLINED' | 'ERROR'>('loading');
  const [reference, setReference] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wompiId = params.get('id');

    if (!wompiId) {
      setStatus('ERROR');
      return;
    }

    const verify = async () => {
      try {
        const res = await db.checkWompiStatus(wompiId);
        setStatus(res.status);
        setReference(res.reference);

        // Si fue exitoso, forzar actualización del estado de auth después de un momento
        if (res.status === 'APPROVED') {
          setTimeout(() => {
            const auth = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
            // En una app real, aquí llamaríamos a un endpoint de "me" para refrescar el token/status
            // Por ahora solo notificamos al usuario.
          }, 2000);
        }
      } catch (err) {
        setStatus('ERROR');
      }
    };

    verify();
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Verificando Pago</h2>
            <p className="text-slate-500 font-medium">Estamos confirmando la transacción con Wompi, por favor no cierres esta ventana.</p>
          </div>
        )}

        {status === 'APPROVED' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-100">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900">¡Pago Exitoso!</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Tu suscripción ha sido activada correctamente. <br/>
              Ref: <span className="font-mono font-bold text-indigo-600">{reference}</span>
            </p>
            <div className="pt-6">
              <Link to="/dashboard" className="block w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Ir al Dashboard</Link>
            </div>
          </div>
        )}

        {status === 'DECLINED' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-rose-100">
              <i className="fa-solid fa-xmark"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900">Pago Rechazado</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              La entidad bancaria no autorizó la transacción. Intenta con otro medio de pago.
            </p>
            <div className="pt-6 space-y-4">
              <Link to="/pricing-checkout" className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95">Reintentar Pago</Link>
              <Link to="/dashboard" className="block w-full text-slate-400 font-bold hover:text-slate-600 transition-colors">Volver al inicio</Link>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Hubo un problema</h2>
            <p className="text-slate-500 font-medium">No pudimos verificar el estado de tu pago automáticamente. Si se realizó el cargo, tu plan se activará en unos minutos vía webhook.</p>
            <div className="pt-6">
              <Link to="/dashboard" className="block w-full bg-slate-900 text-white font-black py-4 rounded-2xl transition-all">Ir al Dashboard</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;