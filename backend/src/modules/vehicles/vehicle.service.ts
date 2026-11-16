import * as repo from './vehicle.repository.js';
import * as authRepo from '../auth/auth.repository.js';
import { prisma } from '../../shared/db.js';
import { recordAssignmentChange } from '../assignment/assignment-history.js';

const PLAN_MAX_VEHICLES: Record<string, number> = {
  'free_trial': 1,
  'basico': 3,
  'pro': 6,
  'enterprise': 99999
};

export const getAll = async (userId: string, query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 100, 100); // 🔒 Límite máximo de 100
  return await repo.findAll(userId, { page, limit });
};

export const save = async (userId: string, data: any) => {
  const existing = await repo.findById(data.id);
  // Normalizar placa a mayúsculas
  if (data.licensePlate) {
    data.licensePlate = data.licensePlate.toUpperCase();
  }
  
  if (!existing) {
    // 1️⃣ Verificar si existe un vehículo con la misma placa (incluyendo soft-deleted)
    const existingVehicle = await repo.findByLicensePlate(userId, data.licensePlate);

    if (existingVehicle) {
      if (!existingVehicle.deletedAt) {
        // Vehículo activo con misma placa - ERROR
        throw {
          code: 'DUPLICATE_VEHICLE',
          message: `Ya existe un vehículo activo con placa ${data.licensePlate}`,
        };
      }

      // 2️⃣ Vehículo existe pero está eliminado (soft delete) - RESTAURAR
      console.log(`🔄 Restaurando vehículo eliminado: ${existingVehicle.licensePlate} (ID: ${existingVehicle.id})`);

      const restoredVehicle = await repo.restore(userId, existingVehicle.id, data);
      return restoredVehicle;
    }

    // 3️⃣ Vehículo no existe - CREAR NUEVO (validar límite)
    const { total } = await repo.findAll(userId, { page: 1, limit: 1 });
    const plan = await authRepo.getUserPlan(userId);
    const limit = PLAN_MAX_VEHICLES[plan] || 1;

    if (total >= limit) {
      throw {
        code: 'PLAN_LIMIT_VEHICLES',
        message: `Límite alcanzado para el plan ${plan.toUpperCase()}. Máximo: ${limit} vehículos.`,
      };
    }

    await repo.create(userId, data);
  } else {
    // Actualizar vehículo existente
    await repo.update(userId, data);
  }
};

export const remove = async (userId: string, id: string) => {
  // Identificar al conductor que quedará desasignado por el soft delete
  const assignedDriver = await prisma.driver.findFirst({
    where: { vehicleId: id },
    select: { id: true },
  });

  await repo.remove(userId, id);

  if (assignedDriver) {
    await recordAssignmentChange(prisma, userId, assignedDriver.id, null);
  }
};