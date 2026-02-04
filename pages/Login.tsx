import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (data: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      if (view === 'register') {
        await db.register({ email, username, password });
        setMessage('Cuenta creada. Por favor revisa tu correo para confirmar tu cuenta.');
        setView('login');
      } else if (view === 'forgot') {
        await db.requestReset(identifier);
        setMessage('Si el usuario o correo existe, se envió un código de recuperación.');
        setView('reset');
      } else if (view === 'reset') {
        await db.resetPassword(resetToken, password);
        setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
        setView('login');
      } else {
        const data = await db.login({ identifier, password });
        onLogin(data);
      }
    } catch (err: any) {
      const apiError = err?.data;
      if (apiError?.accountStatus?.reason === 'TRIAL_EXPIRED') {
        setTrialExpired(true);
      } else if (apiError?.accountStatus?.reason === 'UNCONFIRMED') {
        setError('Debes confirmar tu cuenta por correo antes de entrar.');
      } else {
        setError(apiError?.error || 'Error en la operación.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (trialExpired) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
            <i className="fa-solid fa-hourglass-end"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Trial Expirado</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Tu período de prueba gratuita ha finalizado. Activa un plan profesional para recuperar el acceso a tus datos.
          </p>
          <div className="space-y-4">
            <Link to="/pricing-checkout" className="block w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Activar Plan Pro</Link>
            <Link to="/" className="block w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all">Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 p-10 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <h1 className="text-2xl font-black">FleetMaster Pro</h1>
          <p className="text-indigo-100 mt-2 font-bold uppercase tracking-widest text-[10px]">
            {view === 'login' && 'Acceso Usuarios'}
            {view === 'register' && 'Nuevo Registro'}
            {view === 'forgot' && 'Recuperar Cuenta'}
            {view === 'reset' && 'Nueva Contraseña'}
          </p>
        </div>

        <form onSubmit={handleAction} className="p-10 space-y-6">
          {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}
          {message && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2"><i className="fa-solid fa-circle-check"></i>{message}</div>}

          {/* Campo Identificador para Login / Forgot */}
          {(view === 'login' || view === 'forgot') && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">
                Usuario o Correo
              </label>
              <input 
                required 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                placeholder="Ej: manager_01 o juan@email.com"
              />
            </div>
          )}

          {/* Campos específicos para Registro */}
          {view === 'register' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Correo Electrónico</label>
                <input 
                  required 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                  placeholder="Ej: juan@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Nombre de Usuario</label>
                <input 
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                  placeholder="Ej: manager_juan"
                />
              </div>
            </>
          )}

          {view === 'reset' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Código de Seguridad</label>
              <input 
                required 
                value={resetToken} 
                onChange={e => setResetToken(e.target.value)} 
                className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-center tracking-[0.2em]"
                placeholder="CÓDIGO"
              />
            </div>
          )}

          {(view !== 'forgot') && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">
                {view === 'reset' ? 'Nueva Contraseña' : 'Contraseña'}
              </label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                placeholder="••••••••"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (
              view === 'login' ? 'Entrar' : (view === 'register' ? 'Registrarme' : (view === 'forgot' ? 'Enviar Código' : 'Cambiar Contraseña'))
            )}
          </button>

          <div className="flex flex-col gap-3 text-center">
            {view === 'login' && (
              <>
                <button type="button" onClick={() => setView('forgot')} className="text-xs text-indigo-600 font-bold hover:underline">¿Olvidaste tu contraseña?</button>
                <button type="button" onClick={() => setView('register')} className="text-xs text-slate-400 font-bold uppercase hover:text-indigo-600">¿No tienes cuenta? Registrate</button>
              </>
            )}
            {(view === 'register' || view === 'forgot' || view === 'reset') && (
              <button type="button" onClick={() => setView('login')} className="text-xs text-slate-400 font-bold uppercase hover:text-indigo-600">Volver al inicio de sesión</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;