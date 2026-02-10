import { prisma } from '../../shared/db';

export const findAll = async (userId: string) =>
  prisma.arrear.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' }
  });

export const findByDriver = async (userId: string, driverId: string) =>
  prisma.arrear.findMany({
    where: { userId, driverId },
    orderBy: { dueDate: 'asc' }
  });

export const findById = async (userId: string, id: string) =>
  prisma.arrear.findUnique({ where: { id } });

export const create = async (data: any) =>
  prisma.arrear.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate)
    }
  });

export const markPaid = async (id: string) =>
  prisma.arrear.update({
    where: { id },
    data: { status: 'paid', amountOwed: 0 }
  });

export const reduceAmount = async (id: string, amount: number) =>
  prisma.arrear.update({
    where: { id },
    data: { amountOwed: { decrement: amount } }
  });

export const removeByOriginPayment = async (originPaymentId: string) =>
  prisma.arrear.deleteMany({ where: { originPaymentId } });

export const removeById = async (id: string) =>
  prisma.arrear.delete({ where: { id } });