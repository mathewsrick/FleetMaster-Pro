import { dbHelpers } from '../../shared/db';

export const findByDriver = async (userId: string, driverId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM arrears
    WHERE userId = ? AND driverId = ?
    ORDER BY dueDate ASC
  `).all([userId, driverId]);

export const findById = async (userId: string, id: string) =>
  dbHelpers.prepare(`
    SELECT * FROM arrears WHERE id = ? AND userId = ?
  `).get([id, userId]);

export const create = async (a: any) =>
  dbHelpers.prepare(`
    INSERT INTO arrears (
      id, userId, amountOwed, status,
      driverId, vehicleId, dueDate, originPaymentId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run([
    a.id,
    a.userId,
    a.amountOwed,
    a.status,
    a.driverId,
    a.vehicleId,
    a.dueDate,
    a.originPaymentId
  ]);

export const markPaid = async (id: string) =>
  dbHelpers.prepare(`
    UPDATE arrears SET status='paid', amountOwed=0 WHERE id=?
  `).run([id]);

export const reduceAmount = async (id: string, amount: number) =>
  dbHelpers.prepare(`
    UPDATE arrears SET amountOwed = amountOwed - ? WHERE id = ?
  `).run([amount, id]);

export const removeByOriginPayment = async (paymentId: string) =>
    dbHelpers.prepare(`
        DELETE FROM arrears WHERE originPaymentId = ?
    `).run([paymentId]);

export const removeById = async (id: string) =>
    dbHelpers.prepare(`
        DELETE FROM arrears WHERE id = ?
    `).run([id]);