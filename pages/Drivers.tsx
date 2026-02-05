import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Driver, Vehicle, Payment, Arrear } from '../types';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allArrears, setAllArrears] = useState<Arrear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null);
  const [driverPayments, setDriverPayments] = useState<Payment[]>([]);
  const [driverArrears, setDriverArrears] = useState<Arrear[]>([]);
  const [historyTab, setHistoryTab] = useState<'payments' | 'arrears'>('payments');

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? total >= limits.maxDrivers : false;

  const initialForm = { firstName: '', lastName: '', phone: '', idNumber: '', vehicleId: null };
  const [formData, setFormData] = useState<Partial<Driver>>(initialForm);

  useEffect(() => { loadData(); }, [page, limit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, v, a] = await Promise.all([
        db.getDrivers(page, limit),
        db.getVehicles(1, 1000), 
        db.getArrears(),
      ]);
      setDrivers(dRes.data);
      setTotal(dRes.total);
      setVehicles(v.data);
      setAllArrears(a);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (driver: Driver) => {
    setHistoryDriver(driver);
    const [payments, arrears] = await Promise.all([
      db.getPaymentsByDriver(driver.id),
      db.getArrearsByDriver(driver.id),
    ]);
    setDriverPayments(payments);
    setDriverArrears(arrears);
    setHistoryTab('payments');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const driver: Driver = { ...formData, id: isEdit ? editingId! : crypto.randomUUID() } as Driver;
      await db.saveDriver(driver, isEdit);
      if (driver.vehicleId) await db.assignDriver(driver.id, driver.vehicleId);
      setEditingId(null);
      setFormData(initialForm);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.data?.message || 'Error al guardar conductor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este conductor?')) {
      await db.deleteDriver(id);
      loadData();
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Conductores</h1>
          <p className="text-slate-500 text-sm font-medium">{total} activos en plan {authData.accountStatus?.plan}</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }}
          disabled={reachedLimit || loading}
          className={`px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
            reachedLimit ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
          }`}
        >
          <i className="fa-solid fa-user-plus"></i> 
          {reachedLimit ? 'Límite Alcanzado' : 'Registrar Nuevo'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Cuenta</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && drivers.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
              ) : drivers.map(d => {
                const vehicle = vehicles.find(v => v.driverId === d.id);
                const pendingArrears = allArrears.filter(a => a.driverId === d.id && a.status === 'pending');
                const totalOwed = pendingArrears.reduce((sum, a) => sum + a.amountOwed, 0);

                return (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-bold text-slate-900">{d.firstName} {d.lastName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {d.idNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      {totalOwed > 0 ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">Deuda: ${totalOwed.toLocaleString()}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">Al Día</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vehicle ? (
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">{vehicle.licensePlate}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button onClick={() => handleOpenHistory(d)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><i className="fa-solid fa-clock-rotate-left"></i></button>
                      <button onClick={() => { setEditingId(d.id); setFormData(d); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                      <button onClick={() => handleDelete(d.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400 tracking-tight">
            Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages || 1}</span> 
            <span className="mx-2 opacity-30">•</span> {total} conductores
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={limit} 
              onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600 shadow-sm"
            >
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
            </select>
            
            <div className="flex gap-2">
              <button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <button disabled={page === totalPages || total === 0 || loading} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingId ? 'Editar' : 'Nuevo'} Conductor</h2>
            <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${saving ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Nombre" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none text-sm" />
                <input required placeholder="Apellido" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none text-sm" />
              </div>
              <input required placeholder="Teléfono" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none text-sm" />
              <input required placeholder="Documento ID" value={formData.idNumber || ''} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none text-sm" />
              <select value={formData.vehicleId || ''} onChange={e => setFormData({ ...formData, vehicleId: e.target.value || null })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none text-sm">
                <option value="">Sin vehículo asignado</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} ({v.model})</option>)}
              </select>
              <div className="flex gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-slate-400 uppercase text-[10px] tracking-widest disabled:opacity-30">Cerrar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                    saving 
                      ? 'bg-indigo-400 text-white cursor-not-allowed' 
                      : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {saving ? <i className="fa-solid fa-circle-notch fa-spin text-sm"></i> : null}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;