import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';

const ConfirmAccount: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando tu cuenta...');

  useEffect(() => {
    const confirmToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token no válido o ausente.');
        return;
      }

      try {
        await db.confirm(token);
        setStatus('success');
        setMessage('¡Cuenta confirmada con éxito! Redirigiendo al login...');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.data?.error || 'Ocurrió un error al confirmar tu cuenta.');
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    confirmToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 ${
          status === 'loading' ? 'bg-indigo-50 text-indigo-500' :
          status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
        }`}>
          {status === 'loading' && <i className="fa-solid fa-circle-notch fa-spin"></i>}
          {status === 'success' && <i className="fa-solid fa-check"></i>}
          {status === 'error' && <i className="fa-solid fa-xmark"></i>}
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-4">
          {status === 'loading' ? 'Confirmación en curso' :
           status === 'success' ? '¡Bienvenido!' : 'Error de Confirmación'}
        </h2>

        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          {message}
        </p>

        {status !== 'loading' && (
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all active:scale-95"
          >
            Ir al Inicio de Sesión
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmAccount;