import { v4 as uuid } from 'uuid';
import * as repo from './arrear.repository';
export const getAll = async (userId) => repo.findAll(userId);
export const getByDriver = async (userId, driverId) => repo.findByDriver(userId, driverId);
export const pay = async (userId, arrearId, amount) => {
    const arrear = await repo.findById(userId, arrearId);
    if (!arrear)
        throw new Error('Arrear not found');
    const amountOwed = Number(arrear.amountOwed);
    if (amount >= amountOwed) {
        await repo.markPaid(arrearId);
    }
    else {
        await repo.reduceAmount(arrearId, amount);
    }
    return arrear;
};
export const createFromPartialPayment = async (data) => {
    await repo.create({
        id: uuid(),
        status: 'pending',
        ...data
    });
};
export const removeByOriginPayment = async (paymentId) => {
    await repo.removeByOriginPayment(paymentId);
};
export const removeById = async (id) => {
    await repo.removeById(id);
};
//# sourceMappingURL=arrear.service.js.map