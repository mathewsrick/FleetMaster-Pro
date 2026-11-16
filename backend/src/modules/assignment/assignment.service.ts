import { prisma } from '../../shared/db.js';
import * as emailService from '../../shared/email.service.js';
import * as driverRepo from '../drivers/driver.repository.js';
import { recordAssignmentChange } from './assignment-history.js';

export const assignDriverToVehicle = async (
  userId: string,
  driverId: string,
  vehicleId: string | null
) => {
  // 1. Obtener datos del conductor
  const driver: any = await driverRepo.findById(userId, driverId);
  if (!driver) {
    throw new Error('Conductor no encontrado');
  }

  // 2. Actualizar asignación (regla 1–1) y registrar histórico
  const updatedDriver = await prisma.$transaction(async (tx) => {
    if (vehicleId) {
      // Desasignar ese vehículo de cualquier otro conductor
      await tx.driver.updateMany({
        where: {
          vehicleId,
          userId,
          NOT: { id: driverId },
        },
        data: {
          vehicleId: null,
        },
      });

      // Asignar el vehículo al conductor actual
      const updated = await tx.driver.update({
        where: { id: driverId },
        data: { vehicleId },
        include: { vehicle: true },
      });

      await recordAssignmentChange(tx, userId, driverId, vehicleId);
      return updated;
    }

    // Sin vehículo: desasignar conductor actual
    const updated = await tx.driver.update({
      where: { id: driverId },
      data: { vehicleId: null },
      include: { vehicle: true },
    });

    await recordAssignmentChange(tx, userId, driverId, null);
    return updated;
  });

  // 3. Notificación por correo
  if (driver.email && updatedDriver.vehicle) {
    await emailService.sendEmail({
      to: driver.email,
      subject: `¡Nuevo Vehículo Asignado! - Placa ${updatedDriver.vehicle.licensePlate}`,
      html: emailService.templates.vehicleAssignment(
        `${driver.firstName} ${driver.lastName}`,
        updatedDriver.vehicle
      ),
    });
  }

  return { success: true };
};
