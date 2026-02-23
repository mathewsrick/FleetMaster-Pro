
import { prisma } from '../../shared/db.js';
import * as emailService from '../../shared/email.service.js';

export const checkExpirationsAndNotify = async () => {
  console.log('--- INICIANDO VERIFICACIÓN DIARIA DE VENCIMIENTOS ---');
  const now = new Date();
  const alertDate = new Date();
  alertDate.setDate(now.getDate() + 5);

  const alertDateStr = alertDate.toISOString().split('T')[0];

  // 1. Vencimientos de Documentos (SOAT y Tecnomecánica)
  const expiringVehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { soatExpiration: { gte: now, lte: alertDate } },
        { techExpiration: { gte: now, lte: alertDate } }
      ]
    },
    include: { user: true }
  });

  for (const v of expiringVehicles) {
    try {
      if (v.soatExpiration && v.soatExpiration <= alertDate && v.soatExpiration >= now) {
        const daysRemaining = Math.ceil((new Date(v.soatExpiration).getTime() - now.getTime()) / (1000 * 3600 * 24));
        await emailService.sendEmail({
          to: v.user.email,
          subject: `⚠️ Vencimiento SOAT: ${v.licensePlate}`,
          html: emailService.templates.documentExpirationAlert({
            documentType: 'SOAT',
            entityName: v.licensePlate,
            daysRemaining,
            expirationDate: v.soatExpiration.toLocaleDateString('es-CO'),
            isExpired: daysRemaining <= 0
          })
        });
      }
      if (v.techExpiration && v.techExpiration <= alertDate && v.techExpiration >= now) {
        const daysRemaining = Math.ceil((new Date(v.techExpiration).getTime() - now.getTime()) / (1000 * 3600 * 24));
        await emailService.sendEmail({
          to: v.user.email,
          subject: `⚠️ Vencimiento Tecnomecánica: ${v.licensePlate}`,
          html: emailService.templates.documentExpirationAlert({
            documentType: 'Revisión Tecnomecánica',
            entityName: v.licensePlate,
            daysRemaining,
            expirationDate: v.techExpiration.toLocaleDateString('es-CO'),
            isExpired: daysRemaining <= 0
          })
        });
      }
    } catch (e) { console.error('Error enviando alerta de documento:', e); }
  }

  // 2. Expiración de Suscripciones SaaS
  const expiringSubs = await prisma.subscriptionKey.findMany({
    where: {
      status: 'active',
      dueDate: { gte: now, lte: alertDate }
    },
    include: { user: true }
  });

  for (const sub of expiringSubs) {
    if (!sub.user) continue;
    try {
      await emailService.sendEmail({
        to: sub.user.email,
        subject: `⏰ Tu plan FleetMaster expira en pocos días`,
        html: emailService.templates.subscriptionExpirationAlert({
          plan: sub.plan,
          daysRemaining: Math.ceil((new Date(sub.dueDate!).getTime() - now.getTime()) / (1000 * 3600 * 24)),
          expirationDate: sub.dueDate!.toLocaleDateString()
        })
      });
    } catch (e) { console.error('Error enviando alerta de sub:', e); }
  }

  console.log('--- VERIFICACIÓN DIARIA COMPLETADA ---');
};
