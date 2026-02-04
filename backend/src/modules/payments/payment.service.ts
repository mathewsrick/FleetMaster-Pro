import { v4 as uuid } from 'uuid';
import * as paymentRepo from './payment.repository';
import * as arrearRepo from '../arrears/arrear.repository';
import * as authRepo from '../auth/auth.repository';
import * as emailService from '../../shared/email.service';
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

    // Notificar por correo al dueño de la flota utilizando su email registrado
    const user = await authRepo.findUserById(userId);
    if (user && user.email) {
        await emailService.sendEmail({
            to: user.email,
            subject: "Comprobante de Pago Recibido - FleetMaster Pro",
            html: emailService.templates.paymentConfirmation(payment.amount, payment.date, payment.type)
        });
    }
};

export const remove = async (userId: string, id: string) => {
        await paymentRepo.remove(userId, id);
};