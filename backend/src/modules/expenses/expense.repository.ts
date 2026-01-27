import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string) =>
  dbHelpers
    .prepare(`
      SELECT * FROM expenses
      WHERE userId = ?
      ORDER BY date DESC
    `)
    .all([userId]);

export const findById = async (id: string) =>
  dbHelpers
    .prepare('SELECT id FROM expenses WHERE id = ?')
    .get([id]);

export const create = async (e: any) =>
  dbHelpers.prepare(`
    INSERT INTO expenses (id, userId, description, amount, date, vehicleId)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    e.id,
    e.userId,
    e.description,
    e.amount,
    e.date,
    e.vehicleId
  ]);

export const update = async (userId: string, e: any) =>
  dbHelpers.prepare(`
    UPDATE expenses
    SET description=?, amount=?, date=?, vehicleId=?
    WHERE id=? AND userId=?
  `).run([
    e.description,
    e.amount,
    e.date,
    e.vehicleId,
    e.id,
    userId
  ]);

export const remove = async (userId: string, id: string) =>
  dbHelpers.prepare(`
    DELETE FROM expenses
    WHERE id=? AND userId=?
  `).run([id, userId]);