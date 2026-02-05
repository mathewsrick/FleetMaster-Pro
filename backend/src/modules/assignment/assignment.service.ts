import { dbHelpers } from '../../shared/db';

export const assignDriverToVehicle = async (userId: string, driverId: string, vehicleId: string | null) => {
  // 1. Desasignar al conductor de cualquier vehículo que tenga actualmente
  dbHelpers.prepare(
    'UPDATE vehicles SET driverId = NULL WHERE driverId = ? AND userId = ?'
  ).run([driverId, userId]);

  // 2. Si se proporciona un vehicleId, asignar el conductor a ese vehículo
  if (vehicleId) {
    // Opcional: Desasignar a cualquier otro conductor que esté en ese vehículo específico primero
    dbHelpers.prepare(
      'UPDATE vehicles SET driverId = NULL WHERE id = ? AND userId = ?'
    ).run([vehicleId, userId]);

    // Realizar la nueva asignación
    dbHelpers.prepare(
      'UPDATE vehicles SET driverId = ? WHERE id = ? AND userId = ?'
    ).run([driverId, vehicleId, userId]);
  }

  return { success: true };
};
