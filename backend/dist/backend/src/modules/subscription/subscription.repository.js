import { prisma } from '../../shared/db';
export const findKeyById = async (id) => prisma.subscriptionKey.findUnique({ where: { id, status: 'active' } });
export const findActiveSubscriptionByUserId = async (userId) => prisma.subscriptionKey.findFirst({
    where: { userId, status: 'active' },
    orderBy: { dueDate: 'desc' }
});
export const bindKeyToUser = async (userId, id) => prisma.subscriptionKey.update({
    where: { id },
    data: { userId }
});
export const deactivateUserKeys = async (userId) => prisma.subscriptionKey.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'expired' }
});
export const createKey = async (data) => prisma.subscriptionKey.create({
    data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: new Date(data.dueDate)
    }
});
//# sourceMappingURL=subscription.repository.js.map