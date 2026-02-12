import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../services/db';
import Swal from 'sweetalert2';

const SuperAdmin: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Función principal de carga de datos
  const loadData = useCallback(async (query?: string) => {
    try {
      if (!query) setLoading(true);
      else setSearching(true);

      // Si hay una query, la enviamos al backend que ya soporta ?search=
      const [s, u] = await Promise.all([
        db.getAdminStats(),
        db.getAdminUsers(query)
      ]);
      
      setStats(s);
      setUsers(u);
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudieron cargar los datos administrativos.', 'error');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Efecto para búsqueda con Debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Solo recargamos si no es la carga inicial (donde searchQuery es '')
      // o si el usuario escribió algo.
      loadData(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadData]);

  const handleGrantLicense = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: `<span class="text-indigo-600">Conceder Licencia</span>`,
      html: `
        <div class="text-left space-y-4 px-2">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuario: ${user.username}</p>
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase text-slate-400">Plan a otorgar</label>
            <select id="swal-plan" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
              <option value="basico">Básico</option>
              <option value="pro">Pro</option>
              <option value="enterprise" selected>Enterprise</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase text-slate-400">Expiración (Opcional - Vacío para Vitalicia)</label>
            <input id="swal-date" type="date" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase text-slate-400">Razón / Motivo</label>
            <input id="swal-reason" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" placeholder="Ej: Socio Estratégico, Cortesía Beta">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generar Licencia Gratis',
      confirmButtonColor: '#4f46e5',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const plan = (document.getElementById('swal-plan') as HTMLSelectElement).value;
        const expiresAt = (document.getElementById('swal-date') as HTMLInputElement).value;
        const reason = (document.getElementById('swal-reason') as HTMLInputElement).value;
        return { plan, expiresAt: expiresAt || null, reason: reason || 'Acceso Manual SuperAdmin' };
      }
    });

    if (formValues) {
      try {
        Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

        const response = await fetch(`${API_URL}/api/superadmin/grant-license`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('fmp_auth') || '{}').token}`
          },
          body: JSON.stringify({
            userId: user.id,
            ...formValues
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Error al procesar licencia');
        }

        Swal.fire({
          icon: 'success',
          title: 'Licencia Activada',
          text: `El usuario ${user.username} ahora tiene acceso ${formValues.plan.toUpperCase()}.`,
          timer: 2000,
          showConfirmButton: false
        });
        
        loadData(searchQuery);
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  if (loading && stats === null) return <div className="p-20 text-center"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-600"></i></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight">Panel de Control SaaS</h1>
          <p className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Gestión Maestra de FleetMaster Hub</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4 relative z-10">
          <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Suscripciones SaaS</p>
            <p className="text-2xl font-black text-emerald-400">${stats?.mrr?.toLocaleString() || 0}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon="fa-users" title="Usuarios Totales" value={stats?.totalUsers} color="indigo" />
        <StatCard icon="fa-crown" title="Licencias Activas" value={stats?.activeSubs} color="emerald" />
        <StatCard icon="fa-car-side" title="Vehículos SaaS" value={stats?.totalVehicles} color="blue" />
        <StatCard icon="fa-heart-pulse" title="Estado Servidor" value="Óptimo" color="slate" />
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">Directorio de Clientes</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de accesos y planes manuales</p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
              <i className={`fa-solid ${searching ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400`}></i>
              <input 
                type="text" 
                placeholder="Buscar por email o usuario..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
              />
            </div>
            <button onClick={() => loadData(searchQuery)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-200 transition-all">
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {searching && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <i className="fa-solid fa-circle-notch fa-spin text-indigo-600 text-2xl"></i>
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organización / Usuario</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actual</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo de Acceso</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic font-medium">No se encontraron usuarios que coincidan con la búsqueda.</td></tr>
              ) : users.map(u => {
                const isManual = u.dueDate === null && u.plan !== 'free_trial';
                
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border ${u.role === 'SUPERADMIN' ? 'bg-slate-900 text-white border-slate-900' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{u.username}</p>
                          <p className="text-[11px] font-medium text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest shadow-sm ${
                         u.plan === 'enterprise' ? 'bg-indigo-600 text-white border-indigo-600' : 
                         u.plan === 'pro' ? 'bg-violet-50 text-violet-600 border-violet-100' :
                         u.plan === 'basico' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         'bg-slate-100 text-slate-500 border-slate-200'
                       }`}>
                         {u.plan.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {isManual ? (
                        <div className="flex flex-col items-center">
                          <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-tighter">
                            <i className="fa-solid fa-gift"></i> Cortesía / Manual
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">Sin expiración</span>
                        </div>
                      ) : u.dueDate ? (
                        <div className="flex flex-col items-center">
                          <span className="text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                            <i className="fa-solid fa-credit-card mr-1"></i> Suscripción
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">Vence: {new Date(u.dueDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Free Trial</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {u.role !== 'SUPERADMIN' && (
                        <button 
                          onClick={() => handleGrantLicense(u)}
                          className="px-5 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                        >
                          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Licencia Gratis
                        </button>
                      )}
                      {u.role === 'SUPERADMIN' && (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Master Admin</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }: any) => {
  const colors: any = { 
    indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100 border-indigo-100', 
    emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100 border-emerald-100', 
    slate: 'bg-slate-50 text-slate-600 shadow-slate-100 border-slate-100', 
    blue: 'bg-sky-50 text-sky-600 shadow-sky-100 border-sky-100' 
  };
  return (
    <div className="bg-white p-6 rounded-[28px] border flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${colors[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value !== undefined ? value : '...'}</p>
      </div>
    </div>
  );
};

export default SuperAdmin;