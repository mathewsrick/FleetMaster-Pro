import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaTx = Prisma.TransactionClient | PrismaClient;

/**
 * Registra un cambio de asignación conductor↔vehículo en el histórico.
 *
 * - Cierra cualquier fila abierta del conductor (endedAt = now).
 * - Si se asigna un vehículo, cierra también la fila abierta de ese vehículo
 *   y abre una nueva fila para el conductor.
 */
export const recordAssignmentChange = async (
  tx: PrismaTx,
  userId: string,
  driverId: string,
  vehicleId: string | null
) => {
  const now = new Date();

  await tx.vehicleAssignment.updateMany({
    where: { driverId, endedAt: null },
    data: { endedAt: now },
  });

  if (!vehicleId) return;

  await tx.vehicleAssignment.updateMany({
    where: { vehicleId, endedAt: null },
    data: { endedAt: now },
  });

  await tx.vehicleAssignment.create({
    data: {
      userId,
      driverId,
      vehicleId,
      startedAt: now,
    },
  });
};
