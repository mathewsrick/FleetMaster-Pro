import { v4 as uuid } from 'uuid';
import * as paymentRepo from './payment.repository';
import * as arrearRepo from '../arrears/arrear.repository';
import { dbHelpers } from '../../shared/db';

export const getAll = (userId: string) =>
  paymentRepo.findAll(userId);

export const getByDriver = (userId: string, driverId: string) =>
  paymentRepo.findByDriver(userId, driverId);

export const create = (userId: string, data: any) => {
    const payment = {
        id: data.id || uuid(),
        userId,
        ...data,
        generateArrear: data.generateArrear !== undefined ? data.generateArrear : true
    };

    // eliminar mora previa
    arrearRepo.removeByOriginPayment(payment.id);

    paymentRepo.create(payment);

    if ((!payment.type || payment.type === 'canon') && payment.generateArrear !== false) {
        const vehicle: any = dbHelpers
            .prepare('SELECT canonValue FROM vehicles WHERE id = ?')
            .get([payment.vehicleId]);

        if (vehicle && payment.amount < vehicle.canonValue) {
            arrearRepo.create({
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

export const remove = (userId: string, id: string) => {
    paymentRepo.remove(userId, id);
};

