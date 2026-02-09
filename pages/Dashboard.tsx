import React, { useMemo, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../services/db';
import { Vehicle, Driver, Payment, Expense, AccountStatus } from '../types';
import { Link } from 'react-router-dom';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

const Dashboard: React.FC = () => {
  const [data, setData] = useState({
    vehicles: [] as Vehicle[],
    drivers: [] as Driver[],
    payments: [] as Payment[],
    expenses: [] as Expense[],
  });
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const accountStatus: AccountStatus | undefined = authData.accountStatus;

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [v, d, p, e] = await Promise.all([
          db.getVehicles(1, 1000),
          db.getDrivers(1, 1000),
          db.getPayments({ page: 1, limit: 1000 }),
          db.getExpenses({ page: 1, limit: 1000 }),
        ]);

        setData({
          vehicles: v.data,
          drivers: d.data,
          payments: p.data,
          expenses: e.data,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const stats = useMemo(() => {
    const totalPayments = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const activeVehicles = data.vehicles.filter(v => v.driverId).length;
    const totalPotentialRenta = data.vehicles.reduce((sum, v) => sum + (v.driverId ? v.rentaValue : 0), 0);

    return {
      totalPayments,
      totalExpenses,
      activeVehicles,
      totalVehicles: data.vehicles.length,
      netBalance: totalPayments - totalExpenses,
      potentialRevenue: totalPotentialRenta,
    };
  }, [data]);

  const selectedVehicle = useMemo(() => data.vehicles.find(v => v.id === selectedVehicleId), [selectedVehicleId, data.vehicles]);

  const vehicleStats = useMemo(() => {
    if (!selectedVehicle) return null;
    const vPayments = data.payments.filter(p => p.vehicleId === selectedVehicle.id);
    const vExpenses = data.expenses.filter(e => e.vehicleId === selectedVehicle.id);
    const totalRev = vPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExp = vExpenses.reduce((sum, e) => sum + e.amount, 0);
    const today = new Date();
    const soat = new Date(selectedVehicle.soatExpiration);
    const daysToSoat = Math.ceil((soat.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const tecno = new Date(selectedVehicle.techExpiration);
    const daysToTecno = Math.ceil((tecno.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return { totalRev, totalExp, net: totalRev - totalExp, daysToSoat, daysToTecno, paymentCount: vPayments.length };
  }, [selectedVehicle, data]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayPayments = data.payments.filter(p => p.date === dateStr).reduce((sum, p) => sum + p.amount, 0);
      const dayExpenses = data.expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.amount, 0);
      return { name: d.toLocaleDateString('es-ES', { weekday: 'short' }), payments: dayPayments, expenses: dayExpenses };
    });
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-4xl"></i></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel Principal</h1>
          <p className="text-sm text-slate-500 font-medium">Resumen general de tu operación logística</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500 flex items-center gap-3">
          <i className="fa-solid fa-calendar-day text-indigo-500"></i>
          {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}
        </div>
      </div>

      {/* Account Status Card */}
      {accountStatus && (
        <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 pointer-events-none opacity-50"></div>
           <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${
                accountStatus.daysRemaining <= 5 ? 'bg-rose-100 text-rose-600 shadow-rose-100' : 'bg-indigo-600 text-white shadow-indigo-100'
              }`}>
                <i className={`fa-solid ${accountStatus.daysRemaining <= 5 ? 'fa-triangle-exclamation' : 'fa-award'}`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estado de tu Cuenta</p>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{accountStatus.plan.replace('_', ' ')}</h2>
                   <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                     accountStatus.daysRemaining <= 5 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                   }`}>
                     {accountStatus.daysRemaining <= 5 ? 'Expira pronto' : 'Activo'}
                   </span>
                </div>
                <p className="text-sm font-bold text-slate-500 mt-1">
                   Quedan <span className={accountStatus.daysRemaining <= 5 ? 'text-rose-600' : 'text-indigo-600'}>{accountStatus.daysRemaining} {accountStatus.daysRemaining === 1 ? 'día' : 'días'}</span> de servicio.
                </p>
              </div>
           </div>
           <Link 
             to="/pricing-checkout" 
             className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl ${
               accountStatus.daysRemaining <= 5 
               ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100' 
               : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
             }`}
           >
             Renovar o Subir de Plan
           </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Flota Activa" value={`${stats.activeVehicles}/${stats.totalVehicles}`} icon="fa-car" color="indigo" />
        <StatCard title="Ingresos Totales" value={`$${stats.totalPayments.toLocaleString()}`} icon="fa-money-bill-trend-up" color="green" />
        <StatCard title="Gastos Totales" value={`$${stats.totalExpenses.toLocaleString()}`} icon="fa-money-bill-transfer" color="rose" />
        <StatCard title="Balance Neto" value={`$${stats.netBalance.toLocaleString()}`} icon="fa-scale-balanced" color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
          <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
             <i className="fa-solid fa-chart-line text-indigo-500"></i>
             Flujo de Caja Semanal
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{stroke: '#6366f1', strokeWidth: 1}} 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px'}} 
                />
                <Area type="monotone" dataKey="payments" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorPayments)" name="Ingresos" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} name="Gastos" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-[32px] shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <i className="fa-solid fa-bullseye"></i>
              Eficiencia de Flota
            </h2>
            <div className="space-y-6">
              <div>
                 <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-2">
                    <span className="opacity-80">Potencial Semanal</span>
                    <span>${stats.potentialRevenue.toLocaleString()}</span>
                 </div>
                 <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                   <div className="bg-white h-full shadow-lg" style={{ width: `${stats.totalVehicles > 0 ? (stats.activeVehicles / stats.totalVehicles) * 100 : 0}%` }}></div>
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <p className="text-3xl font-black">{stats.totalVehicles > 0 ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 0}%</p>
                 <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest italic">Ocupación Actual de la Flota</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h2 className="text-lg font-black text-slate-800">Explorador de Vehículos</h2><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Métricas individuales por unidad</p></div>
          <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="w-full sm:w-64 px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm appearance-none">
            <option value="">Seleccione un vehículo...</option>
            {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.model}</option>)}
          </select>
        </div>
        {selectedVehicle && vehicleStats ? (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="aspect-square bg-slate-100 rounded-[28px] overflow-hidden border border-slate-200 shadow-inner group">
                {selectedVehicle.photos && selectedVehicle.photos.length > 0 ? (
                  <img
                    src={`${API_URL}${selectedVehicle.photos[0]}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                    <i className="fa-solid fa-car"></i>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedVehicle.model}</h3>
                <p className="text-sm font-mono text-indigo-600 font-black tracking-[0.2em] uppercase">{selectedVehicle.licensePlate}</p>
              </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ingresos Brutos</p>
                <p className="text-2xl font-black text-slate-900">${vehicleStats.totalRev.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Balance Neto</p>
                <p className={`text-2xl font-black ${vehicleStats.net >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                   {vehicleStats.net < 0 ? '-' : ''}${Math.abs(vehicleStats.net).toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vigilancia Legal</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${vehicleStats.daysToSoat < 10 ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-200' : 'bg-emerald-500 shadow-lg shadow-emerald-200'}`} />
                    <p className="text-xs font-black uppercase">SOAT</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">{selectedVehicle.soatExpiration}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${vehicleStats.daysToTecno < 10 ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-200' : 'bg-emerald-500 shadow-lg shadow-emerald-200'}`} />
                    <p className="text-xs font-black uppercase">TECNO</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">{selectedVehicle.techExpiration}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center text-slate-400">
            <i className="fa-solid fa-magnifying-glass-chart text-5xl mb-4 opacity-10"></i>
            <p className="font-bold text-sm">Selecciona un vehículo para ver sus métricas detalladas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: string, color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = { 
    indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100', 
    green: 'bg-emerald-50 text-emerald-600 shadow-emerald-100', 
    rose: 'bg-rose-50 text-rose-600 shadow-rose-100', 
    blue: 'bg-sky-50 text-sky-600 shadow-sky-100' 
  };
  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${colorMap[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export default Dashboard;