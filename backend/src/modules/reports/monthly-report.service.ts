import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../shared/db.js';
import * as emailService from '../../shared/email.service.js';
import * as authRepo from '../auth/auth.repository.js';
import { getMonthlyReportData, previousMonthBogota } from './analytics.service.js';
import { buildMonthlyReportPdf } from './report-pdf.service.js';

const REPORT_KIND = 'monthly';

export interface GenerateMonthlyReportsOptions {
  /** Envía solo a este email (útil para pruebas). */
  emailFilter?: string;
  /** Período YYYY-MM. Por defecto, mes anterior en Bogota. */
  month?: string;
  /** Genera PDF + HTML en backend/tmp sin enviar correos. */
  dryRun?: boolean;
  /** Ignora el registro de ReportRun y reenvía. */
  force?: boolean;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const safeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

export const generateAndSendMonthlyReports = async (
  options: GenerateMonthlyReportsOptions = {}
) => {
  const { emailFilter, month, dryRun = false, force = false } = options;
  const period = month || previousMonthBogota().month!;

  console.log('--- INICIANDO ENVÍO DE REPORTES MENSUALES DE FLOTA ---');
  console.log(`📅 Período: ${period}${dryRun ? ' (DRY RUN)' : ''}`);

  const users = await prisma.user.findMany({
    where: {
      role: 'USER',
      ...(emailFilter ? { email: emailFilter } : {}),
      vehicles: { some: { deletedAt: null } },
    },
    select: { id: true, username: true, email: true },
  });

  if (users.length === 0) {
    console.log('ℹ️  No hay usuarios con vehículos para el reporte mensual.');
    console.log('--- PROCESO DE REPORTES MENSUALES FINALIZADO ---');
    return;
  }

  const tmpDir = path.join(process.cwd(), 'backend', 'tmp');

  for (const user of users) {
    try {
      const plan = await authRepo.getUserPlan(user.id);
      if (plan === 'free_trial') {
        console.log(`⏭️  ${user.email}: plan free_trial, sin reporte.`);
        continue;
      }

      const existingRun = await prisma.reportRun.findUnique({
        where: {
          userId_period_kind: { userId: user.id, period, kind: REPORT_KIND },
        },
      });

      if (existingRun && !force) {
        console.log(`⏭️  ${user.email}: reporte ${period} ya enviado (${existingRun.sentAt.toISOString()}).`);
        continue;
      }

      const data = await getMonthlyReportData(user.id, period);
      const pdf = await buildMonthlyReportPdf(data);

      const topProfitableVehicles = [...data.vehicles]
        .sort((a, b) => b.net - a.net)
        .slice(0, 3)
        .map((vehicle) => ({
          licensePlate: vehicle.licensePlate,
          driverName: vehicle.driverName,
          income: vehicle.income.total,
          expenses: vehicle.expenses.total,
          net: vehicle.net,
        }));

      const topCostlyVehicles = [...data.vehicles]
        .sort((a, b) => b.expenses.total - a.expenses.total)
        .slice(0, 3)
        .map((vehicle) => ({
          licensePlate: vehicle.licensePlate,
          driverName: vehicle.driverName,
          income: vehicle.income.total,
          expenses: vehicle.expenses.total,
          net: vehicle.net,
        }));

      const riskDrivers = data.drivers
        .filter((driver) => driver.label === 'Riesgo')
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map((driver) => ({
          driverName: driver.driverName,
          score: driver.score,
          label: driver.label,
          currentPendingDebt: driver.currentPendingDebt,
          weeksUnpaid: driver.weeks.unpaid,
        }));

      const repeatedRepairs = data.maintenance.vehicles
        .flatMap((vehicle) =>
          vehicle.repeatedComponents.map((repair) => ({
            licensePlate: vehicle.licensePlate,
            component: repair.component,
            count: repair.count,
          }))
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const html = emailService.templates.monthlyFleetReport({
        username: user.username,
        monthName: data.monthName,
        summary: data.summary,
        topProfitableVehicles,
        topCostlyVehicles,
        riskDrivers,
        repeatedRepairs,
      });

      if (dryRun) {
        await fs.mkdir(tmpDir, { recursive: true });
        const base = `FleetMaster-${period}-${safeFilename(user.email)}`;
        const pdfPath = path.join(tmpDir, `${base}.pdf`);
        const htmlPath = path.join(tmpDir, `${base}.html`);
        await fs.writeFile(pdfPath, pdf);
        await fs.writeFile(htmlPath, html, 'utf8');
        console.log(`🧪 ${user.email}: preview generado en ${pdfPath} y ${htmlPath}`);
        continue;
      }

      const sent = await emailService.sendEmail({
        to: user.email,
        subject: `📋 Extracto Mensual de Flota – ${capitalize(data.monthName)} | FleetMaster Hub`,
        html,
        attachments: [
          {
            filename: `FleetMaster-${period}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });

      if (!sent) {
        console.error(`❌ ${user.email}: el envío falló, no se registra ReportRun.`);
        continue;
      }

      await prisma.reportRun.upsert({
        where: {
          userId_period_kind: { userId: user.id, period, kind: REPORT_KIND },
        },
        update: { sentAt: new Date() },
        create: {
          userId: user.id,
          period,
          kind: REPORT_KIND,
        },
      });

      console.log(`✅ Reporte mensual enviado a: ${user.email}`);
    } catch (err) {
      console.error(`❌ Error enviando reporte mensual a ${user.email}:`, err);
    }
  }

  console.log('--- PROCESO DE REPORTES MENSUALES FINALIZADO ---');
};
