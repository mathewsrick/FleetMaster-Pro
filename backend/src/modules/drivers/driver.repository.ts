import { prisma } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.driver.findMany({
      where: { userId },
      include: {
        vehicle: { select: {id: true, licensePlate: true, rentaValue: true} },
        arrears: { where: {status: 'pending'} }
      },
      orderBy: { lastName: 'asc' },
      skip,
      take: limit
    }),
    prisma.driver.count({ where: { userId } })
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

export const create = async (data: any) =>
  prisma.driver.create({ data });

export const update = async (userId: string, id: string, data: any) =>
  prisma.driver.update({
    where: { id },
    data
  });

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
  prisma.driver.delete({ where: { id } });