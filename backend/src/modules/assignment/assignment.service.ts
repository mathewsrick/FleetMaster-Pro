import { prisma } from '../../shared/db';
import * as emailService from '../../shared/email.service';
import * as driverRepo from '../drivers/driver.repository';

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

  // 2. Desasignar cualquier vehículo actual del conductor
  await prisma.driver.update({
    where: { id: driverId },
    data: { vehicleId: null }
  });

  // 3. Si se envía un vehículo, asignarlo
  if (vehicleId) {
    // 3.1 Desasignar ese vehículo de cualquier otro conductor (regla 1–1)
    await prisma.driver.updateMany({
      where: {
        vehicleId,
        userId
      },
      data: {
        vehicleId: null
      }
    });

    // 3.2 Asignar el vehículo al conductor actual
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: { vehicleId },
      include: {
        vehicle: true
      }
    });

    // 4. Notificación por correo
    if (driver.email && updatedDriver.vehicle) {
      await emailService.sendEmail({
        to: driver.email,
        subject: `¡Nuevo Vehículo Asignado! - Placa ${updatedDriver.vehicle.licensePlate}`,
        html: emailService.templates.vehicleAssignment(
          `${driver.firstName} ${driver.lastName}`,
          updatedDriver.vehicle
        )
      });
    }
  }

  return { success: true };
};