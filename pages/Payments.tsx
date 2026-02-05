import React, { useState, useEffect, useMemo } from 'react';
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
  }, []);

  const loadData = async () => {
    const [p, d, v, a] = await Promise.all([
      db.getPayments(),
      db.getDrivers(),
      db.getVehicles(),
      db.getArrears(),
    ]);
    setPayments(p);
    setDrivers(d);
    setVehicles(v);
    setArrears(a);
  };

  const handleDriverChange = (driverId: string) => {
    const vehicle = vehicles.find(v => v.driverId === driverId);

    setFormData({
      ...formData,
      driverId,
      vehicleId: vehicle?.id || '',
      amount:
        formData.type === 'canon'
          ? vehicle?.canonValue || 0
          : 0,
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
          date: formData.date,
        });
      }
      else {
        await db.savePayment({
          ...formData,
          id: editingId || crypto.randomUUID(),
        } as Payment);
      }

      // Reset UI on success
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
      await loadData();
    } catch (err: any) {
      alert(err?.data?.message || 'Error al procesar el pago. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDriverArrears = useMemo(() => {
    return arrears.filter(
      a => a.driverId === formData.driverId && a.status === 'pending'
    );
  }, [arrears, formData.driverId]);

  const totalAccumulatedDebt = useMemo(() => {
    return selectedDriverArrears.reduce((sum, a) => sum + a.amountOwed, 0);
  }, [selectedDriverArrears]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Caja y Recaudos</h1>
          <p className="text-slate-500 text-sm font-medium">
            Registro de cánones y abonos a moras
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100/50"
        >
          <i className="fa-solid fa-cash-register"></i> Nuevo Ingreso
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Conductor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                  No hay registros de ingresos disponibles.
                </td>
              </tr>
            ) : (
              payments.map(p => {
                const driver = drivers.find(d => d.id === p.driverId);
                const vehicle = vehicles.find(v => v.id === p.vehicleId);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {formatDateDisplay(p.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">
                        {driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}
                      </span>
                      <span className="block text-[10px] text-indigo-600 font-black tracking-widest uppercase mt-0.5">
                        {vehicle?.licensePlate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase ${
                          p.type === 'arrear_payment'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}
                      >
                        {p.type === 'arrear_payment'
                          ? 'ABONO MORA'
                          : 'CANON SEMANAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-black border border-emerald-100 flex items-center w-fit gap-1.5 shadow-sm shadow-emerald-50">
                        <i className="fa-solid fa-check-double text-[10px]"></i> RECIBIDO
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl p-8 transform animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registrar Ingreso</h2>
                <p className="text-slate-400 text-sm font-bold">Complete los datos de la transacción</p>
              </div>
              <button 
                onClick={() => !loading && setIsModalOpen(false)}
                className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all hover:rotate-90"
                disabled={loading}
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resumen de Deuda Acumulada */}
              {formData.driverId && totalAccumulatedDebt > 0 && (
                <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation"></i> Estado de Cuenta Mora
                    </span>
                    <span className="text-xl font-black text-rose-700">
                      ${totalAccumulatedDebt.toLocaleString()}
                    </span>
                  </div>
                  <div className="max-h-20 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDriverArrears.map(a => (
                      <div key={a.id} className="flex justify-between text-[11px] font-bold text-rose-500/80 mb-1">
                        <span>Cuota {formatDateDisplay(a.dueDate)}</span>
                        <span>${a.amountOwed.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Tipo de Ingreso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setFormData({ ...formData, type: 'canon' })}
                    className={`py-4 px-4 rounded-2xl border-2 text-xs font-black transition-all ${
                      formData.type === 'canon'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100'
                        : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                    }`}
                  >
                    Canon Semanal
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setFormData({ ...formData, type: 'arrear_payment' })
                    }
                    className={`py-4 px-4 rounded-2xl border-2 text-xs font-black transition-all ${
                      formData.type === 'arrear_payment'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-100'
                        : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                    }`}
                  >
                    Abono a Mora
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Conductor</label>
                <select
                  required
                  disabled={loading}
                  value={formData.driverId || ''}
                  onChange={e => handleDriverChange(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccione un conductor...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'arrear_payment' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-amber-600 uppercase ml-1 tracking-widest mb-2 block">
                    Vincular a Mora Específica
                  </label>
                  <select
                    required
                    disabled={loading}
                    value={formData.arrearId || ''}
                    onChange={e => {
                      const selected = arrears.find(a => a.id === e.target.value);
                      setFormData({
                        ...formData,
                        arrearId: e.target.value,
                        amount: selected?.amountOwed || 0,
                      });
                    }}
                    className="w-full px-5 py-4 border-2 border-amber-200 rounded-2xl bg-amber-50 font-bold text-amber-900 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione una mora de la lista...</option>
                    {selectedDriverArrears.map(a => (
                      <option key={a.id} value={a.id}>
                        Mora {formatDateDisplay(a.dueDate)} - (${a.amountOwed.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Monto del Pago</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                    <input
                      type="number"
                      required
                      disabled={loading}
                      value={formData.amount}
                      onChange={e =>
                        setFormData({ ...formData, amount: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-black transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest mb-2 block">Fecha Efectiva</label>
                  <input
                    type="date"
                    required
                    disabled={loading}
                    value={formData.date}
                    onChange={e =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-[2] px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-2xl ${
                    loading 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      Confirmar y Notificar
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