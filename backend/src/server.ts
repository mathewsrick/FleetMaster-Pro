// Solo cargar dotenv en desarrollo (no en Docker/producción)
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

import app from './app.js';
import { runSeeders } from './shared/db.js';
import { generateAndSendWeeklyReports } from './modules/reports/automated-reports.service.js';
import { sendExpirationNotifications } from './modules/notifications/notification.service.js';

const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Logger simple
const log = {
  info: (msg: string) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`),
  error: (msg: string, error?: any) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, error || ''),
  success: (msg: string) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`),
  warn: (msg: string) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`)
};

// Inicialización asíncrona de la base de datos y servidor
const bootstrap = async () => {
  try {
    log.info(`Iniciando FleetMaster Hub en modo ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

    // Ejecutar seeders al inicio
    log.info('Ejecutando seeders...');
    await runSeeders();
    log.success('Seeders ejecutados correctamente');

    app.listen(port, '0.0.0.0', () => {
      log.success(`FLEETMASTER HUB ONLINE - Puerto: ${port}`);
      log.info(`API disponible en: http://localhost:${port}/api`);

      // Generar reportes semanales cada Lunes a las 8:00 AM
      import('node-cron').then(({ default: cron }) => {
        cron.schedule('0 8 * * 1', async () => {
          log.info('📊 Ejecutando generación de reportes semanales...');
          try {
            await generateAndSendWeeklyReports();
            log.success('Reportes semanales generados exitosamente');
          } catch (error) {
            log.error('Error generando reportes semanales:', error);
          }
        }, {
          timezone: 'America/Bogota'
        });
        // 🔔 Notificaciones diarias de vencimientos (Diario 8:00 AM)
        cron.schedule('0 8 * * *', async () => {
          log.info('🔔 Ejecutando verificación de vencimientos diaria...');
          try {
            await sendExpirationNotifications();
            log.success('Verificación de vencimientos completada');
          } catch (error) {
            log.error('Error en verificación de vencimientos:', error);
          }
        }, { timezone: 'America/Bogota' });
        
        log.info('⏰ Tareas programadas iniciadas:');
        log.info('  📊 Reportes semanales: Lunes 8:00 AM');
        log.info('  🔔 Notificaciones vencimientos: Diario 8:00 AM');
      });
    });
  } catch (error) {
    log.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise);
  log.error('Reason:', reason);
  // En producción, podrías enviar esto a un servicio de monitoreo
  if (isProduction) {
    // Aquí podrías integrar Sentry, LogRocket, etc.
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

// Manejo de señales de cierre
process.on('SIGTERM', () => {
  log.warn('SIGTERM recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.warn('SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

bootstrap();