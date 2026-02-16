import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay } from '@/services/db';
import { Expense, Vehicle } from '@/types/types';
import Swal from 'sweetalert2';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vehicleId: ''
  });

  useEffect(() => { loadData(); }, [page, limit, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eRes, vRes] = await Promise.all([
        db.getExpenses({ page, limit, search }), 
        db.getVehicles(1, 1000)
      ]);
      setExpenses(eRes.data);
      setTotal(eRes.total);
      setVehicles(vRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Eliminar gasto?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (res.isConfirmed) {
      try {
        await db.deleteExpense(id);
        Swal.fire('Eliminado', 'El registro de gasto ha sido removido.', 'success');
        loadData();
      } catch (err: any) {
        Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || saving) return;

    setSaving(true);
    try {
      await db.saveExpense({ ...formData, id: crypto.randomUUID() } as Expense);
      setIsModalOpen(false);
      setFormData({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], vehicleId: '' });
      loadData();
    } catch (err: any) {
      alert('Error al guardar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gastos de Flota</h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight uppercase tracking-widest text-[10px]">Egresos Operativos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95">
          <i className="fa-solid fa-plus"></i> Registrar Gasto
        </button>
      </div>

      <div className="relative">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text" 
          placeholder="Buscar gasto por descripción..." 
          value={search}
          onChange={(e) => {setSearch(e.target.value); setPage(1);}}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-rose-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">Sin registros coincidentes.</td></tr>
              ) : expenses.map(e => {
                const vehicle = vehicles.find(v => v.id === e.vehicleId);
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-600 font-mono">{formatDateDisplay(e.date).split(' ')[0].replace(',', '')}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">{vehicle?.licensePlate || 'General'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{e.description}</td>
                    <td className="px-6 py-4 font-black text-rose-600">-${Number(e.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all mx-auto mr-0"
                      >
                        <i className="fa-solid fa-trash-can text-sm text-rose-400"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400 tracking-tight">
            Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages || 1}</span> 
            <span className="mx-2 opacity-30">•</span> {total} registros
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={limit} 
              onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}} 
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600"
            >
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
            </select>
            <div className="flex gap-1">
              <button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <button disabled={page === totalPages || total === 0 || loading} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Nuevo Gasto</h2>
            <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${saving ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Vehículo</label>
                <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm">
                  <option value="">Seleccione...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} ({v.model})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Descripción</label>
                <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none text-sm" placeholder="Mantenimiento, repuestos, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required placeholder="Costo" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none" />
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none text-sm" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest disabled:opacity-30">Cerrar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                    saving 
                      ? 'bg-rose-400 text-white cursor-not-allowed' 
                      : 'bg-rose-600 text-white shadow-rose-100 hover:bg-rose-700 active:scale-95'
                  }`}
                >
                  {saving ? <i className="fa-solid fa-circle-notch fa-spin text-sm"></i> : null}
                  {saving ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;