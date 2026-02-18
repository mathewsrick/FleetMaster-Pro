import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/services/db';
import Swal from 'sweetalert2';

type Duration = 'monthly' | 'semiannual' | 'yearly';

declare var WidgetCheckout: any;

const PricingCheckout: React.FC = () => {
  const [duration, setDuration] = useState<Duration>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const auth = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const currentPlan = auth.accountStatus?.plan || 'free_trial';
  const daysRemaining = auth.accountStatus?.daysRemaining || 0;
  
  const isPlanActive = daysRemaining > 0 && auth.accountStatus?.reason === 'ACTIVE_SUBSCRIPTION';

  const PLAN_WEIGHTS: Record<string, number> = {
    'free_trial': 0,
    'basico': 1,
    'pro': 2,
    'enterprise': 3
  };

  const openWompiWidget = (data: any) => {
    const checkout = new WidgetCheckout({
      currency: data.currency,
      amountInCents: data.amountInCents,
      reference: data.reference,
      publicKey: data.publicKey,
      signature: { integrity: data.signature },
      // redirectUrl: data.redirectUrl,
    });

    checkout.open((result: any) => {
      const transaction = result.transaction;
      if (transaction.status === 'APPROVED') {
        Swal.fire({
          icon: 'success',
          title: 'Pago Aprobado',
          text: 'Estamos activando tu plan. Serás redirigido en breve.',
          timer: 3000,
          showConfirmButton: false
        }).then(() => {
          window.location.href = `/#/payment-result?id=${transaction.id}`;
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Estado del Pago',
          text: `El pago se encuentra en estado: ${transaction.status}.`,
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  };

  const handlePurchase = async (planKey: string) => {
    setLoading(planKey);
    try {
      // 1. Obtener parámetros de pago e integridad desde el backend
      const wompiData = await db.initWompiPayment(planKey, duration);
      // 2. Abrir el Widget de Wompi
      openWompiWidget(wompiData);

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.data?.error || 'No se pudo iniciar el proceso de pago.',
        confirmButtonColor: '#e11d48'
      });
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (base: number) => {
    if (duration === 'monthly') return base;
    if (duration === 'semiannual') return base * 5; 
    return base * 10; 
  };

  const currentWeight = PLAN_WEIGHTS[currentPlan] || 0;
  const cannotChooseBasico = currentWeight > 1;

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-24 font-sans selection:bg-indigo-100">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-black mb-8 hover:gap-3 transition-all">
            <i className="fa-solid fa-arrow-left"></i> Volver al Inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Elige tu Plan de Crecimiento</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto mb-10 leading-relaxed">Sube el nivel de tu operación logística con herramientas avanzadas.</p>
          
          {isPlanActive && (
            <div className="mb-10 p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl max-w-2xl mx-auto text-amber-700 font-bold text-sm shadow-xl shadow-amber-100/20">
               <i className="fa-solid fa-lock text-xl mb-2 block"></i>
               Tienes una suscripción vigente de <strong>{currentPlan.toUpperCase()}</strong> con {daysRemaining} días restantes. 
               Podrás renovar o cambiar de plan una vez que el actual expire.
            </div>
          )}

          <div className="inline-flex p-1 bg-slate-200 rounded-2xl gap-1 shadow-inner">
            <button 
              onClick={() => setDuration('monthly')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${duration === 'monthly' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensual
            </button>
            <button 
              onClick={() => setDuration('semiannual')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${duration === 'semiannual' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              6 Meses
              <span className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[7px] px-2 py-0.5 rounded-full shadow-lg border-2 border-white">1 mes GRATIS</span>
            </button>
            <button 
              onClick={() => setDuration('yearly')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${duration === 'yearly' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Anual
              <span className="absolute -top-3 -right-2 bg-indigo-600 text-white text-[7px] px-2 py-0.5 rounded-full shadow-lg border-2 border-white">2 meses GRATIS</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PlanOption 
            name="Básico" 
            price={getPrice(59900)} 
            duration={duration}
            limits="3 Vehículos | 5 Conductores"
            features={[
              { text: "Hasta 3 vehículos", included: true },
              { text: "Hasta 5 conductores", included: true },
              { text: "Gestión de pagos", included: true },
              { text: "Control de gastos", included: true },
              { text: "Historial de 30 días", included: true },
              { text: "Alertas de vencimientos", included: true },
              { text: "Soporte por email", included: true },
              { text: "Reportes básicos", included: true },
              { text: "Exportar a Excel", included: false },
              { text: "Reportes avanzados", included: false },
              { text: "Soporte prioritario", included: false },
              { text: "API personalizada", included: false }
            ]}
            onSelect={() => handlePurchase('basico')}
            loading={loading === 'basico'}
            isCurrent={currentPlan === 'basico'}
            isDisabled={isPlanActive || cannotChooseBasico}
            restrictionMsg={cannotChooseBasico ? "Tu nivel de cuenta no permite bajar a este plan" : (isPlanActive ? "Tienes un plan vigente" : "")}
          />
          <PlanOption
            name="Pro"
            price={getPrice(95900)}
            duration={duration}
            recommended
            limits="6 Vehículos | 10 Conductores"
            features={[
              { text: "Hasta 6 vehículos", included: true },
              { text: "Hasta 10 conductores", included: true },
              { text: "Gestión de pagos", included: true },
              { text: "Control de gastos", included: true },
              { text: "Historial de 90 días", included: true },
              { text: "Alertas de vencimientos", included: true },
              { text: "Soporte prioritario", included: true },
              { text: "Reportes avanzados", included: true },
              { text: "Exportar a Excel", included: true },
              { text: "Dashboard personalizado", included: true },
              { text: "API personalizada", included: false }
            ]}
            onSelect={() => handlePurchase('pro')}
            loading={loading === 'pro'}
            isCurrent={currentPlan === 'pro'}
            isDisabled={isPlanActive}
            restrictionMsg={isPlanActive ? "Tienes un plan vigente" : ""}
          />
          <PlanOption 
            name="Enterprise" 
            price={getPrice(145900)} 
            duration={duration}
            limits="Vehículos Ilimitados"
            features={[
              { text: "Vehículos ilimitados", included: true },
              { text: "Conductores ilimitados", included: true },
              { text: "Gestión de pagos", included: true },
              { text: "Control de gastos", included: true },
              { text: "Historial ilimitado", included: true },
              { text: "Alertas personalizadas", included: true },
              { text: "Soporte 24/7", included: true },
              { text: "Reportes avanzados", included: true },
              { text: "Exportar a Excel", included: true },
              { text: "Dashboard personalizado", included: true },

              { text: "API personalizada", included: true }
            ]}
            onSelect={() => handlePurchase('enterprise')}
            loading={loading === 'enterprise'}
            isCurrent={currentPlan === 'enterprise'}
            isDisabled={isPlanActive}
            restrictionMsg={isPlanActive ? "Tienes un plan vigente" : ""}
          />
        </div>
      </div>
    </div>
  );
};

const PlanOption = ({ name, price, limits, recommended, features, duration, onSelect, loading, isCurrent, isDisabled, restrictionMsg }: any) => {
  const durationLabel = {
    monthly: 'mes',
    semiannual: 'semestre',
    yearly: 'año'
  };

  return (
    <div className={`p-8 rounded-[40px] bg-white border-2 transition-all flex flex-col relative ${
      recommended ? 'border-indigo-600 shadow-2xl scale-105 z-10' : 'border-slate-100 shadow-sm'
    } ${isDisabled && !isCurrent ? 'opacity-40 grayscale-[0.5]' : ''}`}>
      {recommended && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl">Más Recomendado</span>}
      {isCurrent && <span className="absolute top-6 right-6 text-indigo-600 text-[8px] font-black uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">Plan Actual</span>}
      
      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{name}</h3>
      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
         <i className="fa-solid fa-check-double text-[8px]"></i> {limits}
      </p>
      
      <div className="text-5xl font-black text-slate-900 mb-6 flex items-baseline gap-1">
        <span className="text-2xl opacity-40">$</span>{price.toLocaleString()}
        <span className="text-xs font-bold text-slate-300">/{durationLabel[duration as keyof typeof durationLabel]}</span>
      </div>

      <div className="flex-1 mb-6">
        <ul className="space-y-3">
          {features.map((feature: any, idx: number) => (
            <li key={idx} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-slate-700' : 'text-slate-300'}`}>
              <i className={`fa-solid ${feature.included ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-slate-300'} text-base mt-0.5 flex-shrink-0`}></i>
              <span className={`${feature.included ? 'font-medium' : 'font-normal line-through'}`}>{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <button 
        disabled={loading || isDisabled || isCurrent}
        onClick={onSelect}
        className={`w-full font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 ${
          isCurrent ? 'bg-slate-50 text-slate-400 border-dashed border-2 cursor-default' :
          isDisabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
          recommended ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
        {isCurrent ? 'Vigente' : isDisabled ? 'No disponible' : `Activar Plan ${name}`}
      </button>
      {restrictionMsg && <p className="text-[9px] text-rose-500 font-bold mt-3 text-center uppercase tracking-tighter italic">{restrictionMsg}</p>}
    </div>
  );
};

export default PricingCheckout;