import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Vehicles from '@/pages/Vehicles';
import Drivers from '@/pages/Drivers';
import Payments from '@/pages/Payments';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import Login from '@/pages/Login';
import Landing from '@/pages/Landing';
import PricingCheckout from '@/pages/PricingCheckout';
import SuperAdmin from '@/pages/SuperAdmin';
import ConfirmAccount from '@/pages/ConfirmAccount';
import PaymentResult from '@/pages/PaymentResult';
import { db } from '@/services/db';
import { AuthState, AccountStatus } from '@/types/types';
import { usePageTracking } from '@/hooks/usePageTracking';

const TrialBanner: React.FC<{ status?: AccountStatus | null }> = ({ status }) => {
  if (!status) return null;

  // Mostrar banner si:
  // 1. Está en período de prueba (TRIAL) - siempre
  // 2. Plan activo con 7 días o menos para expirar
  // 3. BLOQUEADO (suscripción expirada)
  const shouldShowBanner = 
    status.reason === 'TRIAL' || 
    status.reason === 'TRIAL_EXPIRED' ||
    (status.reason === 'ACTIVE_SUBSCRIPTION' && status.daysRemaining <= 7) ||
    status.accessLevel === 'BLOCKED';

  if (!shouldShowBanner) return null;

  // Determinar urgencia y estilo
  const isExpired = status.reason === 'TRIAL_EXPIRED' || status.accessLevel === 'BLOCKED';
  const isCritical = status.daysRemaining <= 3;
  
  const bannerColor = isExpired ? 'bg-rose-600' : (isCritical ? 'bg-rose-500' : 'bg-amber-500');
  const icon = isExpired ? 'fa-circle-exclamation' : (isCritical ? 'fa-circle-exclamation' : 'fa-triangle-exclamation');
  
  let message = '';
  if (isExpired) {
    message = '🚨 Tu suscripción ha expirado. Renueva ahora para recuperar el acceso';
  } else if (status.reason === 'TRIAL') {
    message = `🎁 Período de Prueba: ${status.daysRemaining} ${status.daysRemaining === 1 ? 'día' : 'días'} restantes`;
  } else {
    message = `⏰ Tu plan expira en ${status.daysRemaining} ${status.daysRemaining === 1 ? 'día' : 'días'}`;
  }

  return (
    <div className={`${bannerColor} text-white px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 sm:gap-4 animate-in slide-in-from-top duration-500 shadow-lg`}>
      <i className={`fa-solid ${icon} ${isExpired ? 'animate-pulse' : ''}`}></i>
      <span className="flex-1">{message}</span>
      <Link to="/pricing-checkout" className={`underline hover:opacity-80 whitespace-nowrap ${isExpired ? 'animate-pulse font-black' : ''}`}>
        {isExpired ? '¡RENOVAR AHORA!' : (status.reason === 'TRIAL' ? 'Activar Plan' : 'Renovar')}
      </Link>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode; logout: () => void; username: string; role?: string; status?: AccountStatus | null }> = ({ children, logout, username, role, status }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { path: '/vehicles', label: 'Vehículos', icon: 'fa-car' },
    { path: '/drivers', label: 'Conductores', icon: 'fa-users' },
    { path: '/payments', label: 'Recaudos', icon: 'fa-money-bill-transfer' },
    { path: '/expenses', label: 'Gastos', icon: 'fa-file-invoice-dollar' },
    { path: '/reports', label: 'Reportes', icon: 'fa-file-lines' },
  ];

  if (role === 'SUPERADMIN') {
    navItems.unshift({ path: '/superadmin', label: 'Admin SaaS', icon: 'fa-shield-halved' });
  }

    const closeMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center justify-between lg:justify-start gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
            <Link to="/dashboard" className="font-black tracking-tight text-white">
            FleetMaster Hub
            </Link>
        </div>
        <button onClick={closeMenu} className="lg:hidden text-slate-400 hover:text-white">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={closeMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${location.pathname === item.path ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <i className={`fa-solid ${item.icon} w-5`}></i>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-6 border-t border-white/5">
        <button onClick={() => { logout(); closeMenu(); }} className="flex items-center gap-3 px-4 py-3 w-full text-rose-400 hover:text-rose-300 font-bold transition-colors">
          <i className="fa-solid fa-right-from-bracket"></i>
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <TrialBanner status={status} />

      {/* Mobile Menu Overlay - Renderizado condicional */}
      <div
        className={`fixed inset-0 z-[9999] lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        style={{ 
          position: 'fixed !important' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        {/* Overlay Background */}
        <div 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" 
          onClick={closeMenu}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Sidebar Menu */}
        <aside 
          className={`absolute top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-slate-900 flex flex-col shadow-2xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ 
            position: 'absolute',
            height: '100%',
            zIndex: 10000
          }}
        >
          <SidebarContent />
        </aside>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-slate-900 hidden lg:flex flex-col flex-shrink-0">
          <SidebarContent />
        </aside>

        <main className="flex-1 overflow-auto">
          {/* Header Responsive */}
          <header className="bg-white h-14 sm:h-16 md:h-20 border-b border-slate-200 px-3 sm:px-4 md:px-8 flex items-center sticky top-0 z-50 shadow-sm">
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(true);
              }}
              className="lg:hidden flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 active:bg-indigo-50 transition-all rounded-xl"
              aria-label="Abrir menú"
              type="button"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                zIndex: 1
              }}
            >
              <i className="fa-solid fa-bars text-xl sm:text-2xl"></i>
            </button>

            {/* Logo Móvil - Visible solo en móvil */}
            <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
              <div className="bg-indigo-600 p-1 sm:p-1.5 px-2 rounded-lg text-white">
                <i className="fa-solid fa-truck-fast text-xs sm:text-sm"></i>
              </div>
              <span className="text-sm sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">FleetMaster Hub</span>
            </div>

            {/* User Info - Más compacto en móvil */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <div className="text-right hidden md:block">
              <p className="text-sm font-black text-slate-900">{username}</p>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                {role === 'SUPERADMIN' ? 'Control Maestro' : (status?.plan.replace('_', ' ') || 'Free Trial')}
              </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 font-black border border-slate-200 uppercase text-xs sm:text-sm">
              {username[0]}
              </div>
            </div>
          </header>
          
          {/* Content Area - Padding responsive */}
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC<{ auth: AuthState; login: (data: any) => void; logout: () => void; refreshAccount: () => Promise<void> }> = ({ auth, login, logout, refreshAccount }) => {
  usePageTracking();

  // 🔒 Verificar si el usuario está bloqueado y necesita renovar
  const isBlocked = auth.accountStatus?.accessLevel === 'BLOCKED' && auth.user?.role !== 'SUPERADMIN';
  
  // Componente para proteger rutas cuando el usuario está bloqueado
  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!auth.isAuthenticated) return <Navigate to="/login" />;
    if (isBlocked) return <Navigate to="/pricing-checkout" replace />;
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={auth.isAuthenticated ? (isBlocked ? <Navigate to="/pricing-checkout" /> : <Navigate to="/dashboard" />) : <Landing />} />
      <Route path="/login" element={auth.isAuthenticated ? (isBlocked ? <Navigate to="/pricing-checkout" /> : <Navigate to="/dashboard" />) : <Login onLogin={login} />} />
      <Route path="/confirm/:token" element={<ConfirmAccount />} />
      
      {/* ✅ Pricing Checkout SIEMPRE accesible para usuarios autenticados */}
      <Route path="/pricing-checkout" element={auth.isAuthenticated ? <PricingCheckout /> : <Navigate to="/login" />} />
      <Route path="/payment-result" element={auth.isAuthenticated ? <PaymentResult refreshAccount={refreshAccount} /> : <Navigate to="/login" />} />

      {/* 🔒 Rutas protegidas - bloqueadas si la suscripción expiró */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/superadmin" element={auth.isAuthenticated && auth.user?.role === 'SUPERADMIN' ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><SuperAdmin /></Layout> : <Navigate to="/" />} />
      <Route path="/vehicles" element={<ProtectedRoute><Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Vehicles /></Layout></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Drivers /></Layout></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Payments /></Layout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Expenses /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Reports /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem('fmp_auth');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null, token: null };
  });

  const login = (data: any) => {
    const newState = { isAuthenticated: true, user: data.user, token: data.token, accountStatus: data.accountStatus };
    setAuth(newState);
    sessionStorage.setItem('fmp_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState = { isAuthenticated: false, user: null, token: null, accountStatus: null };
    setAuth(newState);
    sessionStorage.removeItem('fmp_auth');
  };

  const refreshAccount = async () => {
    try {
      const res = await db.refreshAuth();

      if (!res?.accountStatus) return;

      setAuth(prev => {
        const updated = {
          ...prev,
          accountStatus: res.accountStatus,
        };

        sessionStorage.setItem('fmp_auth', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error('Error refreshing account:', err);
    }
  };

  return (
    <Router>
      <AppContent auth={auth} login={login} logout={logout} refreshAccount={refreshAccount} />
    </Router>
  );
};

export default App;