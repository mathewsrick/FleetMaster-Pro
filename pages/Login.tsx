
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
        alert('Registro exitoso. Tu cuenta de prueba (5 días) está lista.');
        setIsRegister(false);
      } else {
        const data = await db.login({ username, password });
        // Escenario 1 y 2: Activo o Trial
        onLogin(data);
      }
    } catch (err: any) {
      const apiError = err?.data;

      // Escenario 3: Trial Expired
      if (apiError?.accountStatus?.reason === 'TRIAL_EXPIRED') {
        setError('Tu período de prueba ha finalizado. Activa un plan para continuar usando FleetMaster Pro.');
      } else if (err?.status === 401) {
        // Escenario 4: Login fallido
        setError('Usuario o contraseña incorrectos. Por favor intenta de nuevo.');
      } else {
        setError(apiError?.error || 'Error de conexión con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 p-10 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 backdrop-blur-sm border border-white/20">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tight">FleetMaster Pro</h1>
          <p className="text-indigo-100 mt-2 font-medium">
            {isRegister ? 'Comienza tu gestión hoy mismo' : 'Accede a tu centro de control'}
          </p>
        </div>

        <form onSubmit={handleAction} className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-black flex items-center gap-3 animate-in slide-in-from-top-2">
              <i className="fa-solid fa-circle-exclamation text-lg"></i>
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
            <div className="relative group">
              <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
              <input 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                placeholder="Ej: fleet_manager"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative group">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
            ) : (
              <>
                {isRegister ? 'Crear Cuenta Gratis' : 'Entrar al Panel'}
                <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-slate-400 font-black hover:text-indigo-600 transition-colors uppercase tracking-widest"
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Eres nuevo? Crea una cuenta'}
            </button>
          </div>
        </form>
      </div>
      <p className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
        © 2025 FleetMaster Pro - SaaS Fleet Management
      </p>
    </div>
  );
};

export default Login;
