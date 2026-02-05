import { dbHelpers } from '../../shared/db';
import * as emailService from '../../shared/email.service';

export const generateAndSendWeeklyReports = async () => {
  console.log('--- INICIANDO ENVÍO DE REPORTES SEMANALES ENTERPRISE ---');

  // 1. Buscar todos los usuarios con plan Enterprise activo
  const enterpriseUsers = dbHelpers.prepare(`
    SELECT u.id, u.email, u.username 
    FROM users u
    JOIN subscription_keys sk ON u.id = sk.userId
    WHERE sk.plan = 'enterprise' AND sk.status = 'active'
  `).all();

  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(now.getDate() - 7);
  const dateRange = `${lastWeek.toLocaleDateString()} - ${now.toLocaleDateString()}`;

  for (const user of enterpriseUsers) {
    try {
      // 2. Calcular estadísticas de la semana para este usuario
      const userId = user.id;

      const income = dbHelpers.prepare(`
        SELECT SUM(amount) as total FROM payments 
        WHERE userId = ? AND date BETWEEN ? AND ?
      `).get([userId, lastWeek.toISOString(), now.toISOString()]).total || 0;

      const expenses = dbHelpers.prepare(`
        SELECT SUM(amount) as total FROM expenses 
        WHERE userId = ? AND date BETWEEN ? AND ?
      `).get([userId, lastWeek.toISOString(), now.toISOString()]).total || 0;

      const totalDebt = dbHelpers.prepare(`
        SELECT SUM(amountOwed) as total FROM arrears 
        WHERE userId = ? AND status = 'pending'
      `).get([userId]).total || 0;

      const totalVehicles = dbHelpers.prepare(`
        SELECT COUNT(*) as count FROM vehicles WHERE userId = ?
      `).get([userId]).count;

      const activeVehicles = dbHelpers.prepare(`
        SELECT COUNT(*) as count FROM vehicles WHERE userId = ? AND driverId IS NOT NULL
      `).get([userId]).count;

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
        subject: `Reporte Semanal FleetMaster Pro - ${dateRange}`,
        html: emailService.templates.weeklyEnterpriseReport(stats)
      });

      console.log(`✅ Reporte enviado a: ${user.email}`);
    } catch (err) {
      console.error(`❌ Error enviando reporte a ${user.email}:`, err);
    }
  }

  console.log('--- PROCESO DE REPORTES FINALIZADO ---');
};