import * as authRepo from '../auth/auth.repository.js';
import * as analytics from './analytics.service.js';
import { buildMonthlyReportPdf } from './report-pdf.service.js';

const PAID_PLAN_ERROR = 'Disponible en planes pagos';

const isSuperAdmin = (req: any) => req.user?.role === 'SUPERADMIN';

/** Gate de planes: free_trial → 403. SUPERADMIN siempre pasa. */
const ensurePaidPlan = async (req: any, res: any) => {
  if (isSuperAdmin(req)) return true;

  const plan = await authRepo.getUserPlan(req.user.userId);
  if (plan === 'free_trial') {
    res.status(403).json({ error: PAID_PLAN_ERROR });
    return false;
  }

  return true;
};

const queryString = (value: unknown) => (typeof value === 'string' ? value.trim() : undefined);

const resolveRange = (req: any, options: { defaultSixMonths?: boolean } = {}) => {
  const current = analytics.currentMonthBogota();
  const startDate = queryString(req.query.startDate);
  const endDate = queryString(req.query.endDate);

  if (options.defaultSixMonths && !startDate && !endDate) {
    const [year, month] = (current.month as string).split('-').map(Number);
    const sixMonthsAgo = new Date(Date.UTC(year, month - 6, 1));
    const start =
      `${sixMonthsAgo.getUTCFullYear()}-` +
      `${String(sixMonthsAgo.getUTCMonth() + 1).padStart(2, '0')}-01`;

    return analytics.bogotaRange(start, analytics.todayBogota());
  }

  return analytics.bogotaRange(
    startDate || current.startDate,
    endDate || current.endDate
  );
};

const handleError = (res: any, error: any, message: string) => {
  console.error(message, error);
  const status =
    error?.message?.includes('Formato de fecha') ||
    error?.message?.includes('startDate') ||
    error?.message?.includes('Formato de mes') ||
    error?.message?.includes('Mes inválido')
      ? 400
      : 500;

  res.status(status).json({ error: error?.message || message });
};

export const summary = async (req: any, res: any) => {
  try {
    if (!(await ensurePaidPlan(req, res))) return;

    const range = resolveRange(req);
    const data = await analytics.getFleetSummary(req.user.userId, range);
    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Error al generar el resumen de flota');
  }
};

export const vehicles = async (req: any, res: any) => {
  try {
    if (!(await ensurePaidPlan(req, res))) return;

    const range = resolveRange(req);
    const data = await analytics.getVehicleProfitability(req.user.userId, range);
    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Error al generar la rentabilidad por vehículo');
  }
};

export const drivers = async (req: any, res: any) => {
  try {
    if (!(await ensurePaidPlan(req, res))) return;

    const range = resolveRange(req);
    const data = await analytics.getDriverBehavior(req.user.userId, range);
    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Error al generar el comportamiento de conductores');
  }
};

export const maintenance = async (req: any, res: any) => {
  try {
    if (!(await ensurePaidPlan(req, res))) return;

    const range = resolveRange(req, { defaultSixMonths: true });
    const data = await analytics.getMaintenanceAnalysis(req.user.userId, range);
    res.json(data);
  } catch (error: any) {
    handleError(res, error, 'Error al generar el análisis de mantenimiento');
  }
};

export const monthlyPdf = async (req: any, res: any) => {
  try {
    if (!(await ensurePaidPlan(req, res))) return;

    const requestedMonth = queryString(req.query.month);
    const month = requestedMonth || analytics.previousMonthBogota().month!;
    const data = await analytics.getMonthlyReportData(req.user.userId, month);
    const pdf = await buildMonthlyReportPdf(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="FleetMaster-${month}.pdf"`
    );
    res.setHeader('Content-Length', String(pdf.length));
    res.status(200).end(pdf);
  } catch (error: any) {
    console.error('Error al generar el PDF mensual:', error);
    const status =
      error?.message?.includes('Formato de mes') || error?.message?.includes('Mes inválido') ? 400 : 500;
    res.status(status).json({ error: error?.message || 'Error al generar el PDF mensual' });
  }
};
