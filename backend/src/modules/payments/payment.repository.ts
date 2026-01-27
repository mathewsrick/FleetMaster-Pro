import { Payment } from './payment.entity';
import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string): Promise<Payment[]> =>
  dbHelpers.prepare(`
    SELECT * FROM payments
    WHERE userId = ?
    ORDER BY date DESC
  `).all([userId]) as Payment[];

export const findByDriver = async (userId: string, driverId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM payments
    WHERE userId = ? AND driverId = ?
    ORDER BY date DESC
  `).all([userId, driverId]);

export const create = async (p: any) =>
  dbHelpers.prepare(`
    INSERT INTO payments (
      id, userId, amount, date,
      driverId, vehicleId, type, arrearId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run([
    p.id,
    p.userId,
    p.amount,
    p.date,
    p.driverId,
    p.vehicleId,
    p.type,
    p.arrearId
  ]);

export const remove = async (userId: string, id: string) => {
    dbHelpers.prepare(
        'DELETE FROM arrears WHERE paymentId = ? AND userId = ?'
    ).run([id, userId]);

    return dbHelpers.prepare(
        'DELETE FROM payments WHERE id = ? AND userId = ?'
    ).run([id, userId]);
};
