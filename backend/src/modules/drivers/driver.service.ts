import { v4 as uuid } from 'uuid';
import * as repo from './driver.repository.js';
import * as authRepo from '../auth/auth.repository.js';
import * as emailService from '../../shared/email.service.js';
import { prisma } from '../../shared/db.js';
import { recordAssignmentChange } from '../assignment/assignment-history.js';

const PLAN_MAX_DRIVERS: Record<string, number> = {
  'free_trial': 1,
  'basico': 5,
  'pro': 10,
  'enterprise': 99999
};

export const getAll = async (userId: string, query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 100, 100); // 🔒 Límite máximo de 100
  return await repo.findAll(userId, { page, limit });
};

export const create = async (userId: string, data: any) => {
  // 1️⃣ Verificar si existe un conductor con el mismo idNumber (incluyendo soft-deleted)
  const existingDriver = await repo.findByIdNumber(userId, data.idNumber);

  if (existingDriver) {
    if (!existingDriver.deletedAt) {
      // Conductor activo con mismo idNumber - ERROR
      throw {
        code: 'DUPLICATE_DRIVER',
        message: `Ya existe un conductor activo con cédula ${data.idNumber}`,
      };
    }

    // 2️⃣ Conductor existe pero está eliminado (soft delete) - RESTAURAR
    console.log(`🔄 Restaurando conductor eliminado: ${existingDriver.firstName} ${existingDriver.lastName} (ID: ${existingDriver.id})`);
    
    // Desasignar vehículo si se está asignando a otro conductor
    if (data.vehicleId) {
      const driverWithVehicle = await repo.findByVehicleId(data.vehicleId);
      if (driverWithVehicle && driverWithVehicle.id !== existingDriver.id) {
        await repo.update(userId, driverWithVehicle.id, { vehicleId: null });
        await recordAssignmentChange(prisma, userId, driverWithVehicle.id, null);
      }
    }

    // Restaurar conductor con nuevos datos
    const restoredDriver = await repo.restore(userId, existingDriver.id, data);
    await recordAssignmentChange(prisma, userId, existingDriver.id, data.vehicleId || null);

    // Enviar email de bienvenida si tiene email
    if (restoredDriver.email) {
      await emailService.sendEmail({
        to: restoredDriver.email,
        subject: `¡Bienvenido nuevamente! - Términos y Condiciones FleetMaster Hub`,
        html: emailService.templates.driverWelcome(`${restoredDriver.firstName} ${restoredDriver.lastName}`)
      });
    }

    return restoredDriver;
  }

  // 3️⃣ Conductor no existe - CREAR NUEVO (lógica original)
  const { total } = await repo.findAll(userId, { page: 1, limit: 1 });
  const plan = await authRepo.getUserPlan(userId);
  const limit = PLAN_MAX_DRIVERS[plan] || 1;

  if (total >= limit) {
    throw {
      code: 'PLAN_LIMIT_DRIVERS',
      message: `Límite alcanzado para el plan ${plan.toUpperCase()}. Máximo: ${limit} conductores.`,
    };
  }

  // Si se está asignando un vehículo, primero desasignarlo de cualquier otro conductor
  if (data.vehicleId) {
    const driverWithVehicle = await repo.findByVehicleId(data.vehicleId);
    if (driverWithVehicle) {
      console.log(`🔄 Desasignando vehículo ${data.vehicleId} del conductor ${driverWithVehicle.id} antes de crear nuevo conductor`);
      await repo.update(userId, driverWithVehicle.id, { vehicleId: null });
      await recordAssignmentChange(prisma, userId, driverWithVehicle.id, null);
    }
  }

  const driver = { id: uuid(), userId, ...data };
  await repo.create(driver);
  await recordAssignmentChange(prisma, userId, driver.id, data.vehicleId || null);

  // Alerta automática: Bienvenida al conductor
  if (driver.email) {
    await emailService.sendEmail({
      to: driver.email,
      subject: `¡Bienvenido a bordo! - Términos y Condiciones FleetMaster Hub`,
      html: emailService.templates.driverWelcome(`${driver.firstName} ${driver.lastName}`)
    });
  }

  return driver;
};

export const update = async (userId: string, id: string, data: any) => {
  // Si se está cambiando el vehículo, primero desasignar el vehículo del conductor anterior
  if (data.vehicleId) {
    // Buscar si hay otro conductor con este vehículo
    const existingDriver = await repo.findByVehicleId(data.vehicleId);
    
    // Si existe y no es el mismo conductor que estamos editando, desasignarlo
    if (existingDriver && existingDriver.id !== id) {
      await repo.update(userId, existingDriver.id, { vehicleId: null });
      await recordAssignmentChange(prisma, userId, existingDriver.id, null);
    }
  }
  
  const current = await prisma.driver.findFirst({ where: { id, userId }, select: { vehicleId: true } });
  await repo.update(userId, id, data);

  // repo.update siempre escribe vehicleId (null si falta); registrar solo si cambió
  const nextVehicleId = data.vehicleId || null;
  if ((current?.vehicleId ?? null) !== nextVehicleId) {
    await recordAssignmentChange(prisma, userId, id, nextVehicleId);
  }
};

export const remove = async (userId: string, id: string) => {
  await repo.unassignVehicles(userId, id);
  await recordAssignmentChange(prisma, userId, id, null);
  await repo.remove(userId, id);
};