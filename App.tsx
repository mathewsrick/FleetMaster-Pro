
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { AuthState } from './types';

const Layout: React.FC<{ children: React.ReactNode, logout: () => void, username: string }> = ({ children, logout, username }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'fa-chart-pie' },
    { path: '/vehicles', label: 'Vehículos', icon: 'fa-car' },
    { path: '/drivers', label: 'Conductores', icon: 'fa-id-card' },
    { path: '/payments', label: 'Pagos', icon: 'fa-hand-holding-dollar' },
    { path: '/expenses', label: 'Gastos', icon: 'fa-receipt' },
    { path: '/reports', label: 'Reportes', icon: 'fa-file-invoice-dollar' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <i className="fa-solid fa-truck-fast text-xl"></i>
            </div>
            <span className="text-xl font-bold tracking-tight">FleetMaster</span>
          </div>
          <nav className="flex-1 px-4 space-y-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`fa-solid ${item.icon} w-5`}></i>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <i className="fa-solid fa-right-from-bracket w-5"></i>
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden text-slate-600 p-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900">{username}</span>
              <span className="text-xs text-slate-500">Administrador</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('fmp_auth');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null, token: null };
  });

  const login = (data: { token: string, user: any }) => {
    const newState = { isAuthenticated: true, user: data.user, token: data.token };
    setAuth(newState);
    localStorage.setItem('fmp_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState = { isAuthenticated: false, user: null, token: null };
    setAuth(newState);
    localStorage.removeItem('fmp_auth');
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <Router>
      <Layout logout={logout} username={auth.user?.username || 'User'}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
