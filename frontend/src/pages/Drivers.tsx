import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay, formatDateToISO } from '@/services/db';
import { Driver, Vehicle, Payment, Arrear } from '@/types/types';
import Swal from 'sweetalert2';
import ResponsiveTable from '@/components/ResponsiveTable';
import ResponsiveModal from '@/components/ResponsiveModal';
import ModalFooter from '@/components/ModalFooter';
import DateInput from '@/components/DateInput';
import CurrencyInput from '@/components/CurrencyInput';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isArrearModalOpen, setIsArrearModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverHistory, setDriverHistory] = useState<{ payments: Payment[], arrears: Arrear[] }>({ payments: [], arrears: [] });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para crear mora manualmente
  const [arrearFormData, setArrearFormData] = useState<{ amountOwed: number; dueDate: string; description: string }>({
    amountOwed: 0,
    dueDate: formatDateToISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')),
    description: ''
  });

  // Estados para fotos
  const [pendingLicense, setPendingLicense] = useState<File | null>(null);
  const [pendingIdCard, setPendingIdCard] = useState<File | null>(null);
  const [previews, setPreviews] = useState({ license: '', idCard: '' });

  const authData = JSON.parse(sessionStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? total >= limits.maxDrivers : false;

  const initialForm: Partial<Driver> = { firstName: '', lastName: '', email: '', phone: '', idNumber: '', vehicleId: null, licensePhoto: '', idPhoto: '', licenseExpiration: '' };
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

  const handleOpenImage = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
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

      // ✅ No es necesario llamar assignDriver - el vehículo ya se asigna en saveDriver
      // El backend maneja la asignación de vehículo en create() y update()

      Swal.fire({ icon: 'success', title: 'Completado', text: 'Conductor guardado con éxito.', timer: 1500, showConfirmButton: false });

      setEditingId(null);
      setFormData(initialForm);
      setPendingLicense(null);
      setPendingIdCard(null);
      setPreviews({ license: '', idCard: '' });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const errorCode = err?.data?.code;
      const errorMessage = err?.data?.message || 'Error al guardar el conductor.';

      if (errorCode === 'DUPLICATE_DRIVER') {
        Swal.fire({ 
          icon: 'warning', 
          title: 'Conductor Duplicado', 
          text: errorMessage,
          confirmButtonColor: '#4f46e5'
        });
      } else if (errorCode === 'DUPLICATE_ENTRY') {
        Swal.fire({ 
          icon: 'warning', 
          title: 'Datos Duplicados', 
          text: errorMessage,
          confirmButtonColor: '#4f46e5'
        });
      } else if (errorCode === 'PLAN_LIMIT_DRIVERS') {
        Swal.fire({ 
          icon: 'info', 
          title: 'Límite de Plan Alcanzado', 
          text: errorMessage + ' Considera actualizar tu plan.',
          confirmButtonColor: '#4f46e5'
        });
      } else if (errorCode === 'INVALID_REFERENCE') {
        Swal.fire({ 
          icon: 'error', 
          title: 'Vehículo No Disponible', 
          text: errorMessage,
          confirmButtonColor: '#4f46e5'
        });
      } else if (errorCode === 'NOT_FOUND') {
        Swal.fire({ 
          icon: 'error', 
          title: 'No Encontrado', 
          text: errorMessage,
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

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará permanentemente la ficha del conductor.",
      icon: 'warning',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) {
      try {
        await db.deleteDriver(id);
        await loadData();
        Swal.fire('Eliminado', 'El conductor ha sido removido.', 'success');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: err?.data?.message || 'No se pudo eliminar el conductor. Puede tener registros asociados.',
          confirmButtonColor: '#4f46e5'
        });
      }
    }
  };

  const handleCreateArrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !arrearFormData.amountOwed || saving) return;

    setSaving(true);
    try {
      await db.createArrear({
        amountOwed: arrearFormData.amountOwed,
        driverId: selectedDriver.id,
        vehicleId: selectedDriver.vehicleId || '',
        dueDate: arrearFormData.dueDate,
        description: arrearFormData.description || undefined
      });

      Swal.fire({
        icon: 'success',
        title: 'Mora Creada',
        text: 'La mora ha sido registrada exitosamente.',
        timer: 1500,
        showConfirmButton: false
      });

      setIsArrearModalOpen(false);
      setArrearFormData({
        amountOwed: 0,
        dueDate: formatDateToISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')),
        description: ''
      });

      // Recargar lista de conductores
      await loadData();
      
      // Recargar historial del conductor y actualizar el selectedDriver con los nuevos datos
      if (selectedDriver) {
        const [p, a, driversResponse] = await Promise.all([
          db.getPaymentsByDriver(selectedDriver.id),
          db.getArrearsByDriver(selectedDriver.id),
          db.getDrivers(page, limit)
        ]);
        setDriverHistory({ payments: p, arrears: a });
        
        // Actualizar selectedDriver con los datos frescos que incluyen el totalDebt actualizado
        const updatedDriver = driversResponse.data.find(d => d.id === selectedDriver.id);
        if (updatedDriver) {
          setSelectedDriver(updatedDriver);
        }
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.data?.message || 'Error al crear la mora'
      });
    } finally {
      setSaving(false);
    }
  };

  const openArrearModal = () => {
    if (!selectedDriver?.vehicleId) {
      Swal.fire({
        icon: 'warning',
        title: 'Vehículo Requerido',
        text: 'El conductor debe tener un vehículo asignado para registrar una mora.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }
    setIsArrearModalOpen(true);
  };

  const handleDeleteArrear = async (arrearId: string, originPaymentId?: string) => {
    // Las moras con originPaymentId son automáticas
    if (originPaymentId) {
      Swal.fire({
        icon: 'warning',
        title: 'Mora Automática',
        text: 'Las moras generadas automáticamente no se pueden eliminar directamente. Deben ser pagadas.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    const res = await Swal.fire({
      title: '¿Eliminar Mora?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (res.isConfirmed) {
      try {
        await db.deleteArrear(arrearId);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'La mora ha sido eliminada.',
          timer: 1500,
          showConfirmButton: false
        });

        // Recargar lista y actualizar el selectedDriver con datos frescos
        await loadData();
        if (selectedDriver) {
          const [p, a, driversResponse] = await Promise.all([
            db.getPaymentsByDriver(selectedDriver.id),
            db.getArrearsByDriver(selectedDriver.id),
            db.getDrivers(page, limit)
          ]);
          setDriverHistory({ payments: p, arrears: a });
          
          // Actualizar selectedDriver con los datos frescos
          const updatedDriver = driversResponse.data.find(d => d.id === selectedDriver.id);
          if (updatedDriver) {
            setSelectedDriver(updatedDriver);
          }
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.data?.message || 'Error al eliminar la mora'
        });
      }
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
        <ResponsiveTable
          columns={[
            {
              key: 'name',
              label: 'Conductor',
              mobileOrder: 0,
              render: (_, d: Driver) => (
                <div>
                  <p className="font-bold text-slate-900 truncate">{d.firstName} {d.lastName}</p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter truncate">
                    ID: {d.idNumber} {d.email && `| ${d.email}`}
                  </p>
                </div>
              )
            },
            {
              key: 'vehiclePlate',
              label: 'Vehículo Asignado',
              mobileLabel: 'Vehículo',
              mobileOrder: 1,
              render: (plate: string | null) => plate ? (
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-car-side text-indigo-300"></i>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest shadow-sm font-mono">
                    {plate}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 italic uppercase bg-slate-50 px-2 py-1 rounded-lg tracking-wider">
                  Sin Vehículo
                </span>
              )
            },
            {
              key: 'totalDebt',
              label: 'Estado de Cuenta',
              mobileLabel: 'Estado',
              mobileOrder: 2,
              render: (debt: number | null) => debt && debt > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-200"></span>
                  <span className="text-sm font-black text-rose-600">${Number(debt).toLocaleString()}</span>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 bg-rose-50 px-1.5 py-0.5 rounded">
                    MORA
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded">
                    AL DÍA
                  </span>
                </div>
              )
            },
            {
              key: 'actions',
              label: 'Acciones',
              className: 'text-right',
              mobileOrder: 3,
              render: (_, d: Driver) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    title="Ver Detalle y Documentos"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowDetail(d);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shadow-sm"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(d.id);
                      setFormData(d);
                      setPreviews({ license: d.licensePhoto || '', idCard: d.idPhoto || '' });
                      setPendingLicense(null);
                      setPendingIdCard(null);
                      setIsModalOpen(true);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              )
            }
          ]}
          data={drivers}
          loading={loading}
          emptyMessage="No hay conductores registrados"
        />
      </div>

      {/* Modal Detalle Integral */}
      <ResponsiveModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : ''}
        subtitle={selectedDriver ? `Ficha de Conductor — ${selectedDriver.vehiclePlate || 'Sin Vehículo Activo'}` : ''}
        maxWidth="4xl"
        fullScreenOnMobile={true}
      >
        {selectedDriver && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Panel Documentación */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Documentos Legales</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">Licencia de Conducción</p>
                  <div className="aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                    {selectedDriver.licensePhoto ? (
                      <img
                        src={`${API_URL}${selectedDriver.licensePhoto}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                        onClick={() => handleOpenImage(`${API_URL}${selectedDriver.licensePhoto}`, 'Licencia de Conducción')}
                      />
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
                      <img
                        src={`${API_URL}${selectedDriver.idPhoto}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                        onClick={() => handleOpenImage(`${API_URL}${selectedDriver.idPhoto}`, 'Documento de Identidad (Cédula)')}
                      />
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
                  <p className="text-2xl font-black text-emerald-600">${driverHistory.payments.reduce((s,p) => s+Number(p.amount), 0).toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 italic">Basado en historial de pagos</p>
                </div>
                <div className={`p-6 rounded-3xl border text-center shadow-sm ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className={`text-[10px] font-black uppercase mb-2 tracking-widest ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Deuda Pendiente</p>
                  <p className={`text-2xl font-black ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${(Number(selectedDriver.totalDebt) || 0).toLocaleString()}</p>
                  <p className={`text-[9px] font-bold mt-1 uppercase tracking-widest ${selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedDriver.totalDebt && selectedDriver.totalDebt > 0 ? 'En Mora' : 'Cuenta al día'}
                  </p>
                </div>
              </div>

              {/* Moras Pendientes */}
              {driverHistory.arrears.filter(a => a.status === 'pending').length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
                  <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-exclamation-triangle"></i>
                    Moras Activas ({driverHistory.arrears.filter(a => a.status === 'pending').length})
                  </h4>
                  <div className="space-y-2">
                    {driverHistory.arrears.filter(a => a.status === 'pending').map(arrear => (
                      <div key={arrear.id} className="bg-white rounded-xl p-3 border border-rose-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-black text-rose-700">${Number(arrear.amountOwed).toLocaleString()}</p>
                              {arrear.originPaymentId && (
                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase">
                                  Auto
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              <i className="fa-solid fa-calendar mr-1"></i>
                              Vence: {formatDateDisplay(arrear.dueDate)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteArrear(arrear.id, arrear.originPaymentId)}
                            title={arrear.originPaymentId ? 'Las moras automáticas no se pueden eliminar' : 'Eliminar mora'}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                              arrear.originPaymentId 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                        {arrear.description && (
                          <div className="mt-2 pt-2 border-t border-rose-100">
                            <p className="text-[10px] text-slate-600 italic flex items-start gap-1.5">
                              <i className="fa-solid fa-quote-left text-rose-300 text-[8px] mt-0.5"></i>
                              <span>{arrear.description}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cronología de Pagos Recientes</h3>
                  <button
                    onClick={openArrearModal}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <i className="fa-solid fa-plus"></i>
                    Crear Mora
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {driverHistory.payments.length > 0 ? driverHistory.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.type === 'renta' ? 'Pago de Renta' : 'Abono a Mora'}</p>
                        <p className="text-[10px] font-bold text-slate-400"><i className="fa-solid fa-calendar-day mr-1"></i> {formatDateDisplay(p.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600">${Number(p.amount).toLocaleString()}</p>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Efectivo/Ref</span>
                      </div>
                    </div>
                  )) : <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">No se registran transacciones.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Modal Registro/Edición */}
      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingId ? 'Editar' : 'Nuevo'} Conductor`}
        maxWidth="2xl"
        fullScreenOnMobile={true}
      >
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                Correo Electrónico <span className="text-slate-300 font-normal">(Opcional)</span>
              </label>
              <input type="email" placeholder="conductor@correo.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Número de Teléfono</label>
              <input required placeholder="Ej: 3001234567" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
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
                <option value="">Sin vehículo asignado</option>
                {vehicles.filter(v => !v.driverId || v.driverId === editingId).map(v => (
                  <option key={v.id} value={v.id}>{v.licensePlate} — {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 🆕 Vencimiento de Licencia */}
          <div>
            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 block">
              <i className="fa-solid fa-calendar-xmark mr-2"></i>
              Vencimiento de Licencia de Conducción
            </label>
            <DateInput
              value={formData.licenseExpiration || ''} 
              onChange={(isoDate) => setFormData({...formData, licenseExpiration: isoDate})} 
              className="w-full p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Licencia de Conducción</label>
              <div className="flex flex-col gap-3">
                {previews.license && (
                  <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <img
                      src={previews.license.startsWith('blob:')
                        ? previews.license
                        : `${API_URL}${previews.license}`
                      }
                      className="w-full h-full object-cover"
                    />
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
                    <img
                      src={previews.idCard.startsWith('blob:')
                        ? previews.idCard
                        : `${API_URL}${previews.idCard}`
                      }
                      className="w-full h-full object-cover"
                    />
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

          <ModalFooter
            primaryButton={{
              label: saving ? 'Procesando Guardado...' : 'Guardar Ficha del Conductor',
              onClick: () => {}, // Form submit handled by form onSubmit
              variant: 'primary',
              loading: saving,
              disabled: saving
            }}
            secondaryButton={{
              label: 'Cerrar',
              onClick: () => setIsModalOpen(false),
              disabled: saving
            }}
          />
        </form>
      </ResponsiveModal>

      {/* Modal de Visualización de Imagen */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={handleCloseImageModal}
        >
          <div 
            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-3">
                <i className="fa-solid fa-image text-indigo-400"></i>
                {selectedImage.title}
              </h3>
              <button
                onClick={handleCloseImageModal}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
                aria-label="Cerrar"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Imagen */}
            <div className="flex-1 flex items-center justify-center overflow-auto rounded-2xl bg-white/5 border border-white/10">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>

            {/* Footer con acciones */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <a
                href={selectedImage.url}
                download
                className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <i className="fa-solid fa-download"></i>
                Descargar
              </a>
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Mora Manualmente */}
      <ResponsiveModal
        isOpen={isArrearModalOpen}
        onClose={() => !saving && setIsArrearModalOpen(false)}
        title="Registrar Mora Manual"
        subtitle={selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : ''}
        maxWidth="md"
        fullScreenOnMobile={true}
      >
        <form onSubmit={handleCreateArrear} className={`space-y-4 transition-opacity ${saving ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-xl mt-0.5"></i>
              <div>
                <p className="text-xs font-bold text-amber-900 mb-1">Registro Manual de Mora</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Esta función permite crear moras de forma manual para situaciones excepcionales. 
                  Las moras creadas desde pagos parciales se generan automáticamente.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              <i className="fa-solid fa-money-bill-wave mr-1"></i>
              Monto Adeudado
            </label>
            <CurrencyInput
              required
              value={arrearFormData.amountOwed || ''}
              onValueChange={(value) => setArrearFormData({...arrearFormData, amountOwed: value ? Number(value) : 0})}
              placeholder="0"
              className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              <i className="fa-solid fa-file-lines mr-1"></i>
              Descripción
            </label>
            <textarea
              value={arrearFormData.description}
              onChange={(e) => setArrearFormData({...arrearFormData, description: e.target.value})}
              placeholder="Motivo o descripción de la mora..."
              rows={3}
              className="w-full p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner resize-none"
            />
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-info-circle"></i>
              Esta descripción será visible en el historial del conductor
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              <i className="fa-solid fa-calendar-days mr-1"></i>
              Fecha de Vencimiento
            </label>
            <DateInput
              required
              value={arrearFormData.dueDate}
              onChange={(isoDate) => setArrearFormData({...arrearFormData, dueDate: isoDate})}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-inner"
            />
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-info-circle"></i>
              Fecha límite para el pago de esta mora
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Información del Conductor</p>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">{selectedDriver?.firstName} {selectedDriver?.lastName}</p>
              <p className="text-xs text-slate-600">
                <i className="fa-solid fa-car mr-1"></i>
                {selectedDriver?.vehiclePlate || 'Sin vehículo'}
              </p>
            </div>
          </div>

          <ModalFooter
            primaryButton={{
              label: saving ? 'Registrando Mora...' : 'Registrar Mora',
              onClick: () => {}, // Form submit handled by form onSubmit
              variant: 'danger',
              loading: saving,
              disabled: saving
            }}
            secondaryButton={{
              label: 'Cancelar',
              onClick: () => setIsArrearModalOpen(false),
              disabled: saving
            }}
          />
        </form>
      </ResponsiveModal>
    </div>
  );
};

export default Drivers;