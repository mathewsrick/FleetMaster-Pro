import * as service from './arrear.service';
import { v4 as uuid } from 'uuid';
import { dbHelpers } from '../../shared/db';

export const byDriver = (req: any, res: any) => {
  res.json(service.getByDriver(req.userId, req.params.driverId));
};

export const pay = (req: any, res: any) => {
  const { amount, date } = req.body;

  const arrear = service.pay(req.userId, req.params.id, amount);

  dbHelpers.prepare(`
    INSERT INTO payments (
      id, userId, amount, date,
      driverId, vehicleId, type, arrearId
    ) VALUES (?, ?, ?, ?, ?, ?, 'arrear_payment', ?)
  `).run([
    uuid(),
    req.userId,
    amount,
    date,
    arrear.driverId,
    arrear.vehicleId,
    arrear.id
  ]);

  res.json({ success: true });
};

export const createFromPartialPayment = (req: any, res: any) => {
  service.createFromPartialPayment({
    id: uuid(),
    userId: req.userId,
    amountOwed: req.body.amountOwed,
    status: 'pending',
    driverId: req.body.driverId,
    vehicleId: req.body.vehicleId,
    dueDate: req.body.dueDate,
    originPaymentId: req.body.originPaymentId
  });

  res.json({ success: true });
};

export const removeByOriginPayment = (req: any, res: any) => {
    service.removeByOriginPayment(req.params.paymentId);
    res.json({ success: true });
};

export const removeById = (req: any, res: any) => {
    service.removeById(req.params.id);
    res.json({ success: true });
};