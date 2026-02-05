import app from './app';
import { generateAndSendWeeklyReports } from './modules/reports/automated-reports.service';

console.log('SMTP CHECK →', {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? 'OK' : 'MISSING',
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 FLEETMASTER PRO ONLINE - Puerto: ${port}`);

  // Generar reportes semanales cada Lunes a las 8:00 AM
  // Usar node-cron en producción
  import('node-cron').then(({ default: cron }) => {
    cron.schedule('0 8 * * 1', async () => {
      console.log('📊 Ejecutando generación de reportes semanales...');
      try {
      await generateAndSendWeeklyReports();
      console.log('✅ Reportes semanales generados exitosamente');
      } catch (error) {
      console.error('❌ Error generando reportes semanales:', error);
      }
    }, {
      timezone: 'America/Bogota'
    });
    console.log('⏰ Tarea programada: Reportes semanales (Lunes 8:00 AM)');
  }).catch(err => {
    console.error('⚠️ node-cron no disponible. Instalar: npm install node-cron @types/node-cron');
  });
});
