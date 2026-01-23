
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
      const [v, d, p, e, a] = await Promise.all([
        db.getVehicles(),
        db.getDrivers(),
        db.getPayments(),
        db.getExpenses(),
        db.getArrears()
      ]);
      setData({ vehicles: v, drivers: d, payments: p, expenses: e, arrears: a });
      setLoading(false);
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
      return {
        ...v,
        income: vIncome,
        expenses: vExpenses,
        net: vIncome - vExpenses,
        debt: vDebt
      };
    });

    return { totalIncome, totalExpenses, totalDebt, balance: totalIncome - totalExpenses, vehicleBreakdown };
  }, [data]);

  if (loading) return <div className="text-center py-20"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes Administrativos</h1>
          <p className="text-slate-500 text-sm">Análisis financiero y consolidado de flota</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToExcel('report-table', `reporte_${activeTab}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            <i className="fa-solid fa-file-excel"></i> Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white rounded-t-xl">
        {[
          { id: 'general', label: 'Estado de Flota', icon: 'fa-car-side' },
          { id: 'income', label: 'Libro de Ingresos', icon: 'fa-vault' },
          { id: 'expenses', label: 'Libro de Gastos', icon: 'fa-file-invoice-dollar' },
          { id: 'consolidated', label: 'Consolidado P&L', icon: 'fa-chart-line' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 border-t-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table id="report-table" className="w-full text-left">
            {activeTab === 'general' && (
              <>
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Placa</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Modelo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Conductor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Canon Sem.</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Recaudado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Mora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.vehicles.map(v => {
                    const driver = data.drivers.find(d => d.id === v.driverId);
                    const vPayments = data.payments.filter(p => p.vehicleId === v.id).reduce((sum, p) => sum + p.amount, 0);
                    const vDebt = data.arrears.filter(a => a.vehicleId === v.id && a.status === 'pending').reduce((sum, a) => sum + a.amountOwed, 0);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600 font-mono uppercase">{v.licensePlate}</td>
                        <td className="px-6 py-4 text-sm">{v.model}</td>
                        <td className="px-6 py-4 text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : <span className="text-slate-300 italic">No asignado</span>}</td>
                        <td className="px-6 py-4 text-right font-medium">${v.canonValue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">${vPayments.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold">${vDebt.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {activeTab === 'income' && (
              <>
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Conductor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Vehículo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Tipo de Pago</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.payments.map(p => {
                    const driver = data.drivers.find(d => d.id === p.driverId);
                    const vehicle = data.vehicles.find(v => v.id === p.vehicleId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">{formatDateDisplay(p.date)}</td>
                        <td className="px-6 py-4 text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-indigo-600 font-mono text-xs">{vehicle?.licensePlate}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.type === 'arrear_payment' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.type === 'arrear_payment' ? 'ABONO MORA' : 'CANON'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">${p.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {activeTab === 'expenses' && (
              <>
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Vehículo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Descripción del Gasto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.expenses.map(e => {
                    const vehicle = data.vehicles.find(v => v.id === e.vehicleId);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">{formatDateDisplay(e.date)}</td>
                        <td className="px-6 py-4 font-bold text-indigo-600 font-mono text-xs">{vehicle?.licensePlate || 'General'}</td>
                        <td className="px-6 py-4 text-sm">{e.description}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold">-${e.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {activeTab === 'consolidated' && (
              <>
                {/* Tabla 1: Resumen General */}
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th colSpan={2} className="px-6 py-4 font-bold text-lg uppercase tracking-wider">Resumen General de Operación (Flota)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-emerald-50/30">
                    <td className="px-6 py-4 font-semibold text-slate-700 flex items-center gap-2">
                      <i className="fa-solid fa-circle-arrow-up text-emerald-500"></i> Ingresos Totales Recaudados
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-black text-lg">${consolidatedStats.totalIncome.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-rose-50/30">
                    <td className="px-6 py-4 font-semibold text-slate-700 flex items-center gap-2">
                      <i className="fa-solid fa-circle-arrow-down text-rose-500"></i> Gastos Operativos Totales
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 font-black text-lg">-${consolidatedStats.totalExpenses.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-indigo-600 text-white">
                    <td className="px-6 py-4 font-black text-lg">UTILIDAD OPERATIVA NETA (Caja)</td>
                    <td className="px-6 py-4 text-right font-black text-2xl">${consolidatedStats.balance.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-500 italic">Cartera Pendiente (Moras por Cobrar)</td>
                    <td className="px-6 py-4 text-right text-rose-400 font-bold">${consolidatedStats.totalDebt.toLocaleString()}</td>
                  </tr>
                </tbody>

                {/* Espaciador para el Excel */}
                <tr className="h-8"><td colSpan={2}></td></tr>

                {/* Tabla 2: Detalle por Vehículo */}
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-6 py-4 font-bold text-sm uppercase">Detalle Analítico por Vehículo</th>
                    <th className="px-6 py-4 text-right font-bold text-sm uppercase">P&L Individual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {consolidatedStats.vehicleBreakdown.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-all border-l-4 border-l-indigo-500">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-indigo-100 text-indigo-700 p-3 rounded-lg font-black font-mono text-lg shadow-sm border border-indigo-200">
                            {v.licensePlate}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{v.model}</p>
                            <div className="flex gap-4 mt-1">
                              <span className="text-[10px] font-bold text-emerald-600">Ing: ${v.income.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-rose-500">Gas: ${v.expenses.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-amber-600">Mora: ${v.debt.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <p className={`text-xl font-black ${v.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {v.net >= 0 ? '+' : ''}${v.net.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Margen Operativo</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>

      {activeTab === 'consolidated' && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
          <i className="fa-solid fa-circle-info text-indigo-500 mt-1"></i>
          <p className="text-xs text-indigo-700 leading-relaxed font-medium">
            <strong>Nota sobre P&L:</strong> La Utilidad Operativa Neta representa el dinero real en caja (Ingresos menos Gastos). 
            La Cartera Pendiente no se suma a la utilidad hasta que los abonos a moras sean efectivamente cobrados.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
