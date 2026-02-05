import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number, startDate?: string, endDate?: string, search?: string }) => {
  const { page, limit, startDate, endDate, search } = options;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM expenses WHERE userId = ?';
  let countQuery = 'SELECT COUNT(*) as count FROM expenses WHERE userId = ?';
  const params: any[] = [userId];

  if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    countQuery += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (search) {
    query += ' AND description LIKE ?';
    countQuery += ' AND description LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';

  const data = dbHelpers.prepare(query).all([...params, limit, offset]);
  const total = dbHelpers.prepare(countQuery).get(params).count;

  return { data, total };
};

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