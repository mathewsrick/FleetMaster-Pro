import React, { useEffect, useState } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { User } from '../types';

const SuperAdmin: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, u] = await Promise.all([db.getAdminStats(), db.getAdminUsers()]);
      setStats(s);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl">
        <div>
          <h1 className="text-3xl font-black">Panel SuperAdmin</h1>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mt-1">Control Global de FleetMaster Pro</p>
        </div>
        <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
          <p className="text-[10px] text-white/60 font-black uppercase">Ingresos SaaS Totales</p>
          <p className="text-2xl font-black text-emerald-400">${stats?.totalRevenue.toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon="fa-users" title="Usuarios Registrados" value={stats?.totalUsers} color="indigo" />
        <StatCard icon="fa-credit-card" title="Suscripciones Activas" value={stats?.activeSubs} color="emerald" />
        <StatCard icon="fa-server" title="Uptime Servidor" value={`${Math.floor(stats?.serverUptime / 3600)}h ${Math.floor((stats?.serverUptime % 3600) / 60)}m`} color="slate" />
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Monitor de Actividad de Usuarios</h2>
          <button onClick={loadData} className="text-indigo-600 font-bold text-sm"><i className="fa-solid fa-rotate mr-2"></i>Refrescar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Confirmado</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Última Actividad</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {u.isConfirmed ? (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Si</span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full border border-rose-100 uppercase tracking-widest">Pendiente</span>
                    )}
                  </td>
                  <td className="px-8 py-6 font-medium text-slate-500 text-sm">
                    {u.lastActivity ? formatDateDisplay(u.lastActivity) : 'Nunca'}
                  </td>
                  <td className="px-8 py-6">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-headset mr-2"></i>Soporte</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }: any) => {
  const colors: any = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-50 text-slate-600' };
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${colors[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};

export default SuperAdmin;