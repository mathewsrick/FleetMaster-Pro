
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, formatDateDisplay } from '../services/db';
import { Driver, Vehicle, Payment, Arrear } from '../types';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allArrears, setAllArrears] = useState<Arrear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null);
  const [driverPayments, setDriverPayments] = useState<Payment[]>([]);
  const [driverArrears, setDriverArrears] = useState<Arrear[]>([]);
  const [historyTab, setHistoryTab] = useState<'payments' | 'arrears'>('payments');

  // Obtener límites del plan desde el auth
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
  }, []);

  const loadData = async () => {
    const [d, v, a] = await Promise.all([
      db.getDrivers(),
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Directorio de Conductores
          </h1>
          <p className="text-slate-500 text-sm">
            {drivers.length} / {limits?.maxDrivers || 0} usados en plan {authData.accountStatus?.plan}
          </p>
        </div>
        <button
          onClick={() => {
            if (!reachedLimit || editingId) {
              setEditingId(null);
              setFormData(initialForm);
              setIsModalOpen(true);
            }
          }}
          disabled={reachedLimit && !editingId}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            reachedLimit && !editingId 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100'
          }`}
        >
          <i className="fa-solid fa-user-plus"></i> 
          {reachedLimit && !editingId ? 'Límite de Plan Alcanzado' : 'Registrar Nuevo'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                Nombre Completo
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                Estado de Cuenta
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                Vehículo
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.map(d => {
              const vehicle = vehicles.find(v => v.driverId === d.id);
              const pendingArrears = allArrears.filter(
                a => a.driverId === d.id && a.status === 'pending'
              );
              const totalOwed = pendingArrears.reduce(
                (sum, a) => sum + a.amountOwed,
                0
              );

              return (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">
                      {d.firstName} {d.lastName}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      ID: {d.idNumber} • {d.phone}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {totalOwed > 0 ? (
                      <div className="items-center gap-1">
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          Deuda: ${totalOwed.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1">
                          {pendingArrears.length} cuotas pendientes
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">
                        <i className="fa-solid fa-check"></i>
                        Al Día
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {vehicle ? (
                      <div className="items-center gap-3">
                        <span className="font-semibold text-indigo-600">{vehicle.licensePlate}</span>
                        <span className="block text-xs text-slate-500">{vehicle.model}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Sin asignar
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 flex gap-4">
                    <button 
                      onClick={() => handleOpenHistory(d)} 
                      title="Payment History"
                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      <i className="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(d.id);
                        setFormData(d);
                        setIsModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-amber-600"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Upgrade de Plan */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
              <i className="fa-solid fa-crown"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">¡Límite Alcanzado!</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              Has alcanzado el número máximo de conductores permitidos en tu plan actual (<strong>{authData.accountStatus?.plan}</strong>). 
              Sube de nivel para seguir gestionando tu flota sin restricciones.
            </p>
            <div className="space-y-4">
              <Link 
                to="/pricing-checkout" 
                className="block w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Actualizar Plan Ahora
              </Link>
              <button 
                onClick={() => setIsUpgradeModalOpen(false)}
                className="block w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all"
              >
                Tal vez luego
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {historyDriver && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-8 text-white">
              <div className="flex justify-between">
                <h2 className="text-2xl font-bold">
                  {historyDriver.firstName} {historyDriver.lastName}
                </h2>
                <button
                  onClick={() => setHistoryDriver(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Total Pagado
                  </p>
                  <p className="text-2xl font-bold">
                    $
                    {driverPayments
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Moras Pendientes
                  </p>
                  <p className="text-2xl font-bold text-rose-400">
                    $
                    {driverArrears
                      .filter(a => a.status === 'pending')
                      .reduce((sum, a) => sum + a.amountOwed, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-4 border-b mb-4">
                <button
                  onClick={() => setHistoryTab('payments')}
                  className={`px-4 py-2 font-bold ${
                    historyTab === 'payments'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-400'
                  }`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => setHistoryTab('arrears')}
                  className={`px-4 py-2 font-bold ${
                    historyTab === 'arrears'
                      ? 'text-rose-600 border-b-2 border-rose-600'
                      : 'text-slate-400'
                  }`}
                >
                  Moras
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3">
                {historyTab === 'payments'
                  ? driverPayments.map(p => (
                      <div
                        key={p.id}
                        className="flex justify-between p-4 bg-slate-50 rounded-xl"
                      >
                        <div>
                          <p className="font-bold">${p.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-400">
                            {formatDateDisplay(p.date)}
                          </p>
                        </div>
                        <i className="fa-solid fa-circle-check text-emerald-500"></i>
                      </div>
                    ))
                  : driverArrears.map(a => (
                      <div
                        key={a.id}
                        className={`flex justify-between p-4 rounded-xl ${
                          a.status === 'paid'
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-rose-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold">
                            ${a.amountOwed.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">
                            Vence: {formatDateDisplay(a.dueDate)}
                          </p>
                        </div>
                        <span className="text-xs font-bold">
                          {a.status === 'paid' ? 'SALDADA' : 'PENDIENTE'}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Crear/Editar Conductor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Conductor' : 'Registrar Conductor'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Nombre"
                  value={formData.firstName || ''}
                  onChange={e =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  required
                  placeholder="Apellido"
                  value={formData.lastName || ''}
                  onChange={e =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg"
                />
              </div>

              <input
                required
                placeholder="Teléfono"
                value={formData.phone || ''}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                required
                placeholder="Documento / ID"
                value={formData.idNumber || ''}
                onChange={e =>
                  setFormData({ ...formData, idNumber: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />

              <select
                value={formData.vehicleId || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    vehicleId: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin vehículo</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} ({v.model})
                  </option>
                ))}
              </select>

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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Guardar
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