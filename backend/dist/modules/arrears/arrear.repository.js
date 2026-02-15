import { prisma } from '../../shared/db';
export const findAll = async (userId) => prisma.arrear.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' }
});
export const findByDriver = async (userId, driverId) => prisma.arrear.findMany({
    where: { userId, driverId },
    orderBy: { dueDate: 'asc' }
});
export const findById = async (userId, id) => prisma.arrear.findUnique({ where: { id } });
export const create = async (data) => prisma.arrear.create({
    data: {
        ...data,
        dueDate: new Date(data.dueDate)
    }
});
export const markPaid = async (id) => prisma.arrear.update({
    where: { id },
    data: { status: 'paid', amountOwed: 0 }
});
export const reduceAmount = async (id, amount) => prisma.arrear.update({
    where: { id },
    data: { amountOwed: { decrement: amount } }
});
export const removeByOriginPayment = async (originPaymentId) => prisma.arrear.deleteMany({ where: { originPaymentId } });
export const removeById = async (id) => prisma.arrear.delete({ where: { id } });
