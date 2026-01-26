import { v4 as uuid } from 'uuid';
import * as repo from './arrear.repository';

export const getByDriver = (userId: string, driverId: string) =>
  repo.findByDriver(userId, driverId);

export const pay = (userId: string, arrearId: string, amount: number) => {
  const arrear = repo.findById(userId, arrearId);
  if (!arrear) throw new Error('Arrear not found');

  if (amount >= arrear.amountOwed) {
    repo.markPaid(arrearId);
  } else {
    repo.reduceAmount(arrearId, amount);
  }

  return arrear;
};

export const createFromPartialPayment = (data: any) => {
  repo.create({
    id: uuid(),
    status: 'pending',
    ...data
  });
};

export const removeByOriginPayment = (paymentId: string) => {
    repo.removeByOriginPayment(paymentId);
};

export const removeById = (id: string) => {
    repo.removeById(id);
};