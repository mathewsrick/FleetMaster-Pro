import { prisma } from '@/shared/db.js';

export const findAll = async (userId: string, options: { page: number, limit: number, startDate?: string, endDate?: string }) => {
  const { page, limit, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { date: 'desc' },
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
    orderBy: { date: 'desc' }
  });

export const create = async (data: any) => {
  const { generateArrear, ...paymentData } = data;

  return prisma.payment.create({
    data: {
      ...paymentData,
      date: new Date(paymentData.date)
    }
  });
};

export const remove = async (userId: string, id: string) =>
  prisma.payment.delete({ where: { id } });