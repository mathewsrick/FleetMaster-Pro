import { Payment } from './payment.entity';
import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number, startDate?: string, endDate?: string }): Promise<{ data: Payment[], total: number }> => {
  const { page, limit, startDate, endDate } = options;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM payments WHERE userId = ?';
  let countQuery = 'SELECT COUNT(*) as count FROM payments WHERE userId = ?';
  const params: any[] = [userId];

  if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    countQuery += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  
  const data = dbHelpers.prepare(query).all([...params, limit, offset]) as Payment[];
  const total = dbHelpers.prepare(countQuery).get(params).count;

  return { data, total };
};

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
        'DELETE FROM arrears WHERE originPaymentId = ? AND userId = ?'
    ).run([id, userId]);

    return dbHelpers.prepare(
        'DELETE FROM payments WHERE id = ? AND userId = ?'
    ).run([id, userId]);
};