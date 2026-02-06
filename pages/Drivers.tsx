import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { Driver, Vehicle, Payment, Arrear } from '../types';
import Swal from 'sweetalert2';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverHistory, setDriverHistory] = useState<{ payments: Payment[], arrears: Arrear[] }>({ payments: [], arrears: [] });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para fotos
  const [pendingLicense, setPendingLicense] = useState<File | null>(null);
  const [pendingIdCard, setPendingIdCard] = useState<File | null>(null);
  const [previews, setPreviews] = useState({ license: '', idCard: '' });

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? total >= limits.maxDrivers : false;

  const initialForm: Partial<Driver> = { firstName: '', lastName: '', phone: '', idNumber: '', vehicleId: null, licensePhoto: '', idPhoto: '' };
  const [formData, setFormData] = useState<Partial<Driver>>(initialForm);

  useEffect(() => { loadData(); }, [page, limit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, v] = await Promise.all([
        db.getDrivers(page, limit),
        db.getVehicles(1, 1000)
      ]);
      setDrivers(dRes.data);
      setTotal(dRes.total);
      setVehicles(v.data);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = async (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDetailOpen(true);
    try {
      const [p, a] = await Promise.all([
        db.getPaymentsByDriver(driver.id),
        db.getArrearsByDriver(driver.id)
      ]);
      setDriverHistory({ payments: p, arrears: a });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      let licenseUrl = formData.licensePhoto || '';
      let idUrl = formData.idPhoto || '';
      
      if (pendingLicense) {
        const { url } = await db.uploadDriverDocument(pendingLicense);
        licenseUrl = url;
      }
      if (pendingIdCard) {
        const { url } = await db.uploadDriverDocument(pendingIdCard);
        idUrl = url;
      }

      const isEdit = Boolean(editingId);
      const driver: Driver = { 
        ...formData, 
        licensePhoto: licenseUrl, 
        idPhoto: idUrl, 
        id: isEdit ? editingId! : crypto.randomUUID() 
      } as Driver;

      await db.saveDriver(driver, isEdit);
      
      if (formData.vehicleId) {
        await db.assignDriver(driver.id, formData.vehicleId);
      }
      
      Swal.fire({ icon: 'success', title: 'Completado', text: 'Conductor guardado con éxito.', timer: 1500, showConfirmButton: false });

      setEditingId(null);
      setFormData(initialForm);
      setPendingLicense(null);
      setPendingIdCard(null);
      setPreviews({ license: '', idCard: '' });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.data?.message || 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará permanentemente la ficha del conductor.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) {
      await db.deleteDriver(id);
      loadData();
      Swal.fire('Eliminado', 'El conductor ha sido removido.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Conductores</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm font-medium uppercase text-[10px] tracking-widest">{total} / {limits?.maxDrivers} registrados</p>
            {reachedLimit && <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-amber-200 animate-pulse">Límite Alcanzado</span>}
          </div>
        </div>
        <button
          onClick={() => { 
            setEditingId(null); 
            setFormData(initialForm); 
            setPreviews({ license: '', idCard: '' });
            setPendingLicense(null);
            setPendingIdCard(null);
            setIsModalOpen(true); 
          }}
          disabled={reachedLimit || loading}
          className={`px-6 py-2.5 rounded-xl font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 ${
            reachedLimit 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
          }`}
        >
          <i className={`fa-solid ${reachedLimit ? 'fa-lock' : 'fa-user-plus'}`}></i>
          {reachedLimit ? 'Límite de Plan Alcanzado' : 'Nuevo Conductor'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo Asignado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Cuenta</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && drivers.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
              ) : drivers.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{d.firstName} {d.lastName}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {d.idNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    {d.vehiclePlate ? (
                      <div className="flex items-center gap-2">
                         <i className="fa-solid fa-car-side text-indigo-300"></i>
                         <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest shadow-sm font-mono">{d.vehiclePlate}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 italic uppercase bg-slate-50 px-2 py-1 rounded-lg tracking-wider">Sin Vehículo</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {d.totalDebt && d.totalDebt > 0 ? (
                      <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-200"></span>
                         <span className="text-sm font-black text-rose-600">${d.totalDebt.toLocaleString()}</span>
                         <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 bg-rose-50 px-1.5 py-0.5 rounded">MORA</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded">AL DÍA</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Ver Detalle y Documentos" onClick={() => handleShowDetail(d)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shadow-sm"><i className="fa-solid fa-eye"></i></button>
                      <button onClick={() => {
                        setEditingId(d.id);
                        setFormData(d);
                        setPreviews({ license: d.licensePhoto || '', idCard: d.idPhoto || '' });
                        setPendingLicense(null);
                        setPendingIdCard(null);
                        setIsModalOpen(true);
                      }} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                      <button onClick={() => handleDelete(d.id)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle Integral */}
      {isDetailOpen && selectedDriver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl p-8 my-8 transform animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
                   <p className="text-indigo-600 font-bold tracking-widest text-[10px] uppercase mt-1 flex items-center gap-2">
                     <i className="fa-solid fa-address-card"></i> Ficha de Conductor — {selectedDriver.vehiclePlate || 'Sin Vehículo Activo'}
                   </p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><i className="fa-solid fa-xmark"></i></button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel Documentación */}
                <div className="space-y-6">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Documentos Legales</h3>
                   <div className="space-y-4">
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">Licencia de Conducción</p>
                         <div className="aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                            {selectedDriver.licensePhoto ? (
                               <img src={`/api${selectedDriver.licensePhoto}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in" onClick={() => window.open(`/api${selectedDriver.licensePhoto}`, '_blank')} />
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                  <i className="fa-solid fa-id-card text-3xl"></i>
                                  <span className="text-[9px] font-black uppercase tracking-widest">Imagen no disponible</span>
                               </div>
                            )}
                         </div>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">Documento Identidad (Cédula)</p>
                         <div className="aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                            {selectedDriver.idPhoto ? (
                               <img src={`/api${selectedDriver.idPhoto}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in" onClick={() => window.open(`/api${selectedDriver.idPhoto}`, '_blank')} />
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                  <i className="fa-solid fa-address-card text-3xl"></i>
                                  <span className="text-[9px] font-black uppercase tracking-widest">Imagen no disponible</span>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Panel Historial y Deuda */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Total Recaudado</p>
                         <p className="text-2xl font-black text-emerald-600">${driverHistory.payments.reduce((s,p) => s+p.amount, 0).toLocaleString()}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 italic">Basado en historial de pagos</p>
                      </div>
                      <div className={`p-6 rounded-3xl border text-center shadow-sm ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                         <p className={`text-[10px] font-black uppercase mb-2 tracking-widest ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Deuda Pendiente</p>
                         <p className={`text-2xl font-black ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${(selectedDriver.totalDebt || 0).toLocaleString()}</p>
                         <p className={`text-[9px] font-bold mt-1 uppercase tracking-widest ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                           {selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'En Mora' : 'Cuenta al día'}
                         </p>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Cronología de Pagos Recientes</h3>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                         {driverHistory.payments.length > 0 ? driverHistory.payments.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <div>
                                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.type === 'canon' ? 'Pago Canon Semanal' : 'Abono a Mora'}</p>
                                  <p className="text-[10px] font-bold text-slate-400"><i className="fa-solid fa-calendar-day mr-1"></i> {formatDateDisplay(p.date)}</p>
                               </div>
                               <div className="text-right">
                                  <p className="font-black text-indigo-600">${p.amount.toLocaleString()}</p>
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Efectivo/Ref</span>
                               </div>
                            </div>
                         )) : <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">No se registran transacciones.</div>}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Modal Registro/Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-8 shadow-2xl my-8 transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black mb-6 tracking-tight">{editingId ? 'Editar' : 'Nuevo'} Conductor</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombres</label>
                  <input required placeholder="Ej: Juan" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Apellidos</label>
                  <input required placeholder="Ej: Pérez" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Número de Cédula</label>
                   <input required placeholder="Sin puntos ni comas" value={formData.idNumber || ''} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Asignar a Vehículo</label>
                   <select value={formData.vehicleId || ''} onChange={e => setFormData({ ...formData, vehicleId: e.target.value || null })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none appearance-none cursor-pointer shadow-inner">
                      <option value="">Permanecer sin vehículo...</option>
                      {vehicles.filter(v => !v.driverId || v.driverId === editingId).map(v => (
                        <option key={v.id} value={v.id}>{v.licensePlate} — {v.model}</option>
                      ))}
                   </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Licencia de Conducción</label>
                  <div className="flex flex-col gap-3">
                    {previews.license && (
                      <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={previews.license.startsWith('blob:') ? previews.license : `/api${previews.license}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="w-full p-4 bg-slate-50 border-2 border-dashed rounded-2xl text-center text-[10px] font-black text-slate-400 cursor-pointer hover:border-indigo-600 hover:text-indigo-600 uppercase transition-all shadow-inner">
                      <i className="fa-solid fa-camera mr-2"></i> {previews.license ? 'Cambiar Foto Licencia' : 'Cargar Foto Licencia'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setPendingLicense(file); setPreviews(prev => ({...prev, license: URL.createObjectURL(file)})); }
                      }} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Cédula Ciudadanía</label>
                  <div className="flex flex-col gap-3">
                    {previews.idCard && (
                      <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={previews.idCard.startsWith('blob:') ? previews.idCard : `/api${previews.idCard}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="w-full p-4 bg-slate-50 border-2 border-dashed rounded-2xl text-center text-[10px] font-black text-slate-400 cursor-pointer hover:border-indigo-600 hover:text-indigo-600 uppercase transition-all shadow-inner">
                      <i className="fa-solid fa-address-card mr-2"></i> {previews.idCard ? 'Cambiar Foto Cédula' : 'Cargar Foto Cédula'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setPendingIdCard(file); setPreviews(prev => ({...prev, idCard: URL.createObjectURL(file)})); }
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cerrar</button>
                <button type="submit" disabled={saving} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-indigo-100">
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
                  {saving ? 'Procesando Guardado...' : 'Guardar Ficha del Conductor'}
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