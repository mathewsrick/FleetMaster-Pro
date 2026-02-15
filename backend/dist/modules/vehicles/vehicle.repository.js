import { prisma } from '../../shared/db';
export const findAll = async (userId, options) => {
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
export const findById = async (id) => prisma.vehicle.findUnique({ where: { id } });
export const create = async (userId, data) => {
    return prisma.vehicle.create({
        data: {
            id: data.id,
            userId,
            year: Number(data.year),
            licensePlate: data.licensePlate,
            model: data.model,
            color: data.color,
            purchaseDate: data.purchaseDate
                ? new Date(data.purchaseDate)
                : null,
            insurance: data.insurance || null,
            insuranceNumber: data.insuranceNumber || null,
            soatExpiration: data.soatExpiration
                ? new Date(data.soatExpiration)
                : null,
            techExpiration: data.techExpiration
                ? new Date(data.techExpiration)
                : null,
            rentaValue: Number(data.rentaValue),
            photos: Array.isArray(data.photos) ? data.photos : []
        }
    });
};
export const update = async (userId, payload) => {
    if (!payload?.id) {
        throw new Error('Vehicle ID is required');
    }
    const existing = await prisma.vehicle.findFirst({
        where: {
            id: payload.id,
            userId
        }
    });
    if (!existing) {
        throw new Error('Vehículo no encontrado');
    }
    return prisma.vehicle.update({
        where: { id: payload.id },
        data: {
            year: Number(payload.year),
            licensePlate: payload.licensePlate,
            model: payload.model,
            color: payload.color,
            purchaseDate: payload.purchaseDate
                ? new Date(payload.purchaseDate)
                : null,
            insurance: payload.insurance || null,
            insuranceNumber: payload.insuranceNumber || null,
            soatExpiration: payload.soatExpiration
                ? new Date(payload.soatExpiration)
                : null,
            techExpiration: payload.techExpiration
                ? new Date(payload.techExpiration)
                : null,
            rentaValue: Number(payload.rentaValue),
            photos: Array.isArray(payload.photos)
                ? payload.photos
                : []
        }
    });
};
export const remove = async (userId, id) => {
    // Validar pertenencia al tenant
    const vehicle = await prisma.vehicle.findFirst({
        where: { id, userId }
    });
    if (!vehicle) {
        throw new Error('Vehículo no encontrado');
    }
    return prisma.vehicle.delete({ where: { id } });
};
