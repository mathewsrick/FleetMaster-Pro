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

    // Reset UI
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
    loadData();
  };

  const driverPendingArrears = arrears.filter(
    a => a.driverId === formData.driverId && a.status === 'pending'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Caja y Recaudos</h1>
          <p className="text-slate-500 text-sm">
            Registro de cánones y abonos a moras
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
        >
          <i className="fa-solid fa-cash-register"></i> Nuevo Ingreso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Fecha</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Conductor</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Monto</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map(p => {
              const driver = drivers.find(d => d.id === p.driverId);
              const vehicle = vehicles.find(v => v.id === p.vehicleId);

              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {formatDateDisplay(p.date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">
                      {driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}
                    </span>
                    <span className="block text-[10px] text-indigo-600 font-bold">
                      {vehicle?.licensePlate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.type === 'arrear_payment'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {p.type === 'arrear_payment'
                        ? 'ABONO MORA'
                        : 'CANON SEMANAL'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ${p.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">
                      RECIBIDO
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Ingreso</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Ingreso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'canon' })}
                    className={`py-2 px-3 rounded-lg border text-sm font-bold ${
                      formData.type === 'canon'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Canon Semanal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: 'arrear_payment' })
                    }
                    className={`py-2 px-3 rounded-lg border text-sm font-bold ${
                      formData.type === 'arrear_payment'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Abono a Mora
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Conductor</label>
                <select
                  required
                  value={formData.driverId || ''}
                  onChange={e => handleDriverChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Seleccione...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'arrear_payment' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-amber-600">
                    Seleccionar Deuda Pendiente
                  </label>
                  <select
                    required
                    value={formData.arrearId || ''}
                    onChange={e => {
                      const selected = arrears.find(a => a.id === e.target.value);
                      setFormData({
                        ...formData,
                        arrearId: e.target.value,
                        amount: selected?.amountOwed || 0,
                      });
                    }}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50"
                  >
                    <option value="">Seleccione una mora...</option>
                    {driverPendingArrears.map(a => (
                      <option key={a.id} value={a.id}>
                        Deuda del {formatDateDisplay(a.dueDate)} - (${a.amountOwed})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Monto ($)</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={e =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Confirmar Ingreso
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