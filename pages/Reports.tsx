import React, { useState, useEffect, useMemo } from 'react';
import { db, formatDateDisplay } from '../services/db';
import { Vehicle, Driver, Payment, Expense, Arrear } from '../types';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [data, setData] = useState({
    vehicles: [] as Vehicle[],
    drivers: [] as Driver[],
    payments: [] as Payment[],
    expenses: [] as Expense[],
    arrears: [] as Arrear[],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'expenses' | 'income' | 'consolidated'>('general');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [v, d, p, e, a] = await Promise.all([
          db.getVehicles(1, 1000),
          db.getDrivers(1, 1000),
          db.getPayments({ page: 1, limit: 1000 }),
          db.getExpenses({ page: 1, limit: 1000 }),
          db.getArrears()
        ]);
        setData({ vehicles: v.data, drivers: d.data, payments: p.data, expenses: e.data, arrears: a });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportToExcel = (tableId: string, fileName: string) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const consolidatedStats = useMemo(() => {
    const totalIncome = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDebt = data.arrears.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amountOwed, 0);
    const vehicleBreakdown = data.vehicles.map(v => {
      const vIncome = data.payments.filter(p => p.vehicleId === v.id).reduce((sum, p) => sum + p.amount, 0);
      const vExpenses = data.expenses.filter(e => e.vehicleId === v.id).reduce((sum, e) => sum + e.amount, 0);
      const vDebt = data.arrears.filter(a => a.vehicleId === v.id && a.status === 'pending').reduce((sum, a) => sum + a.amountOwed, 0);
      return { ...v, income: vIncome, expenses: vExpenses, net: vIncome - vExpenses, debt: vDebt };
    });
    return { totalIncome, totalExpenses, totalDebt, balance: totalIncome - totalExpenses, vehicleBreakdown };
  }, [data]);

  if (loading) return <div className="text-center py-20"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes Administrativos</h1><p className="text-slate-500 text-sm">Análisis consolidado</p></div>
        <button onClick={() => exportToExcel('report-table', `reporte_${activeTab}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95"><i className="fa-solid fa-file-excel"></i> Exportar Excel</button>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white rounded-t-xl">
        {[ { id: 'general', label: 'Estado de Flota', icon: 'fa-car-side' }, { id: 'income', label: 'Libro de Ingresos', icon: 'fa-vault' }, { id: 'expenses', label: 'Libro de Gastos', icon: 'fa-file-invoice-dollar' }, { id: 'consolidated', label: 'Consolidado P&L', icon: 'fa-chart-line' } ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><i className={`fa-solid ${tab.icon}`}></i> {tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 border-t-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table id="report-table" className="w-full text-left">
            {activeTab === 'general' && (
              <>
                <thead className="bg-slate-50 border-b"><tr><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Placa</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Modelo</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Conductor</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Canon Sem.</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Recaudado</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Mora</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{data.vehicles.map(v => {
                  const driver = data.drivers.find(d => d.id === v.driverId);
                  const vPayments = data.payments.filter(p => p.vehicleId === v.id).reduce((sum, p) => sum + p.amount, 0);
                  const vDebt = data.arrears.filter(a => a.vehicleId === v.id && a.status === 'pending').reduce((sum, a) => sum + a.amountOwed, 0);
                  return (<tr key={v.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 font-bold text-indigo-600 font-mono uppercase">{v.licensePlate}</td><td className="px-6 py-4 text-sm">{v.model}</td><td className="px-6 py-4 text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : <span className="text-slate-300 italic">No asignado</span>}</td><td className="px-6 py-4 text-right font-medium">${v.canonValue.toLocaleString()}</td><td className="px-6 py-4 text-right text-emerald-600 font-bold">${vPayments.toLocaleString()}</td><td className="px-6 py-4 text-right text-rose-600 font-bold">${vDebt.toLocaleString()}</td></tr>);
                })}</tbody>
              </>
            )}
            {activeTab === 'consolidated' && (
              <>
                <thead className="bg-slate-900 text-white"><tr><th colSpan={2} className="px-6 py-4 font-bold text-lg uppercase tracking-wider">P&L Operativo</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-emerald-50/30"><td className="px-6 py-4 font-semibold text-slate-700">Ingresos Totales Recaudados</td><td className="px-6 py-4 text-right text-emerald-600 font-black text-lg">${consolidatedStats.totalIncome.toLocaleString()}</td></tr>
                  <tr className="bg-rose-50/30"><td className="px-6 py-4 font-semibold text-slate-700">Gastos Operativos Totales</td><td className="px-6 py-4 text-right text-rose-600 font-black text-lg">-${consolidatedStats.totalExpenses.toLocaleString()}</td></tr>
                  <tr className="bg-indigo-600 text-white"><td className="px-6 py-4 font-black text-lg">UTILIDAD OPERATIVA NETA</td><td className="px-6 py-4 text-right font-black text-2xl">${consolidatedStats.balance.toLocaleString()}</td></tr>
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;