import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Vehicle, Driver } from '../types';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const authData = JSON.parse(localStorage.getItem('fmp_auth') || '{}');
  const limits = authData.accountStatus?.limits;
  const reachedLimit = limits ? vehicles.length >= limits.maxVehicles : false;

  const initialForm = {
    year: new Date().getFullYear(), licensePlate: '', model: '', color: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    insurance: '', insuranceNumber: '', soatExpiration: '', techExpiration: '',
    canonValue: 0, driverId: null,
  };

  const [formData, setFormData] = useState<Partial<Vehicle>>(initialForm);

  useEffect(() => { loadData(); }, [page, limit]);

  const loadData = async () => {
    const [v, d] = await Promise.all([db.getVehicles(page, limit), db.getDrivers()]);
    setVehicles(v);
    setDrivers(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicle = { ...formData, id: editingId || crypto.randomUUID() } as Vehicle;
      await db.saveVehicle(vehicle);
      setEditingId(null);
      setFormData(initialForm);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.data?.error || 'Error al guardar vehículo.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vehículos</h1>
          <p className="text-slate-500 text-sm font-medium">{vehicles.length} / {limits?.maxVehicles || 0} activos en plan {authData.accountStatus?.plan}</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }} 
          disabled={reachedLimit}
          className={`px-6 py-2.5 rounded-xl font-black transition-all shadow-lg active:scale-95 flex items-center gap-2 ${reachedLimit ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}
        >
          <i className="fa-solid fa-plus"></i>
          {reachedLimit ? 'Límite Alcanzado' : 'Añadir Vehículo'}
        </button>
      </div>

      <div className="flex justify-end">
        <select 
          value={limit} 
          onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 text-sm shadow-sm"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
            {vehicles.map(v => (
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

        {/* Paginación */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Página {page}</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button 
              disabled={vehicles.length < limit}
              onClick={() => setPage(page + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingId ? 'Editar' : 'Nuevo'} Vehículo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95">Guardar Vehículo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;