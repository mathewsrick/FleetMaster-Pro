import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { Payment, Driver, Vehicle, Arrear } from '../types';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    loadData();
  }, [page, limit, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, d, v, a] = await Promise.all([
        db.getPayments({ page, limit, ...dateRange }),
        db.getDrivers(1, 1000),
        db.getVehicles(1, 1000),
        db.getArrears(),
      ]);
      setPayments(p.data);
      setTotal(p.total);
      setDrivers(d.data);
      setVehicles(v.data);
      setArrears(a);
    } catch (error) {
      console.error("Error loading data", error);
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
    if (!formData.driverId || !formData.vehicleId || saving) return;

    setSaving(true);
    try {
      if (formData.type === 'arrear_payment' && formData.arrearId) {
        await db.payArrear(formData.arrearId, {
          amount: formData.amount || 0,
          date: formData.date || new Date().toISOString().split('T')[0],
        });
      } else {
        await db.savePayment({
          ...formData,
          id: editingId || crypto.randomUUID(),
        } as Payment);
      }

      setEditingId(null);
      setFormData({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        driverId: '',
        vehicleId: '',
        type: 'canon',
        arrearId: null,
      });
      setIsModalOpen(false);
      setPage(1);
      await loadData();
    } catch (err: any) {
      alert(err?.data?.message || 'Error al procesar el pago. Por favor intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const driverPendingArrears = arrears.filter(
    a => a.driverId === formData.driverId && a.status === 'pending'
  );

  const totalOwed = driverPendingArrears.reduce((sum, a) => sum + a.amountOwed, 0);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Caja y Recaudos</h1>
          <p className="text-slate-500 text-sm font-medium">Registro de cánones y abonos a moras</p>
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
            onClick={() => {
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100/50 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-cash-register"></i> Nuevo Ingreso
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
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
              {loading && payments.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">No hay registros para este periodo.</td></tr>
              ) : (
                payments.map(p => {
                  const driver = drivers.find(d => d.id === p.driverId);
                  const vehicle = vehicles.find(v => v.id === p.vehicleId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{formatDateDisplay(p.date)}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{vehicle?.licensePlate}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${p.type === 'arrear_payment' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          {p.type === 'arrear_payment' ? 'ABONO MORA' : 'CANON SEMANAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">${p.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest flex items-center justify-end gap-1">
                          <i className="fa-solid fa-check-double text-[8px]"></i> Recibido
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400 tracking-tight">
            Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages || 1}</span> 
            <span className="ml-2 opacity-50">•</span> <span className="ml-2">{total} resultados</span>
          </span>
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
              <button 
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button 
                disabled={page === totalPages || total === 0 || loading}
                onClick={() => setPage(page + 1)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 transform animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Registrar Ingreso</h2>
              <button 
                onClick={() => !saving && setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={saving}
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${saving ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Conductor</label>
                <select
                  required
                  disabled={saving}
                  value={formData.driverId || ''}
                  onChange={e => handleDriverChange(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all appearance-none"
                >
                  <option value="">Seleccione un conductor...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.driverId && (
                 <div className={`p-5 rounded-2xl border-2 transition-all flex justify-between items-center ${totalOwed > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Resumen de Cuenta</span>
                     <span className={`text-sm font-black uppercase tracking-tight ${totalOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                       {totalOwed > 0 ? 'Tiene Saldo Pendiente' : 'Cuenta al Día'}
                     </span>
                   </div>
                   <div className="text-right">
                     <span className={`text-xl font-black ${totalOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                       ${totalOwed.toLocaleString()}
                     </span>
                   </div>
                 </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Tipo de Ingreso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setFormData({ ...formData, type: 'canon', arrearId: null })}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-black transition-all ${
                      formData.type === 'canon'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                        : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                    }`}
                  >
                    Canon Semanal
                  </button>
                  <button
                    type="button"
                    disabled={saving || driverPendingArrears.length === 0}
                    onClick={() =>
                      setFormData({ ...formData, type: 'arrear_payment' })
                    }
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-black transition-all ${
                      formData.type === 'arrear_payment'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100'
                        : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                    } disabled:opacity-30`}
                  >
                    Abono a Mora
                  </button>
                </div>
              </div>

              {formData.type === 'arrear_payment' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-black text-amber-600 uppercase ml-1 tracking-widest mb-2 block">
                    Seleccionar Deuda Pendiente
                  </label>
                  <select
                    required
                    disabled={saving}
                    value={formData.arrearId || ''}
                    onChange={e => {
                      const selected = arrears.find(a => a.id === e.target.value);
                      setFormData({
                        ...formData,
                        arrearId: e.target.value,
                        amount: selected?.amountOwed || 0,
                      });
                    }}
                    className="w-full px-5 py-4 border-2 border-amber-200 rounded-2xl bg-amber-50 font-bold text-amber-900 outline-none focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Seleccione una mora...</option>
                    {driverPendingArrears.map(a => (
                      <option key={a.id} value={a.id}>
                        Deuda del {formatDateDisplay(a.dueDate)} - (${a.amountOwed.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Monto ($)</label>
                  <input
                    type="number"
                    required
                    disabled={saving}
                    value={formData.amount}
                    onChange={e =>
                      setFormData({ ...formData, amount: Number(e.target.value) })
                    }
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-black transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Fecha de Pago</label>
                  <input
                    type="date"
                    required
                    disabled={saving}
                    value={formData.date}
                    onChange={e =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50 uppercase text-[10px] tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-[2] px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl uppercase text-[10px] tracking-widest ${
                    saving 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 active:scale-95'
                  }`}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-upload"></i>
                      Confirmar Ingreso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;