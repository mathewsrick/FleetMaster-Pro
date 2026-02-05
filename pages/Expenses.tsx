import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { Expense, Vehicle } from '../types';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // db.getExpenses returns a PaginatedResponse<Expense>
    const [e, v] = await Promise.all([db.getExpenses(), db.getVehicles()]);
    // Fix: Access .data from the paginated result
    const sortedExpenses = [...e.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(sortedExpenses);
    setVehicles(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) return;
    await db.saveExpense({ ...formData, id: crypto.randomUUID() } as Expense);
    setFormData({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], vehicleId: '' });
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gastos de Flota</h1>
          <p className="text-slate-500 text-sm">Registro de mantenimiento y costos operativos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> Registrar Gasto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Fecha</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Vehículo</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Descripción</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => {
                const vehicle = vehicles.find(v => v.id === e.vehicleId);
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{formatDateDisplay(e.date)}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">{vehicle?.licensePlate || 'General'}</td>
                    <td className="px-6 py-4 text-slate-900">{e.description}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">-${e.amount.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Nuevo Gasto</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vehículo</label>
                <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                  <option value="">Seleccione...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} ({v.model})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Ej. Cambio de aceite, reparación llanta..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Costo ($)</label>
                <input type="number" required value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value === '' ? 0 : Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;