import { prisma } from '@/shared/db.js';

export const findAll = async (userId: string, options: { page: number, limit: number, startDate?: string, endDate?: string, search?: string }) => {
  const { page, limit, startDate, endDate, search } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) };
  }
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
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
      date: new Date(data.date)
    }
  });

export const update = async (userId: string, data: any) =>
  prisma.expense.update({
    where: { id: data.id },
    data: {
      ...data,
      date: new Date(data.date)
    }
  });

export const remove = async (userId: string, id: string) =>
  prisma.expense.delete({ where: { id } });