import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';

const Landing: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const WHATSAPP_NUMBER = '573046387118';
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20estoy%20interesado%20en%20FleetMaster%20Hub`;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await db.submitContactForm(contactForm);
      setIsSubmitting(false);
      setSubmitted(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 8000);
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      setError('Ocurrió un error al enviar tu mensaje. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-600 scroll-smooth">
      {/* Floating WhatsApp Button */}
      <a 
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] bg-emerald-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all active:scale-95 group animate-bounce"
        title="Chatea con nosotros"
      >
        <i className="fa-brands fa-whatsapp"></i>
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ¿Dudas? Chatea aquí
        </span>
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white transform group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <i className="fa-solid fa-truck-fast text-xl"></i>
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              FleetMaster Hub
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Planes</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contacto</a>
            <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-indigo-600 hover:shadow-lg transition-all active:scale-95">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-44 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-100 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-bounce">
            <i className="fa-solid fa-sparkles"></i> Gestión de Flotas 2.0
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8">
            Control Total de tu Flota <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">en un solo lugar.</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            La plataforma definitiva para rentadores de vehículos. Gestiona conductores, automatiza cobros de mora, guarda registros fotográficos y visualiza tu rentabilidad en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">
              Prueba Gratis (5 días)
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100">
              <i className="fa-brands fa-whatsapp"></i> Hablar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Potencia tu Negocio</h2>
            <p className="text-slate-500 font-medium">Diseñado específicamente para las necesidades de los propietarios de vehículos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon="fa-money-bill-transfer" 
              title="Moras Automatizadas" 
              desc="El sistema detecta pagos incompletos y genera saldos de mora automáticamente vinculados a cada conductor."
            />
            <FeatureCard 
              icon="fa-camera-retro" 
              title="Inspección Fotográfica" 
              desc="Guarda hasta 5 fotos de alta resolución por vehículo para un control estricto de daños y estado de entrega."
            />
            <FeatureCard 
              icon="fa-id-card" 
              title="Documentación Digital" 
              desc="Almacena licencias y cédulas de conductores. Recibe alertas visuales cuando el SOAT o la Tecnomecánica van a vencer."
            />
            <FeatureCard 
              icon="fa-chart-mixed" 
              title="Rendimiento por Vehículo" 
              desc="Explora ingresos y gastos de forma individual para saber qué vehículo es realmente rentable."
            />
            <FeatureCard 
              icon="fa-file-excel" 
              title="Reportes Profesionales" 
              desc="Exporta toda tu operación a Excel en segundos para auditorías o contabilidad externa (Planes Pro/Ent)."
            />
            <FeatureCard 
              icon="fa-envelope-open-text" 
              title="Recibos Automáticos" 
              desc="Envía comprobantes de pago detallados por correo electrónico con el saldo de mora actualizado al instante."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Planes diseñados para crecer</h2>
            <p className="text-slate-500 font-medium">Desde un solo vehículo hasta flotas corporativas ilimitadas.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PriceCard 
              plan="Básico" 
              price="59.900" 
              desc="Para dueños que inician su flota."
              features={[
                'Hasta 3 Vehículos', 
                'Hasta 5 Conductores', 
                'Gestión de Moras', 
                'Historial de 30 días',
                'Soporte por Email'
              ]} 
            />
            <PriceCard 
              plan="Pro" 
              price="95.900" 
              featured 
              desc="El estándar para flotas activas."
              features={[
                'Hasta 6 Vehículos', 
                'Hasta 10 Conductores', 
                'Reportes de Excel', 
                'Rango de búsqueda de 90 días',
                'Soporte Prioritario',
                'Gestión de Moras Avanzada'
              ]} 
            />
            <PriceCard 
              plan="Enterprise" 
              price="145.900" 
              desc="Potencia máxima sin límites."
              features={[
                'Vehículos Ilimitados', 
                'Conductores Ilimitados', 
                'Reportes Semanales Automáticos', 
                'Reportes de Excel Ilimitados',
                'API Personalizada',
                'Soporte 24/7'
              ]} 
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 skew-x-12 translate-x-1/2 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">Hablemos de tu flota</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
              ¿Tienes dudas técnicas o necesitas una demostración personalizada? Nuestro equipo de expertos está listo para ayudarte a digitalizar tu operación hoy mismo.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email de Soporte</p>
                  <p className="font-bold">soporte@fleetmaster.pro</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Oficina Central</p>
                  <p className="font-bold">Bogotá, Colombia</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(WHATSAPP_LINK, '_blank')}>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <i className="fa-brands fa-whatsapp"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp Empresa</p>
                  <p className="font-bold text-emerald-400 group-hover:underline">+57 304 638 7118</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 md:p-12 text-slate-900 shadow-2xl relative">
            {submitted && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[40px] z-20 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3 className="text-2xl font-black mb-2">¡Mensaje Recibido!</h3>
                <p className="text-slate-500 font-medium italic">Te contactaremos en menos de 24 horas hábiles.</p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-indigo-600 font-black uppercase text-[10px] tracking-widest">Enviar otro mensaje</button>
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tu Nombre</label>
                  <input 
                    required 
                    type="text" 
                    value={contactForm.name}
                    onChange={e => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Ej: Carlos Silva"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tu Email</label>
                  <input 
                    required 
                    type="email" 
                    value={contactForm.email}
                    onChange={e => setContactForm({...contactForm, email: e.target.value})}
                    placeholder="Ej: carlos@empresa.com"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">¿En qué podemos ayudarte?</label>
                <textarea 
                  required 
                  rows={4} 
                  value={contactForm.message}
                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all resize-none"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white text-slate-900 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <i className="fa-solid fa-truck-fast text-xl"></i>
            </div>
            <span className="text-xl font-black tracking-tighter">FleetMaster Hub</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-400">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-indigo-600 transition-colors">Privacidad</button>
            <button onClick={() => setShowTerms(true)} className="hover:text-indigo-600 transition-colors">Términos</button>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contacto</a>
          </div>
          <p className="text-slate-400 text-xs font-medium">© 2025 FleetMaster Hub. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Legal Modals */}
      <LegalModal 
        isOpen={showPrivacy} 
        onClose={() => setShowPrivacy(false)} 
        title="Política de Privacidad"
        content={`
          <h3>1. Recolección de Datos</h3>
          <p>FleetMaster Hub recolecta información necesaria para la gestión operativa de flotas, incluyendo nombres de conductores, placas de vehículos, registros fotográficos de inspección y comprobantes de pago.</p>
          <h3>2. Uso de la Información</h3>
          <p>Los datos se utilizan exclusivamente para proveer el servicio de gestión de flota solicitado por el usuario administrador. No vendemos ni compartimos datos con terceros con fines publicitarios.</p>
          <h3>3. Seguridad de los Datos</h3>
          <p>Implementamos encriptación de nivel industrial (SSL/TLS) para todas las comunicaciones y almacenamiento seguro en bases de datos con redundancia geográfica.</p>
          <h3>4. Derechos del Usuario</h3>
          <p>Usted puede solicitar la exportación o eliminación definitiva de todos sus datos operativos en cualquier momento desde su panel de administración o contactando a nuestro soporte.</p>
        `}
      />

      <LegalModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title="Términos y Condiciones"
        content={`
          <h3>1. Naturaleza del Servicio</h3>
          <p>FleetMaster Hub es una plataforma SaaS diseñada para la administración logística. El usuario es el único responsable de la veracidad de la información cargada al sistema.</p>
          <h3>2. Planes y Pagos</h3>
          <p>El acceso a funcionalidades avanzadas está sujeto al pago de la suscripción correspondiente. Las moras en el pago de la suscripción pueden resultar en el bloqueo temporal del acceso a la plataforma.</p>
          <h3>3. Limitación de Responsabilidad</h3>
          <p>FleetMaster Hub no se hace responsable por multas de tránsito, vencimientos legales de documentos (SOAT/Técnica) o daños mecánicos no detectados en las inspecciones fotográficas.</p>
          <h3>4. Uso Aceptable</h3>
          <p>Queda prohibido el uso del sistema para actividades ilegales o para sobrecargar la infraestructura mediante el uso abusivo de la API personalizada.</p>
        `}
      />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-10 rounded-[32px] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group">
    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 font-medium text-sm leading-relaxed">{desc}</p>
  </div>
);

const PriceCard = ({ plan, price, features, featured, desc }: any) => (
  <div className={`p-10 rounded-[40px] border flex flex-col transition-all relative ${featured ? 'bg-indigo-600 text-white border-indigo-500 shadow-3xl scale-105 z-10' : 'bg-white border-slate-100 text-slate-900'}`}>
    {featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-400 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Más Popular</div>}
    <h3 className="text-2xl font-black mb-1">{plan}</h3>
    <p className={`text-xs font-medium mb-8 ${featured ? 'text-indigo-100' : 'text-slate-400'}`}>{desc}</p>
    <div className="flex items-baseline gap-1 mb-10">
      <span className="text-5xl font-black">${price}</span>
      <span className={`text-sm font-bold opacity-60`}>/ mes</span>
    </div>
    <ul className="space-y-4 mb-10 flex-1">
      {features.map((f: string) => (
        <li key={f} className="flex items-center gap-3 text-sm font-bold tracking-tight">
          <i className={`fa-solid fa-circle-check ${featured ? 'text-violet-300' : 'text-emerald-500'}`}></i>
          {f}
        </li>
      ))}
    </ul>
    <Link to="/login" className={`w-full py-5 rounded-2xl font-black text-center transition-all shadow-xl ${featured ? 'bg-white text-indigo-600 hover:bg-slate-50 shadow-indigo-700/50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
      Elegir Plan {plan}
    </Link>
  </div>
);

const LegalModal = ({ isOpen, onClose, title, content }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-[40px] w-full max-w-2xl p-8 md:p-12 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">{title}</h2>
        <div 
          className="prose prose-slate max-w-none text-slate-500 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        ></div>
        <button 
          onClick={onClose}
          className="mt-12 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default Landing;