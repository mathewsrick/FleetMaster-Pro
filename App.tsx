
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Landing from './pages/Landing';
import { AuthState, AccountStatus } from './types';

const TrialBanner: React.FC<{ status: AccountStatus }> = ({ status }) => {
  if (status.reason !== 'TRIAL') return null;
  return (
    <div className="bg-amber-500 text-white px-6 py-2.5 text-xs font-black flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 shadow-lg relative z-[60]">
      <i className="fa-solid fa-clock text-lg"></i>
      <span className="uppercase tracking-widest">Periodo de Prueba: Te quedan {status.daysRemaining} día(s) de uso gratuito</span>
      <Link to="/subscription" className="bg-white text-amber-600 px-4 py-1 rounded-full hover:bg-slate-50 transition-colors ml-4 shadow-sm">
        ACTIVAR PLAN PRO
      </Link>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode, logout: () => void, username: string, status?: AccountStatus | null }> = ({ children, logout, username, status }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { path: '/vehicles', label: 'Vehículos', icon: 'fa-car' },
    { path: '/drivers', label: 'Conductores', icon: 'fa-id-card' },
    { path: '/payments', label: 'Pagos', icon: 'fa-hand-holding-dollar' },
    { path: '/expenses', label: 'Gastos', icon: 'fa-receipt' },
    { path: '/reports', label: 'Reportes', icon: 'fa-file-invoice-dollar' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-900/20">
              <i className="fa-solid fa-truck-fast text-xl"></i>
            </div>
            <span className="text-xl font-black tracking-tight">FleetMaster</span>
          </div>
          <nav className="flex-1 px-4 space-y-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`fa-solid ${item.icon} w-5`}></i>
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-800">
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-sm">
              <i className="fa-solid fa-right-from-bracket w-5"></i>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {status && <TrialBanner status={status} />}

        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden text-slate-600 p-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-slate-900 tracking-tight">{username}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${status?.accessLevel === 'FULL' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {status?.accessLevel === 'FULL' ? 'Suscripción Pro' : 'Free Trial'}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black border border-slate-200 text-lg shadow-sm">
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('fmp_auth');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null, token: null };
  });

  const login = (data: any) => {
    const newState = { 
      isAuthenticated: true, 
      user: data.user, 
      token: data.token,
      accountStatus: data.accountStatus
    };
    setAuth(newState);
    localStorage.setItem('fmp_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState = { isAuthenticated: false, user: null, token: null, accountStatus: null };
    setAuth(newState);
    localStorage.removeItem('fmp_auth');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          auth.isAuthenticated ? 
          <Layout logout={logout} username={auth.user?.username || 'User'} status={auth.accountStatus}>
            <Dashboard />
          </Layout> : <Navigate to="/" />
        } />
        
        <Route path="/vehicles" element={
          auth.isAuthenticated ? 
          <Layout logout={logout} username={auth.user?.username || 'User'} status={auth.accountStatus}>
            <Vehicles />
          </Layout> : <Navigate to="/" />
        } />

        <Route path="/drivers" element={
          auth.isAuthenticated ? 
          <Layout logout={logout} username={auth.user?.username || 'User'} status={auth.accountStatus}>
            <Drivers />
          </Layout> : <Navigate to="/" />
        } />

        <Route path="/payments" element={
          auth.isAuthenticated ? 
          <Layout logout={logout} username={auth.user?.username || 'User'} status={auth.accountStatus}>
            <Payments />
          </Layout> : <Navigate to="/" />
        } />

        <Route path="/expenses" element={
          auth.isAuthenticated ? 
          <Layout logout={logout} username={auth.user?.username || 'User'} status={auth.accountStatus}>
            <Expenses />
          </Layout> : <Navigate to="/" />
        } />

        <Route path="/reports" element={
          auth.isAuthenticated ? 
          <Layout logout={logout} username={auth.user?.username || 'User'} status={auth.accountStatus}>
            <Reports />
          </Layout> : <Navigate to="/" />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
