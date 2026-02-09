
import { dbHelpers } from '../../shared/db';
import * as emailService from '../../shared/email.service';
import * as driverRepo from '../drivers/driver.repository';

export const assignDriverToVehicle = async (userId: string, driverId: string, vehicleId: string | null) => {
  // 1. Obtener datos del conductor antes de cambiar nada
  const driver: any = await driverRepo.findById(userId, driverId);

  // 2. Desasignar al conductor de cualquier vehículo que tenga actualmente
  dbHelpers.prepare(
    'UPDATE vehicles SET driverId = NULL WHERE driverId = ? AND userId = ?'
  ).run([driverId, userId]);

  // 3. Si se proporciona un vehicleId, asignar el conductor a ese vehículo
  if (vehicleId) {
    // Desasignar a cualquier otro conductor que esté en ese vehículo específico
    dbHelpers.prepare(
      'UPDATE vehicles SET driverId = NULL WHERE id = ? AND userId = ?'
    ).run([vehicleId, userId]);

    // Realizar la nueva asignación
    dbHelpers.prepare(
      'UPDATE vehicles SET driverId = ? WHERE id = ? AND userId = ?'
    ).run([driverId, vehicleId, userId]);

    // Obtener datos del vehículo para el email
    const vehicle: any = dbHelpers.prepare('SELECT * FROM vehicles WHERE id = ?').get([vehicleId]);

    // Alerta automática: Notificación de asignación al conductor
    if (driver && driver.email) {
      await emailService.sendEmail({
        to: driver.email,
        subject: `¡Nuevo Vehículo Asignado! - Placa ${vehicle.licensePlate}`,
        html: emailService.templates.vehicleAssignment(`${driver.firstName} ${driver.lastName}`, vehicle)
      });
    }
  }

  return { success: true };
};
