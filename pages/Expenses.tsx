import React, { useState, useEffect } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { Expense, Vehicle } from '../types';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<Partial<Expense>>({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], vehicleId: '' });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) return;
    await db.saveExpense({ ...formData, id: crypto.randomUUID() } as Expense);
    setIsModalOpen(false);
    loadData();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gastos de Flota</h1>
          <p className="text-slate-500 text-sm">Registro de mantenimiento y costos operativos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95"><i className="fa-solid fa-plus"></i> Registrar Gasto</button>
      </div>

      <div className="relative">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text" 
          placeholder="Buscar por descripción..." 
          value={search}
          onChange={(e) => {setSearch(e.target.value); setPage(1);}}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-12 text-center text-rose-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">No se encontraron resultados.</td></tr>
            ) : expenses.map(e => {
              const vehicle = vehicles.find(v => v.id === e.vehicleId);
              return (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-600 font-mono">{formatDateDisplay(e.date)}</td>
                  <td className="px-6 py-4"><span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{vehicle?.licensePlate || 'General'}</span></td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{e.description}</td>
                  <td className="px-6 py-4 font-black text-rose-600">-${e.amount.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginación Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400 tracking-tight">
            Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages || 1}</span> 
            <span className="ml-2 opacity-50">•</span> <span className="ml-2">{total} resultados totales</span>
          </div>
          <div className="flex items-center gap-4">
            <select value={limit} onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}} className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600">
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
            </select>
            <div className="flex gap-1">
              <button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 disabled:opacity-30"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <button disabled={page === totalPages || total === 0 || loading} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 disabled:opacity-30"><i className="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;