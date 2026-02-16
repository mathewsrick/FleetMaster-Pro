import React, { useState, useEffect, useMemo } from 'react';
import { db, formatDateDisplay } from '@/services/db';
import { Vehicle, Driver, Payment, Expense, Arrear } from '@/types/types';
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
  const [activeTab, setActiveTab] = useState<'general' | 'expenses' | 'income' | 'consolidated' | 'drivers'>('general');

  // Filtros y Paginación
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const authData = useMemo(() => JSON.parse(localStorage.getItem('fmp_auth') || '{}'), []);
  const plan = authData.accountStatus?.plan;
  const limits = authData.accountStatus?.limits;

  const canExportExcel = limits?.hasExcelReports === true;
  const isRestricted = plan === 'free_trial' || plan === 'basico';
  const hasAdvancedReports = plan === 'pro' || plan === 'enterprise';

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

  // Reset pagination when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedVehicleId, selectedDriverId]);

  const exportToExcel = (tableId: string, fileName: string) => {
    if (!canExportExcel) return;
    const table = document.getElementById(tableId);
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Lógica de filtrado y paginación local
  const filteredData = useMemo(() => {
    if (activeTab === 'income') {
      let filtered = data.payments;
      if (selectedVehicleId) filtered = filtered.filter(p => p.vehicleId === selectedVehicleId);
      const total = filtered.length;
      const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
      return { list: paginated, total };
    }
    if (activeTab === 'expenses') {
      let filtered = data.expenses;
      if (selectedVehicleId) filtered = filtered.filter(e => e.vehicleId === selectedVehicleId);
      const total = filtered.length;
      const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
      return { list: paginated, total };
    }
    if (activeTab === 'drivers') {
      let filtered = data.drivers;
      if (selectedDriverId) filtered = filtered.filter(d => d.id === selectedDriverId);
      const total = filtered.length;
      const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
      return { list: paginated, total };
    }
    return { list: [], total: 0 };
  }, [activeTab, data, selectedVehicleId, selectedDriverId, currentPage]);

  const consolidatedStats = useMemo(() => {
    const totalIncome = data.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalDebt = data.arrears.filter(a => a.status === 'pending').reduce((sum, a) => sum + Number(a.amountOwed), 0);
    return { totalIncome, totalExpenses, totalDebt, balance: totalIncome - totalExpenses };
  }, [data]);

  const allTabs = [
    { id: 'general', label: 'Estado de Flota', icon: 'fa-car-side', restricted: false },
    { id: 'drivers', label: 'Historial Conductores', icon: 'fa-id-card-clip', restricted: !hasAdvancedReports },
    { id: 'income', label: 'Libro de Ingresos', icon: 'fa-vault', restricted: isRestricted },
    { id: 'expenses', label: 'Libro de Gastos', icon: 'fa-file-invoice-dollar', restricted: isRestricted },
    { id: 'consolidated', label: 'Consolidado P&L', icon: 'fa-chart-line', restricted: false }
  ];

  const availableTabs = allTabs.filter(tab => !tab.restricted);

  if (loading) return <div className="text-center py-20"><i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i></div>;

  const totalPages = Math.ceil(filteredData.total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes Administrativos</h1>
          <p className="text-slate-500 text-sm">Análisis consolidado — Plan {plan?.toUpperCase()}</p>
        </div>
        
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

      {/* Filtros dinámicos según pestaña */}
      {(activeTab === 'income' || activeTab === 'expenses' || (activeTab === 'drivers' && hasAdvancedReports)) && (
        <div className="bg-white px-6 py-4 border-x border-slate-200 flex flex-wrap gap-4 items-center animate-in fade-in duration-300">
          {(activeTab === 'income' || activeTab === 'expenses') && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo:</span>
              <select 
                value={selectedVehicleId} 
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
              </select>
            </div>
          )}
          {activeTab === 'drivers' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor:</span>
              <select 
                value={selectedDriverId} 
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {data.drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Renta</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Recaudado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.vehicles.map(v => {
                    const driver = data.drivers.find(d => d.id === v.driverId);
                    const vPayments = data.payments.filter(p => p.vehicleId === v.id).reduce((sum, p) => sum + Number(p.amount), 0);
                    const vDebt = data.arrears.filter(a => a.vehicleId === v.id && a.status === 'pending').reduce((sum, a) => sum + Number(a.amountOwed), 0);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600 font-mono uppercase text-sm">{v.licensePlate}</td>
                        <td className="px-6 py-4 text-sm">{v.model}</td>
                        <td className="px-6 py-4 text-sm">
                          {driver ? `${driver.firstName} ${driver.lastName}` : <span className="text-slate-300 italic">No asignado</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-sm">${v.rentaValue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold text-sm">${vPayments.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold text-sm">${vDebt.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}

            {activeTab === 'drivers' && hasAdvancedReports && (
              <>
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo Actual</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Pagado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mora Pendiente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.list.map((d: any) => {
                    const vehicle = data.vehicles.find(v => v.driverId === d.id);
                    const dPayments = data.payments.filter(p => p.driverId === d.id).reduce((sum, p) => sum + Number(p.amount), 0);
                    const dDebt = data.arrears.filter(a => a.driverId === d.id && a.status === 'pending').reduce((sum, a) => sum + Number(a.amountOwed), 0);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{d.firstName} {d.lastName}</td>
                        <td className="px-6 py-4">
                          {vehicle ? <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100">{vehicle.licensePlate}</span> : <span className="text-[10px] text-slate-300 italic">Ninguno</span>}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold text-sm">${dPayments.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold text-sm">${dDebt.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          {dDebt > 0 ? (
                            <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-full border border-rose-100">MOROSO</span>
                          ) : (
                            <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100">AL DÍA</span>
                          )}
                        </td>
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
                  {filteredData.list.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono">{formatDateDisplay(p.date)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                        {data.vehicles.find(v => v.id === p.vehicleId)?.licensePlate}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black uppercase">
                        {p.type === 'renta' ? 'Renta' : 'Mora'}
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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Vehículo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Descripción</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.list.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono">{formatDateDisplay(e.date)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                        {data.vehicles.find(v => v.id === e.vehicleId)?.licensePlate || 'General'}
                      </td>
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

        {/* Paginación */}
        {(activeTab === 'income' || activeTab === 'expenses' || (activeTab === 'drivers' && hasAdvancedReports)) && (
          <div className="px-6 py-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-slate-400 tracking-tight">
              Mostrando página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages || 1}</span> 
              <span className="mx-2 opacity-30">•</span> {filteredData.total} registros encontrados
            </div>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button 
                disabled={currentPage === totalPages || filteredData.total === 0} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {isRestricted && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
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