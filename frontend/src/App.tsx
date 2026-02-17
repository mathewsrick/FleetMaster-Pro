import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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

const TrialBanner: React.FC<{ status?: AccountStatus | null }> = ({ status }) => {
  if (!status) return null;

  const isExpiringSoon = status.daysRemaining <= 5 && (status.reason === 'TRIAL' || status.reason === 'ACTIVE_SUBSCRIPTION');

  if (!isExpiringSoon) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-4 animate-in slide-in-from-top duration-500">
      <i className="fa-solid fa-triangle-exclamation"></i>
      {status.reason === 'TRIAL' ? 'Tu periodo de prueba' : 'Tu plan actual'} expira en {status.daysRemaining} {status.daysRemaining === 1 ? 'día' : 'días'}. 
      <Link to="/pricing-checkout" className="underline hover:text-amber-100 ml-2">Renovar o subir de plan ahora</Link>
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
    { path: '/payments', label: 'Pagos', icon: 'fa-money-bill-transfer' },
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
          <span className="font-black text-xl tracking-tight text-white">FleetMaster</span>
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

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('fmp_auth');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null, token: null };
  });

  const login = (data: any) => {
    const newState = { isAuthenticated: true, user: data.user, token: data.token, accountStatus: data.accountStatus };
    setAuth(newState);
    localStorage.setItem('fmp_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState = { isAuthenticated: false, user: null, token: null, accountStatus: null };
    setAuth(newState);
    localStorage.removeItem('fmp_auth');
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

        localStorage.setItem('fmp_auth', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error('Error refreshing account:', err);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} />
        <Route path="/confirm/:token" element={<ConfirmAccount />} />
        <Route path="/pricing-checkout" element={auth.isAuthenticated ? <PricingCheckout /> : <Navigate to="/login" />} />
        <Route path="/payment-result" element={auth.isAuthenticated ? <PaymentResult refreshAccount={refreshAccount} /> : <Navigate to="/login" />} />

        <Route path="/dashboard" element={auth.isAuthenticated ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Dashboard /></Layout> : <Navigate to="/" />} />
        <Route path="/superadmin" element={auth.isAuthenticated && auth.user?.role === 'SUPERADMIN' ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><SuperAdmin /></Layout> : <Navigate to="/" />} />
        <Route path="/vehicles" element={auth.isAuthenticated ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Vehicles /></Layout> : <Navigate to="/" />} />
        <Route path="/drivers" element={auth.isAuthenticated ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Drivers /></Layout> : <Navigate to="/" />} />
        <Route path="/payments" element={auth.isAuthenticated ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Payments /></Layout> : <Navigate to="/" />} />
        <Route path="/expenses" element={auth.isAuthenticated ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Expenses /></Layout> : <Navigate to="/" />} />
        <Route path="/reports" element={auth.isAuthenticated ? <Layout logout={logout} username={auth.user?.username || 'User'} role={auth.user?.role} status={auth.accountStatus}><Reports /></Layout> : <Navigate to="/" />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;