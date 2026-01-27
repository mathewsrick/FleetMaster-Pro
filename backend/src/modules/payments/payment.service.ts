import { v4 as uuid } from 'uuid';
import * as paymentRepo from './payment.repository';
import * as arrearRepo from '../arrears/arrear.repository';
import { dbHelpers } from '../../shared/db';

export const getAll = async (userId: string) =>
    await paymentRepo.findAll(userId);

export const getByDriver = async (userId: string, driverId: string) =>
    await paymentRepo.findByDriver(userId, driverId);

export const create = async (userId: string, data: any) => {
    const payment = {
            id: data.id || uuid(),
            userId,
            ...data,
            generateArrear: data.generateArrear !== undefined ? data.generateArrear : true
    };

    // eliminar mora previa
    await arrearRepo.removeByOriginPayment(payment.id);

    await paymentRepo.create(payment);

    if ((!payment.type || payment.type === 'canon') && payment.generateArrear !== false) {
        const vehicle: any = dbHelpers
            .prepare('SELECT canonValue FROM vehicles WHERE id = ?')
            .get([payment.vehicleId]);

        if (vehicle && payment.amount < vehicle.canonValue) {
            await arrearRepo.create({
                id: uuid(),
                userId,
                amountOwed: vehicle.canonValue - payment.amount,
                status: 'pending',
                driverId: payment.driverId,
                vehicleId: payment.vehicleId,
                dueDate: payment.date,
                originPaymentId: payment.id
            });
        }
    }
};

export const remove = async (userId: string, id: string) => {
        await paymentRepo.remove(userId, id);
};
