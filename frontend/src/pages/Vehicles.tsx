
import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay, getTodayDateDisplay, formatDateToISO } from '@/services/db';
import { Vehicle, Payment, Expense } from '@/types/types';
import Swal from 'sweetalert2';
import ResponsiveTable from '@/components/ResponsiveTable';
import ResponsiveModal from '@/components/ResponsiveModal';
import ModalFooter from '@/components/ModalFooter';
import DateInput from '@/components/DateInput';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<{ payments: Payment[], expenses: Expense[] }>({ payments: [], expenses: [] });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? total >= limits.maxVehicles : false;

  const initialForm: Partial<Vehicle> = {
    year: new Date().getFullYear(), licensePlate: '', model: '', color: '',
    purchaseDate: formatDateToISO(getTodayDateDisplay()),
    insurance: '', insuranceNumber: '', soatExpiration: '', techExpiration: '',
    rentaValue: 0, driverId: null, photos: []
  };

  const [formData, setFormData] = useState<Partial<Vehicle>>(initialForm);

  useEffect(() => { loadData(); }, [page, limit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const vRes = await db.getVehicles(page, limit);
      setVehicles(vRes.data);
      setTotal(vRes.total);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsDetailOpen(true);
    try {
      const [p, e] = await Promise.all([
        db.getPayments({ limit: 100 }),
        db.getExpenses({ limit: 100 })
      ]);
      setVehicleHistory({
        payments: p.data.filter(pay => pay.vehicleId === v.id),
        expenses: e.data.filter(exp => exp.vehicleId === v.id)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará permanentemente el vehículo.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) {
      try {
        await db.deleteVehicle(id);
        await loadData();
        Swal.fire('Eliminado', 'El vehículo ha sido removido.', 'success');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: err?.data?.message || 'No se pudo eliminar el vehículo. Puede tener registros asociados.',
          confirmButtonColor: '#4f46e5'
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArray = Array.from(files);
    const slotsAvailable = 5 - (previews.length);
    const newFiles = filesArray.slice(0, slotsAvailable);

    setPendingFiles(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    const p = previews[index];
    if (p.startsWith('blob:')) {
      const fileIndex = pendingFiles.findIndex(f => URL.createObjectURL(f) === p);
      setPendingFiles(prev => prev.filter((_, i) => i !== fileIndex));
      URL.revokeObjectURL(p);
    } else {
      setFormData(prev => ({ ...prev, photos: (prev.photos || []).filter(url => url !== p) }));
    }
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);

    try {
      let finalPhotos = [...(formData.photos || [])];

      if (pendingFiles.length > 0) {
        const { urls } = await db.uploadVehiclePhotos(pendingFiles);
        finalPhotos = [...finalPhotos, ...urls];
      }

      // 🔐 Payload limpio
      const cleanVehicle = {
        id: editingId || crypto.randomUUID(),
        year: Number(formData.year),
        licensePlate: formData.licensePlate,
        model: formData.model,
        color: formData.color,
        purchaseDate: formData.purchaseDate,
        insurance: formData.insurance || null,
        insuranceNumber: formData.insuranceNumber || null,
        soatExpiration: formData.soatExpiration,
        techExpiration: formData.techExpiration,
        rentaValue: Number(formData.rentaValue),
        // Fix: Provide driverId to match Vehicle type expectations
        driverId: formData.driverId || null,
        photos: finalPhotos
      };

      // Fix: Cast to any as userId is handled exclusively by the backend
      await db.saveVehicle(cleanVehicle as any);

      Swal.fire({
        icon: 'success',
        title: 'Vehículo guardado',
        showConfirmButton: false,
        timer: 1500
      });

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const errorCode = err?.data?.code;
      const errorMessage = err?.data?.message || err.data?.error || 'No se pudo guardar.';

      if (errorCode === 'DUPLICATE_VEHICLE') {
        Swal.fire({ 
          icon: 'warning', 
          title: 'Vehículo Duplicado', 
          text: errorMessage,
          confirmButtonColor: '#4f46e5'
        });
      } else if (errorCode === 'PLAN_LIMIT_VEHICLES') {
        Swal.fire({ 
          icon: 'info', 
          title: 'Límite de Plan Alcanzado', 
          text: errorMessage + ' Considera actualizar tu plan.',
          confirmButtonColor: '#4f46e5'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vehículos</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm font-medium uppercase text-[10px] tracking-widest">{total} / {limits?.maxVehicles} activos</p>
            {reachedLimit && <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-amber-200 animate-pulse">Límite Alcanzado</span>}
          </div>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialForm);
            setPreviews([]);
            setPendingFiles([]);
            setIsModalOpen(true);
          }}
          disabled={reachedLimit || loading}
          className={`px-6 py-2.5 rounded-xl font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 ${
            reachedLimit
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
          }`}
        >
          <i className={`fa-solid ${reachedLimit ? 'fa-lock' : 'fa-plus'}`}></i>
          {reachedLimit ? 'Límite de Plan Alcanzado' : 'Añadir Vehículo'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <ResponsiveTable
          columns={[
            {
              key: 'model',
              label: 'Modelo / Año',
              mobileLabel: 'Vehículo',
              mobileOrder: 0,
              render: (_, v: Vehicle) => (
                <div>
                  <span className="font-bold text-slate-800">{v.model}</span>
                  <span className="text-xs text-slate-400 ml-1 font-medium">{v.year}</span>
                </div>
              )
            },
            {
              key: 'licensePlate',
              label: 'Placa',
              mobileOrder: 1,
              render: (plate: string) => (
                <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase font-mono tracking-widest text-xs">
                  {plate}
                </span>
              )
            },
            {
              key: 'driverName',
              label: 'Conductor Asignado',
              mobileLabel: 'Conductor',
              mobileOrder: 2,
              render: (name: string | null) => name ? (
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-user text-indigo-400"></i>
                  <span className="text-sm font-bold text-slate-700 truncate">{name}</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 italic uppercase bg-slate-50 px-2 py-1 rounded-lg tracking-wider">
                  Disponible
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Acciones',
              className: 'text-right',
              mobileOrder: 3,
              render: (_, v: Vehicle) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    title="Ver Detalle Operativo"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowDetail(v);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(v.id);
                      setFormData({
                        id: v.id,
                        year: v.year,
                        licensePlate: v.licensePlate,
                        model: v.model,
                        color: v.color,
                        purchaseDate: v.purchaseDate,
                        insurance: v.insurance,
                        insuranceNumber: v.insuranceNumber,
                        soatExpiration: v.soatExpiration,
                        techExpiration: v.techExpiration,
                        rentaValue: v.rentaValue,
                        driverId: v.driverId || null,
                        photos: v.photos || []
                      });
                      setPreviews(v.photos || []);
                      setPendingFiles([]);
                      setIsModalOpen(true);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(v.id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              )
            }
          ]}
          data={vehicles}
          loading={loading}
          emptyMessage="No hay vehículos registrados"
        />
      </div>

      {/* Modal Detalle Operativo */}
      <ResponsiveModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Vehículo: ${selectedVehicle?.licensePlate}`}
        subtitle={selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.year}) — ${selectedVehicle.driverName || 'Sin Conductor'}` : ''}
        maxWidth="5xl"
      >
        {selectedVehicle && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                Fotos de Inspección
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {selectedVehicle.photos && selectedVehicle.photos.length > 0 ? selectedVehicle.photos.map((src, idx) => (
                  <div key={idx} className="aspect-square bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 hover:scale-105 transition-transform">
                    <img src={`${API_URL}${src}`} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                  </div>
                )) : (
                  <div className="col-span-2 sm:col-span-3 py-8 sm:py-12 text-center text-slate-300 italic text-xs sm:text-sm">
                    No hay fotos registradas.
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 space-y-3 sm:space-y-4 shadow-inner">
                <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estatus Legal y Seguro
                </h4>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-500">Vencimiento SOAT:</span>
                  <span className={`font-black ${new Date(selectedVehicle.soatExpiration) < new Date() ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedVehicle.soatExpiration ? formatDateDisplay(selectedVehicle.soatExpiration).split(' ')[0].replace(',', '') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-500">Vencimiento Técnico:</span>
                  <span className="font-black text-indigo-500">
                    {selectedVehicle.techExpiration ? formatDateDisplay(selectedVehicle.techExpiration).split(' ')[0].replace(',', '') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm pt-2 border-t">
                  <span className="font-bold text-slate-500">Renta:</span>
                  <span className="font-black text-slate-900">${Number(selectedVehicle.rentaValue).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                Resumen de Movimientos
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-6 bg-emerald-50 rounded-2xl sm:rounded-3xl border border-emerald-100 text-center">
                  <p className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase mb-2">Ingresos (Pagos)</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600">
                    ${vehicleHistory.payments.reduce((s,p) => s+Number(p.amount), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 sm:p-6 bg-rose-50 rounded-2xl sm:rounded-3xl border border-rose-100 text-center">
                  <p className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase mb-2">Egresos (Gastos)</p>
                  <p className="text-xl sm:text-2xl font-black text-rose-600">
                    -${vehicleHistory.expenses.reduce((s,e) => s+Number(e.amount), 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-3 sm:mb-4">
                  Últimos Gastos Operativos
                </h3>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2 pr-1 sm:pr-2 custom-scrollbar">
                  {vehicleHistory.expenses.length > 0 ? vehicleHistory.expenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{e.description}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                          {formatDateDisplay(e.date).split(' ')[0].replace(',', '')}
                        </p>
                      </div>
                      <p className="font-black text-rose-600 text-sm sm:text-base whitespace-nowrap">
                        -${Number(e.amount).toLocaleString()}
                      </p>
                    </div>
                  )) : (
                    <p className="text-center py-6 sm:py-8 text-slate-300 italic text-xs sm:text-sm">
                      Sin gastos registrados.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Modal Registro */}
      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingId ? 'Editar' : 'Nuevo'} Vehículo`}
        subtitle="Información del vehículo y documentos"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Modelo</label>
              <input 
                required 
                placeholder='Ej: Nissan March' 
                value={formData.model || ''} 
                onChange={e => setFormData({...formData, model: e.target.value})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none font-bold text-sm sm:text-base focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Placa</label>
              <input 
                required 
                placeholder="ABC-123" 
                value={formData.licensePlate || ''} 
                onChange={e => setFormData({...formData, licensePlate: e.target.value})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl font-black outline-none uppercase text-sm sm:text-base focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Vencimiento SOAT</label>
              <DateInput
                required 
                value={formData.soatExpiration || ''} 
                onChange={(isoDate) => setFormData({...formData, soatExpiration: isoDate})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl font-bold outline-none text-sm sm:text-base focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Vencimiento Técnico</label>
              <DateInput
                required 
                value={formData.techExpiration || ''} 
                onChange={(isoDate) => setFormData({...formData, techExpiration: isoDate})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl font-bold outline-none text-sm sm:text-base focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Año</label>
              <input 
                type="number" 
                required 
                value={formData.year || ''} 
                onChange={e => setFormData({...formData, year: Number(e.target.value)})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl font-bold outline-none text-sm sm:text-base" 
              />
            </div>
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Color</label>
              <input 
                required 
                value={formData.color || ''} 
                onChange={e => setFormData({...formData, color: e.target.value})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl font-bold outline-none text-sm sm:text-base" 
                placeholder="Blanco" 
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">Renta ($)</label>
              <input 
                type="number" 
                required 
                value={formData.rentaValue || ''} 
                onChange={e => setFormData({...formData, rentaValue: Number(e.target.value)})} 
                className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl font-black outline-none text-sm sm:text-base" 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Fotos de Inspección (Máx. 5)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
              {previews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden group border border-slate-200">
                  <img 
                    src={url.startsWith('blob:') ? url : `${API_URL}${url}`} 
                    className="w-full h-full object-cover" 
                    alt={`Preview ${idx + 1}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => removePreview(idx)} 
                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-rose-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                  >
                    <i className="fa-solid fa-times text-[10px] sm:text-xs"></i>
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <label className="aspect-square rounded-lg sm:rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer transition-all active:scale-95">
                  <i className="fa-solid fa-plus text-base sm:text-xl mb-0.5 sm:mb-1"></i>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter">Añadir</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <ModalFooter
            primaryButton={{
              label: saving ? 'Guardando...' : 'Confirmar Registro',
              onClick: () => {},
              loading: saving,
              disabled: saving,
              icon: 'fa-check',
              variant: 'primary'
            }}
            secondaryButton={{
              label: 'Cancelar',
              onClick: () => setIsModalOpen(false),
              disabled: saving
            }}
          />
        </form>
      </ResponsiveModal>
    </div>
  );
};

export default Vehicles;