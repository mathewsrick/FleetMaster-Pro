import * as service from './arrear.service';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../shared/db';
export const all = async (req, res) => {
    res.json(await service.getAll(req.user.userId));
};
export const byDriver = async (req, res) => {
    if (!req.params.driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
    }
    res.json(await service.getByDriver(req.user.userId, req.params.driverId));
};
export const pay = async (req, res) => {
    const { amount, date } = req.body;
    const arrear = await service.pay(req.user.userId, req.params.id, amount);
    // Reemplazamos dbHelpers.prepare por prisma.payment.create
    await prisma.payment.create({
        data: {
            id: uuid(),
            userId: req.user.userId,
            amount: amount,
            date: new Date(date),
            driverId: arrear.driverId,
            vehicleId: arrear.vehicleId,
            type: 'arrear_payment',
            arrearId: arrear.id
        }
    });
    res.json({ success: true });
};
export const createFromPartialPayment = async (req, res) => {
    await service.createFromPartialPayment({
        id: uuid(),
        userId: req.user.userId,
        amountOwed: req.body.amountOwed,
        status: 'pending',
        driverId: req.body.driverId,
        vehicleId: req.body.vehicleId,
        dueDate: req.body.dueDate,
        originPaymentId: req.body.originPaymentId
    });
    res.json({ success: true });
};
export const removeByOriginPayment = async (req, res) => {
    await service.removeByOriginPayment(req.params.paymentId);
    res.json({ success: true });
};
export const removeById = async (req, res) => {
    await service.removeById(req.params.id);
    res.json({ success: true });
};
//# sourceMappingURL=arrear.controller.js.map