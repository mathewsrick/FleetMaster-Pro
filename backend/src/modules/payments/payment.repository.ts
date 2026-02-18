import { prisma } from '../../shared/db.js';

export const findAll = async (userId: string, options: { page: number, limit: number, startDate?: string, endDate?: string }) => {
  const { page, limit, startDate, endDate } = options;
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

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.payment.count({ where })
  ]);

  return { data, total };
};

export const findById = async (userId: string, id: string) =>
  prisma.payment.findUnique({ where: { id } });

export const findByDriver = async (userId: string, driverId: string) =>
  prisma.payment.findMany({
    where: { userId, driverId },
    orderBy: { createdAt: 'desc' }
  });

export const create = async (data: any) => {
  const { generateArrear, ...paymentData } = data;

  return prisma.payment.create({
    data: {
      ...paymentData,
      // Convertir a UTC si viene como string
      date: paymentData.date instanceof Date 
        ? paymentData.date 
        : new Date(paymentData.date + (paymentData.date.includes('T') ? '' : 'T00:00:00.000Z'))
    }
  });
};

export const remove = async (userId: string, id: string) =>
  prisma.payment.delete({ where: { id } });