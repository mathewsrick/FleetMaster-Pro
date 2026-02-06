import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import Swal from 'sweetalert2';

const PricingCheckout: React.FC = () => {
  const [duration, setDuration] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const auth = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const currentPlan = auth.accountStatus?.plan || 'free_trial';

  const handlePurchase = async (planKey: string) => {
    setLoading(planKey);
    try {
      const result = await db.purchasePlan(planKey.toLowerCase(), duration);

      // Actualizar localStorage con el nuevo estatus
      const newAuth = { 
        ...auth, 
        accountStatus: { 
          ...auth.accountStatus, 
          plan: result.plan, 
          accessLevel: result.accessLevel 
        } 
      };
      localStorage.setItem('fmp_auth', JSON.stringify(newAuth));

      await Swal.fire({
        icon: 'success',
        title: '¡Suscripción Activada!',
        text: `Has activado con éxito el plan ${planKey}. Tu nueva fecha de vencimiento es ${new Date(result.dueDate).toLocaleDateString()}.`,
        confirmButtonColor: '#4f46e5'
      });

      navigate('/dashboard');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Operación no permitida',
        text: err.data?.error || 'No se pudo procesar la suscripción.',
        confirmButtonColor: '#e11d48'
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-24 font-sans selection:bg-indigo-100">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-black mb-8 hover:gap-3 transition-all">
            <i className="fa-solid fa-arrow-left"></i> Volver al Inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Elige tu Plan de Crecimiento</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto mb-10">Sube de nivel tu operación. Al elegir el plan anual obtienes 2 meses de regalo.</p>
          
          {/* Duration Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${duration === 'monthly' ? 'text-indigo-600' : 'text-slate-400'}`}>Mensual</span>
            <button 
              onClick={() => setDuration(duration === 'monthly' ? 'yearly' : 'monthly')}
              className="w-16 h-8 bg-slate-200 rounded-full relative p-1 transition-all"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all absolute top-1 ${duration === 'yearly' ? 'left-9' : 'left-1'}`}></div>
            </button>
            <span className={`text-sm font-bold ${duration === 'yearly' ? 'text-indigo-600' : 'text-slate-400'}`}>
              Anual <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full ml-1">Ahorra 17%</span>
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PlanOption 
            name="Básico" 
            price={duration === 'monthly' ? 29 : 290} 
            duration={duration}
            limits="3 Vehículos | 5 Conductores"
            desc="Soporte por email y visualización de historial de 30 días."
            onSelect={() => handlePurchase('basico')}
            loading={loading === 'basico'}
            isCurrent={currentPlan === 'basico'}
          />
          <PlanOption 
            name="Pro" 
            price={duration === 'monthly' ? 59 : 590} 
            duration={duration}
            recommended 
            limits="6 Vehículos | 10 Conductores"
            desc="Reportes de Excel, soporte prioritario y búsqueda de 90 días."
            onSelect={() => handlePurchase('pro')}
            loading={loading === 'pro'}
            isCurrent={currentPlan === 'pro'}
          />
          <PlanOption 
            name="Enterprise" 
            price={duration === 'monthly' ? 149 : 1490} 
            duration={duration}
            limits="Vehículos Ilimitados"
            desc="Reportes semanales automáticos y acceso a API personalizada."
            onSelect={() => handlePurchase('enterprise')}
            loading={loading === 'enterprise'}
            isCurrent={currentPlan === 'enterprise'}
          />
        </div>
        
        <div className="mt-20 p-10 bg-indigo-900 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-black mb-2">¿Necesitas algo a medida?</h3>
            <p className="text-indigo-200 font-medium italic opacity-80">Si tienes más de 100 vehículos, contáctanos para un descuento corporativo.</p>
          </div>
          <button className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-100 transition-all active:scale-95">
            Contactar Ventas
          </button>
        </div>
      </div>
    </div>
  );
};

const PlanOption = ({ name, price, limits, recommended, desc, duration, onSelect, loading, isCurrent }: any) => (
  <div className={`p-10 rounded-[40px] bg-white border-2 transition-all flex flex-col relative ${recommended ? 'border-indigo-600 shadow-2xl scale-105' : 'border-slate-100 shadow-sm'}`}>
    {recommended && <span className="inline-block bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">Más Recomendado</span>}
    {isCurrent && <span className="absolute top-6 right-6 text-indigo-600 text-[8px] font-black uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Plan Actual</span>}
    
    <h3 className="text-2xl font-black text-slate-900 mb-2">{name}</h3>
    <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4">{limits}</p>
    <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{desc}</p>
    
    <div className="text-5xl font-black text-slate-900 mb-10 mt-auto">
      ${price}<span className="text-sm font-bold text-slate-300 ml-1">/{duration === 'monthly' ? 'mes' : 'año'}</span>
    </div>

    <button 
      disabled={loading || isCurrent}
      onClick={onSelect}
      className={`w-full font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 ${
        isCurrent ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-dashed border-2' :
        recommended ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
      {isCurrent ? 'Tu plan actual' : `Activar Plan ${name}`}
    </button>
  </div>
);

export default PricingCheckout;