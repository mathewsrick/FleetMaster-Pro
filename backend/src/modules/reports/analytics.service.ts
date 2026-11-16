import { prisma } from '../../shared/db.js';

/**
 * Reportes analíticos de flota y conductores.
 *
 * Todas las fechas se calculan con límites de America/Bogota (UTC-5, sin DST).
 * Las semanas de cobro van de martes a lunes (Bogota): cada cuota se paga el martes.
 */

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAINTENANCE_TYPES = ['reparacion', 'repuesto', 'mantenimiento'] as const;

export interface AnalyticsRange {
  /** Inicio inclusivo (instante UTC que corresponde a 00:00 Bogota). */
  start: Date;
  /** Fin exclusivo (instante UTC que corresponde a 00:00 Bogota del día siguiente). */
  end: Date;
}

export interface RangeInfo extends AnalyticsRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD inclusivo
  label: string;
  month?: string; // YYYY-MM solo para rangos mensuales
}

const pad = (value: number) => String(value).padStart(2, '0');

const toBogotaShifted = (date: Date) => new Date(date.getTime() - BOGOTA_OFFSET_MS);

/** Construye un instante UTC a partir de una fecha/hora local de Bogota. */
const fromBogota = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day, 0, 0, 0, 0) + BOGOTA_OFFSET_MS);

const shiftDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export const bogotaMidnight = (date: Date) => {
  const local = toBogotaShifted(date);
  return fromBogota(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
};

export const bogotaMonthKey = (date: Date) => {
  const local = toBogotaShifted(date);
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}`;
};

/** Fecha actual en Bogota como YYYY-MM-DD. */
export const todayBogota = () => {
  const local = toBogotaShifted(new Date());
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
};

const formatBogotaDate = (date: Date) =>
  date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

const isDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00-05:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const isMonthString = (value: string) => /^\d{4}-\d{2}$/.test(value);

const buildRange = (startDate: string, endDate: string): RangeInfo => {
  const start = new Date(`${startDate}T00:00:00-05:00`);
  const end = new Date(`${endDate}T00:00:00-05:00`);
  const endExclusive = shiftDays(end, 1);

  return {
    start,
    end: endExclusive,
    startDate,
    endDate,
    label: `${formatBogotaDate(start)} – ${formatBogotaDate(shiftDays(endExclusive, -1))}`,
  };
};

/** Rango inclusivo por días (YYYY-MM-DD), interpretado en Bogota. */
export const bogotaRange = (startDate: string, endDate: string): RangeInfo => {
  if (!isDateString(startDate) || !isDateString(endDate)) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
  }
  if (startDate > endDate) {
    throw new Error('startDate no puede ser posterior a endDate');
  }
  return buildRange(startDate, endDate);
};

/** Primer y último día del mes actual (Bogota). */
export const currentMonthBogota = (): RangeInfo => {
  const local = toBogotaShifted(new Date());
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const startDate = `${year}-${pad(month + 1)}-01`;
  const endDate = `${year}-${pad(month + 1)}-${pad(new Date(Date.UTC(year, month + 1, 0)).getUTCDate())}`;
  return { ...buildRange(startDate, endDate), month: `${year}-${pad(month + 1)}` };
};

/** Mes anterior completo (Bogota). */
export const previousMonthBogota = (): RangeInfo => {
  const local = toBogotaShifted(new Date());
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const prev = new Date(Date.UTC(year, month - 1, 1));
  const prevYear = prev.getUTCFullYear();
  const prevMonth = prev.getUTCMonth();
  const startDate = `${prevYear}-${pad(prevMonth + 1)}-01`;
  const endDate = `${prevYear}-${pad(prevMonth + 1)}-${pad(new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate())}`;
  return { ...buildRange(startDate, endDate), month: `${prevYear}-${pad(prevMonth + 1)}` };
};

/** Convierte YYYY-MM en un rango mensual Bogota. */
export const monthRangeBogota = (month: string): RangeInfo => {
  if (!isMonthString(month)) {
    throw new Error('Formato de mes inválido. Use YYYY-MM');
  }
  const [year, monthNumber] = month.split('-').map(Number);
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error('Mes inválido. Use YYYY-MM');
  }
  const startDate = `${year}-${pad(monthNumber)}-01`;
  const endDate = `${year}-${pad(monthNumber)}-${pad(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate())}`;
  return { ...buildRange(startDate, endDate), month };
};

/**
 * Martes 00:00 Bogota de la semana de cobro que contiene la fecha.
 * La semana de cobro va del martes al lunes siguiente.
 * Un pago cuenta para el martes más reciente ≤ fecha del pago
 * (un pago tardío de miércoles a lunes abona a esa misma cuota).
 */
export const bogotaWeekAnchor = (date: Date): Date => {
  const local = toBogotaShifted(date);
  const dow = local.getUTCDay(); // 0 = domingo
  const diff = (dow - 2 + 7) % 7;
  return fromBogota(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - diff);
};

/**
 * Lista las semanas de cobro del rango: solo las que tienen su martes dentro
 * del rango y que ya llegaron (martes ≤ hoy en Bogota). Las semanas futuras no
 * cuentan como esperado ni como "sin pago".
 */
export const listWeeks = (range: AnalyticsRange) => {
  const weeks: Array<{ start: Date; end: Date; label: string }> = [];
  const today = bogotaMidnight(new Date());
  let cursor = bogotaWeekAnchor(range.start);

  // Solo semanas cuyo martes cae dentro del rango (evita contar dos veces
  // las semanas parciales de los extremos del mes).
  if (cursor < range.start) cursor = shiftDays(cursor, 7);

  while (cursor < range.end) {
    if (cursor > today) break;
    const end = shiftDays(cursor, 7);
    weeks.push({
      start: cursor,
      end,
      label: `${formatBogotaDate(cursor)} – ${formatBogotaDate(shiftDays(end, -1))}`,
    });
    cursor = end;
  }

  return weeks;
};

const overlaps = (startedAt: Date, endedAt: Date | null, start: Date, end: Date) =>
  startedAt < end && (!endedAt || endedAt > start);

const countAssignmentWeeks = (
  startedAt: Date,
  endedAt: Date | null,
  weeks: Array<{ start: Date; end: Date }>
) => weeks.filter((week) => overlaps(startedAt, endedAt, week.start, week.end)).length;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toNumber = (value: unknown) => Number(value || 0);

const rangeJson = (range: RangeInfo) => ({
  startDate: range.startDate,
  endDate: range.endDate,
  start: range.start.toISOString(),
  endExclusive: range.end.toISOString(),
  label: range.label,
  ...(range.month ? { month: range.month } : {}),
});

const driverName = (driver: { firstName: string; lastName: string } | null | undefined) =>
  driver ? `${driver.firstName} ${driver.lastName}`.trim() : null;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreLabel = (score: number) => {
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Riesgo';
};

const wearLabel = (index: number | null) => {
  if (index === null) return 'Sin datos';
  if (index <= 0.8) return 'Bajo';
  if (index <= 1.2) return 'Normal';
  if (index <= 1.5) return 'Alto';
  return 'Muy alto';
};

const buildDriverScore = (
  compliancePct: number,
  weeksUnpaid: number,
  weeksTotal: number,
  debtPaid: number,
  arrearsGenerated: number
) => {
  const complianceScore = Math.min(100, compliancePct) * 0.6;
  const unpaidScore = weeksTotal > 0 ? (1 - weeksUnpaid / weeksTotal) * 100 * 0.25 : 0;
  const debtTrend =
    arrearsGenerated <= 0
      ? 100
      : Math.max(0, Math.min(100, (debtPaid / arrearsGenerated) * 100));
  const score = Math.round(complianceScore + unpaidScore + debtTrend * 0.15);
  return { score, label: scoreLabel(score) };
};

/* ------------------------------------------------------------------ */
/* 1. Resumen de flota                                                */
/* ------------------------------------------------------------------ */

export const getFleetSummary = async (userId: string, range: RangeInfo) => {
  const [incomeGroups, expenseGroups, vehicles, assignments, debtAgg] = await Promise.all([
    prisma.payment.groupBy({
      by: ['type'],
      where: { userId, date: { gte: range.start, lt: range.end } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['type'],
      where: { userId, date: { gte: range.start, lt: range.end } },
      _sum: { amount: true },
    }),
    prisma.vehicle.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        licensePlate: true,
        rentaValue: true,
        driver: { select: { id: true } },
      },
    }),
    prisma.vehicleAssignment.findMany({
      where: {
        userId,
        startedAt: { lt: range.end },
        OR: [{ endedAt: null }, { endedAt: { gt: range.start } }],
      },
      select: { vehicleId: true, startedAt: true, endedAt: true },
    }),
    prisma.arrear.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amountOwed: true },
    }),
  ]);

  const incomeByType: Record<string, number> = { renta: 0, arrear_payment: 0, other: 0 };
  for (const group of incomeGroups) {
    incomeByType[group.type] = toNumber(group._sum.amount);
  }

  const expensesByType = expenseGroups
    .map((group) => ({ type: group.type, amount: round2(toNumber(group._sum.amount)) }))
    .sort((a, b) => b.amount - a.amount);

  const incomeTotal = round2(Object.values(incomeByType).reduce((sum, value) => sum + value, 0));
  const expensesTotal = round2(expensesByType.reduce((sum, item) => sum + item.amount, 0));
  const net = round2(incomeTotal - expensesTotal);
  const marginPct = incomeTotal > 0 ? round2((net / incomeTotal) * 100) : 0;

  const weeks = listWeeks(range);
  const rentaByVehicle = new Map(vehicles.map((vehicle) => [vehicle.id, toNumber(vehicle.rentaValue)]));

  const expectedRent = round2(
    assignments.reduce((sum, assignment) => {
      const weekly = rentaByVehicle.get(assignment.vehicleId) || 0;
      return sum + weekly * countAssignmentWeeks(assignment.startedAt, assignment.endedAt, weeks);
    }, 0)
  );

  const rentaIncome = incomeByType.renta;
  const collectionRatePct = expectedRent > 0 ? round2((rentaIncome / expectedRent) * 100) : 0;
  const assignedVehicles = vehicles.filter((vehicle) => vehicle.driver !== null).length;

  return {
    range: rangeJson(range),
    weeks: weeks.length,
    income: {
      total: incomeTotal,
      renta: round2(incomeByType.renta),
      abonos: round2(incomeByType.arrear_payment),
      other: round2(incomeByType.other),
    },
    expenses: {
      total: expensesTotal,
      byType: expensesByType,
    },
    net,
    marginPct,
    expectedRent,
    collectionRatePct,
    pendingDebt: round2(toNumber(debtAgg._sum.amountOwed)),
    vehicles: {
      total: vehicles.length,
      assigned: assignedVehicles,
      idle: vehicles.length - assignedVehicles,
    },
  };
};

/* ------------------------------------------------------------------ */
/* 2. Rentabilidad por vehículo                                       */
/* ------------------------------------------------------------------ */

export const getVehicleProfitability = async (userId: string, range: RangeInfo) => {
  const [vehicles, payments, expenses, mileageGroups, assignments] = await Promise.all([
    prisma.vehicle.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        licensePlate: true,
        model: true,
        year: true,
        rentaValue: true,
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { licensePlate: 'asc' },
    }),
    prisma.payment.groupBy({
      by: ['vehicleId', 'type'],
      where: { userId, date: { gte: range.start, lt: range.end } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['vehicleId', 'type'],
      where: { userId, date: { gte: range.start, lt: range.end } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['vehicleId'],
      where: {
        userId,
        date: { gte: range.start, lt: range.end },
        mileage: { not: null },
      },
      _min: { mileage: true },
      _max: { mileage: true },
    }),
    prisma.vehicleAssignment.findMany({
      where: {
        userId,
        startedAt: { lt: range.end },
        OR: [{ endedAt: null }, { endedAt: { gt: range.start } }],
      },
      select: { vehicleId: true, startedAt: true, endedAt: true },
    }),
  ]);

  const weeks = listWeeks(range);

  const incomeMap = new Map<string, Record<string, number>>();
  for (const group of payments) {
    const current = incomeMap.get(group.vehicleId) || { renta: 0, arrear_payment: 0, other: 0 };
    current[group.type] = toNumber(group._sum.amount);
    incomeMap.set(group.vehicleId, current);
  }

  const expenseMap = new Map<string, Array<{ type: string; amount: number }>>();
  for (const group of expenses) {
    const list = expenseMap.get(group.vehicleId) || [];
    list.push({ type: group.type, amount: round2(toNumber(group._sum.amount)) });
    expenseMap.set(group.vehicleId, list);
  }

  const mileageMap = new Map(
    mileageGroups.map((group) => [
      group.vehicleId,
      {
        min: group._min.mileage ?? null,
        max: group._max.mileage ?? null,
      },
    ])
  );

  const assignedWeeksMap = new Map<string, number>();
  for (const assignment of assignments) {
    const covered = countAssignmentWeeks(assignment.startedAt, assignment.endedAt, weeks);
    assignedWeeksMap.set(assignment.vehicleId, (assignedWeeksMap.get(assignment.vehicleId) || 0) + covered);
  }

  const rows = vehicles.map((vehicle) => {
    const income = incomeMap.get(vehicle.id) || { renta: 0, arrear_payment: 0, other: 0 };
    const incomeByType = {
      renta: round2(income.renta || 0),
      abonos: round2(income.arrear_payment || 0),
      other: round2(income.other || 0),
    };
    const incomeTotal = round2(incomeByType.renta + incomeByType.abonos + incomeByType.other);

    const expenseByType = (expenseMap.get(vehicle.id) || []).sort((a, b) => b.amount - a.amount);
    const expenseTotal = round2(expenseByType.reduce((sum, item) => sum + item.amount, 0));
    const net = round2(incomeTotal - expenseTotal);

    const mileage = mileageMap.get(vehicle.id);
    const km =
      mileage && mileage.min !== null && mileage.max !== null ? Math.max(0, mileage.max - mileage.min) : 0;

    const assignedWeeks = Math.min(weeks.length, assignedWeeksMap.get(vehicle.id) || 0);

    return {
      vehicleId: vehicle.id,
      licensePlate: vehicle.licensePlate,
      model: vehicle.model,
      year: vehicle.year,
      driverName: driverName(vehicle.driver),
      rentaValue: round2(toNumber(vehicle.rentaValue)),
      income: { total: incomeTotal, ...incomeByType },
      expenses: { total: expenseTotal, byType: expenseByType },
      net,
      marginPct: incomeTotal > 0 ? round2((net / incomeTotal) * 100) : 0,
      km,
      costPerKm: km > 0 ? round2(expenseTotal / km) : null,
      assignedWeeks,
      idleWeeks: Math.max(0, weeks.length - assignedWeeks),
      netNegative: net < 0,
      rankByExpense: 0,
      rankByNet: 0,
    };
  });

  [...rows]
    .sort((a, b) => b.expenses.total - a.expenses.total || a.licensePlate.localeCompare(b.licensePlate))
    .forEach((row, index) => {
      row.rankByExpense = index + 1;
    });

  [...rows]
    .sort((a, b) => b.net - a.net || a.licensePlate.localeCompare(b.licensePlate))
    .forEach((row, index) => {
      row.rankByNet = index + 1;
    });

  return {
    range: rangeJson(range),
    weeks: weeks.map((week) => ({
      startDate: formatBogotaDate(week.start),
      endDate: formatBogotaDate(shiftDays(week.end, -1)),
    })),
    vehicles: rows,
  };
};

/* ------------------------------------------------------------------ */
/* 3. Comportamiento de conductores                                   */
/* ------------------------------------------------------------------ */

export const getDriverBehavior = async (userId: string, range: RangeInfo) => {
  const [drivers, assignments, payments, arrearsInRange, pendingArrears] = await Promise.all([
    prisma.driver.findMany({
      where: { userId, deletedAt: null, vehicleId: { not: null } },
      select: { id: true, firstName: true, lastName: true, deletedAt: true },
    }),
    prisma.vehicleAssignment.findMany({
      where: {
        userId,
        startedAt: { lt: range.end },
        OR: [{ endedAt: null }, { endedAt: { gt: range.start } }],
      },
      select: {
        driverId: true,
        vehicleId: true,
        startedAt: true,
        endedAt: true,
        vehicle: { select: { licensePlate: true, rentaValue: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId, date: { gte: range.start, lt: range.end } },
      select: { driverId: true, vehicleId: true, type: true, amount: true, date: true },
    }),
    prisma.arrear.groupBy({
      by: ['driverId'],
      where: { userId, dueDate: { gte: range.start, lt: range.end } },
      _sum: { amountOwed: true },
      _count: { _all: true },
    }),
    prisma.arrear.groupBy({
      by: ['driverId'],
      where: { userId, status: 'pending' },
      _sum: { amountOwed: true },
    }),
  ]);

  const weeks = listWeeks(range);
  const paymentsByDriver = new Map<string, typeof payments>();
  for (const payment of payments) {
    const list = paymentsByDriver.get(payment.driverId) || [];
    list.push(payment);
    paymentsByDriver.set(payment.driverId, list);
  }

  const assignmentsByDriver = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const list = assignmentsByDriver.get(assignment.driverId) || [];
    list.push(assignment);
    assignmentsByDriver.set(assignment.driverId, list);
  }

  const arrearsRangeMap = new Map(
    arrearsInRange.map((group) => [group.driverId, group])
  );
  const pendingMap = new Map(pendingArrears.map((group) => [group.driverId, toNumber(group._sum.amountOwed)]));

  const rows = drivers
    .map((driver) => {
      const driverAssignments = assignmentsByDriver.get(driver.id) || [];
      const driverPayments = paymentsByDriver.get(driver.id) || [];
      const driverWeeks = weeks.filter((week) =>
        driverAssignments.some((assignment) =>
          overlaps(assignment.startedAt, assignment.endedAt, week.start, week.end)
        )
      );

      const weekDetails = driverWeeks.map((week) => {
        const expected = round2(
          driverAssignments
            .filter((assignment) => overlaps(assignment.startedAt, assignment.endedAt, week.start, week.end))
            .reduce((sum, assignment) => sum + toNumber(assignment.vehicle?.rentaValue), 0)
        );

        const paid = round2(
          driverPayments
            .filter(
              (payment) =>
                payment.type === 'renta' && payment.date >= week.start && payment.date < week.end
            )
            .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
        );

        let status: 'completa' | 'parcial' | 'sin_pago' = 'sin_pago';
        if (paid > 0 && paid >= expected) status = 'completa';
        else if (paid > 0) status = 'parcial';

        return {
          weekStart: formatBogotaDate(week.start),
          weekEnd: formatBogotaDate(shiftDays(week.end, -1)),
          expected,
          paid,
          balance: round2(paid - expected),
          status,
        };
      });

      const weeksFull = weekDetails.filter((week) => week.status === 'completa').length;
      const weeksPartial = weekDetails.filter((week) => week.status === 'parcial').length;
      const weeksUnpaid = weekDetails.filter((week) => week.status === 'sin_pago').length;
      const weeksTotal = weekDetails.length;

      const expected = round2(weekDetails.reduce((sum, week) => sum + week.expected, 0));
      const rentaPaid = round2(weekDetails.reduce((sum, week) => sum + week.paid, 0));
      const compliancePct = expected > 0 ? round2((rentaPaid / expected) * 100) : 0;

      const arrearPayments = driverPayments.filter((payment) => payment.type === 'arrear_payment');
      const debtPaid = round2(arrearPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0));
      const arrearsGenerated = round2(
        weekDetails.reduce((sum, week) => sum + Math.max(0, week.expected - week.paid), 0)
      );

      let unpaidStreak = 0;
      for (let i = weekDetails.length - 1; i >= 0; i -= 1) {
        if (weekDetails[i].status === 'sin_pago') unpaidStreak += 1;
        else break;
      }

      const { score, label } = buildDriverScore(
        compliancePct,
        weeksUnpaid,
        weeksTotal,
        debtPaid,
        arrearsGenerated
      );

      const plates = Array.from(
        new Set(
          driverAssignments
            .map((assignment) => assignment.vehicle?.licensePlate)
            .filter((plate): plate is string => Boolean(plate))
        )
      );

      const arrearsGroup = arrearsRangeMap.get(driver.id);

      return {
        driverId: driver.id,
        driverName: driverName(driver) || 'Conductor',
        active: driver.deletedAt === null,
        vehiclePlates: plates,
        expected,
        rentaPaid,
        compliancePct,
        weeks: {
          total: weeksTotal,
          full: weeksFull,
          partial: weeksPartial,
          unpaid: weeksUnpaid,
        },
        arrearPayments: {
          amount: debtPaid,
          count: arrearPayments.length,
        },
        arrearsGenerated,
        arrearsRecordedInPeriod: round2(toNumber(arrearsGroup?._sum.amountOwed)),
        arrearsRecordedCount: arrearsGroup?._count._all || 0,
        debtPaid,
        currentPendingDebt: round2(pendingMap.get(driver.id) || 0),
        unpaidStreak,
        score,
        label,
        weekDetails,
      };
    })
    .filter(
      (row) =>
        row.weeks.total > 0 ||
        row.arrearPayments.count > 0 ||
        row.currentPendingDebt > 0 ||
        row.expected > 0
    );

  return {
    range: rangeJson(range),
    weeks: weeks.map((week) => ({
      startDate: formatBogotaDate(week.start),
      endDate: formatBogotaDate(shiftDays(week.end, -1)),
    })),
    drivers: rows,
  };
};

/* ------------------------------------------------------------------ */
/* 4. Análisis de mantenimiento                                       */
/* ------------------------------------------------------------------ */

export const getMaintenanceAnalysis = async (userId: string, range: RangeInfo) => {
  const [expenses, assignments, vehicles, drivers] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        type: { in: [...MAINTENANCE_TYPES] },
        date: { gte: range.start, lt: range.end },
      },
      select: {
        id: true,
        vehicleId: true,
        type: true,
        component: true,
        description: true,
        amount: true,
        date: true,
        mileage: true,
      },
      orderBy: { date: 'asc' },
    }),
    prisma.vehicleAssignment.findMany({
      where: {
        userId,
        startedAt: { lt: range.end },
        OR: [{ endedAt: null }, { endedAt: { gt: range.start } }],
      },
      select: {
        driverId: true,
        vehicleId: true,
        startedAt: true,
        endedAt: true,
      },
    }),
    prisma.vehicle.findMany({
      where: { userId },
      select: { id: true, licensePlate: true },
    }),
    prisma.driver.findMany({
      where: { userId, deletedAt: null, vehicleId: { not: null } },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const weeks = listWeeks(range);
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));

  const componentMap = new Map<string, { component: string; count: number; amount: number }>();
  for (const expense of expenses) {
    if (!expense.component) continue;
    const current = componentMap.get(expense.component) || {
      component: expense.component,
      count: 0,
      amount: 0,
    };
    current.count += 1;
    current.amount = round2(current.amount + toNumber(expense.amount));
    componentMap.set(expense.component, current);
  }

  const topComponents = [...componentMap.values()].sort(
    (a, b) => b.count - a.count || b.amount - a.amount
  );

  const descriptionMap = new Map<string, { description: string; count: number; amount: number }>();
  for (const expense of expenses) {
    if (!expense.description) continue;
    const normalized = normalizeText(expense.description);
    if (!normalized) continue;
    const current = descriptionMap.get(normalized) || {
      description: normalized,
      count: 0,
      amount: 0,
    };
    current.count += 1;
    current.amount = round2(current.amount + toNumber(expense.amount));
    descriptionMap.set(normalized, current);
  }

  const topDescriptions = [...descriptionMap.values()]
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, 10);

  const totalMaintenanceSpend = round2(expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0));

  /* -------- Por vehículo -------- */

  const expensesByVehicle = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const list = expensesByVehicle.get(expense.vehicleId) || [];
    list.push(expense);
    expensesByVehicle.set(expense.vehicleId, list);
  }

  const vehicleRows = [...expensesByVehicle.entries()].map(([vehicleId, vehicleExpenses]) => {
    const spendByComponentMap = new Map<string, { component: string; count: number; amount: number }>();
    for (const expense of vehicleExpenses) {
      if (!expense.component) continue;
      const current = spendByComponentMap.get(expense.component) || {
        component: expense.component,
        count: 0,
        amount: 0,
      };
      current.count += 1;
      current.amount = round2(current.amount + toNumber(expense.amount));
      spendByComponentMap.set(expense.component, current);
    }

    const componentEvents = new Map<string, typeof vehicleExpenses>();
    for (const expense of vehicleExpenses) {
      if (!expense.component) continue;
      const list = componentEvents.get(expense.component) || [];
      list.push(expense);
      componentEvents.set(expense.component, list);
    }

    const repeatedComponents = [...componentEvents.entries()]
      .filter(([, list]) => list.length >= 2)
      .map(([component, list]) => {
        const sorted = [...list].sort((a, b) => a.date.getTime() - b.date.getTime());
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const firstMileage = sorted.find((item) => item.mileage !== null)?.mileage ?? null;
        const lastMileage = [...sorted].reverse().find((item) => item.mileage !== null)?.mileage ?? null;

        return {
          component,
          count: sorted.length,
          daysBetween: Math.max(
            0,
            Math.round((last.date.getTime() - first.date.getTime()) / DAY_MS)
          ),
          kmBetween:
            firstMileage !== null && lastMileage !== null ? Math.max(0, lastMileage - firstMileage) : null,
          firstDate: first.date.toISOString(),
          lastDate: last.date.toISOString(),
          amount: round2(sorted.reduce((sum, item) => sum + toNumber(item.amount), 0)),
        };
      })
      .sort((a, b) => b.count - a.count || b.amount - a.amount);

    return {
      vehicleId,
      licensePlate: vehicleMap.get(vehicleId)?.licensePlate || '—',
      repairCount: vehicleExpenses.filter((expense) => expense.type === 'reparacion').length,
      expenseCount: vehicleExpenses.length,
      totalSpend: round2(vehicleExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)),
      spendByComponent: [...spendByComponentMap.values()].sort(
        (a, b) => b.amount - a.amount || b.count - a.count
      ),
      repeatedComponents,
    };
  });

  vehicleRows.sort((a, b) => b.totalSpend - a.totalSpend || a.licensePlate.localeCompare(b.licensePlate));

  /* -------- Por conductor (atribución por histórico) -------- */

  const assignmentsByVehicle = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const list = assignmentsByVehicle.get(assignment.vehicleId) || [];
    list.push(assignment);
    assignmentsByVehicle.set(assignment.vehicleId, list);
  }
  for (const list of assignmentsByVehicle.values()) {
    list.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  const findAssignmentAt = (vehicleId: string, date: Date) => {
    const list = assignmentsByVehicle.get(vehicleId) || [];
    return (
      list.find(
        (assignment) =>
          assignment.startedAt <= date && (!assignment.endedAt || assignment.endedAt > date)
      ) || null
    );
  };

  const driverSpend = new Map<string, number>();
  const driverExpenses = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const assignment = findAssignmentAt(expense.vehicleId, expense.date);
    if (!assignment) continue;
    driverSpend.set(
      assignment.driverId,
      round2((driverSpend.get(assignment.driverId) || 0) + toNumber(expense.amount))
    );
    const list = driverExpenses.get(assignment.driverId) || [];
    list.push(expense);
    driverExpenses.set(assignment.driverId, list);
  }

  const driverWeekSets = new Map<string, Set<number>>();
  const driverKm = new Map<string, number>();
  for (const assignment of assignments) {
    const weekSet = driverWeekSets.get(assignment.driverId) || new Set<number>();
    for (const week of weeks) {
      if (overlaps(assignment.startedAt, assignment.endedAt, week.start, week.end)) {
        weekSet.add(week.start.getTime());
      }
    }
    driverWeekSets.set(assignment.driverId, weekSet);

    const assignmentStart = assignment.startedAt > range.start ? assignment.startedAt : range.start;
    const assignmentEnd = assignment.endedAt && assignment.endedAt < range.end ? assignment.endedAt : range.end;
    const mileages = expenses
      .filter(
        (expense) =>
          expense.vehicleId === assignment.vehicleId &&
          expense.mileage !== null &&
          expense.date >= assignmentStart &&
          expense.date < assignmentEnd
      )
      .map((expense) => expense.mileage as number);

    if (mileages.length > 0) {
      const km = Math.max(...mileages) - Math.min(...mileages);
      driverKm.set(assignment.driverId, (driverKm.get(assignment.driverId) || 0) + Math.max(0, km));
    }
  }

  const totalAssignedWeeks = [...driverWeekSets.values()].reduce((sum, set) => sum + set.size, 0);
  const totalKm = [...driverKm.values()].reduce((sum, km) => sum + km, 0);
  const fleetSpendPerWeek = totalAssignedWeeks > 0 ? round2(totalMaintenanceSpend / totalAssignedWeeks) : null;
  const fleetSpendPerKm = totalKm > 0 ? round2(totalMaintenanceSpend / totalKm) : null;

  const driverRows = [...new Set([...driverSpend.keys(), ...driverWeekSets.keys()])]
    .filter((driverId) => driverMap.has(driverId))
    .map((driverId) => {
      const weeksAssigned = driverWeekSets.get(driverId)?.size || 0;
      const km = driverKm.get(driverId) || 0;
      const spend = driverSpend.get(driverId) || 0;
      const spendPerWeek = weeksAssigned > 0 ? round2(spend / weeksAssigned) : null;
      const spendPerKm = km > 0 ? round2(spend / km) : null;

      let wearIndex: number | null = null;
      if (spendPerKm !== null && fleetSpendPerKm !== null && fleetSpendPerKm > 0) {
        wearIndex = round2(spendPerKm / fleetSpendPerKm);
      } else if (spendPerWeek !== null && fleetSpendPerWeek !== null && fleetSpendPerWeek > 0) {
        wearIndex = round2(spendPerWeek / fleetSpendPerWeek);
      }

      return {
        driverId,
        driverName: driverName(driverMap.get(driverId)) || 'Conductor',
        weeksAssigned,
        km,
        expenseCount: driverExpenses.get(driverId)?.length || 0,
        totalSpend: round2(spend),
        spendPerWeek,
        spendPerKm,
        wearIndex,
        wearLabel: wearLabel(wearIndex),
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);

  return {
    range: rangeJson(range),
    fleet: {
      totalSpend: totalMaintenanceSpend,
      expenseCount: expenses.length,
      assignedWeeks: totalAssignedWeeks,
      km: totalKm,
      spendPerWeek: fleetSpendPerWeek,
      spendPerKm: fleetSpendPerKm,
      topComponents,
      topDescriptions,
    },
    vehicles: vehicleRows,
    drivers: driverRows,
  };
};

/* ------------------------------------------------------------------ */
/* 5. Bundle para el reporte mensual (PDF + email)                    */
/* ------------------------------------------------------------------ */

export const getMonthlyReportData = async (userId: string, month: string) => {
  const range = monthRangeBogota(month);

  const [user, summary, profitability, behavior, maintenance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    }),
    getFleetSummary(userId, range),
    getVehicleProfitability(userId, range),
    getDriverBehavior(userId, range),
    getMaintenanceAnalysis(userId, range),
  ]);

  const payments = await prisma.payment.findMany({
    where: { userId, date: { gte: range.start, lt: range.end } },
    select: {
      id: true,
      date: true,
      type: true,
      amount: true,
      driverId: true,
      vehicle: { select: { licensePlate: true } },
    },
    orderBy: { date: 'asc' },
  });

  const drivers = await prisma.driver.findMany({
    where: { userId, deletedAt: null, vehicleId: { not: null } },
    select: { id: true, firstName: true, lastName: true },
  });
  const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));

  const paymentIds = payments.map((payment) => payment.id);
  const generatedArrears =
    paymentIds.length > 0
      ? await prisma.arrear.findMany({
          where: { userId, originPaymentId: { in: paymentIds } },
          select: { originPaymentId: true, amountOwed: true },
        })
      : [];

  const generatedByPayment = new Map<string, number>();
  for (const arrear of generatedArrears) {
    if (!arrear.originPaymentId) continue;
    generatedByPayment.set(
      arrear.originPaymentId,
      round2((generatedByPayment.get(arrear.originPaymentId) || 0) + toNumber(arrear.amountOwed))
    );
  }

  const paymentsByDriverMap = new Map<
    string,
    {
      driverId: string;
      driverName: string;
      total: number;
      renta: number;
      abonos: number;
      other: number;
      payments: Array<{
        id: string;
        date: string;
        type: string;
        amount: number;
        vehiclePlate: string;
        arrearGenerated: number;
      }>;
    }
  >();

  for (const payment of payments) {
    // Solo se detalla el pago por conductor de quienes tienen vehículo asignado.
    if (!driverMap.has(payment.driverId)) continue;

    const current = paymentsByDriverMap.get(payment.driverId) || {
      driverId: payment.driverId,
      driverName: driverName(driverMap.get(payment.driverId)) || 'Conductor',
      total: 0,
      renta: 0,
      abonos: 0,
      other: 0,
      payments: [],
    };

    const amount = round2(toNumber(payment.amount));
    current.total = round2(current.total + amount);
    if (payment.type === 'renta') current.renta = round2(current.renta + amount);
    else if (payment.type === 'arrear_payment') current.abonos = round2(current.abonos + amount);
    else current.other = round2(current.other + amount);

    current.payments.push({
      id: payment.id,
      date: payment.date.toISOString(),
      type: payment.type,
      amount,
      vehiclePlate: payment.vehicle?.licensePlate || '—',
      arrearGenerated: generatedByPayment.get(payment.id) || 0,
    });

    paymentsByDriverMap.set(payment.driverId, current);
  }

  const monthName = range.start.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

  return {
    user,
    month,
    monthName,
    range: rangeJson(range),
    summary,
    weeks: behavior.weeks,
    vehicles: profitability.vehicles,
    drivers: behavior.drivers,
    maintenance,
    paymentsByDriver: [...paymentsByDriverMap.values()].sort((a, b) =>
      a.driverName.localeCompare(b.driverName)
    ),
  };
};

export type MonthlyReportData = Awaited<ReturnType<typeof getMonthlyReportData>>;
export type FleetSummary = Awaited<ReturnType<typeof getFleetSummary>>;
export type VehicleProfitability = Awaited<ReturnType<typeof getVehicleProfitability>>;
export type DriverBehavior = Awaited<ReturnType<typeof getDriverBehavior>>;
export type MaintenanceAnalysis = Awaited<ReturnType<typeof getMaintenanceAnalysis>>;
