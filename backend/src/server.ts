import app from './app';
import { runSeeders } from './shared/db';
import { generateAndSendWeeklyReports } from './modules/reports/automated-reports.service';

const port = process.env.PORT || 3001;

// Inicialización asíncrona de la base de datos y servidor
const bootstrap = async () => {
  try {
    // Ejecutar seeders al inicio
    await runSeeders();

    app.listen(port, () => {
      console.log(`🚀 FLEETMASTER HUB ONLINE - Puerto: ${port}`);

      // Generar reportes semanales cada Lunes a las 8:00 AM
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
      });
    });
  } catch (error) {
    console.error('❌ Failed to bootstrap server:', error);
    process.exit(1);
  }
};

bootstrap();