import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Vehicle } from '../types';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? total >= limits.maxVehicles : false;

  const initialForm = {
    year: new Date().getFullYear(), licensePlate: '', model: '', color: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    insurance: '', insuranceNumber: '', soatExpiration: '', techExpiration: '',
    canonValue: 0, driverId: null,
  };

  const [formData, setFormData] = useState<Partial<Vehicle>>(initialForm);

  useEffect(() => { loadData(); }, [page, limit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await db.getVehicles(page, limit);
      setVehicles(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    
    setSaving(true);
    try {
      const vehicle = { ...formData, id: editingId || crypto.randomUUID() } as Vehicle;
      await db.saveVehicle(vehicle);
      setEditingId(null);
      setFormData(initialForm);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.data?.error || 'Error al guardar vehículo.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vehículos</h1>
          <p className="text-slate-500 text-sm font-medium">{total} / {limits?.maxVehicles || 0} activos en plan {authData.accountStatus?.plan}</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }} 
          disabled={reachedLimit || loading}
          className={`px-6 py-2.5 rounded-xl font-black transition-all shadow-lg active:scale-95 flex items-center gap-2 ${reachedLimit ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}
        >
          <i className="fa-solid fa-plus"></i>
          {reachedLimit ? 'Límite Alcanzado' : 'Añadir Vehículo'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo / Año</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Canon Semanal</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && vehicles.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
              ) : vehicles.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {v.model} <span className="text-xs text-slate-400 ml-1 font-medium">{v.year}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase font-mono tracking-widest text-xs">{v.licensePlate}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">${v.canonValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingId(v.id); setFormData(v); setIsModalOpen(true); }} className="w-10 h-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center ml-auto">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400 tracking-tight">
            Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages || 1}</span> 
            <span className="mx-2 opacity-30">•</span> {total} vehículos
          </div>
          
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
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button 
                disabled={page === totalPages || total === 0 || loading}
                onClick={() => setPage(page + 1)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingId ? 'Editar' : 'Nuevo'} Vehículo</h2>
            <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${saving ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Modelo del Auto</label>
                <input required placeholder="Ej. Chevrolet Onix" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Placa</label>
                  <input required placeholder="ABC-123" value={formData.licensePlate || ''} onChange={e => setFormData({...formData, licensePlate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none uppercase focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor Canon ($)</label>
                  <input type="number" required placeholder="0.00" value={formData.canonValue || ''} onChange={e => setFormData({...formData, canonValue: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest disabled:opacity-30">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                    saving 
                      ? 'bg-indigo-400 text-white cursor-not-allowed' 
                      : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {saving ? <i className="fa-solid fa-circle-notch fa-spin text-sm"></i> : null}
                  {saving ? 'Guardando...' : 'Guardar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;