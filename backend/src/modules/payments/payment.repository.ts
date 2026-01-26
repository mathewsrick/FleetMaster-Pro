import { dbHelpers } from '../../shared/db';

export const findAll = (userId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM payments
    WHERE userId = ?
    ORDER BY date DESC
  `).all([userId]);

export const findByDriver = (userId: string, driverId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM payments
    WHERE userId = ? AND driverId = ?
    ORDER BY date DESC
  `).all([userId, driverId]);

export const create = (p: any) =>
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

export const remove = (userId: string, id: string) => {
    // First remove associated arrears
    dbHelpers.prepare(
        'DELETE FROM arrears WHERE paymentId = ? AND userId = ?'
    ).run([id, userId]);

    // Then remove the payment
    return dbHelpers.prepare(
        'DELETE FROM payments WHERE id = ? AND userId = ?'
    ).run([id, userId]);
};