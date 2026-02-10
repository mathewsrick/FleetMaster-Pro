import { prisma } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: { userId },
      include: { driver: true },
      orderBy: { licensePlate: 'asc' },
      skip,
      take: limit
    }),
    prisma.vehicle.count({ where: { userId } })
  ]);

  const transformed = data.map(v => ({
    ...v,
    driverName: v.driver ? `${v.driver.firstName} ${v.driver.lastName}` : null
  }));

  return { data: transformed, total };
};

export const findById = async (id: string) =>
  prisma.vehicle.findUnique({ where: { id } });

export const create = async (data: any) =>
  prisma.vehicle.create({
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      soatExpiration: data.soatExpiration ? new Date(data.soatExpiration) : null,
      techExpiration: data.techExpiration ? new Date(data.techExpiration) : null,
    }
  });

export const update = async (userId: string, data: any) =>
  prisma.vehicle.update({
    where: { id: data.id },
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      soatExpiration: data.soatExpiration ? new Date(data.soatExpiration) : null,
      techExpiration: data.techExpiration ? new Date(data.techExpiration) : null,
    }
  });

export const remove = async (userId: string, id: string) =>
  prisma.vehicle.delete({ where: { id } });