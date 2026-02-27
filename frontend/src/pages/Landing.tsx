import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/services/db';
import ResponsiveModal from '@/components/ResponsiveModal';
import ModalFooter from '@/components/ModalFooter';

const Landing: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      const navHeight = 64; // altura del navbar
      const sectionTop = section.offsetTop - navHeight;
      window.scrollTo({ top: sectionTop, behavior: 'smooth' });
      setIsMobileMenuOpen(false); // Cierra el menú móvil después de navegar
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-600 scroll-smooth">
      {/* Floating WhatsApp Button */}
      <a 
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[60] bg-emerald-500 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all active:scale-95 group"
        title="Chatea con nosotros"
      >
        <i className="fa-brands fa-whatsapp"></i>
        <span className="absolute right-full mr-3 sm:mr-4 bg-slate-900 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ¿Dudas? Chatea aquí
        </span>
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white transform group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <i className="fa-solid fa-truck-fast text-base sm:text-xl"></i>
            </div>
            <span className="text-base sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              FleetMaster Hub
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-slate-500">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-indigo-600 transition-colors cursor-pointer">Funcionalidades</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-indigo-600 transition-colors cursor-pointer">Planes</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="hover:text-indigo-600 transition-colors cursor-pointer">Contacto</a>
            <Link to="/login" className="bg-slate-900 text-white px-5 lg:px-6 py-2.5 rounded-full hover:bg-indigo-600 hover:shadow-lg transition-all active:scale-95">
              Iniciar Sesión
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center w-10 h-10 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all rounded-xl"
            aria-label="Abrir menú"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* Overlay Background */}
        <div 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-white flex flex-col shadow-2xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Menu Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <span className="font-black text-lg text-slate-900">Menú</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-slate-400 hover:text-slate-900 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          {/* Menu Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <a 
              href="#features" 
              onClick={(e) => scrollToSection(e, 'features')} 
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold"
            >
              <i className="fa-solid fa-cubes w-5"></i>
              Funcionalidades
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => scrollToSection(e, 'pricing')} 
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold"
            >
              <i className="fa-solid fa-tags w-5"></i>
              Planes
            </a>
            <a 
              href="#contact" 
              onClick={(e) => scrollToSection(e, 'contact')} 
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold"
            >
              <i className="fa-solid fa-envelope w-5"></i>
              Contacto
            </a>
          </nav>

          {/* Login Button */}
          <div className="p-4 border-t border-slate-100">
            <Link 
              to="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 md:pt-44 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
           <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-100 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-violet-100 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 sm:px-4 py-1.5 rounded-full text-indigo-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 animate-bounce">
            <i className="fa-solid fa-sparkles"></i> Gestión de Flotas 2.0
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-4 sm:mb-6 md:mb-8 px-2">
            Deja el Excel y recupera el <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">control real de tu flota.</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 font-medium leading-relaxed px-4">
            Deja de perder dinero por moras olvidadas y documentos vencidos. La herramienta diseñada para dueños de flotas que quieren orden, rentabilidad y menos estrés administrativo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link to="/login" className="w-full sm:w-auto bg-indigo-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">
              Empezar Prueba Gratuita
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-emerald-500 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100">
              <i className="fa-brands fa-whatsapp"></i> Asesoría por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="bg-rose-50 p-6 sm:p-10 rounded-3xl border border-rose-100">
              <h3 className="text-rose-600 font-black uppercase text-[10px] sm:text-xs tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-circle-xmark"></i> El Caos Actual (Excel/WhatsApp)
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600 text-sm sm:text-base font-medium">
                  <i className="fa-solid fa-minus mt-1 text-rose-400"></i>
                  <span>Moras perdidas en chats infinitos de WhatsApp.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm sm:text-base font-medium">
                  <i className="fa-solid fa-minus mt-1 text-rose-400"></i>
                  <span>No sabes qué vehículo te está haciendo perder dinero.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm sm:text-base font-medium">
                  <i className="fa-solid fa-minus mt-1 text-rose-400"></i>
                  <span>Multas costosas por SOAT o Tecno vencidos.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm sm:text-base font-medium">
                  <i className="fa-solid fa-minus mt-1 text-rose-400"></i>
                  <span>Discusiones con conductores por daños sin pruebas.</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 p-6 sm:p-10 rounded-3xl border border-emerald-100">
              <h3 className="text-emerald-600 font-black uppercase text-[10px] sm:text-xs tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-circle-check"></i> Con FleetMaster Hub
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700 text-sm sm:text-base font-bold">
                  <i className="fa-solid fa-plus mt-1 text-emerald-500"></i>
                  <span>Cobros automatizados y saldos claros al instante.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 text-sm sm:text-base font-bold">
                  <i className="fa-solid fa-plus mt-1 text-emerald-500"></i>
                  <span>Rentabilidad real calculada por cada placa.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 text-sm sm:text-base font-bold">
                  <i className="fa-solid fa-plus mt-1 text-emerald-500"></i>
                  <span>Alertas preventivas automáticas a tu celular.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 text-sm sm:text-base font-bold">
                  <i className="fa-solid fa-plus mt-1 text-emerald-500"></i>
                  <span>Fotos de inspección que respaldan tu negocio.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-3 sm:mb-4">Elimina el Caos Administrativo</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base">Todo lo que necesitas para que tu flota sea un negocio rentable y no un dolor de cabeza.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <FeatureCard 
              icon="fa-money-bill-transfer" 
              title="Cobra cada peso a tiempo" 
              desc="El sistema detecta pagos incompletos y genera saldos de mora automáticamente. No más cuentas perdidas en cuadernos o chats."
            />
            <FeatureCard 
              icon="fa-camera-retro" 
              title="Cero discusiones por daños" 
              desc="Registros fotográficos obligatorios por vehículo. Ten pruebas claras del estado de entrega y evita pérdidas de dinero."
            />
            <FeatureCard 
              icon="fa-id-card" 
              title="Adiós a las multas" 
              desc="Alertas inteligentes de vencimiento de SOAT y Tecnomecánica. Evita inmovilizaciones y gastos innecesarios por descuido."
            />
            <FeatureCard 
              icon="fa-chart-column" 
              title="¿Qué vehículo te da dinero?" 
              desc="Análisis de rentabilidad individual. Identifica qué vehículos son productivos y cuáles están consumiendo tus ganancias."
            />
            <FeatureCard 
              icon="fa-file-excel" 
              title="Reportes en un clic" 
              desc="Exporta toda tu operación a Excel. Ahorra horas de trabajo manual y ten tu contabilidad lista para auditorías."
            />
            <FeatureCard 
              icon="fa-envelope-open-text" 
              title="Profesionalismo total" 
              desc="Envía recibos automáticos por correo. Dale confianza a tus conductores con cuentas claras y saldos actualizados."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-3 sm:mb-4">Planes que se pagan solos</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base">Recupera tu inversión evitando una sola mora olvidada o una multa por documentos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
      <section id="contact" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 skew-x-12 translate-x-1/2 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6">¿Listo para profesionalizar tu flota?</h2>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 leading-relaxed font-medium">
              Si estás cansado de las planillas de Excel y los mensajes perdidos en WhatsApp, es momento de dar el salto. Estamos aquí para ayudarte en la transición.
            </p>
            <div className="space-y-5 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10 flex-shrink-0">
                  <i className="fa-solid fa-envelope text-sm sm:text-base"></i>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Email de Soporte</p>
                  <p className="font-bold text-sm sm:text-base">contacto@fleetmasterhub.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10 flex-shrink-0">
                  <i className="fa-solid fa-location-dot text-sm sm:text-base"></i>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Ubicación</p>
                  <p className="font-bold text-sm sm:text-base">Medellín, Colombia</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => window.open(WHATSAPP_LINK, '_blank')}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all flex-shrink-0">
                  <i className="fa-brands fa-whatsapp text-sm sm:text-base"></i>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp Empresa</p>
                  <p className="font-bold text-sm sm:text-base text-emerald-400 group-hover:underline">+57 304 638 7118</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl sm:rounded-[40px] p-6 sm:p-8 md:p-12 text-slate-900 shadow-2xl relative">
            {submitted && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl sm:rounded-[40px] z-20 flex flex-col items-center justify-center text-center p-6 sm:p-8 animate-in fade-in duration-500">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2">¡Mensaje Recibido!</h3>
                <p className="text-slate-500 font-medium italic text-sm sm:text-base">Te contactaremos en menos de 24 horas hábiles.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 sm:mt-8 text-indigo-600 font-black uppercase text-[9px] sm:text-[10px] tracking-widest">Enviar otro mensaje</button>
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-5 sm:space-y-6">
              {error && (
                <div className="p-3 sm:p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tu Nombre</label>
                  <input 
                    required 
                    type="text" 
                    value={contactForm.name}
                    onChange={e => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Ej: Carlos Silva"
                    className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tu Email</label>
                  <input 
                    required 
                    type="email" 
                    value={contactForm.email}
                    onChange={e => setContactForm({...contactForm, email: e.target.value})}
                    placeholder="Ej: carlos@empresa.com"
                    className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">¿En qué podemos ayudarte?</label>
                <textarea 
                  required 
                  rows={4} 
                  value={contactForm.message}
                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all resize-none text-sm sm:text-base"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 md:py-20 bg-white text-slate-900 px-4 sm:px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white">
              <i className="fa-solid fa-truck-fast text-lg sm:text-xl"></i>
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tighter">FleetMaster Hub</span>
          </div>
          <div className="flex gap-6 sm:gap-8 text-xs sm:text-sm font-bold text-slate-400">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-indigo-600 transition-colors">Privacidad</button>
            <button onClick={() => setShowTerms(true)} className="hover:text-indigo-600 transition-colors">Términos</button>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contacto</a>
          </div>
          <p className="text-slate-400 text-[10px] sm:text-xs font-medium text-center md:text-left">© 2025 FleetMaster Hub. Todos los derechos reservados.</p>
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
  <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[32px] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group">
    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 text-slate-400 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 sm:mb-3">{title}</h3>
    <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed">{desc}</p>
  </div>
);

const PriceCard = ({ plan, price, features, featured, desc }: any) => (
  <div className={`p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[40px] border flex flex-col transition-all relative ${featured ? 'bg-indigo-600 text-white border-indigo-500 shadow-3xl md:scale-105 z-10' : 'bg-white border-slate-100 text-slate-900'}`}>
    {featured && <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-violet-400 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">Más Popular</div>}
    <h3 className="text-xl sm:text-2xl font-black mb-1">{plan}</h3>
    <p className={`text-xs font-medium mb-6 sm:mb-8 ${featured ? 'text-indigo-100' : 'text-slate-400'}`}>{desc}</p>
    <div className="flex items-baseline gap-1 mb-8 sm:mb-10">
      <span className="text-4xl sm:text-5xl font-black">${price}</span>
      <span className={`text-xs sm:text-sm font-bold opacity-60`}>/ mes</span>
    </div>
    <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-1">
      {features.map((f: string) => (
        <li key={f} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold tracking-tight">
          <i className={`fa-solid fa-circle-check flex-shrink-0 ${featured ? 'text-violet-300' : 'text-emerald-500'}`}></i>
          {f}
        </li>
      ))}
    </ul>
    <Link to="/login" className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-center transition-all shadow-xl text-sm sm:text-base ${featured ? 'bg-white text-indigo-600 hover:bg-slate-50 shadow-indigo-700/50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
      Elegir Plan {plan}
    </Link>
  </div>
);

const LegalModal = ({ isOpen, onClose, title, content }: any) => {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="2xl"
      fullScreenOnMobile={true}
    >
      <div 
        className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-500 font-medium leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
      <ModalFooter
        primaryButton={{
          label: 'Entendido',
          onClick: onClose,
          variant: 'primary'
        }}
      />
    </ResponsiveModal>
  );
};

export default Landing;