import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
import { db, formatDateDisplay } from '../services/db';
import { Driver, Vehicle, Payment, Arrear } from '../types';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allArrears, setAllArrears] = useState<Arrear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null);
  const [driverPayments, setDriverPayments] = useState<Payment[]>([]);
  const [driverArrears, setDriverArrears] = useState<Arrear[]>([]);
  const [historyTab, setHistoryTab] = useState<'payments' | 'arrears'>('payments');

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? drivers.length >= limits.maxDrivers : false;

  const initialForm = {
    firstName: '',
    lastName: '',
    phone: '',
    idNumber: '',
    vehicleId: null,
  };

  const [formData, setFormData] = useState<Partial<Driver>>(initialForm);

  useEffect(() => {
    loadData();
  }, [page, limit]);

  const loadData = async () => {
    const [d, v, a] = await Promise.all([
      db.getDrivers(page, limit),
      db.getVehicles(),
      db.getArrears(),
    ]);
    setDrivers(d);
    setVehicles(v);
    setAllArrears(a);
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
    try {
      const isEdit = Boolean(editingId);
      const driver: Driver = {
        ...formData,
        id: isEdit ? editingId! : crypto.randomUUID(),
      } as Driver;

      await db.saveDriver(driver, isEdit);

      if (driver.vehicleId) {
        await db.assignDriver(driver.id, driver.vehicleId);
      }

      setEditingId(null);
      setFormData(initialForm);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      if (err?.data?.error === 'PLAN_LIMIT_DRIVERS') {
        setIsModalOpen(false);
        setIsUpgradeModalOpen(true);
      } else {
        alert(err?.data?.message || 'Ocurrió un error inesperado.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este conductor?')) {
      await db.deleteDriver(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Directorio de Conductores</h1>
          <p className="text-slate-500 text-sm font-medium">{drivers.length} activos en plan {authData.accountStatus?.plan}</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }}
          disabled={reachedLimit}
          className={`px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
            reachedLimit 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
          }`}
        >
          <i className="fa-solid fa-user-plus"></i> 
          {reachedLimit ? 'Límite Alcanzado' : 'Registrar Nuevo'}
        </button>
      </div>

      <div className="flex justify-end">
        <select 
          value={limit} 
          onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 text-sm shadow-sm"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Cuenta</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo Asignado</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.map(d => {
              const vehicle = vehicles.find(v => v.driverId === d.id);
              const pendingArrears = allArrears.filter(a => a.driverId === d.id && a.status === 'pending');
              const totalOwed = pendingArrears.reduce((sum, a) => sum + a.amountOwed, 0);

              return (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{d.firstName} {d.lastName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {d.idNumber} • {d.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    {totalOwed > 0 ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">
                        Deuda: ${totalOwed.toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">
                        Al Día
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vehicle ? (
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 font-mono tracking-widest">{vehicle.licensePlate}</span>
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

        {/* Paginación */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Página {page}</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button 
              disabled={drivers.length < limit}
              onClick={() => setPage(page + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Historial y Editar se mantienen... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingId ? 'Editar' : 'Nuevo'} Conductor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;