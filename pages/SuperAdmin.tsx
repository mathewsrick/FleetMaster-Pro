import React, { useEffect, useState } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { User, SystemPlan, SystemFeature, AuditLog, GlobalBanner } from '../types';
import Swal from 'sweetalert2';

type Tab = 'dashboard' | 'fleets' | 'plans' | 'staff' | 'notices';

const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await db.request<any>('/superadmin/dashboard');
        setData(res);
      } else if (activeTab === 'fleets') {
        const res = await db.request<any[]>(`/superadmin/fleets?search=${search}`);
        setData(res);
      } else if (activeTab === 'plans') {
        const res = await db.request<any>('/superadmin/plans');
        setData(res);
      } else if (activeTab === 'staff') {
        const res = await db.request<User[]>('/superadmin/staff');
        setData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFleet = async (fleet: any) => {
    const action = fleet.isBlocked ? 'desbloquear' : 'suspender';
    const res = await Swal.fire({
      title: `¿Confirmas ${action} esta flota?`,
      text: fleet.isBlocked ? "Podrán acceder de nuevo." : "Se les impedirá el acceso inmediatamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      confirmButtonColor: fleet.isBlocked ? '#10b981' : '#e11d48'
    });

    if (res.isConfirmed) {
      await db.request('/superadmin/fleets/toggle', 'POST', { fleetId: fleet.id, isBlocked: !fleet.isBlocked });
      loadData();
      Swal.fire('Hecho', `La flota ha sido ${action}ada.`, 'success');
    }
  };

  const handleEditPlan = async (plan: SystemPlan) => {
    const features = data.features as SystemFeature[];
    const { value: formValues } = await Swal.fire({
      title: `Configurar Plan: ${plan.name}`,
      html: `
        <div class="space-y-4 text-left p-2 max-h-[60vh] overflow-y-auto">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400">Nombre del Plan</label>
            <input id="swal-name" class="swal2-input !w-full !m-0 !mt-1" value="${plan.name}">
          </div>
          <div class="grid grid-cols-2 gap-4">
             <div>
               <label class="text-[10px] font-black uppercase text-slate-400">Precio Mes ($)</label>
               <input id="swal-pm" type="number" class="swal2-input !w-full !m-0 !mt-1" value="${plan.priceMonthly}">
             </div>
             <div>
               <label class="text-[10px] font-black uppercase text-slate-400">Precio Año ($)</label>
               <input id="swal-py" type="number" class="swal2-input !w-full !m-0 !mt-1" value="${plan.priceYearly}">
             </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
             <div>
               <label class="text-[10px] font-black uppercase text-slate-400">Límite Vehículos</label>
               <input id="swal-lv" type="number" class="swal2-input !w-full !m-0 !mt-1" value="${plan.limits.maxVehicles}">
             </div>
             <div>
               <label class="text-[10px] font-black uppercase text-slate-400">Límite Drivers</label>
               <input id="swal-ld" type="number" class="swal2-input !w-full !m-0 !mt-1" value="${plan.limits.maxDrivers}">
             </div>
          </div>
          <div class="border-t pt-4">
            <p class="text-[10px] font-black uppercase text-slate-400 mb-2">Features Habilitadas</p>
            <div class="grid grid-cols-1 gap-2">
              ${features.map(f => `
                <label class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="checkbox" name="swal-features" value="${f.key}" ${plan.features.includes(f.key) ? 'checked' : ''}>
                  <div class="text-left">
                    <p class="text-xs font-black text-slate-700">${f.name}</p>
                    <p class="text-[9px] text-slate-400">${f.description}</p>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      width: '32rem',
      preConfirm: () => {
        const enabledFeatures: string[] = [];
        document.querySelectorAll<HTMLInputElement>('input[name="swal-features"]:checked').forEach(el => enabledFeatures.push(el.value));
        
        return {
          name: (document.getElementById('swal-name') as HTMLInputElement).value,
          priceMonthly: Number((document.getElementById('swal-pm') as HTMLInputElement).value),
          priceYearly: Number((document.getElementById('swal-py') as HTMLInputElement).value),
          features: enabledFeatures,
          limits: {
            maxVehicles: Number((document.getElementById('swal-lv') as HTMLInputElement).value),
            maxDrivers: Number((document.getElementById('swal-ld') as HTMLInputElement).value),
            hasExcelReports: enabledFeatures.includes('basic_reports') || enabledFeatures.includes('custom_reports'),
            hasCustomApi: enabledFeatures.includes('api_access'),
            maxHistoryDays: plan.limits.maxHistoryDays,
            maxRangeDays: plan.limits.maxRangeDays
          },
          isActive: true
        }
      }
    });

    if (formValues) {
      await db.request(`/superadmin/plans/${plan.key}`, 'PUT', formValues);
      loadData();
      Swal.fire('Guardado', 'Configuración de plan actualizada.', 'success');
    }
  };

  const handlePostNotice = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Publicar Aviso Global',
      html: `
        <div class="space-y-4 text-left p-2">
           <div>
            <label class="text-[10px] font-black uppercase text-slate-400">Mensaje del Banner</label>
            <textarea id="b-msg" class="swal2-textarea !w-full !m-0 !mt-1" placeholder="Ej: Mantenimiento programado hoy a las 11 PM"></textarea>
           </div>
           <div>
            <label class="text-[10px] font-black uppercase text-slate-400">Tipo de Alerta</label>
            <select id="b-type" class="swal2-input !w-full !m-0 !mt-1">
              <option value="info">Información (Azul)</option>
              <option value="warning">Advertencia (Ambar)</option>
              <option value="error">Urgente (Rojo)</option>
              <option value="success">Éxito (Verde)</option>
            </select>
           </div>
           <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400">Fecha Inicio</label>
                <input id="b-start" type="date" class="swal2-input !w-full !m-0 !mt-1" value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400">Fecha Fin</label>
                <input id="b-end" type="date" class="swal2-input !w-full !m-0 !mt-1" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}">
              </div>
           </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => ({
        message: (document.getElementById('b-msg') as HTMLTextAreaElement).value,
        type: (document.getElementById('b-type') as HTMLSelectElement).value,
        startDate: (document.getElementById('b-start') as HTMLInputElement).value,
        endDate: (document.getElementById('b-end') as HTMLInputElement).value
      })
    });

    if (formValues) {
      await db.request('/superadmin/banners', 'POST', formValues);
      Swal.fire('Publicado', 'El aviso global está activo.', 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Panel SuperAdmin</h1>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] mt-1">SaaS Management Suite — v2.0</p>
        </div>
        
        <div className="flex bg-white/10 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <TabBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-chart-pie" label="Metricas" />
          <TabBtn active={activeTab === 'fleets'} onClick={() => setActiveTab('fleets')} icon="fa-truck-ramp-box" label="Flotas" />
          <TabBtn active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon="fa-layer-group" label="Planes" />
          <TabBtn active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon="fa-user-shield" label="Staff" />
          <TabBtn active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} icon="fa-bullhorn" label="Avisos" />
        </div>
      </header>

      {loading && !data ? (
        <div className="p-20 text-center"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i></div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon="fa-sack-dollar" title="MRR Proyectado" value={`$${data.mrr.toLocaleString()}`} color="indigo" />
                <StatCard icon="fa-users" title="Flotas Totales" value={data.totalUsers} color="blue" />
                <StatCard icon="fa-hourglass-half" title="En Período Trial" value={data.trialUsers} color="amber" />
                <StatCard icon="fa-car" title="Vehículos Global" value={data.totalVehicles} color="emerald" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                   <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                     <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i>
                     Auditoría del Sistema
                   </h3>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {data.recentLogs.map((log: AuditLog) => (
                        <div key={log.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-start">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm shrink-0 uppercase">{log.username[0]}</div>
                           <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900 leading-tight">{log.details}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{log.username} • {log.action}</span>
                                <span className="text-[9px] text-slate-400 font-medium">{formatDateDisplay(log.createdAt)}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                      <h3 className="text-lg font-black mb-4">Salud del Servidor</h3>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-xs font-bold opacity-60 uppercase">Uptime</span>
                            <span className="font-mono text-xl font-black">
                               {Math.floor(data.serverUptime / 3600)}h {Math.floor((data.serverUptime % 3600) / 60)}m
                            </span>
                         </div>
                         <div className="flex justify-between items-center py-2">
                            <span className="text-xs font-bold opacity-60 uppercase">BBDD Latency</span>
                            <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Normal (2ms)</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6">Avisos Globales Activos</h3>
                      <div className="space-y-3">
                         {data.activeBanners.length > 0 ? data.activeBanners.map((b: GlobalBanner) => (
                           <div key={b.id} className={`p-4 rounded-2xl border flex items-center gap-3 ${
                             b.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                             b.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                           }`}>
                              <i className="fa-solid fa-circle-info"></i>
                              <p className="text-xs font-bold flex-1">{b.message}</p>
                              <span className="text-[9px] font-black opacity-50 uppercase">HASTA {b.endDate}</span>
                           </div>
                         )) : (
                           <p className="text-center py-8 text-slate-300 italic text-sm font-medium">No hay avisos globales activos.</p>
                         )}
                         <button onClick={handlePostNotice} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Publicar Nuevo Aviso</button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fleets' && (
            <div className="space-y-6">
               <div className="relative">
                 <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                 <input 
                    placeholder="Buscar flotas por nombre o correo..." 
                    className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-50 font-bold transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                 />
               </div>

               <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flota / Empresa</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recursos</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {(data as any[]).map(f => (
                         <tr key={f.id} className={`hover:bg-slate-50 transition-colors ${f.isBlocked ? 'bg-rose-50/20 opacity-70' : ''}`}>
                            <td className="px-8 py-6">
                               <div className="font-black text-slate-900 leading-tight">{f.username}</div>
                               <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{f.email}</div>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                                 f.plan === 'enterprise' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                 f.plan === 'pro' ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-slate-50 text-slate-500'
                               }`}>
                                 {f.plan || 'Free Trial'}
                               </span>
                            </td>
                            <td className="px-8 py-6">
                               {f.isBlocked ? (
                                 <span className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase">
                                   <i className="fa-solid fa-lock text-[8px]"></i> Suspendida
                                 </span>
                               ) : (
                                 <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                                   <i className="fa-solid fa-check text-[8px]"></i> Activa
                                 </span>
                               )}
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  <i className="fa-solid fa-car text-slate-300"></i>
                                  <span className="font-black text-slate-700 text-sm">{f.vehicleCount}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-500">
                               {f.dueDate ? formatDateDisplay(f.dueDate) : 'N/A'}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => handleToggleFleet(f)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${f.isBlocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}>
                                     <i className={`fa-solid ${f.isBlocked ? 'fa-unlock' : 'fa-lock'} text-xs`}></i>
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {(data.plans as SystemPlan[]).map(plan => (
                 <div key={plan.key} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-indigo-600 transition-colors duration-500"></div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-6 relative z-10">{plan.name}</h3>
                    
                    <div className="space-y-4 mb-8">
                       <PlanInfo label="Vehículos" value={plan.limits.maxVehicles >= 999 ? '∞' : plan.limits.maxVehicles} />
                       <PlanInfo label="Conductores" value={plan.limits.maxDrivers >= 999 ? '∞' : plan.limits.maxDrivers} />
                       <PlanInfo label="Precio" value={`$${plan.priceMonthly.toLocaleString()}`} />
                       <div className="pt-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Features Habilitadas</p>
                          <div className="flex flex-wrap gap-1.5">
                             {plan.features.slice(0, 3).map(f => (
                               <span key={f} className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{f.replace('_', ' ')}</span>
                             ))}
                             {plan.features.length > 3 && <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-400 rounded">+{plan.features.length - 3}</span>}
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => handleEditPlan(plan)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl relative z-10"
                    >
                      Configurar
                    </button>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-xl font-black text-slate-900">Equipo de Soporte y Admins</h3>
                  <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">Añadir Staff</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Usuario / Rol</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Estado</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Último Acceso</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Acciones</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {(data as User[]).map(u => (
                         <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6">
                               <div className="font-black text-slate-900">{u.username}</div>
                               <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{u.role}</div>
                            </td>
                            <td className="px-8 py-6">
                               {u.isBlocked ? (
                                 <span className="text-rose-500 font-black text-[10px] uppercase">Bloqueado</span>
                               ) : (
                                 <span className="text-emerald-500 font-black text-[10px] uppercase">Activo</span>
                               )}
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-400">
                               {u.lastActivity ? formatDateDisplay(u.lastActivity) : 'Nunca'}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex justify-end gap-2">
                                  <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-pen text-xs"></i></button>
                                  <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="max-w-2xl mx-auto text-center space-y-8 py-20">
               <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                 <i className="fa-solid fa-bullhorn"></i>
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Comunicaciones Globales</h2>
                  <p className="text-slate-500 font-medium">Envía mensajes instantáneos a todas las flotas o correos masivos de actualización.</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={handlePostNotice} className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all group">
                     <i className="fa-solid fa-display text-2xl text-slate-300 group-hover:text-indigo-600 mb-4"></i>
                     <p className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Publicar Banner</p>
                  </button>
                  <button className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all group">
                     <i className="fa-solid fa-envelope-bulk text-2xl text-slate-300 group-hover:text-indigo-600 mb-4"></i>
                     <p className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Email Masivo</p>
                  </button>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-white/60 hover:text-white'}`}>
    <i className={`fa-solid ${icon}`}></i> {label}
  </button>
);

const StatCard = ({ icon, title, value, color }: any) => {
  const colors: any = { indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100', blue: 'bg-blue-50 text-blue-600 shadow-blue-100', amber: 'bg-amber-50 text-amber-600 shadow-amber-100', emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100' };
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-xl transition-shadow duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${colors[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

const PlanInfo = ({ label, value }: any) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{label}</span>
    <span className="font-black text-slate-900">{value}</span>
  </div>
);

export default SuperAdmin;