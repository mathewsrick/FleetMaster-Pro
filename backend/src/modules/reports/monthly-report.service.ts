import { prisma } from '../../shared/db.js';
import * as emailService from '../../shared/email.service.js';

/**
 * Devuelve el primer y último instante (UTC) del mes anterior.
 */
const getPreviousMonthRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 1);
  return { start, end };
};

export const generateAndSendMonthlyReports = async () => {
  console.log('--- INICIANDO ENVÍO DE REPORTES MENSUALES DE FLOTA ---');

  const { start, end } = getPreviousMonthRange();

  const monthName = start.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

  // Todos los usuarios con suscripción activa
  const users = await prisma.user.findMany({
    where: {
      subscriptions: {
        some: { status: 'active' },
      },
    },
  });

  for (const user of users) {
    try {
      const userId = user.id;

      // ── Resumen general ──────────────────────────────────────────────────
      const [incomeAgg, expensesAgg, arrearsAgg, totalVehicles, activeVehicles] =
        await Promise.all([
          prisma.payment.aggregate({
            where: { userId, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: { userId, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.arrear.aggregate({
            where: { userId, status: 'pending' },
            _sum: { amountOwed: true },
          }),
          prisma.vehicle.count({ where: { userId, deletedAt: null } }),
          prisma.driver.count({ where: { userId, vehicleId: { not: null } } }),
        ]);

      const totalIncome = Number(incomeAgg._sum.amount || 0);
      const totalExpenses = Number(expensesAgg._sum.amount || 0);
      const totalDebt = Number(arrearsAgg._sum.amountOwed || 0);

      // ── Detalle por vehículo ─────────────────────────────────────────────
      const vehicles = await prisma.vehicle.findMany({
        where: { userId, deletedAt: null },
        include: { driver: true },
        orderBy: { licensePlate: 'asc' },
      });

      const vehicleDetails = await Promise.all(
        vehicles.map(async (v) => {
          const [vIncomeAgg, vExpensesAgg, vArrearsAgg] = await Promise.all([
            prisma.payment.aggregate({
              where: { userId, vehicleId: v.id, date: { gte: start, lte: end } },
              _sum: { amount: true },
            }),
            prisma.expense.aggregate({
              where: { userId, vehicleId: v.id, date: { gte: start, lte: end } },
              _sum: { amount: true },
            }),
            prisma.arrear.aggregate({
              where: { userId, vehicleId: v.id, status: 'pending' },
              _sum: { amountOwed: true },
            }),
          ]);

          return {
            licensePlate: v.licensePlate,
            model: `${v.model} (${v.year})`,
            driverName: v.driver
              ? `${v.driver.firstName} ${v.driver.lastName}`
              : 'Sin conductor',
            rentaValue: Number(v.rentaValue),
            income: Number(vIncomeAgg._sum.amount || 0),
            expenses: Number(vExpensesAgg._sum.amount || 0),
            pendingDebt: Number(vArrearsAgg._sum.amountOwed || 0),
          };
        }),
      );

      // Solo enviar si el usuario tiene al menos un vehículo
      if (vehicles.length === 0) continue;

      await emailService.sendEmail({
        to: user.email,
        subject: `📋 Extracto Mensual de Flota – ${monthName} | FleetMaster Hub`,
        html: emailService.templates.monthlyFleetReport({
          username: user.username,
          monthName,
          totalIncome,
          totalExpenses,
          net: totalIncome - totalExpenses,
          totalDebt,
          totalVehicles,
          activeVehicles,
          vehicleDetails,
        }),
      });

      console.log(`✅ Reporte mensual enviado a: ${user.email}`);
    } catch (err) {
      console.error(`❌ Error enviando reporte mensual a ${user.email}:`, err);
    }
  }

  console.log('--- PROCESO DE REPORTES MENSUALES FINALIZADO ---');
};
