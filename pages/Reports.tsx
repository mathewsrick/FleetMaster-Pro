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

  // Cargamos los datos de autenticación cada vez que el componente se monta
  const authData = useMemo(() => JSON.parse(localStorage.getItem('fmp_auth') || '{}'), []);
  const plan = authData.accountStatus?.plan;
  const limits = authData.accountStatus?.limits;

  // Verificamos si el usuario tiene habilitado el reporte Excel específicamente por sus límites
  const canExportExcel = limits?.hasExcelReports === true;

  // Los planes Free y Básico tienen acceso restringido a ciertas pestañas de datos crudos
  const isRestricted = plan === 'free_trial' || plan === 'basico';

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
    if (!canExportExcel) return;
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

  const allTabs = [
    { id: 'general', label: 'Estado de Flota', icon: 'fa-car-side', restricted: false },
    { id: 'income', label: 'Libro de Ingresos', icon: 'fa-vault', restricted: isRestricted },
    { id: 'expenses', label: 'Libro de Gastos', icon: 'fa-file-invoice-dollar', restricted: isRestricted },
    { id: 'consolidated', label: 'Consolidado P&L', icon: 'fa-chart-line', restricted: false }
  ];

  const availableTabs = allTabs.filter(tab => !tab.restricted);

  if (loading) return <div className="text-center py-20"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes Administrativos</h1>
          <p className="text-slate-500 text-sm">Análisis consolidado — Plan {plan?.toUpperCase()}</p>
        </div>
        
        {/* El botón de Excel ahora depende directamente de canExportExcel */}
        {canExportExcel && (
          <button 
            onClick={() => exportToExcel('report-table', `reporte_${activeTab}`)} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <i className="fa-solid fa-file-excel"></i> Exportar a Excel
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white rounded-t-xl">
        {availableTabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Canon Sem.</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Recaudado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.vehicles.map(v => {
                    const driver = data.drivers.find(d => d.id === v.driverId);
                    const vPayments = data.payments.filter(p => p.vehicleId === v.id).reduce((sum, p) => sum + p.amount, 0);
                    const vDebt = data.arrears.filter(a => a.vehicleId === v.id && a.status === 'pending').reduce((sum, a) => sum + a.amountOwed, 0);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600 font-mono uppercase text-sm">{v.licensePlate}</td>
                        <td className="px-6 py-4 text-sm">{v.model}</td>
                        <td className="px-6 py-4 text-sm">
                          {driver ? `${driver.firstName} ${driver.lastName}` : <span className="text-slate-300 italic">No asignado</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-sm">${v.canonValue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold text-sm">${vPayments.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold text-sm">${vDebt.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}
            
            {activeTab === 'income' && !isRestricted && (
              <>
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Vehículo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono">{formatDateDisplay(p.date)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                        {data.vehicles.find(v => v.id === p.vehicleId)?.licensePlate}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black uppercase">
                        {p.type === 'canon' ? 'Canon' : 'Mora'}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">${p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTab === 'expenses' && !isRestricted && (
              <>
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Descripción</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono">{formatDateDisplay(e.date)}</td>
                      <td className="px-6 py-4 text-sm font-bold">{e.description}</td>
                      <td className="px-6 py-4 text-right font-black text-rose-600 text-sm">-${e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTab === 'consolidated' && (
              <>
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th colSpan={2} className="px-6 py-4 font-black text-lg uppercase tracking-wider">Balance General P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-emerald-50/30">
                    <td className="px-6 py-6 font-bold text-slate-700">Ingresos Totales Históricos</td>
                    <td className="px-6 py-6 text-right text-emerald-600 font-black text-xl">${consolidatedStats.totalIncome.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-rose-50/30">
                    <td className="px-6 py-6 font-bold text-slate-700">Gastos Operativos Históricos</td>
                    <td className="px-6 py-6 text-right text-rose-600 font-black text-xl">-${consolidatedStats.totalExpenses.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-indigo-600 text-white">
                    <td className="px-6 py-8 font-black text-xl">UTILIDAD NETA DISPONIBLE</td>
                    <td className="px-6 py-8 text-right font-black text-3xl">${consolidatedStats.balance.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="px-6 py-4 font-bold text-amber-700">Cartera Total Pendiente (Moras)</td>
                    <td className="px-6 py-4 text-right text-amber-600 font-black text-lg">${consolidatedStats.totalDebt.toLocaleString()}</td>
                  </tr>
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
      
      {isRestricted && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <i className="fa-solid fa-lock text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-indigo-900">Libro de Gastos e Ingresos Bloqueado</p>
            <p className="text-xs text-indigo-600">Sube a un plan <span className="font-black uppercase">Pro</span> para ver desgloses detallados y habilitar exportación a Excel.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;