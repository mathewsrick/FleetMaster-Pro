import cron from 'node-cron';
import { sendExpirationNotifications } from '../modules/notifications/notification.service.js';

/**
 * Cron Job: Ejecuta diariamente a las 8:00 AM (hora del servidor)
 * Verifica y envía notificaciones de documentos próximos a vencer o vencidos
 */
export const startDocumentExpirationCron = () => {
  // Ejecutar todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('🕐 [CRON] Iniciando verificación de vencimientos de documentos...');
    try {
      await sendExpirationNotifications();
      console.log('✅ [CRON] Verificación de vencimientos completada exitosamente');
    } catch (error) {
      console.error('❌ [CRON] Error en verificación de vencimientos:', error);
    }
  }, {
    timezone: 'America/Bogota'
  });

  console.log('✅ [CRON] Job de notificaciones de vencimientos iniciado (8:00 AM diario)');
};
