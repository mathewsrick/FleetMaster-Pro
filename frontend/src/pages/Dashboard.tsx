import React, { useMemo, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '@/services/db';
import { Vehicle, Driver, Payment, Expense, AccountStatus } from '@/types/types';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

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
          payments: p.data.map((x: any) => ({
            ...x,
            amount: Number(x.amount)
          })),
          expenses: e.data.map((x: any) => ({
            ...x,
            amount: Number(x.amount)
          })),
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
    const totalPayments = data.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const totalExpenses = data.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    const activeVehicles = data.vehicles.filter(v => v.driverId).length;

    const totalPotentialRenta = data.vehicles.reduce(
      (sum, v) => sum + (v.driverId ? Number(v.rentaValue) : 0),
      0
    );

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
    const totalRev = vPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExp = vExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
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
      const dayPayments = data.payments.filter(p => p.date === dateStr).reduce((sum, p) => sum + Number(p.amount), 0);
      const dayExpenses = data.expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + Number(e.amount), 0);
      return { name: d.toLocaleDateString('es-ES', { weekday: 'short' }), payments: dayPayments, expenses: dayExpenses };
    });
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-4xl"></i></div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Panel Principal</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Resumen general de tu operación logística</p>
        </div>
        <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm text-[10px] sm:text-xs font-bold text-slate-500 flex items-center gap-2 sm:gap-3">
          <i className="fa-solid fa-calendar-day text-indigo-500 text-xs sm:text-sm"></i>
          <span className="hidden sm:inline">{new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
          <span className="sm:hidden">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
        </div>
      </div>

      {/* Account Status Card */}
      {accountStatus && (
        <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-50 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 group-hover:scale-110 transition-transform duration-700 pointer-events-none opacity-50"></div>
           <div className="flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg ${
                accountStatus.daysRemaining <= 5 ? 'bg-rose-100 text-rose-600 shadow-rose-100' : 'bg-indigo-600 text-white shadow-indigo-100'
              }`}>
                <i className={`fa-solid ${accountStatus.daysRemaining <= 5 ? 'fa-triangle-exclamation' : 'fa-award'}`}></i>
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-400 mb-1">Estado de tu Cuenta</p>
                <div className="flex items-center gap-2 sm:gap-3">
                   <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{accountStatus.plan.replace('_', ' ')}</h2>
                   <span className={`text-[8px] sm:text-[10px] font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border uppercase tracking-wider sm:tracking-widest ${
                     accountStatus.daysRemaining <= 5 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                   }`}>
                     {accountStatus.daysRemaining <= 5 ? 'Expira pronto' : 'Activo'}
                   </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5 sm:mt-1">
                   Quedan <span className={accountStatus.daysRemaining <= 5 ? 'text-rose-600' : 'text-indigo-600'}>{accountStatus.daysRemaining} {accountStatus.daysRemaining === 1 ? 'día' : 'días'}</span> de servicio.
                </p>
              </div>
           </div>
           <Link 
             to="/pricing-checkout" 
             className={`w-full md:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest transition-all active:scale-95 shadow-lg sm:shadow-xl text-center relative z-10 ${
               accountStatus.daysRemaining <= 5 
               ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100' 
               : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
             }`}
           >
             Renovar o Subir de Plan
           </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Flota Activa" value={`${stats.activeVehicles}/${stats.totalVehicles}`} icon="fa-car" color="indigo" />
        <StatCard title="Ingresos Totales" value={`$${stats.totalPayments.toLocaleString()}`} icon="fa-money-bill-trend-up" color="green" />
        <StatCard title="Gastos Totales" value={`$${stats.totalExpenses.toLocaleString()}`} icon="fa-money-bill-transfer" color="rose" />
        <StatCard title="Balance Neto" value={`$${stats.netBalance.toLocaleString()}`} icon="fa-scale-balanced" color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-sm border border-slate-200">
          <h2 className="text-base sm:text-lg font-black text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
             <i className="fa-solid fa-chart-line text-indigo-500 text-sm sm:text-base"></i>
             <span className="truncate">Flujo de Caja Semanal</span>
          </h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{stroke: '#6366f1', strokeWidth: 1}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px'}} 
                />
                <Area type="monotone" dataKey="payments" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPayments)" name="Ingresos" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} name="Gastos" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-indigo-600 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
            <h2 className="text-base sm:text-lg font-black mb-4 flex items-center gap-2 relative z-10">
              <i className="fa-solid fa-bullseye"></i>
              <span className="truncate">Eficiencia de Flota</span>
            </h2>
            <div className="space-y-4 sm:space-y-6 relative z-10">
              <div>
                 <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest mb-2">
                    <span className="opacity-80 truncate">Potencial Semanal</span>
                    <span className="whitespace-nowrap">${stats.potentialRevenue.toLocaleString()}</span>
                 </div>
                 <div className="w-full bg-white/20 h-2.5 sm:h-3 rounded-full overflow-hidden">
                   <div className="bg-white h-full shadow-lg transition-all duration-500" style={{ width: `${stats.totalVehicles > 0 ? (stats.activeVehicles / stats.totalVehicles) * 100 : 0}%` }}></div>
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <p className="text-2xl sm:text-3xl font-black">{stats.totalVehicles > 0 ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 0}%</p>
                 <p className="text-[9px] sm:text-[10px] font-bold opacity-60 uppercase tracking-wider sm:tracking-widest italic">Ocupación Actual de la Flota</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">Explorador de Vehículos</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider sm:tracking-widest">Métricas individuales por unidad</p>
          </div>
          <select 
            value={selectedVehicleId} 
            onChange={(e) => setSelectedVehicleId(e.target.value)} 
            className="w-full sm:w-64 px-4 py-2 sm:px-6 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-bold shadow-sm appearance-none"
          >
            <option value="">Seleccione un vehículo...</option>
            {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.model}</option>)}
          </select>
        </div>
        {selectedVehicle && vehicleStats ? (
          <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-1 space-y-3 sm:space-y-4">
              <div className="aspect-square bg-slate-100 rounded-2xl sm:rounded-[28px] overflow-hidden border border-slate-200 shadow-inner group">
                {selectedVehicle.photos && selectedVehicle.photos.length > 0 ? (
                  <img
                    src={`${API_URL}${selectedVehicle.photos[0]}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={selectedVehicle.model}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl text-slate-300">
                    <i className="fa-solid fa-car"></i>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">{selectedVehicle.model}</h3>
                <p className="text-xs sm:text-sm font-mono text-indigo-600 font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase">{selectedVehicle.licensePlate}</p>
              </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider sm:tracking-widest mb-2 sm:mb-4">Ingresos Brutos</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">${vehicleStats.totalRev.toLocaleString()}</p>
              </div>
              <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider sm:tracking-widest mb-2 sm:mb-4">Balance Neto</p>
                <p className={`text-xl sm:text-2xl font-black ${vehicleStats.net >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                   {vehicleStats.net < 0 ? '-' : ''}${Math.abs(vehicleStats.net).toLocaleString()}
                </p>
              </div>
              <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider sm:tracking-widest mb-2 sm:mb-4">Vigilancia Legal</p>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${vehicleStats.daysToSoat < 10 ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-200' : 'bg-emerald-500 shadow-lg shadow-emerald-200'}`} />
                      <p className="text-[10px] sm:text-xs font-black uppercase">SOAT</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 block">
                        {new Date(selectedVehicle.soatExpiration).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-bold ${vehicleStats.daysToSoat < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ({vehicleStats.daysToSoat}d)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${vehicleStats.daysToTecno < 10 ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-200' : 'bg-emerald-500 shadow-lg shadow-emerald-200'}`} />
                      <p className="text-[10px] sm:text-xs font-black uppercase">TECNO</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 block">
                        {new Date(selectedVehicle.techExpiration).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-bold ${vehicleStats.daysToTecno < 0 ? 'text-rose-600' : vehicleStats.daysToTecno < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {vehicleStats.daysToTecno < 0 ? 'Vencido' : `(${vehicleStats.daysToTecno}d)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 sm:p-20 text-center text-slate-400">
            <i className="fa-solid fa-magnifying-glass-chart text-4xl sm:text-5xl mb-3 sm:mb-4 opacity-10"></i>
            <p className="font-bold text-xs sm:text-sm">Selecciona un vehículo para ver sus métricas detalladas.</p>
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
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 md:gap-6 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-lg ${colorMap[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1 truncate">{title}</p>
        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
      </div>
    </div>
  );
};

export default Dashboard;