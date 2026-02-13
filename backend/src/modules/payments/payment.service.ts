import { v4 as uuid } from 'uuid';
import * as paymentRepo from './payment.repository';
import * as arrearRepo from '../arrears/arrear.repository';
import * as authRepo from '../auth/auth.repository';
import * as driverRepo from '../drivers/driver.repository';
import * as emailService from '../../shared/email.service';
import { prisma } from '../../shared/db';

const PLAN_RESTRICTIONS: any = {
  free_trial: { maxHistoryDays: 30, maxRangeDays: null },
  basico: { maxHistoryDays: 30, maxRangeDays: null },
  pro: { maxHistoryDays: null, maxRangeDays: 90 },
  enterprise: { maxHistoryDays: null, maxRangeDays: null }
};

export const getAll = async (userId: string, query: any, plan: string) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // 🔒 Límite máximo de 100
  let startDate = query.startDate;
  let endDate = query.endDate;

  const restriction = PLAN_RESTRICTIONS[plan] || PLAN_RESTRICTIONS.free_trial;

  if (restriction.maxHistoryDays) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - restriction.maxHistoryDays);
    const minDateStr = minDate.toISOString().split('T')[0];
    if (!startDate || startDate < minDateStr) startDate = minDateStr;
  }

  if (restriction.maxRangeDays && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    if (diffDays > restriction.maxRangeDays) {
      throw new Error(`Su plan Pro permite un rango máximo de ${restriction.maxRangeDays} días de búsqueda.`);
    }
  }

  const result = await paymentRepo.findAll(userId, { page, limit, startDate, endDate });
  return { ...result, page, limit };
};

export const getByDriver = async (userId: string, driverId: string) =>
    await paymentRepo.findByDriver(userId, driverId);

export const create = async (userId: string, data: any) => {
    const {
        generateArrear = true,
        ...paymentData
    } = data;

    const payment = {
        id: paymentData.id || uuid(),
        userId,
        ...paymentData,
        amount: Number(paymentData.amount)
    };

    await arrearRepo.removeByOriginPayment(payment.id);
    await paymentRepo.create(payment);

    let createdArrearAmount = 0;

    if ((!payment.type || payment.type === 'renta') && generateArrear) {
        // Reemplazo de dbHelpers por prisma.vehicle.findUnique
        const vehicle = await prisma.vehicle.findUnique({ where: { id: payment.vehicleId } });

        if (vehicle && payment.amount < Number(vehicle.rentaValue)) {
            createdArrearAmount = Number(vehicle.rentaValue) - payment.amount;
            await arrearRepo.create({
                id: uuid(),
                userId,
                amountOwed: createdArrearAmount,
                status: 'pending',
                driverId: payment.driverId,
                vehicleId: payment.vehicleId,
                dueDate: payment.date,
                originPaymentId: payment.id
            });
        }
    }

    const allPendingArrears = await arrearRepo.findByDriver(userId, payment.driverId);
    const pendingArrears = allPendingArrears.filter((a: any) => a.status === 'pending');
    const totalAccumulatedDebt = pendingArrears.reduce((sum: number, a: any) => sum + Number(a.amountOwed), 0);

    const driver: any = await driverRepo.findById(userId, payment.driverId);
    if (driver && driver.email) {
        await emailService.sendEmail({
            to: driver.email,
            subject: `Recibo de Pago - FleetMaster Hub - $${payment.amount.toLocaleString()}`,
            html: emailService.templates.paymentConfirmation(
                payment.amount, 
                payment.date, 
                payment.type,
                createdArrearAmount,
                totalAccumulatedDebt,
                pendingArrears
            )
        });
    }

    const user = await authRepo.findUserById(userId);
    if (user && user.email) {
        await emailService.sendEmail({
            to: user.email,
            subject: `[ADMIN] Nuevo Recaudo - ${driver?.firstName || 'Conductor'} - $${payment.amount.toLocaleString()}`,
            html: emailService.templates.paymentConfirmation(
                payment.amount, 
                payment.date, 
                payment.type,
                createdArrearAmount,
                totalAccumulatedDebt,
                pendingArrears
            )
        });
    }
};

export const remove = async (userId: string, id: string) => {
    const payment = await paymentRepo.findById(userId, id);
    if (!payment) return;

    if (payment.type === 'arrear_payment' && payment.arrearId) {
        // Reemplazo de dbHelpers por prisma.arrear.update
        await prisma.arrear.update({
            where: { id: payment.arrearId },
            data: {
                amountOwed: { increment: payment.amount },
                status: 'pending'
            }
        });
    }

    if (!payment.type || payment.type === 'renta') {
        await arrearRepo.removeByOriginPayment(id);
    }

    await paymentRepo.remove(userId, id);
};