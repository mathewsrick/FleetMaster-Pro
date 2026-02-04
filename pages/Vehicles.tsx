
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Vehicle, Driver } from '../types';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [v, d] = await Promise.all([db.getVehicles(), db.getDrivers()]);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vehículos</h1>
          <p className="text-slate-400 text-sm">{vehicles.length} / {limits?.maxVehicles || 0} usados en plan {authData.accountStatus?.plan}</p>
        </div>
        <button 
          onClick={() => { if(!reachedLimit || editingId) { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); } }} 
          disabled={reachedLimit && !editingId}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${reachedLimit && !editingId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-lg'}`}
        >
          {reachedLimit && !editingId ? 'Límite de Plan Alcanzado' : 'Añadir Vehículo'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4">Modelo</th>
              <th className="px-6 py-4">Placa</th>
              <th className="px-6 py-4">Canon</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map(v => (
              <tr key={v.id}>
                <td className="px-6 py-4 font-medium">{v.model}</td>
                <td className="px-6 py-4 font-bold text-indigo-600 uppercase font-mono">{v.licensePlate}</td>
                <td className="px-6 py-4 font-bold">${v.canonValue.toLocaleString()}</td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => { setEditingId(v.id); setFormData(v); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-600"><i className="fa-solid fa-pen"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar' : 'Nuevo'} Vehículo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Modelo" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border p-4 rounded-xl font-bold bg-slate-50" />
              <input required placeholder="Placa" value={formData.licensePlate || ''} onChange={e => setFormData({...formData, licensePlate: e.target.value})} className="w-full border p-4 rounded-xl font-bold bg-slate-50 uppercase" />
              <input type="number" required placeholder="Canon" value={formData.canonValue || ''} onChange={e => setFormData({...formData, canonValue: Number(e.target.value)})} className="w-full border p-4 rounded-xl font-bold bg-slate-50" />
              <div className="flex justify-end gap-2 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
