import { prisma } from '../../shared/db';
export const findAll = async (userId, options) => {
    const { page, limit, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    const where = { userId };
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
export const findById = async (userId, id) => prisma.payment.findUnique({ where: { id } });
export const findByDriver = async (userId, driverId) => prisma.payment.findMany({
    where: { userId, driverId },
    orderBy: { date: 'desc' }
});
export const create = async (data) => {
    const { generateArrear, ...paymentData } = data;
    return prisma.payment.create({
        data: {
            ...paymentData,
            date: new Date(paymentData.date)
        }
    });
};
export const remove = async (userId, id) => prisma.payment.delete({ where: { id } });
//# sourceMappingURL=payment.repository.js.map