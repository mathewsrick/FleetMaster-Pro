import { prisma } from '../../shared/db';
import * as emailService from '../../shared/email.service';
export const generateAndSendWeeklyReports = async () => {
    console.log('--- INICIANDO ENVÍO DE REPORTES SEMANALES ENTERPRISE ---');
    // 1. Buscar todos los usuarios con plan Enterprise activo usando Prisma
    const enterpriseUsers = await prisma.user.findMany({
        where: {
            subscriptions: {
                some: {
                    plan: 'enterprise',
                    status: 'active'
                }
            }
        }
    });
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    const dateRange = `${lastWeek.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    for (const user of enterpriseUsers) {
        try {
            const userId = user.id;
            // 2. Calcular estadísticas usando agregaciones de Prisma
            const incomeAgg = await prisma.payment.aggregate({
                where: { userId, date: { gte: lastWeek, lte: now } },
                _sum: { amount: true }
            });
            const income = Number(incomeAgg._sum.amount || 0);
            const expensesAgg = await prisma.expense.aggregate({
                where: { userId, date: { gte: lastWeek, lte: now } },
                _sum: { amount: true }
            });
            const expenses = Number(expensesAgg._sum.amount || 0);
            const arrearsAgg = await prisma.arrear.aggregate({
                where: { userId, status: 'pending' },
                _sum: { amountOwed: true }
            });
            const totalDebt = Number(arrearsAgg._sum.amountOwed || 0);
            const totalVehicles = await prisma.vehicle.count({ where: { userId } });
            // Contar vehículos activos (asignados a drivers)
            const activeVehicles = await prisma.driver.count({
                where: { userId, vehicleId: { not: null } }
            });
            const stats = {
                dateRange,
                income,
                expenses,
                net: income - expenses,
                totalDebt,
                totalVehicles,
                activeVehicles
            };
            // 3. Enviar email
            await emailService.sendEmail({
                to: user.email,
                subject: `📊 Reporte Semanal FleetMaster Hub - ${dateRange}`,
                html: emailService.templates.weeklyEnterpriseReport(stats)
            });
            console.log(`✅ Reporte enviado a: ${user.email}`);
        }
        catch (err) {
            console.error(`❌ Error enviando reporte a ${user.email}:`, err);
        }
    }
    console.log('--- PROCESO DE REPORTES FINALIZADO ---');
};
//# sourceMappingURL=automated-reports.service.js.map