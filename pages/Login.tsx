
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (data: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        await db.register({ username, password });
        alert('Cuenta creada. Trial de 5 días activo (Límites: 1 Vehículo, 1 Conductor)');
        setIsRegister(false);
      } else {
        const data = await db.login({ username, password });
        onLogin(data);
      }
    } catch (err: any) {
      const apiError = err?.data;
      if (apiError?.accountStatus?.reason === 'TRIAL_EXPIRED') {
        setTrialExpired(true);
      } else if (err?.status === 401) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (trialExpired) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
            <i className="fa-solid fa-hourglass-end"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Trial Expirado</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Tu período de prueba gratuita ha finalizado. Activa un plan profesional para recuperar el acceso a tus datos.
          </p>
          <div className="space-y-4">
            <Link 
              to="/pricing-checkout" 
              className="block w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Ver Planes de Suscripción
            </Link>
            <Link 
              to="/" 
              className="block w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 p-10 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <h1 className="text-2xl font-black">FleetMaster Pro</h1>
        </div>

        <form onSubmit={handleAction} className="p-10 space-y-6">
          {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold">{error}</div>}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">Usuario</label>
            <input 
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              placeholder="Ej: manager_01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isRegister ? 'Crear Cuenta' : 'Entrar')}
          </button>
          <div className="text-center">
            <button 
              type="button" 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-xs text-slate-400 font-bold uppercase hover:text-indigo-600 transition-colors"
            >
              {isRegister ? 'Ya tengo cuenta' : '¿No tienes cuenta? Registrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
