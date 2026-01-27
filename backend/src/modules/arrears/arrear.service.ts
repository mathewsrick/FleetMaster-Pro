import { v4 as uuid } from 'uuid';
import * as repo from './arrear.repository';

export const getAll = async (userId: string) => repo.findAll(userId);

export const getByDriver = async (userId: string, driverId: string) =>
  repo.findByDriver(userId, driverId);

export const pay = async (userId: string, arrearId: string, amount: number) => {
  const arrear = await repo.findById(userId, arrearId);
  if (!arrear) throw new Error('Arrear not found');

  if (amount >= arrear.amountOwed) {
    await repo.markPaid(arrearId);
  } else {
    await repo.reduceAmount(arrearId, amount);
  }

  return arrear;
};

export const createFromPartialPayment = async (data: any) => {
  await repo.create({
    id: uuid(),
    status: 'pending',
    ...data
  });
};

export const removeByOriginPayment = async (paymentId: string) => {
    await repo.removeByOriginPayment(paymentId);
};

export const removeById = async (id: string) => {
    await repo.removeById(id);
};