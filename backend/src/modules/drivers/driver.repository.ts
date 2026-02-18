import { prisma } from '../../shared/db.js';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.driver.findMany({
      where: { 
        userId,
        deletedAt: null // Solo conductores activos
      },
      include: {
        vehicle: { select: {id: true, licensePlate: true, rentaValue: true} },
        arrears: { where: {status: 'pending'} }
      },
      orderBy: { lastName: 'asc' },
      skip,
      take: limit
    }),
    prisma.driver.count({ 
      where: { 
        userId,
        deletedAt: null // Solo contar conductores activos
      } 
    })
  ]);

  const transformed = data.map((d: typeof data[0]) => ({
    ...d,
    vehiclePlate: d.vehicle?.licensePlate || null,
    vehicleId: d.vehicle?.id || null,
    totalDebt: d.arrears.reduce((acc: number, curr: typeof d.arrears[0]) => acc + Number(curr.amountOwed), 0)
  }));

  return { data: transformed, total };
};

export const findById = async (userId: string, id: string) =>
  prisma.driver.findUnique({ where: { id } });

export const findByVehicleId = async (vehicleId: string) =>
  prisma.driver.findUnique({ 
    where: { vehicleId },
    select: { id: true, userId: true, firstName: true, lastName: true, vehicleId: true }
  });

export const findByIdNumber = async (userId: string, idNumber: string) =>
  prisma.driver.findFirst({
    where: { 
      userId,
      idNumber
    },
    include: {
      vehicle: { select: { id: true, licensePlate: true } }
    }
  });

export const restore = async (userId: string, id: string, newData: any) => {
  // Restaurar conductor y actualizar sus datos
  const allowedFields = {
    firstName: newData.firstName,
    lastName: newData.lastName,
    email: newData.email || null,
    phone: newData.phone,
    licensePhoto: newData.licensePhoto,
    idPhoto: newData.idPhoto,
    vehicleId: newData.vehicleId || null,
    deletedAt: null // Restaurar
  };

  const updated = await prisma.driver.update({
    where: { id },
    data: allowedFields,
    include: {
      vehicle: { select: { id: true, licensePlate: true, rentaValue: true } },
      arrears: { where: { status: 'pending' } }
    }
  });

  // Transformar para que coincida con el formato esperado
  return {
    ...updated,
    vehiclePlate: updated.vehicle?.licensePlate || null,
    vehicleId: updated.vehicle?.id || null,
    totalDebt: updated.arrears.reduce((acc: number, curr) => acc + Number(curr.amountOwed), 0)
  };
};

export const create = async (data: any) => {
  // Filtrar solo los campos permitidos
  const allowedFields = {
    id: data.id,
    userId: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email || null,
    phone: data.phone,
    idNumber: data.idNumber,
    licensePhoto: data.licensePhoto,
    idPhoto: data.idPhoto,
    vehicleId: data.vehicleId || null
  };

  const created = await prisma.driver.create({ 
    data: allowedFields,
    include: {
      vehicle: { select: { id: true, licensePlate: true, rentaValue: true } },
      arrears: { where: { status: 'pending' } }
    }
  });

  // Transformar para que coincida con el formato esperado
  return {
    ...created,
    vehiclePlate: created.vehicle?.licensePlate || null,
    vehicleId: created.vehicle?.id || null,
    totalDebt: created.arrears.reduce((acc: number, curr) => acc + Number(curr.amountOwed), 0)
  };
};

export const update = async (userId: string, id: string, data: any) => {
  // Filtrar solo los campos permitidos para evitar errores de validación
  const allowedFields = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email || null,
    phone: data.phone,
    idNumber: data.idNumber,
    licensePhoto: data.licensePhoto,
    idPhoto: data.idPhoto,
    vehicleId: data.vehicleId || null
  };

  return prisma.driver.update({
    where: { id },
    data: allowedFields
  });
};

export const unassignVehicles = async (userId: string, driverId: string) => {
  // Encontrar el driver para obtener su vehicleId
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { vehicleId: true }
  });
  
  if (driver?.vehicleId) {
    // Desasignar el vehículo actualizando el driver
    await prisma.driver.update({
      where: { id: driverId },
      data: { vehicleId: null }
    });
  }
};

export const remove = async (userId: string, id: string) =>
  prisma.driver.update({ 
    where: { id },
    data: { deletedAt: new Date() }
  });