
import React, { useState } from 'react';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (data: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await db.register({ username, password });
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        setIsRegister(false);
      } else {
        const data = await db.login({ username, password });
        if (
          data.accountStatus?.reason === 'TRIAL' &&
          data.accountStatus?.daysRemaining !== null
        ) {
          alert(
            `Estás usando el período de prueba. Te quedan ${data.accountStatus.daysRemaining} día(s).`
          );
        }
        onLogin(data);
      }
    } catch (err: any) {
      const apiError = err?.data;

      if (apiError?.accountStatus?.reason === 'TRIAL_EXPIRED') {
        setError(
          'Tu período de prueba ha finalizado. Activa un plan para continuar usando FleetMaster Pro.'
        );
        return;
      }

      setError(apiError?.error || 'Error en la operación');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <h1 className="text-2xl font-bold">FleetMaster Pro</h1>
          <p className="text-indigo-100 mt-2">{isRegister ? 'Crea tu cuenta de flota' : 'Gestión profesional de flota'}</p>
        </div>
        <form onSubmit={handleAction} className="p-8 space-y-6">
          {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm font-medium">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Usuario</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]">
            {loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar al Panel'}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-sm text-indigo-600 font-medium hover:underline">
              {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿Eres nuevo? Crea una cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
