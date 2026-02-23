import { prisma } from '../../shared/db.js';

export const findAll = async (userId: string, options: { page: number, limit: number, startDate?: string, endDate?: string, search?: string, vehicleId?: string, type?: string }) => {
  const { page, limit, startDate, endDate, search, vehicleId, type } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (startDate && endDate) {
    // Usar UTC explícitamente con TIMESTAMPTZ
    const startDateObj = new Date(startDate + 'T00:00:00.000Z');
    const endDateObj = new Date(endDate + 'T23:59:59.999Z');
    
    where.date = { 
      gte: startDateObj, 
      lte: endDateObj 
    };
  }
  if (search) {
    // Buscar en descripción O en tipo
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { type: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (vehicleId) {
    where.vehicleId = vehicleId;
  }
  if (type) {
    where.type = type;
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.expense.count({ where })
  ]);

  return { data, total };
};

export const findById = async (id: string) =>
  prisma.expense.findUnique({ where: { id } });

export const create = async (data: any) =>
  prisma.expense.create({
    data: {
      ...data,
      // Convertir a UTC si viene como string
      date: data.date instanceof Date 
        ? data.date 
        : new Date(data.date + (data.date.includes('T') ? '' : 'T00:00:00.000Z'))
    }
  });

export const update = async (userId: string, data: any) =>
  prisma.expense.update({
    where: { id: data.id },
    data: {
      ...data,
      // Convertir a UTC si viene como string
      date: data.date instanceof Date 
        ? data.date 
        : new Date(data.date + (data.date.includes('T') ? '' : 'T00:00:00.000Z'))
    }
  });

export const remove = async (userId: string, id: string) =>
  prisma.expense.delete({ where: { id } });