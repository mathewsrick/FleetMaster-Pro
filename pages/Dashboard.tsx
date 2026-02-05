
import React, { useMemo, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../services/db';
import { Vehicle, Driver, Payment, Expense } from '../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState({
    vehicles: [] as Vehicle[],
    drivers: [] as Driver[],
    payments: [] as Payment[],
    expenses: [] as Expense[],
  });
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        // Fetching data from API which returns paginated responses for payments and expenses
        const [v, d, p, e] = await Promise.all([
          db.getVehicles(),
          db.getDrivers(),
          db.getPayments(),
          db.getExpenses(),
        ]);

        // Fix: Extract .data from paginated response
        setData({
          vehicles: v,
          drivers: d,
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
    const totalPotentialCanon = data.vehicles.reduce((sum, v) => sum + (v.driverId ? v.canonValue : 0), 0);

    return {
      totalPayments,
      totalExpenses,
      activeVehicles,
      totalVehicles: data.vehicles.length,
      netBalance: totalPayments - totalExpenses,
      potentialRevenue: totalPotentialCanon,
    };
  }, [data]);

  const selectedVehicle = useMemo(() => {
    return data.vehicles.find(v => v.id === selectedVehicleId);
  }, [selectedVehicleId, data.vehicles]);

  const vehicleStats = useMemo(() => {
    if (!selectedVehicle) return null;
    const vPayments = data.payments.filter(p => p.vehicleId === selectedVehicle.id);
    const vExpenses = data.expenses.filter(e => e.vehicleId === selectedVehicle.id);
    const totalRev = vPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExp = vExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const today = new Date();
    const soat = new Date(selectedVehicle.soatExpiration);
    const daysToSoat = Math.ceil((soat.getTime() - today.getTime()) / (1000 * 3600 * 24));

    return {
      totalRev,
      totalExp,
      net: totalRev - totalExp,
      daysToSoat,
      paymentCount: vPayments.length,
      lastPayment: vPayments.length > 0 ? vPayments[vPayments.length - 1].date : 'Nunca',
    };
  }, [selectedVehicle, data]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayPayments = data.payments
        .filter(p => p.date === dateStr)
        .reduce((sum, p) => sum + p.amount, 0);
      const dayExpenses = data.expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        payments: dayPayments,
        expenses: dayExpenses,
      };
    });
    return last7Days;
  }, [data]);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-indigo-600">
      <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel Principal</h1>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-500">
          <i className="fa-solid fa-calendar-day mr-2 text-indigo-500"></i>
          {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Flota Activa" value={`${stats.activeVehicles}/${stats.totalVehicles}`} icon="fa-car" color="indigo" />
        <StatCard title="Pagos Totales" value={`$${stats.totalPayments.toLocaleString()}`} icon="fa-money-bill-trend-up" color="green" />
        <StatCard title="Gastos Totales" value={`$${stats.totalExpenses.toLocaleString()}`} icon="fa-money-bill-transfer" color="rose" />
        <StatCard title="Balance Neto" value={`$${stats.netBalance.toLocaleString()}`} icon="fa-scale-balanced" color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Flujo de Caja Semanal</h2>
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
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="payments" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPayments)" name="Ingresos" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} name="Gastos" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-xl shadow-lg shadow-indigo-200 text-white">
            <h2 className="text-lg font-bold mb-4">Resumen de Flota</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Potencial Semanal</span>
                <span className="font-bold">${stats.potentialRevenue}</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full" style={{ width: `${stats.totalVehicles > 0 ? (stats.activeVehicles / stats.totalVehicles) * 100 : 0}%` }}></div>
              </div>
              <div className="text-xs opacity-80 italic">
                * {stats.totalVehicles > 0 ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 0}% de los vehículos están rentados.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Explorador de Vehículos</h2>
            <p className="text-sm text-slate-500">Métricas detalladas consultadas en SQLite</p>
          </div>
          <select 
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            <option value="">Seleccione un vehículo...</option>
            {data.vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.licensePlate} - {v.model}</option>
            ))}
          </select>
        </div>

        {selectedVehicle && vehicleStats ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="lg:col-span-1 space-y-4 text-center sm:text-left">
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-4xl text-slate-300 border border-slate-200">
                <i className="fa-solid fa-car"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedVehicle.model}</h3>
                <p className="text-sm font-mono text-indigo-600 font-bold tracking-widest">{selectedVehicle.licensePlate}</p>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rendimiento Bruto</p>
                <p className="text-2xl font-bold text-slate-900">${vehicleStats.totalRev}</p>
                <div className="mt-2 text-xs text-emerald-600 font-bold">
                  {vehicleStats.paymentCount} Pagos Recibidos
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Balance Neto</p>
                <p className={`text-2xl font-bold ${vehicleStats.net >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  ${vehicleStats.net}
                </p>
                <p className="text-xs text-slate-400 mt-2">Gastos: -${vehicleStats.totalExp}</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estado Legal</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${vehicleStats.daysToSoat < 10 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <p className="text-sm font-bold">SOAT Vigente</p>
                </div>
                <p className="text-xs text-slate-500">Expira: {selectedVehicle.soatExpiration}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <i className="fa-solid fa-magnifying-glass-chart text-4xl mb-3 opacity-20"></i>
            <p>Seleccione un vehículo de la lista superior para ver estadísticas detalladas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: string, color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-sky-50 text-sky-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorMap[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );
};

export default Dashboard;
