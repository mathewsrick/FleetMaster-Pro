
import React from 'react';
import { Link } from 'react-router-dom';

const PricingCheckout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-24 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-black mb-8">
            <i className="fa-solid fa-arrow-left"></i> Volver
          </Link>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Elige tu Plan de Crecimiento</h1>
          <p className="text-slate-500 font-medium">Sube de nivel tu flota. Recuerda: Solo permitimos upgrades para proteger tu operación.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PlanOption
            name="Básico"
            price="60,000"
            limits="3 Vehículos | 5 Conductores"
            color="indigo"
          />
          <PlanOption
            name="Pro"
            price="90,000"
            recommended
            limits="6 Vehículos | 10 Conductores"
            color="indigo"
          />
          <PlanOption
            name="Enterprise"
            price="145,000"
            limits="Vehículos Ilimitados"
            color="indigo"
          />
        </div>
      </div>
    </div>
  );
};

const PlanOption = ({ name, price, limits, recommended }: any) => (
  <div className={`p-10 rounded-[40px] bg-white border-2 transition-all ${recommended ? 'border-indigo-600 shadow-2xl' : 'border-white'}`}>
    {recommended && <span className="inline-block bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full mb-6 uppercase tracking-widest">Recomendado</span>}
    <h3 className="text-2xl font-black text-slate-900 mb-2">{name}</h3>
    <p className="text-slate-400 font-bold text-xs uppercase mb-8">{limits}</p>
    <div className="text-4xl font-black text-slate-900 mb-8">${price}<span className="text-sm font-medium opacity-40">/mes</span></div>
    <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg">
      Activar Plan
    </button>
  </div>
);

export default PricingCheckout;
