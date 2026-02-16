import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/services/db';

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
  const [showPassword, setShowPassword] = useState(false);

  // Evaluación detallada de criterios
  const passwordCriteria = useMemo(() => {
    return [
      { label: 'Al menos 8 caracteres', met: password.length >= 8 },
      { label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
      { label: 'Una letra minúscula', met: /[a-z]/.test(password) },
      { label: 'Un número', met: /[0-9]/.test(password) },
      { label: 'Un carácter especial (!@#$...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  }, [password]);

  // Resumen de fuerza para la barra de progreso
  const passwordStats = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    const score = passwordCriteria.filter(c => c.met).length;

    if (score < 3) return { score, label: 'Débil', color: 'bg-rose-500' };
    if (score < 5) return { score, label: 'Media', color: 'bg-amber-500' };
    return { score, label: 'Segura', color: 'bg-emerald-500' };
  }, [password, passwordCriteria]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      if (view === 'register') {
        if (passwordStats.score < 5) {
          throw new Error('La contraseña no cumple con todos los requisitos de seguridad.');
        }
        await db.register({ email, username, password });
        setMessage('Cuenta creada. Por favor revisa tu correo para confirmar tu cuenta.');
        setView('login');
        setPassword('');
      } else if (view === 'forgot') {
        await db.requestReset(identifier);
        setMessage('Si el usuario o correo existe, se envió un código de recuperación.');
        setView('reset');
      } else if (view === 'reset') {
        if (passwordStats.score < 5) {
          throw new Error('La nueva contraseña debe cumplir con todos los requisitos.');
        }
        await db.resetPassword(resetToken, password);
        setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
        setView('login');
        setPassword('');
      } else {
        const data = await db.login({ identifier, password });
        onLogin(data);
      }
    } catch (err: any) {
      const apiError = err?.data || err;
      if (apiError?.accountStatus?.reason === 'TRIAL_EXPIRED') {
        setTrialExpired(true);
      } else if (apiError?.accountStatus?.reason === 'UNCONFIRMED') {
        setError('Debes confirmar tu cuenta por correo antes de entrar.');
      } else {
        setError(apiError?.error || apiError?.message || 'Error en la operación.');
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
          <h1 className="text-2xl font-black">FleetMaster Hub</h1>
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

          {(view === 'login' || view === 'forgot') && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Usuario o Correo</label>
              <input 
                required 
                autoComplete="username"
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                placeholder="Ej: manager_01 o juan@email.com"
              />
            </div>
          )}

          {view === 'register' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Correo Electrónico</label>
                <input 
                  required 
                  type="email"
                  autoComplete="email"
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
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">
                  {view === 'reset' ? 'Nueva Contraseña' : 'Contraseña'}
                </label>
                {(view === 'register' || view === 'reset') && password && (
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white ${passwordStats.color}`}>
                    {passwordStats.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  autoComplete={view === 'register' ? 'new-password' : 'current-password'}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 pr-12 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {(view === 'register' || view === 'reset') && (
                <div className="space-y-3 mt-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map(step => (
                      <div key={step} className={`h-1 rounded-full transition-all duration-500 ${passwordStats.score >= step ? passwordStats.color : 'bg-slate-100'}`}></div>
                    ))}
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Requisitos de seguridad:</p>
                    {passwordCriteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${criterion.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <i className={`fa-solid ${criterion.met ? 'fa-check' : 'fa-circle'} text-[8px]`}></i>
                        </div>
                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${criterion.met ? 'text-slate-900' : 'text-slate-400'}`}>
                          {criterion.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || ((view === 'register' || view === 'reset') && passwordStats.score < 5)} 
            className={`w-full text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              ((view === 'register' || view === 'reset') && passwordStats.score < 5) ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
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
              <button type="button" onClick={() => {setView('login'); setPassword('');}} className="text-xs text-slate-400 font-bold uppercase hover:text-indigo-600">Volver al inicio de sesión</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;