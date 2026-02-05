import React, { useState, useEffect, useMemo } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { Payment, Driver, Vehicle, Arrear } from '../types';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [formData, setFormData] = useState<Partial<Payment>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    driverId: '',
    vehicleId: '',
    type: 'canon',
    arrearId: null,
  });

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const userPlan = authData.accountStatus?.plan || 'free_trial';

  useEffect(() => {
    loadData();
  }, [page, limit, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, d, v, a] = await Promise.all([
        db.getPayments({ page, limit, ...dateRange }),
        db.getDrivers(),
        db.getVehicles(),
        db.getArrears(),
      ]);
      setPayments(res.data);
      setTotal(res.total);
      setDrivers(d);
      setVehicles(v);
      setArrears(a);
    } catch (err: any) {
      alert(err.data?.error || 'Error cargando datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverChange = (driverId: string) => {
    const vehicle = vehicles.find(v => v.driverId === driverId);
    setFormData({
      ...formData,
      driverId,
      vehicleId: vehicle?.id || '',
      amount: formData.type === 'canon' ? vehicle?.canonValue || 0 : 0,
      arrearId: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId) return;

    setLoading(true);
    try {
      if (formData.type === 'arrear_payment' && formData.arrearId) {
        await db.payArrear(formData.arrearId, {
          amount: formData.amount,
          date: formData.date!,
        });
      } else {
        await db.savePayment({
          ...formData,
          id: crypto.randomUUID(),
        } as Payment);
      }
      setIsModalOpen(false);
      setPage(1);
      await loadData();
    } catch (err: any) {
      alert(err?.data?.message || 'Error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDriverArrears = arrears.filter(
    a => a.driverId === formData.driverId && a.status === 'pending'
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Caja y Recaudos</h1>
          <p className="text-slate-500 text-sm font-medium">Historial paginado y búsqueda por fechas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-slate-400 text-[10px] font-black tracking-widest">DESDE</div>
            <input 
              type="date" 
              value={dateRange.startDate} 
              onChange={e => {setDateRange({ ...dateRange, startDate: e.target.value }); setPage(1);}}
              className="px-3 py-2 text-xs font-bold outline-none"
            />
            <div className="flex items-center px-3 bg-slate-50 border-x border-slate-200 text-slate-400 text-[10px] font-black tracking-widest">HASTA</div>
            <input 
              type="date" 
              value={dateRange.endDate} 
              onChange={e => {setDateRange({ ...dateRange, endDate: e.target.value }); setPage(1);}}
              className="px-3 py-2 text-xs font-bold outline-none"
            />
            {(dateRange.startDate || dateRange.endDate) && (
              <button 
                onClick={() => {setDateRange({ startDate: '', endDate: '' }); setPage(1);}}
                className="px-3 bg-rose-50 text-rose-500 border-l border-slate-200 hover:bg-rose-100 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100/50 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-plus"></i> Nuevo Pago
          </button>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <select 
          value={limit} 
          onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-600 text-sm shadow-sm"
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
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor / Vehículo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-12 text-center text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No hay registros para este periodo.</td></tr>
            ) : (
              payments.map(p => {
                const driver = drivers.find(d => d.id === p.driverId);
                const vehicle = vehicles.find(v => v.id === p.vehicleId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">{formatDateDisplay(p.date)}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}</p>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{vehicle?.licensePlate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.type === 'arrear_payment' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {p.type === 'arrear_payment' ? 'MORA' : 'CANON'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">${p.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">PROCESADO</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-tight">
              Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages}</span> 
              <span className="ml-2 opacity-50">•</span> <span className="ml-2">{total} resultados</span>
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button 
                disabled={page === totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Registrar Ingreso</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Conductor</label>
                <select 
                  required 
                  onChange={e => handleDriverChange(e.target.value)} 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold"
                >
                  <option value="">Seleccione...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <input type="number" required placeholder="Monto" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none" />
                 <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
               </div>
               <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">Cerrar</button>
                 <button type="submit" disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Confirmar Pago</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;