import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, formatDateToDisplay } from '@/services/db';
import {
  DriverBehaviorReport,
  DriverBehaviorRow,
  DriverWeekStatus,
  FleetSummaryReport,
  MaintenanceReport,
  MaintenanceVehicleRow,
  VehicleProfitabilityReport,
  VehicleProfitabilityRow,
  expenseComponentLabel
} from '@/types/types';
import DateRangePicker from '@/components/DateRangePicker';
import ResponsiveTable from '@/components/ResponsiveTable';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import * as XLSX from 'xlsx';

type TabId = 'summary' | 'vehicles' | 'drivers' | 'maintenance';

const TABS: Array<{ id: TabId; label: string; shortLabel: string; icon: string }> = [
  { id: 'summary', label: 'Resumen', shortLabel: 'Resumen', icon: 'fa-chart-pie' },
  { id: 'vehicles', label: 'Vehículos', shortLabel: 'Vehículos', icon: 'fa-car-side' },
  { id: 'drivers', label: 'Conductores', shortLabel: 'Conductores', icon: 'fa-id-card-clip' },
  { id: 'maintenance', label: 'Mantenimiento', shortLabel: 'Mant.', icon: 'fa-screwdriver-wrench' }
];

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  reparacion: 'Reparación',
  repuesto: 'Repuesto',
  combustible: 'Combustible',
  mantenimiento: 'Mantenimiento',
  seguro: 'Seguro',
  impuesto: 'Impuesto',
  multa: 'Multa',
  lavado: 'Lavado',
  otro: 'Otro'
};

const EXPENSE_TYPE_COLORS: Record<string, string> = {
  reparacion: 'bg-orange-500',
  repuesto: 'bg-blue-500',
  combustible: 'bg-amber-500',
  mantenimiento: 'bg-purple-500',
  seguro: 'bg-emerald-500',
  impuesto: 'bg-red-500',
  multa: 'bg-rose-500',
  lavado: 'bg-cyan-500',
  otro: 'bg-slate-400'
};

const WEEK_STATUS_STYLE: Record<DriverWeekStatus, string> = {
  completa: 'bg-emerald-500 border-emerald-600',
  parcial: 'bg-amber-400 border-amber-500',
  sin_pago: 'bg-rose-500 border-rose-600'
};

const WEEK_STATUS_ICON: Record<DriverWeekStatus, string> = {
  completa: '✓',
  parcial: '½',
  sin_pago: '✕'
};

const WEEK_STATUS_LABEL: Record<DriverWeekStatus, string> = {
  completa: 'Completa',
  parcial: 'Parcial',
  sin_pago: 'Sin pago'
};

const SCORE_STYLE: Record<string, string> = {
  Excelente: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Bueno: 'bg-blue-50 text-blue-600 border-blue-100',
  Regular: 'bg-amber-50 text-amber-600 border-amber-100',
  Riesgo: 'bg-rose-50 text-rose-600 border-rose-100'
};

const WEAR_STYLE: Record<string, string> = {
  Bajo: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Normal: 'bg-blue-50 text-blue-600 border-blue-100',
  Alto: 'bg-amber-50 text-amber-600 border-amber-100',
  'Muy alto': 'bg-rose-50 text-rose-600 border-rose-100',
  'Sin datos': 'bg-slate-50 text-slate-500 border-slate-200'
};

const money = (value?: number | null) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const compactMoney = (value: number) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${Math.round(amount)}`;
};

const percent = (value?: number | null) => `${Number(value || 0).toFixed(1)}%`;

const pad = (value: number) => String(value).padStart(2, '0');

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const currentMonthRange = () => {
  const now = new Date();
  return {
    startDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: isoDate(now)
  };
};

const monthKey = (dateStr?: string) => {
  if (dateStr && /^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
};

const monthName = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  });
};

const shortMonthName = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  const label = new Date(year, monthNumber - 1, 1).toLocaleDateString('es-CO', {
    month: 'short',
    year: 'numeric'
  });
  return titleCase(label);
};

const titleCase = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, tone = 'indigo' }) => {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
          {label}
        </span>
        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
          <i className={`fa-solid ${icon} text-xs sm:text-sm`}></i>
        </div>
      </div>
      <div className="mt-2 text-base sm:text-xl font-black text-slate-800 leading-tight break-words">
        {value}
      </div>
      {hint && <div className="mt-1 text-[10px] sm:text-xs font-semibold text-slate-400">{hint}</div>}
    </div>
  );
};

const ScoreBadge: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${
      SCORE_STYLE[label] || SCORE_STYLE.Bueno
    }`}
    title={`Puntaje ${score}/100`}
  >
    <span className="text-[10px]">{score}</span>
    {label}
  </span>
);

const WeekGrid: React.FC<{ weeks: DriverBehaviorRow['weekDetails'] }> = ({ weeks }) => {
  if (weeks.length === 0) return <span className="text-[10px] text-slate-300 italic">Sin semanas</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {weeks.map((week) => (
        <span
          key={week.weekStart}
          title={`${week.weekStart} – ${week.weekEnd}\nEstado: ${WEEK_STATUS_LABEL[week.status]}\nEsperado: ${money(
            week.expected
          )}\nPagado: ${money(week.paid)}`}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border text-white text-[10px] font-black flex items-center justify-center ${
            WEEK_STATUS_STYLE[week.status]
          }`}
        >
          {WEEK_STATUS_ICON[week.status]}
        </span>
      ))}
    </div>
  );
};

const AmountBreakdown: React.FC<{
  title: string;
  icon: string;
  total: number;
  items: Array<{ label: string; value: number; color?: string }>;
}> = ({ title, icon, total, items }) => {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <i className={`fa-solid ${icon} text-indigo-500`}></i>
          {title}
        </h3>
        <span className="text-xs sm:text-sm font-black text-slate-700">{money(total)}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium py-3">Sin movimientos en el periodo.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-[11px] font-bold text-slate-600 truncate">{item.label}</span>
                <span className="text-[11px] font-black text-slate-800 whitespace-nowrap">{money(item.value)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color || 'bg-indigo-500'}`}
                  style={{ width: `${max > 0 ? Math.max(2, (item.value / max) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Reports: React.FC = () => {
  const [range, setRange] = useState(currentMonthRange);
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [summary, setSummary] = useState<FleetSummaryReport | null>(null);
  const [vehicles, setVehicles] = useState<VehicleProfitabilityReport | null>(null);
  const [drivers, setDrivers] = useState<DriverBehaviorReport | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planBlocked, setPlanBlocked] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const authData = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('fmp_auth') || '{}');
    } catch {
      return {};
    }
  }, []);

  const plan = authData.accountStatus?.plan as string | undefined;

  const loadReports = useCallback(
    async (nextRange: { startDate: string; endDate: string }) => {
      if (!nextRange.startDate || !nextRange.endDate) return;

      if (nextRange.startDate > nextRange.endDate) {
        setError('La fecha inicial no puede ser posterior a la fecha final.');
        return;
      }

      setLoading(true);
      setError(null);
      setPdfError(null);

      try {
        const [summaryData, vehiclesData, driversData, maintenanceData] = await Promise.all([
          db.getReportSummary(nextRange),
          db.getReportVehicles(nextRange),
          db.getReportDrivers(nextRange),
          db.getReportMaintenance(nextRange)
        ]);

        setSummary(summaryData);
        setVehicles(vehiclesData);
        setDrivers(driversData);
        setMaintenance(maintenanceData);
        setPlanBlocked(null);
      } catch (err: any) {
        if (err?.status === 403) {
          setSummary(null);
          setVehicles(null);
          setDrivers(null);
          setMaintenance(null);
          setPlanBlocked(err?.data?.error || 'Disponible en planes pagos');
        } else {
          setError(
            err?.data?.error ||
              err?.data?.message ||
              'No se pudieron cargar los reportes. Intenta nuevamente.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadReports(range);
  }, [range, loadReports]);

  const repeatedRepairs = useMemo(() => {
    if (!maintenance) return [];
    return maintenance.vehicles
      .flatMap((vehicle) =>
        vehicle.repeatedComponents.map((component) => ({
          ...component,
          licensePlate: vehicle.licensePlate
        }))
      )
      .sort((a, b) => b.count - a.count || b.amount - a.amount);
  }, [maintenance]);

  const vehiclesByNet = useMemo(
    () => (vehicles ? [...vehicles.vehicles].sort((a, b) => a.rankByNet - b.rankByNet) : []),
    [vehicles]
  );

  const driversInRisk = useMemo(
    () => (drivers ? drivers.drivers.filter((driver) => driver.label === 'Riesgo').length : 0),
    [drivers]
  );

  const vehicleChartData = useMemo(
    () =>
      vehicles?.vehicles.map((vehicle) => ({
        name: vehicle.licensePlate,
        Ingresos: vehicle.income.total,
        Gastos: vehicle.expenses.total
      })) || [],
    [vehicles]
  );

  const componentChartData = useMemo(
    () =>
      (maintenance?.fleet.topComponents || []).slice(0, 8).map((component) => ({
        name: expenseComponentLabel(component.component),
        Monto: component.amount,
        Eventos: component.count
      })),
    [maintenance]
  );

  const pdfMonth = monthKey(range.endDate || range.startDate);

  const downloadPdf = async () => {
    if (downloadingPdf) return;

    setDownloadingPdf(true);
    setPdfError(null);

    try {
      const blob = await db.getMonthlyReportPdf(pdfMonth);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FleetMaster-${pdfMonth}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err?.status === 403) {
        setPlanBlocked(err?.data?.error || 'Disponible en planes pagos');
      } else {
        setPdfError(err?.data?.error || 'No se pudo generar el PDF. Intenta nuevamente.');
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const hasData =
    (activeTab === 'summary' && !!summary) ||
    (activeTab === 'vehicles' && !!vehicles) ||
    (activeTab === 'drivers' && !!drivers) ||
    (activeTab === 'maintenance' && !!maintenance);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const appendSheet = (rows: any[], sheetName: string) => {
      const sheet = XLSX.utils.json_to_sheet(
        rows.length ? rows : [{ Información: 'Sin datos en el periodo seleccionado' }]
      );
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
    };

    if (activeTab === 'summary' && summary) {
      appendSheet(
        [
          { Indicador: 'Periodo', Valor: summary.range.label },
          { Indicador: 'Semanas del periodo', Valor: summary.weeks },
          { Indicador: 'Ingresos totales', Valor: summary.income.total },
          { Indicador: 'Ingresos por renta', Valor: summary.income.renta },
          { Indicador: 'Abonos a deuda', Valor: summary.income.abonos },
          { Indicador: 'Otros ingresos', Valor: summary.income.other },
          { Indicador: 'Gastos totales', Valor: summary.expenses.total },
          { Indicador: 'Utilidad neta', Valor: summary.net },
          { Indicador: 'Margen (%)', Valor: summary.marginPct },
          { Indicador: 'Renta esperada', Valor: summary.expectedRent },
          { Indicador: 'Tasa de recaudo (%)', Valor: summary.collectionRatePct },
          { Indicador: 'Deuda pendiente', Valor: summary.pendingDebt },
          { Indicador: 'Vehículos totales', Valor: summary.vehicles.total },
          { Indicador: 'Vehículos asignados', Valor: summary.vehicles.assigned },
          { Indicador: 'Vehículos ociosos', Valor: summary.vehicles.idle }
        ],
        'Resumen'
      );

      appendSheet(
        summary.expenses.byType.map((item) => ({
          'Tipo de gasto': EXPENSE_TYPE_LABELS[item.type] || item.type,
          Monto: item.amount
        })),
        'Gastos por tipo'
      );
    }

    if (activeTab === 'vehicles' && vehicles) {
      appendSheet(
        vehiclesByNet.map((vehicle) => ({
          Ranking: vehicle.rankByNet,
          Placa: vehicle.licensePlate,
          Modelo: vehicle.model,
          Año: vehicle.year,
          Conductor: vehicle.driverName || 'Sin asignar',
          'Renta semanal': vehicle.rentaValue,
          Ingresos: vehicle.income.total,
          'Ingresos renta': vehicle.income.renta,
          Abonos: vehicle.income.abonos,
          Gastos: vehicle.expenses.total,
          'Utilidad neta': vehicle.net,
          'Margen (%)': vehicle.marginPct,
          'Km recorridos': vehicle.km,
          'Costo por km': vehicle.costPerKm ?? '',
          'Semanas asignadas': vehicle.assignedWeeks,
          'Semanas ociosas': vehicle.idleWeeks,
          'Ranking por gasto': vehicle.rankByExpense
        })),
        'Vehículos'
      );
    }

    if (activeTab === 'drivers' && drivers) {
      appendSheet(
        drivers.drivers.map((driver) => ({
          Conductor: driver.driverName,
          Vehículos: driver.vehiclePlates.join(', '),
          Puntaje: driver.score,
          Calificación: driver.label,
          'Renta esperada': driver.expected,
          'Renta pagada': driver.rentaPaid,
          'Cumplimiento (%)': driver.compliancePct,
          'Semanas totales': driver.weeks.total,
          'Semanas completas': driver.weeks.full,
          'Semanas parciales': driver.weeks.partial,
          'Semanas sin pago': driver.weeks.unpaid,
          'Abonos a deuda': driver.arrearPayments.amount,
          'Deuda generada': driver.arrearsGenerated,
          'Deuda pendiente actual': driver.currentPendingDebt,
          'Racha sin pago (semanas)': driver.unpaidStreak
        })),
        'Conductores'
      );
    }

    if (activeTab === 'maintenance' && maintenance) {
      appendSheet(
        maintenance.fleet.topComponents.map((component) => ({
          Componente: expenseComponentLabel(component.component),
          Eventos: component.count,
          Monto: component.amount
        })),
        'Componentes'
      );

      appendSheet(
        maintenance.fleet.topDescriptions.map((description) => ({
          Descripción: titleCase(description.description),
          Eventos: description.count,
          Monto: description.amount
        })),
        'Repuestos'
      );

      appendSheet(
        maintenance.vehicles.map((vehicle) => ({
          Placa: vehicle.licensePlate,
          'Eventos de mantenimiento': vehicle.expenseCount,
          Reparaciones: vehicle.repairCount,
          'Gasto total': vehicle.totalSpend
        })),
        'Por vehículo'
      );

      appendSheet(
        repeatedRepairs.map((repair) => ({
          Placa: repair.licensePlate,
          Componente: expenseComponentLabel(repair.component),
          Veces: repair.count,
          'Días entre eventos': repair.daysBetween,
          'Km entre eventos': repair.kmBetween ?? '',
          Monto: repair.amount
        })),
        'Repeticiones'
      );

      appendSheet(
        maintenance.drivers.map((driver) => ({
          Conductor: driver.driverName,
          'Semanas asignadas': driver.weeksAssigned,
          'Km estimados': driver.km,
          'Gasto mantenimiento': driver.totalSpend,
          'Gasto por semana': driver.spendPerWeek ?? '',
          'Gasto por km': driver.spendPerKm ?? '',
          'Índice de desgaste': driver.wearIndex ?? '',
          Calificación: driver.wearLabel
        })),
        'Desgaste'
      );
    }

    if (workbook.SheetNames.length === 0) return;

    XLSX.writeFile(workbook, `reporte_${activeTab}_${range.endDate || 'periodo'}.xlsx`);
  };

  const tabButtonClass = (tabId: TabId, mobile = false) => {
    const isActive = activeTab === tabId;
    if (mobile) {
      return `flex items-center gap-2 px-4 py-3 text-xs font-black rounded-xl transition-all whitespace-nowrap min-w-fit ${
        isActive
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105'
          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:scale-105 shadow-md'
      }`;
    }
    return `flex items-center gap-2 px-4 lg:px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
      isActive
        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
        : 'border-transparent text-slate-400 hover:text-slate-600'
    }`;
  };

  const periodLabel =
    summary?.range.label ||
    `${formatDateToDisplay(range.startDate)} – ${formatDateToDisplay(range.endDate)}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Reportes</h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium capitalize">
            {plan ? `Plan ${plan.replace('_', ' ')}` : 'Plan'} · {periodLabel}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={downloadPdf}
            disabled={!!planBlocked || downloadingPdf}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all text-[10px] sm:text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Descargar PDF de ${monthName(pdfMonth)}`}
          >
            <i className={`fa-solid ${downloadingPdf ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'}`}></i>
            {downloadingPdf ? (
              'Generando…'
            ) : (
              <>
                <span className="hidden lg:inline">Descargar PDF · {shortMonthName(pdfMonth)}</span>
                <span className="lg:hidden">PDF del mes</span>
              </>
            )}
          </button>

          <button
            onClick={exportToExcel}
            disabled={!hasData || loading || !!planBlocked}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all text-[10px] sm:text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-file-excel"></i>
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-4 py-3 text-xs font-bold flex items-start gap-2">
          <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
          <span className="flex-1">{pdfError}</span>
          <button onClick={() => setPdfError(null)} className="text-rose-400 hover:text-rose-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {planBlocked ? (
        <div className="bg-indigo-50 border border-indigo-100 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-crown text-lg"></i>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm sm:text-base font-black text-indigo-900">
              Reportes disponibles en planes pagos
            </p>
            <p className="text-[11px] sm:text-xs text-indigo-600 mt-1 font-medium">
              El resumen de flota, la rentabilidad por vehículo, el comportamiento de conductores, el
              análisis de mantenimiento y el PDF mensual se habilitan al activar un plan. Tu periodo de
              prueba no incluye reportes analíticos.
            </p>
            {planBlocked !== 'Disponible en planes pagos' && (
              <p className="text-[10px] sm:text-[11px] text-indigo-400 mt-1 font-mono">{planBlocked}</p>
            )}
          </div>
          <Link
            to="/pricing-checkout"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            Mejorar plan
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <i className="fa-solid fa-calendar-days text-indigo-500"></i>
              Periodo
            </div>
            <DateRangePicker
              startDate={range.startDate}
              endDate={range.endDate}
              onChange={(nextRange) => setRange(nextRange)}
            />
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              <button
                onClick={() => setRange(currentMonthRange())}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
              >
                Mes actual
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                  setRange({ startDate: isoDate(previous), endDate: isoDate(lastDay) });
                }}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
              >
                Mes anterior
              </button>
            </div>
          </div>

          {/* Tabs - Desktop */}
          <div className="hidden sm:flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white rounded-t-xl">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={tabButtonClass(tab.id)}
              >
                <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* Tabs - Mobile */}
          <div className="flex sm:hidden gap-3 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={tabButtonClass(tab.id, true)}
              >
                <i className={`fa-solid ${tab.icon} text-sm`}></i>
                <span className="uppercase tracking-wider font-black">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl py-20 text-center">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
              <p className="mt-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                Calculando reportes…
              </p>
            </div>
          ) : error ? (
            <div className="bg-white border border-rose-100 rounded-xl p-8 text-center space-y-3">
              <i className="fa-solid fa-triangle-exclamation text-3xl text-rose-500"></i>
              <p className="text-sm font-bold text-slate-700">{error}</p>
              <button
                onClick={() => void loadReports(range)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* RESUMEN */}
              {activeTab === 'summary' && summary && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <KpiCard
                      label="Ingresos"
                      value={money(summary.income.total)}
                      hint={`Renta ${money(summary.income.renta)} · Abonos ${money(summary.income.abonos)}`}
                      icon="fa-arrow-trend-up"
                      tone="emerald"
                    />
                    <KpiCard
                      label="Gastos"
                      value={money(summary.expenses.total)}
                      hint={`${summary.expenses.byType.length} tipos de gasto`}
                      icon="fa-arrow-trend-down"
                      tone="rose"
                    />
                    <KpiCard
                      label="Utilidad neta"
                      value={money(summary.net)}
                      hint={`Margen ${percent(summary.marginPct)}`}
                      icon="fa-scale-balanced"
                      tone={summary.net >= 0 ? 'emerald' : 'rose'}
                    />
                    <KpiCard
                      label="Renta esperada"
                      value={money(summary.expectedRent)}
                      hint={`Recaudo ${percent(summary.collectionRatePct)} · ${summary.weeks} semanas`}
                      icon="fa-file-invoice-dollar"
                      tone="indigo"
                    />
                    <KpiCard
                      label="Deuda pendiente"
                      value={money(summary.pendingDebt)}
                      hint="Cartera total en mora"
                      icon="fa-hand-holding-dollar"
                      tone="amber"
                    />
                    <KpiCard
                      label="Flota"
                      value={`${summary.vehicles.assigned}/${summary.vehicles.total}`}
                      hint={`${summary.vehicles.idle} vehículo(s) sin asignar`}
                      icon="fa-car-side"
                      tone="slate"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AmountBreakdown
                      title="Composición de ingresos"
                      icon="fa-vault"
                      total={summary.income.total}
                      items={[
                        { label: 'Renta', value: summary.income.renta, color: 'bg-emerald-500' },
                        { label: 'Abonos a deuda', value: summary.income.abonos, color: 'bg-blue-500' },
                        { label: 'Otros ingresos', value: summary.income.other, color: 'bg-slate-400' }
                      ]}
                    />
                    <AmountBreakdown
                      title="Gastos por tipo"
                      icon="fa-file-invoice-dollar"
                      total={summary.expenses.total}
                      items={summary.expenses.byType.map((item) => ({
                        label: EXPENSE_TYPE_LABELS[item.type] || item.type,
                        value: item.amount,
                        color: EXPENSE_TYPE_COLORS[item.type] || 'bg-slate-400'
                      }))}
                    />
                  </div>
                </div>
              )}

              {/* VEHÍCULOS */}
              {activeTab === 'vehicles' && vehicles && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-chart-column text-indigo-500"></i>
                        Ingresos vs. gastos por vehículo
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 hidden sm:block">
                        {vehicles.range.label}
                      </span>
                    </div>

                    {vehicleChartData.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-6 text-center">
                        No hay vehículos registrados.
                      </p>
                    ) : (
                      <div className="w-full" style={{ height: Math.max(260, vehicleChartData.length * 46) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={vehicleChartData}
                            layout="vertical"
                            margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
                            barGap={2}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis
                              type="number"
                              tickFormatter={(value: any) => compactMoney(Number(value))}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={68}
                              tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              formatter={(value: any) => money(Number(value))}
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                            <Bar dataKey="Ingresos" fill="#10b981" radius={[0, 6, 6, 0]} />
                            <Bar dataKey="Gastos" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-ranking-star text-indigo-500"></i>
                        Ranking por utilidad neta
                      </h3>
                      {vehiclesByNet[0] && (
                        <span className="text-[10px] font-bold text-slate-400">
                          Mayor gasto: {[...vehicles.vehicles].sort((a, b) => a.rankByExpense - b.rankByExpense)[0]?.licensePlate || '—'}
                        </span>
                      )}
                    </div>

                    <ResponsiveTable
                      data={vehiclesByNet}
                      loading={loading}
                      emptyMessage="Sin datos de vehículos en el periodo."
                      mobileCardRender={(vehicle: VehicleProfitabilityRow) => (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                            <div>
                              <div className="font-black text-indigo-600 font-mono text-sm uppercase">
                                {vehicle.licensePlate}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {vehicle.model} · {vehicle.driverName || 'Sin asignar'}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                                vehicle.net >= 0
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}
                            >
                              #{vehicle.rankByNet} · {money(vehicle.net)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Ingresos</span>
                              <span className="font-bold text-emerald-600">{money(vehicle.income.total)}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Gastos</span>
                              <span className="font-bold text-rose-600">{money(vehicle.expenses.total)}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Margen</span>
                              <span className="font-bold text-slate-700">{percent(vehicle.marginPct)}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Costo/km</span>
                              <span className="font-bold text-slate-700">
                                {vehicle.costPerKm !== null ? money(vehicle.costPerKm) : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Km</span>
                              <span className="font-bold text-slate-700">
                                {vehicle.km.toLocaleString('es-CO')}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Semanas</span>
                              <span className="font-bold text-slate-700">
                                {vehicle.assignedWeeks}/{vehicle.assignedWeeks + vehicle.idleWeeks}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      columns={[
                        {
                          key: 'rankByNet',
                          label: 'Ranking',
                          render: (rank: number, vehicle: VehicleProfitabilityRow) => (
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                  rank === 1
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                #{rank}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                Gasto #{vehicle.rankByExpense}
                              </span>
                            </div>
                          )
                        },
                        {
                          key: 'licensePlate',
                          label: 'Vehículo',
                          render: (plate: string, vehicle: VehicleProfitabilityRow) => (
                            <div>
                              <div className="font-black text-indigo-600 font-mono uppercase text-xs">
                                {plate}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {vehicle.model} · {vehicle.year}
                              </div>
                            </div>
                          )
                        },
                        {
                          key: 'driverName',
                          label: 'Conductor',
                          render: (driverName: string | null) =>
                            driverName ? (
                              <span className="text-xs font-bold text-slate-700">{driverName}</span>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">Sin asignar</span>
                            )
                        },
                        {
                          key: 'income',
                          label: 'Ingresos',
                          className: 'text-right',
                          render: (income: VehicleProfitabilityRow['income']) => (
                            <span className="text-xs font-black text-emerald-600">{money(income.total)}</span>
                          )
                        },
                        {
                          key: 'expenses',
                          label: 'Gastos',
                          className: 'text-right',
                          render: (expenses: VehicleProfitabilityRow['expenses']) => (
                            <span className="text-xs font-black text-rose-600">{money(expenses.total)}</span>
                          )
                        },
                        {
                          key: 'net',
                          label: 'Utilidad',
                          className: 'text-right',
                          render: (net: number) => (
                            <span
                              className={`text-xs font-black ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                            >
                              {money(net)}
                            </span>
                          )
                        },
                        {
                          key: 'marginPct',
                          label: 'Margen',
                          className: 'text-right',
                          render: (margin: number) => (
                            <span className="text-xs font-bold text-slate-600">{percent(margin)}</span>
                          )
                        },
                        {
                          key: 'km',
                          label: 'Km',
                          className: 'text-right',
                          render: (km: number) => (
                            <span className="text-xs font-bold text-slate-600">
                              {km.toLocaleString('es-CO')}
                            </span>
                          )
                        },
                        {
                          key: 'costPerKm',
                          label: 'Costo/km',
                          className: 'text-right',
                          render: (cost: number | null) => (
                            <span className="text-xs font-bold text-slate-600">
                              {cost !== null ? money(cost) : '—'}
                            </span>
                          )
                        },
                        {
                          key: 'idleWeeks',
                          label: 'Semanas',
                          className: 'text-right',
                          render: (_: number, vehicle: VehicleProfitabilityRow) => (
                            <div className="text-[10px] font-bold">
                              <span className="text-emerald-600">{vehicle.assignedWeeks} asignadas</span>
                              {vehicle.idleWeeks > 0 && (
                                <span className="block text-amber-600">{vehicle.idleWeeks} ociosas</span>
                              )}
                            </div>
                          )
                        }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* CONDUCTORES */}
              {activeTab === 'drivers' && drivers && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-500">
                      {drivers.drivers.length} conductor(es) con actividad
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border ${
                        driversInRisk > 0
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}
                    >
                      {driversInRisk} en riesgo
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-500">
                      {drivers.weeks.length} semanas
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-id-card-clip text-indigo-500"></i>
                        Comportamiento de pago por conductor
                      </h3>
                    </div>

                    <ResponsiveTable
                      data={drivers.drivers}
                      loading={loading}
                      emptyMessage="Sin conductores con actividad en el periodo."
                      mobileCardRender={(driver: DriverBehaviorRow) => (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{driver.driverName}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase">
                                {driver.vehiclePlates.length ? driver.vehiclePlates.join(', ') : 'Sin vehículo'}
                              </div>
                            </div>
                            <ScoreBadge label={driver.label} score={driver.score} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Cumplimiento</span>
                              <span className="font-bold text-slate-700">{percent(driver.compliancePct)}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Semanas</span>
                              <span className="font-bold text-slate-700">
                                {driver.weeks.full}/{driver.weeks.total} completas
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Abonos</span>
                              <span className="font-bold text-blue-600">{money(driver.arrearPayments.amount)}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400 font-black uppercase text-[9px]">Deuda</span>
                              <span className="font-bold text-rose-600">{money(driver.currentPendingDebt)}</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Semanas
                            </div>
                            <WeekGrid weeks={driver.weekDetails} />
                          </div>
                        </div>
                      )}
                      columns={[
                        {
                          key: 'driverName',
                          label: 'Conductor',
                          render: (name: string, driver: DriverBehaviorRow) => (
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                {name}
                                {!driver.active && (
                                  <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                                    INACTIVO
                                  </span>
                                )}
                              </div>
                              {driver.unpaidStreak > 0 && (
                                <div className="text-[10px] font-bold text-rose-500 mt-0.5">
                                  {driver.unpaidStreak} semana(s) sin pago consecutiva(s)
                                </div>
                              )}
                            </div>
                          )
                        },
                        {
                          key: 'vehiclePlates',
                          label: 'Vehículos',
                          render: (plates: string[]) =>
                            plates.length ? (
                              <div className="flex flex-wrap gap-1">
                                {plates.map((plate) => (
                                  <span
                                    key={plate}
                                    className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-1 rounded border border-indigo-100 uppercase"
                                  >
                                    {plate}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">—</span>
                            )
                        },
                        {
                          key: 'score',
                          label: 'Puntaje',
                          render: (score: number, driver: DriverBehaviorRow) => (
                            <ScoreBadge label={driver.label} score={score} />
                          )
                        },
                        {
                          key: 'compliancePct',
                          label: 'Cumplimiento',
                          render: (value: number, driver: DriverBehaviorRow) => (
                            <div>
                              <div className="text-xs font-black text-slate-700">{percent(value)}</div>
                              <div className="text-[9px] font-bold text-slate-400">
                                {money(driver.rentaPaid)} / {money(driver.expected)}
                              </div>
                            </div>
                          )
                        },
                        {
                          key: 'weeks',
                          label: 'Semanas',
                          render: (weeks: DriverBehaviorRow['weeks']) => (
                            <div className="text-[10px] font-bold space-y-0.5">
                              <div className="text-emerald-600">{weeks.full} completas</div>
                              <div className="text-amber-600">{weeks.partial} parciales</div>
                              <div className="text-rose-600">{weeks.unpaid} sin pago</div>
                            </div>
                          )
                        },
                        {
                          key: 'arrearPayments',
                          label: 'Abonos',
                          render: (arrears: DriverBehaviorRow['arrearPayments']) => (
                            <div>
                              <div className="text-xs font-black text-blue-600">{money(arrears.amount)}</div>
                              <div className="text-[9px] font-bold text-slate-400">
                                {arrears.count} abono(s)
                              </div>
                            </div>
                          )
                        },
                        {
                          key: 'currentPendingDebt',
                          label: 'Deuda pendiente',
                          render: (debt: number, driver: DriverBehaviorRow) => (
                            <div>
                              <div className="text-xs font-black text-rose-600">{money(debt)}</div>
                              <div className="text-[9px] font-bold text-slate-400">
                                Generada: {money(driver.arrearsGenerated)}
                              </div>
                            </div>
                          )
                        },
                        {
                          key: 'weekDetails',
                          label: 'Detalle semanal',
                          render: (weekDetails: DriverBehaviorRow['weekDetails']) => (
                            <WeekGrid weeks={weekDetails} />
                          )
                        }
                      ]}
                    />

                    <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500"></span> Completa
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-400"></span> Parcial
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-rose-500"></span> Sin pago
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MANTENIMIENTO */}
              {activeTab === 'maintenance' && maintenance && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <KpiCard
                      label="Gasto mantenimiento"
                      value={money(maintenance.fleet.totalSpend)}
                      hint={`${maintenance.fleet.expenseCount} evento(s)`}
                      icon="fa-screwdriver-wrench"
                      tone="rose"
                    />
                    <KpiCard
                      label="Costo por semana"
                      value={
                        maintenance.fleet.spendPerWeek !== null
                          ? money(maintenance.fleet.spendPerWeek)
                          : '—'
                      }
                      hint={`${maintenance.fleet.assignedWeeks} semanas asignadas`}
                      icon="fa-calendar-week"
                      tone="indigo"
                    />
                    <KpiCard
                      label="Costo por km"
                      value={
                        maintenance.fleet.spendPerKm !== null ? money(maintenance.fleet.spendPerKm) : '—'
                      }
                      hint={`${maintenance.fleet.km.toLocaleString('es-CO')} km registrados`}
                      icon="fa-gauge-high"
                      tone="amber"
                    />
                    <KpiCard
                      label="Reparaciones repetidas"
                      value={String(repeatedRepairs.length)}
                      hint="Componentes con 2+ eventos"
                      icon="fa-rotate"
                      tone="slate"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-chart-simple text-indigo-500"></i>
                        Componentes con mayor gasto
                      </h3>

                      {componentChartData.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium py-8 text-center">
                          Aún no hay gastos clasificados por componente. Clasifica los gastos de
                          reparación, repuesto y mantenimiento para ver este análisis.
                        </p>
                      ) : (
                        <div
                          className="w-full"
                          style={{ height: Math.max(220, componentChartData.length * 38) }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={componentChartData}
                              layout="vertical"
                              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                              <XAxis
                                type="number"
                                tickFormatter={(value: any) => compactMoney(Number(value))}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                formatter={(value: any, name: any) =>
                                  name === 'Eventos' ? `${value} evento(s)` : money(Number(value))
                                }
                                contentStyle={{
                                  borderRadius: 12,
                                  border: '1px solid #e2e8f0',
                                  fontSize: 12,
                                  fontWeight: 600
                                }}
                              />
                              <Bar dataKey="Monto" fill="#6366f1" radius={[0, 6, 6, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <i className="fa-solid fa-boxes-stacked text-indigo-500"></i>
                        Repuestos más consumidos
                      </h3>

                      {maintenance.fleet.topDescriptions.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium py-4">
                          Sin descripciones registradas en el periodo.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {maintenance.fleet.topDescriptions.map((description) => (
                            <div
                              key={description.description}
                              className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-700 truncate">
                                  {titleCase(description.description)}
                                </div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                  {description.count} evento(s)
                                </div>
                              </div>
                              <span className="text-[11px] font-black text-slate-700 whitespace-nowrap">
                                {money(description.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-rotate text-indigo-500"></i>
                        Reparaciones repetidas por vehículo
                      </h3>
                    </div>

                    <ResponsiveTable
                      data={repeatedRepairs}
                      loading={loading}
                      emptyMessage="No se detectaron componentes repetidos en el periodo."
                      columns={[
                        {
                          key: 'licensePlate',
                          label: 'Vehículo',
                          render: (plate: string) => (
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                              {plate}
                            </span>
                          )
                        },
                        {
                          key: 'component',
                          label: 'Componente',
                          render: (component: string) => (
                            <span className="text-xs font-bold text-slate-700">
                              {expenseComponentLabel(component)}
                            </span>
                          )
                        },
                        {
                          key: 'count',
                          label: 'Veces',
                          render: (count: number, repair: any) => (
                            <div>
                              <div className="text-xs font-black text-rose-600">{count}</div>
                              <div className="text-[9px] font-bold text-slate-400">
                                {money(repair.amount)}
                              </div>
                            </div>
                          )
                        },
                        {
                          key: 'daysBetween',
                          label: 'Días entre eventos',
                          render: (days: number) => (
                            <span className="text-xs font-bold text-slate-600">{days} días</span>
                          )
                        },
                        {
                          key: 'kmBetween',
                          label: 'Km entre eventos',
                          render: (km: number | null) => (
                            <span className="text-xs font-bold text-slate-600">
                              {km !== null ? `${km.toLocaleString('es-CO')} km` : '—'}
                            </span>
                          )
                        },
                        {
                          key: 'lastDate',
                          label: 'Último evento',
                          render: (date: string) => (
                            <span className="text-[10px] font-mono text-slate-500">
                              {formatDateToDisplay(date.slice(0, 10))}
                            </span>
                          )
                        }
                      ]}
                    />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-user-gear text-indigo-500"></i>
                        Desgaste atribuido por conductor
                      </h3>
                    </div>

                    <ResponsiveTable
                      data={maintenance.drivers}
                      loading={loading}
                      emptyMessage="Sin datos de desgaste por conductor en el periodo."
                      columns={[
                        {
                          key: 'driverName',
                          label: 'Conductor',
                          render: (name: string) => (
                            <span className="text-xs font-bold text-slate-800">{name}</span>
                          )
                        },
                        {
                          key: 'weeksAssigned',
                          label: 'Semanas',
                          render: (weeks: number) => (
                            <span className="text-xs font-bold text-slate-600">{weeks}</span>
                          )
                        },
                        {
                          key: 'km',
                          label: 'Km',
                          render: (km: number) => (
                            <span className="text-xs font-bold text-slate-600">
                              {km.toLocaleString('es-CO')}
                            </span>
                          )
                        },
                        {
                          key: 'totalSpend',
                          label: 'Gasto mantenimiento',
                          render: (spend: number) => (
                            <span className="text-xs font-black text-rose-600">{money(spend)}</span>
                          )
                        },
                        {
                          key: 'spendPerWeek',
                          label: 'Por semana',
                          render: (spend: number | null) => (
                            <span className="text-xs font-bold text-slate-600">
                              {spend !== null ? money(spend) : '—'}
                            </span>
                          )
                        },
                        {
                          key: 'spendPerKm',
                          label: 'Por km',
                          render: (spend: number | null) => (
                            <span className="text-xs font-bold text-slate-600">
                              {spend !== null ? money(spend) : '—'}
                            </span>
                          )
                        },
                        {
                          key: 'wearIndex',
                          label: 'Desgaste',
                          render: (index: number | null, driver: any) => (
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${
                                  WEAR_STYLE[driver.wearLabel] || WEAR_STYLE['Sin datos']
                                }`}
                              >
                                {driver.wearLabel}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {index !== null ? `${index.toFixed(2)}x` : '—'}
                              </span>
                            </div>
                          )
                        }
                      ]}
                    />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-table-list text-indigo-500"></i>
                        Gasto por vehículo y componente
                      </h3>
                    </div>

                    <ResponsiveTable
                      data={maintenance.vehicles}
                      loading={loading}
                      emptyMessage="Sin gastos de mantenimiento en el periodo."
                      mobileCardRender={(vehicle: MaintenanceVehicleRow) => (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="font-black text-indigo-600 font-mono text-sm uppercase">
                              {vehicle.licensePlate}
                            </div>
                            <span className="text-sm font-black text-rose-600">{money(vehicle.totalSpend)}</span>
                          </div>
                          <div className="flex justify-between gap-2 text-[10px] font-bold text-slate-500">
                            <span>{vehicle.expenseCount} evento(s)</span>
                            <span>{vehicle.repairCount} reparación(es)</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {vehicle.spendByComponent.map((component) => (
                              <span
                                key={component.component}
                                className="text-[9px] font-black bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-lg"
                              >
                                {expenseComponentLabel(component.component)} · {money(component.amount)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      columns={[
                        {
                          key: 'licensePlate',
                          label: 'Vehículo',
                          render: (plate: string) => (
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                              {plate}
                            </span>
                          )
                        },
                        {
                          key: 'expenseCount',
                          label: 'Eventos',
                          render: (count: number, vehicle: MaintenanceVehicleRow) => (
                            <div className="text-[10px] font-bold text-slate-600">
                              <div>{count} evento(s)</div>
                              <div className="text-rose-500">{vehicle.repairCount} reparación(es)</div>
                            </div>
                          )
                        },
                        {
                          key: 'spendByComponent',
                          label: 'Gasto por componente',
                          render: (components: MaintenanceVehicleRow['spendByComponent']) =>
                            components.length ? (
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {components.map((component) => (
                                  <span
                                    key={component.component}
                                    className="text-[9px] font-black bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-lg"
                                    title={`${component.count} evento(s)`}
                                  >
                                    {expenseComponentLabel(component.component)} · {money(component.amount)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">Sin clasificar</span>
                            )
                        },
                        {
                          key: 'totalSpend',
                          label: 'Total',
                          className: 'text-right',
                          render: (spend: number) => (
                            <span className="text-xs font-black text-rose-600">{money(spend)}</span>
                          )
                        }
                      ]}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
