import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const data = dbHelpers.prepare(
    'SELECT * FROM drivers WHERE userId = ? ORDER BY lastName ASC LIMIT ? OFFSET ?'
  ).all([userId, limit, offset]);

  const total = dbHelpers.prepare(
    'SELECT COUNT(*) as count FROM drivers WHERE userId = ?'
  ).get([userId]).count;

  return { data, total };
};

export const create = async (d: any) =>
  dbHelpers.prepare(`
    INSERT INTO drivers (id, userId, firstName, lastName, phone, idNumber)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    d.id,
    d.userId,
    d.firstName,
    d.lastName,
    d.phone,
    d.idNumber,
  ]);

export const update = async (userId: string, id: string, d: any) =>
  dbHelpers.prepare(`
    UPDATE drivers
    SET firstName=?, lastName=?, phone=?, idNumber=?
    WHERE id=? AND userId=?
  `).run([
    d.firstName,
    d.lastName,
    d.phone,
    d.idNumber,
    id,
    userId,
  ]);

export const unassignVehicles = async (userId: string, driverId: string) =>
  dbHelpers.prepare(
    'UPDATE vehicles SET driverId = NULL WHERE driverId = ? AND userId = ?'
  ).run([driverId, userId]);

export const remove = async (userId: string, id: string) =>
  dbHelpers.prepare(
    'DELETE FROM drivers WHERE id = ? AND userId = ?'
  ).run([id, userId]);