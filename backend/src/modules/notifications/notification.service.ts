import { prisma } from '../../shared/db.js';
import * as emailService from '../../shared/email.service.js';

interface DocumentExpiration {
  type: 'SOAT' | 'TECH' | 'FULL_COVERAGE' | 'LICENSE';
  expirationDate: Date;
  daysUntilExpiration: number;
  vehicleId?: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  driverEmail?: string;
  userId: string;
  userEmail: string;
}

/**
 * Calcula los días hasta el vencimiento
 */
const getDaysUntilExpiration = (expirationDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 3600 * 24));
};

/**
 * Obtiene todos los documentos próximos a vencer o vencidos
 */
export const checkDocumentExpirations = async (): Promise<DocumentExpiration[]> => {
  const expirations: DocumentExpiration[] = [];

  // 🚗 Verificar vencimientos de vehículos
  const vehicles = await prisma.vehicle.findMany({
    where: {
      deletedAt: null,
      OR: [
        { soatExpiration: { not: null } },
        { techExpiration: { not: null } },
        { fullCoverageExpiration: { not: null } } as any
      ]
    },
    include: {
      user: { select: { id: true, email: true, username: true } },
      driver: { select: { id: true, firstName: true, lastName: true, email: true } }
    }
  }) as any;

  for (const vehicle of vehicles) {
    // SOAT
    if (vehicle.soatExpiration) {
      const days = getDaysUntilExpiration(vehicle.soatExpiration);
      // Enviar en días específicos: 10, 5, 3, 1 antes, y diariamente desde el vencimiento
      if (days === 10 || days === 5 || days === 3 || days === 1 || days <= 0) {
        expirations.push({
          type: 'SOAT',
          expirationDate: vehicle.soatExpiration,
          daysUntilExpiration: days,
          vehicleId: vehicle.id,
          vehiclePlate: vehicle.licensePlate,
          userId: vehicle.userId,
          userEmail: vehicle.user.email
        });
      }
    }

    // Tecnomecánica
    if (vehicle.techExpiration) {
      const days = getDaysUntilExpiration(vehicle.techExpiration);
      // Enviar en días específicos: 10, 5, 3, 1 antes, y diariamente desde el vencimiento
      if (days === 10 || days === 5 || days === 3 || days === 1 || days <= 0) {
        expirations.push({
          type: 'TECH',
          expirationDate: vehicle.techExpiration,
          daysUntilExpiration: days,
          vehicleId: vehicle.id,
          vehiclePlate: vehicle.licensePlate,
          userId: vehicle.userId,
          userEmail: vehicle.user.email
        });
      }
    }

    // Seguro Todo Riesgo
    if (vehicle.fullCoverageExpiration) {
      const days = getDaysUntilExpiration(vehicle.fullCoverageExpiration);
      // Enviar en días específicos: 10, 5, 3, 1 antes, y diariamente desde el vencimiento
      if (days === 10 || days === 5 || days === 3 || days === 1 || days <= 0) {
        expirations.push({
          type: 'FULL_COVERAGE',
          expirationDate: vehicle.fullCoverageExpiration,
          daysUntilExpiration: days,
          vehicleId: vehicle.id,
          vehiclePlate: vehicle.licensePlate,
          userId: vehicle.userId,
          userEmail: vehicle.user.email
        });
      }
    }
  }

  // 👤 Verificar vencimientos de licencias de conductores
  const drivers = await prisma.driver.findMany({
    where: {
      deletedAt: null,
      licenseExpiration: { not: null }
    } as any,
    include: {
      user: { select: { id: true, email: true, username: true } },
      vehicle: { select: { licensePlate: true } }
    }
  }) as any;

  for (const driver of drivers) {
    if (driver.licenseExpiration) {
      const days = getDaysUntilExpiration(driver.licenseExpiration);
      // Enviar en días específicos: 10, 5, 3, 1 antes, y diariamente desde el vencimiento
      if (days === 10 || days === 5 || days === 3 || days === 1 || days <= 0) {
        expirations.push({
          type: 'LICENSE',
          expirationDate: driver.licenseExpiration,
          daysUntilExpiration: days,
          driverId: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          driverEmail: driver.email || undefined,
          vehiclePlate: driver.vehicle?.licensePlate,
          userId: driver.userId,
          userEmail: driver.user.email
        });
      }
    }
  }

  return expirations;
};

/**
 * Envía notificaciones por email según el estado del documento
 */
export const sendExpirationNotifications = async () => {
  const expirations = await checkDocumentExpirations();
  
  console.log(`📧 Procesando ${expirations.length} notificaciones de vencimiento...`);

  for (const exp of expirations) {
    try {
      const isExpired = exp.daysUntilExpiration <= 0;
      const isWarning = exp.daysUntilExpiration === 10 || exp.daysUntilExpiration === 5 || 
                        exp.daysUntilExpiration === 3 || exp.daysUntilExpiration === 1;

      // Solo enviar en días específicos (10, 5, 3, 1) o si está vencido (diariamente)
      if (!isExpired && !isWarning) continue;

      const documentNames = {
        'SOAT': 'SOAT',
        'TECH': 'Revisión Tecnomecánica',
        'FULL_COVERAGE': 'Seguro Todo Riesgo',
        'LICENSE': 'Licencia de Conducción'
      };

      const docName = documentNames[exp.type];
      const subject = isExpired 
        ? `[URGENTE] ${docName} VENCIDO - ${exp.vehiclePlate || exp.driverName}`
        : `⚠️ Alerta: ${docName} por vencer - ${exp.vehiclePlate || exp.driverName}`;

      // 📧 Notificar al administrador de la flota
      if (exp.userEmail) {
        await emailService.sendEmail({
          to: exp.userEmail,
          subject,
          html: emailService.templates.documentExpirationAlert({
            documentType: docName,
            entityName: exp.vehiclePlate || exp.driverName || '',
            daysRemaining: exp.daysUntilExpiration,
            expirationDate: exp.expirationDate.toLocaleDateString('es-CO'),
            isExpired
          })
        });
        console.log(`✅ Email enviado al admin: ${exp.userEmail} - ${docName} (${exp.daysUntilExpiration} días)`);
      }

      // 📧 Si es licencia de conducción, también notificar al conductor
      if (exp.type === 'LICENSE' && exp.driverEmail) {
        await emailService.sendEmail({
          to: exp.driverEmail,
          subject,
          html: emailService.templates.driverLicenseExpirationAlert({
            driverName: exp.driverName || '',
            daysRemaining: exp.daysUntilExpiration,
            expirationDate: exp.expirationDate.toLocaleDateString('es-CO'),
            isExpired
          })
        });
        console.log(`✅ Email enviado al conductor: ${exp.driverEmail} (${exp.daysUntilExpiration} días)`);
      }

    } catch (error) {
      console.error(`❌ Error enviando notificación:`, error);
    }
  }

  console.log(`✅ Proceso de notificaciones completado`);
};
