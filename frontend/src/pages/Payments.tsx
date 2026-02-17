import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay, getTodayDateDisplay, formatDateToISO } from '@/services/db';
import { Payment, Driver, Vehicle, Arrear } from '@/types/types';
import Swal from 'sweetalert2';
import ResponsiveTable from '@/components/ResponsiveTable';
import ResponsiveModal from '@/components/ResponsiveModal';
import ModalFooter from '@/components/ModalFooter';
import DateInput from '@/components/DateInput';

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
    date: formatDateToISO(getTodayDateDisplay()),
    driverId: '',
    vehicleId: '',
    type: 'renta',
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
    const driver = drivers.find(d => d.id === driverId);
    const vehicle = vehicles.find(v => v.id === driver?.vehicleId);

    setFormData({
      ...formData,
      driverId,
      vehicleId: vehicle?.id || '',
      amount: formData.type === 'renta' ? vehicle?.rentaValue || 0 : 0,
      arrearId: null,
    });
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Eliminar registro?',
      text: "Si este pago generó una mora, esta también será eliminada.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (res.isConfirmed) {
      try {
        await db.deletePayment(id);
        Swal.fire('Eliminado', 'El registro de pago ha sido removido.', 'success');
        loadData();
      } catch (err: any) {
        Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
      }
    }
  };

  const isInvalidAmount = !formData.amount || formData.amount <= 0;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId || saving) return;

    setSaving(true);
    try {
      if (formData.type === 'arrear_payment' && formData.arrearId) {
        await db.payArrear(formData.arrearId, {
          amount: formData.amount || 0,
          date: formData.date || formatDateToISO(getTodayDateDisplay()),
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
        date: formatDateToISO(getTodayDateDisplay()),
        driverId: '',
        vehicleId: '',
        type: 'renta',
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

  const totalOwed = driverPendingArrears.reduce((sum, a) => sum + Number(a.amountOwed), 0);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Caja y Recaudos</h1>
          <p className="text-slate-500 text-sm font-medium">Registro de cánones y abonos a moras</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-full md:w-auto">
            <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-slate-400 text-[10px] font-black tracking-widest uppercase">Desde</div>
            <DateInput
              value={dateRange.startDate} 
              onChange={(isoDate) => {setDateRange({ ...dateRange, startDate: isoDate }); setPage(1);}}
              className="px-3 py-2 text-xs font-bold outline-none flex-1 min-w-[120px]"
              placeholder="dd/mm/yyyy"
            />
            <div className="flex items-center px-3 bg-slate-50 border-x border-slate-200 text-slate-400 text-[10px] font-black tracking-widest uppercase">Hasta</div>
            <DateInput
              value={dateRange.endDate} 
              onChange={(isoDate) => {setDateRange({ ...dateRange, endDate: isoDate }); setPage(1);}}
              className="px-3 py-2 text-xs font-bold outline-none flex-1 min-w-[120px]"
              placeholder="dd/mm/yyyy"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100/50 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
          >
            <span className='m-auto'>
              <i className="fa-solid fa-cash-register"></i> Nuevo Ingreso
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <ResponsiveTable
          columns={[
            {
              key: 'date',
              label: 'Fecha',
              mobileOrder: 2,
              render: (date: string) => (
                <span className="text-xs text-slate-500 font-mono">
                  {formatDateDisplay(date).split(' ')[0].replace(',', '')}
                </span>
              )
            },
            {
              key: 'driver',
              label: 'Conductor / Vehículo',
              mobileLabel: 'Conductor',
              mobileOrder: 0,
              render: (_, p: Payment) => {
                const driver = drivers.find(d => d.id === p.driverId);
                const vehicle = vehicles.find(v => v.id === p.vehicleId);
                return (
                  <div>
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}
                    </p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                      {vehicle?.licensePlate}
                    </p>
                  </div>
                );
              }
            },
            {
              key: 'type',
              label: 'Tipo',
              mobileOrder: 3,
              render: (type: string) => (
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest whitespace-nowrap ${
                  type === 'arrear_payment' 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  {type === 'arrear_payment' ? 'ABONO MORA' : 'RENTA'}
                </span>
              )
            },
            {
              key: 'amount',
              label: 'Monto',
              mobileOrder: 1,
              render: (amount: number) => (
                <span className="font-black text-slate-900">
                  ${Number(amount).toLocaleString()}
                </span>
              )
            },
            {
              key: 'status',
              label: 'Estado',
              hideOnMobile: true,
              render: () => (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest inline-flex items-center gap-1">
                  <i className="fa-solid fa-check-double text-[8px]"></i> Recibido
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Acciones',
              className: 'text-right',
              mobileOrder: 4,
              render: (_, p: Payment) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all mx-auto md:mr-0"
                >
                  <i className="fa-solid fa-trash-can text-sm text-rose-400"></i>
                </button>
              )
            }
          ]}
          data={payments}
          loading={loading}
          emptyMessage="No hay registros para este periodo."
        />

        <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400 tracking-tight text-center sm:text-left">
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
              <button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-30"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <button disabled={page === totalPages || total === 0 || loading} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-30"><i className="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ResponsiveModal
          isOpen={isModalOpen}
          onClose={() => !saving && setIsModalOpen(false)}
          title="Registrar Ingreso"
          maxWidth="lg"
          fullScreenOnMobile={true}
        >
          <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${saving ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Seleccionar Conductor</label>
              <div className="relative">
                <select
                  required
                  disabled={saving}
                  value={formData.driverId || ''}
                  onChange={e => handleDriverChange(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl outline-none font-bold text-base sm:text-sm transition-all appearance-none"
                >
                  <option value="">Buscar conductor...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>

            {formData.driverId && (
              <div className={`rounded-3xl border-2 overflow-hidden transition-all ${totalOwed > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <div className="p-5 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Saldo Acumulado</span>
                    <span className={`text-xs font-black uppercase tracking-tight ${totalOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {totalOwed > 0 ? 'Mora Pendiente' : 'Sin Deudas'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black ${totalOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${totalOwed.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {driverPendingArrears.length > 0 && (
                  <div className="border-t border-rose-100/50 bg-white/50 max-h-32 overflow-y-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-rose-100/30">
                        {driverPendingArrears.map(a => (
                          <tr key={a.id} className="text-[11px] font-bold">
                            <td className="px-5 py-2 text-slate-500 font-mono">{formatDateDisplay(a.dueDate)}</td>
                            <td className="px-5 py-2 text-right text-rose-600">${a.amountOwed.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tipo de Ingreso</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setFormData({ ...formData, type: 'renta', arrearId: null, amount: formData.vehicleId ? (vehicles.find(v => v.id === formData.vehicleId)?.rentaValue || 0) : 0 })}
                  className={`py-4 px-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === 'renta'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100'
                      : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  Renta
                </button>
                <button
                  type="button"
                  disabled={saving || driverPendingArrears.length === 0}
                  onClick={() =>
                    setFormData({ ...formData, type: 'arrear_payment', amount: 0 })
                  }
                  className={`py-4 px-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === 'arrear_payment'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-100'
                      : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200 hover:text-slate-600'
                  } disabled:opacity-20`}
                >
                  Abono a Mora
                </button>
              </div>
            </div>

            {formData.type === 'arrear_payment' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 mb-2 block">
                  Seleccionar Fecha Específica
                </label>
                <div className="relative">
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
                    className="w-full px-6 py-4 border-2 border-amber-200 rounded-3xl bg-amber-50 font-bold text-amber-900 text-base sm:text-sm outline-none focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Seleccione la mora...</option>
                    {driverPendingArrears.map(a => (
                      <option key={a.id} value={a.id}>
                        {formatDateDisplay(a.dueDate)} — ${a.amountOwed.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500">
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Monto a Recibir ($)</label>
                <input
                  type="number"
                  required
                  disabled={saving}
                  value={formData.amount}
                  onChange={e =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl outline-none font-black text-base sm:text-sm transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Fecha de Pago</label>
                <DateInput
                  required
                  value={formData.date || ''}
                  onChange={(isoDate) => setFormData({ ...formData, date: isoDate })}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl outline-none font-bold text-base sm:text-sm transition-all"
                />
              </div>
            </div>

            <ModalFooter
              primaryButton={{
                label: saving ? 'Procesando...' : 'Confirmar Ingreso',
                onClick: () => {}, // Form submit handled by form onSubmit
                variant: 'success',
                loading: saving,
                disabled: saving || isInvalidAmount,
                icon: 'fa-cloud-upload'
              }}
              secondaryButton={{
                label: 'Cancelar',
                onClick: () => setIsModalOpen(false),
                disabled: saving
              }}
            />
          </form>
        </ResponsiveModal>
      )}
    </div>
  );
};

export default Payments;