import { prisma } from '../../shared/db.js';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: { 
        userId,
        deletedAt: null // Solo vehículos activos
      },
      include: { driver: true },
      orderBy: { licensePlate: 'asc' },
      skip,
      take: limit
    }),
    prisma.vehicle.count({ 
      where: { 
        userId,
        deletedAt: null // Solo contar vehículos activos
      } 
    })
  ]);

  const transformed = data.map((v: typeof data[0]) => ({
    ...v,
    driverName: v.driver ? `${v.driver.firstName} ${v.driver.lastName}` : null
  }));

  return { data: transformed, total };
};

export const findById = async (id: string) =>
  prisma.vehicle.findUnique({ where: { id } });

export const findByLicensePlate = async (userId: string, licensePlate: string) =>
  prisma.vehicle.findFirst({
    where: { 
      userId,
      licensePlate
      // ⚠️ Busca tanto activos como eliminados
    },
    include: {
      driver: { select: { id: true, firstName: true, lastName: true } }
    }
  });

export const restore = async (userId: string, id: string, newData: any) => {
  // Restaurar vehículo y actualizar sus datos
  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      year: Number(newData.year),
      licensePlate: newData.licensePlate,
      model: newData.model,
      color: newData.color,
      purchaseDate: newData.purchaseDate ? new Date(newData.purchaseDate) : null,
      insurance: newData.insurance || null,
      insuranceNumber: newData.insuranceNumber || null,
      soatExpiration: newData.soatExpiration ? new Date(newData.soatExpiration) : null,
      techExpiration: newData.techExpiration ? new Date(newData.techExpiration) : null,
      hasFullCoverage: newData.hasFullCoverage || false,
      fullCoverageExpiration: newData.hasFullCoverage && newData.fullCoverageExpiration ? new Date(newData.fullCoverageExpiration) : null,
      rentaValue: Number(newData.rentaValue),
      photos: Array.isArray(newData.photos) ? newData.photos : [],
      deletedAt: null // 🔑 Restaurar
    } as any,
    include: {
      driver: true
    }
  });

  // Transformar para que coincida con el formato esperado
  return {
    ...updated,
    driverName: (updated as any).driver ? `${(updated as any).driver.firstName} ${(updated as any).driver.lastName}` : null
  };
};

export const create = async (userId: string, data: any) => {
  const created = await prisma.vehicle.create({
    data: {
      id: data.id,
      userId,
      year: Number(data.year),
      licensePlate: data.licensePlate,
      model: data.model,
      color: data.color,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      insurance: data.insurance || null,
      insuranceNumber: data.insuranceNumber || null,
      soatExpiration: data.soatExpiration ? new Date(data.soatExpiration) : null,
      techExpiration: data.techExpiration ? new Date(data.techExpiration) : null,
      hasFullCoverage: data.hasFullCoverage || false,
      fullCoverageExpiration: data.hasFullCoverage && data.fullCoverageExpiration ? new Date(data.fullCoverageExpiration) : null,
      rentaValue: Number(data.rentaValue),
      photos: Array.isArray(data.photos) ? data.photos : []
    } as any,
    include: {
      driver: true
    }
  });

  // Transformar para que coincida con el formato esperado
  return {
    ...created,
    driverName: (created as any).driver ? `${(created as any).driver.firstName} ${(created as any).driver.lastName}` : null
  };
};

export const update = async (userId: string, payload: any) => {
  if (!payload?.id) {
    throw new Error('Vehicle ID is required');
  }

  const existing = await prisma.vehicle.findFirst({
    where: {
      id: payload.id,
      userId
    }
  });

  if (!existing) {
    throw new Error('Vehículo no encontrado');
  }

  const updated = await prisma.vehicle.update({
    where: { id: payload.id },
    data: {
      year: Number(payload.year),
      licensePlate: payload.licensePlate,
      model: payload.model,
      color: payload.color,
      purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : null,
      insurance: payload.insurance || null,
      insuranceNumber: payload.insuranceNumber || null,
      soatExpiration: payload.soatExpiration ? new Date(payload.soatExpiration) : null,
      techExpiration: payload.techExpiration ? new Date(payload.techExpiration) : null,
      hasFullCoverage: payload.hasFullCoverage || false,
      fullCoverageExpiration: payload.hasFullCoverage && payload.fullCoverageExpiration ? new Date(payload.fullCoverageExpiration) : null,
      rentaValue: Number(payload.rentaValue),
      photos: Array.isArray(payload.photos) ? payload.photos : []
    } as any,
    include: {
      driver: true
    }
  });

  // Transformar para que coincida con el formato esperado
  return {
    ...updated,
    driverName: (updated as any).driver ? `${(updated as any).driver.firstName} ${(updated as any).driver.lastName}` : null
  };
};

export const remove = async (userId: string, id: string) => {
  // Validar pertenencia al tenant
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId },
    include: { driver: true }
  });

  if (!vehicle) {
    throw new Error('Vehículo no encontrado');
  }

  // Si el vehículo tiene un conductor asignado, desvincularlo
  if (vehicle.driver) {
    await prisma.driver.update({
      where: { id: vehicle.driver.id },
      data: { vehicleId: null }
    });
  }

  // Soft delete
  return prisma.vehicle.update({ 
    where: { id },
    data: { deletedAt: new Date() }
  });
};