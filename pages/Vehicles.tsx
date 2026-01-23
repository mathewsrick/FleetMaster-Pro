
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Vehicle, Driver } from '../types';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    year: new Date().getFullYear(), licensePlate: '', model: '', color: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    insurance: '', insuranceNumber: '', soatExpiration: '', techExpiration: '',
    canonValue: 0, driverId: null,
  };

  const [formData, setFormData] = useState<Partial<Vehicle>>(initialForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const results = await Promise.allSettled([
      db.getVehicles(),
      db.getDrivers(),
    ]);

    setVehicles(
      results[0].status === 'fulfilled' ? results[0].value : []
    );

    setDrivers(
      results[1].status === 'fulfilled' ? results[1].value : []
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = { ...formData, id: editingId || crypto.randomUUID() } as Vehicle;
    await db.saveVehicle(vehicle);
    if (vehicle.driverId) await db.assignDriver(vehicle.driverId, vehicle.id);
    
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este vehículo?')) {
      await db.deleteVehicle(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flota de Vehículos</h1>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          Añadir Vehículo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4">Modelo</th>
              <th className="px-6 py-4">Placa</th>
              <th className="px-6 py-4">Canon Semanal</th>
              <th className="px-6 py-4">Conductor</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map(v => {
              const driver = drivers.find(d => d.id === v.driverId);
              return (
                <tr key={v.id}>
                  <td className="px-6 py-4 font-medium">{v.model}</td>
                  <td className="px-6 py-4 text-indigo-600 font-bold">{v.licensePlate}</td>
                  <td className="px-6 py-4">${v.canonValue}</td>
                  <td className="px-6 py-4 text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : 'Sin asignar'}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => { setEditingId(v.id); setFormData(v); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-600"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => handleDelete(v.id)} className="text-slate-400 hover:text-rose-600"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Nuevo'} Vehículo</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input required placeholder="Modelo" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} className="border p-2 rounded col-span-2" />
              <input required placeholder="Placa" value={formData.licensePlate || ''} onChange={e => setFormData({...formData, licensePlate: e.target.value})} className="border p-2 rounded" />
              <input type="number" required placeholder="Canon" value={formData.canonValue || ''} onChange={e => setFormData({...formData, canonValue: Number(e.target.value)})} className="border p-2 rounded" />
              <select value={formData.driverId || ''} onChange={e => setFormData({...formData, driverId: e.target.value || null})} className="border p-2 rounded">
                <option value="">Sin conductor</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
              </select>
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
