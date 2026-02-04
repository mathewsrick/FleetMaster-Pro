
import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-600">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-indigo-600 p-2 rounded-xl text-white transform group-hover:rotate-12 transition-transform">
              <i className="fa-solid fa-truck-fast text-xl"></i>
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              FleetMaster Pro
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Características</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Planes</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contacto</a>
            <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-44 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-indigo-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            SaaS de Gestión de Flotas
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-8">
            Controla tu Negocio<br />
            <span className="text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Administra tu flota de Vehículos.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            La plataforma definitiva para gestionar conductores, pagos semanales, moras y gastos operativos. Toma decisiones basadas en datos reales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">
              Prueba Gratis 5 Días
            </Link>
            <a href="#pricing" className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-8 py-4 rounded-2xl font-black text-lg hover:border-indigo-600 transition-all">
              Ver Planes y Precios
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon="fa-chart-line" title="Analítica en Vivo" desc="Dashboard con gráficos de ingresos y gastos semanales actualizados al instante." />
            <FeatureCard icon="fa-bell" title="Gestión de Moras" desc="Detección automática de pagos incompletos y generación de deudas por cobrar." />
            <FeatureCard icon="fa-file-excel" title="Reportes Pro" desc="Exporta consolidados financieros a Excel con un solo clic para tu contabilidad." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
                Planes diseñados para escalar tu flota
            </h2>
            <p className="text-slate-500 font-medium">
                Paga solo por lo que necesitas hoy. Cambia de plan cuando crezcas.
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PriceCard
                plan="Básico"
                price="60,000"
                features={[
                'Hasta 3 vehículos',
                'Hasta 5 conductores',
                'Gestión de moras',
                'Dashboard básico',
                'Soporte por email'
                ]}
            />

            <PriceCard
                plan="Pro"
                price="90,000"
                featured
                badge="Más Popular"
                features={[
                'Hasta 10 vehículos',
                'Conductores ilimitados',
                'Gestión de moras',
                'Modulo de reportes',
                'Gestión de gastos',
                'Soporte prioritario'
                ]}
            />

            <PriceCard
                plan="Enterprise"
                price="145,000"
                features={[
                'Vehículos ilimitados',
                'Usuarios múltiples',
                'Gestión de moras',
                'Modulo de reportes avanzado',
                'API personalizada',
                'Gestión de gastos',
                'Reportes avanzados',
                'Soporte 24/7'
                ]}
            />
            </div>
        </div>
    </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-12">¿Listo para escalar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <p className="font-bold">+57 300 123 4567</p>
              <p className="text-slate-400 text-sm">Escríbenos por WhatsApp</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl">
                <i className="fa-solid fa-envelope"></i>
              </div>
              <p className="font-bold">contacto@fleetmaster.pro</p>
              <p className="text-slate-400 text-sm">Respuesta en menos de 24h</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-100">
        © 2025 FleetMaster Pro. Todos los derechos reservados.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
  <div className="p-8 bg-white border border-slate-100 rounded-[32px] hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-2">
    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);

const PriceCard = ({ plan, price, features, featured, badge }: any) => (
  <div
    className={`relative p-10 rounded-[40px] border flex flex-col transition-all
    ${featured
      ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl scale-105 z-10'
      : 'bg-white border-slate-100 text-slate-900'
    }`}
  >
    {badge && (
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black px-4 py-1 rounded-full">
        {badge}
      </span>
    )}

    <h3 className="text-xl font-bold mb-2">{plan}</h3>

    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-4xl font-black">${price}</span>
      <span className="text-sm opacity-60">/ mes</span>
    </div>

    <ul className="space-y-4 mb-10 flex-1">
      {features.map((f: string) => (
        <li key={f} className="flex items-center gap-3 text-sm font-bold">
          <i className={`fa-solid fa-circle-check ${featured ? 'text-white' : 'text-emerald-500'}`}></i>
          {f}
        </li>
      ))}
    </ul>

    <Link
      to="/login"
      className={`w-full py-4 rounded-2xl font-black text-center transition-all
      ${featured
        ? 'bg-white text-indigo-600 hover:bg-slate-50'
        : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      Elegir Plan
    </Link>
  </div>
);

export default Landing;
