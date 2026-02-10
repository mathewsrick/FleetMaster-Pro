import { prisma } from '../../shared/db';

export const findKeyById = async (id: string) =>
  prisma.subscriptionKey.findUnique({ where: { id, status: 'active' } });

export const findActiveSubscriptionByUserId = async (userId: string) =>
  prisma.subscriptionKey.findFirst({
    where: { userId, status: 'active' },
    orderBy: { dueDate: 'desc' }
  });

export const bindKeyToUser = async (userId: string, id: string) =>
  prisma.subscriptionKey.update({
    where: { id },
    data: { userId }
  });

export const deactivateUserKeys = async (userId: string) =>
  prisma.subscriptionKey.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'expired' }
  });

export const createKey = async (data: any) =>
  prisma.subscriptionKey.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: new Date(data.dueDate)
    }
  });