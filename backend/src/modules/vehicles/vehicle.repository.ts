import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const data = dbHelpers
    .prepare('SELECT * FROM vehicles WHERE userId = ? ORDER BY licensePlate ASC LIMIT ? OFFSET ?')
    .all([userId, limit, offset]);

  const total = dbHelpers
    .prepare('SELECT COUNT(*) as count FROM vehicles WHERE userId = ?')
    .get([userId]).count;

  return { data, total };
};

export const findById = async (id: string) =>
  await dbHelpers
    .prepare('SELECT id FROM vehicles WHERE id = ?')
    .get([id]);

export const create = async (v: any) =>
  dbHelpers.prepare(`
    INSERT INTO vehicles (
      id, userId, year, licensePlate, model, color,
      purchaseDate, insurance, insuranceNumber,
      soatExpiration, techExpiration, canonValue, driverId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run([
    v.id,
    v.userId,
    v.year,
    v.licensePlate,
    v.model,
    v.color,
    v.purchaseDate,
    v.insurance,
    v.insuranceNumber,
    v.soatExpiration,
    v.techExpiration,
    v.canonValue,
    v.driverId
  ]);

export const update = async (userId: string, v: any) =>
  dbHelpers.prepare(`
    UPDATE vehicles SET
      year=?, licensePlate=?, model=?, color=?, purchaseDate=?,
      insurance=?, insuranceNumber=?, soatExpiration=?, techExpiration=?,
      canonValue=?, driverId=?
    WHERE id=? AND userId=?
  `).run([
    v.year,
    v.licensePlate,
    v.model,
    v.color,
    v.purchaseDate,
    v.insurance,
    v.insuranceNumber,
    v.soatExpiration,
    v.techExpiration,
    v.canonValue,
    v.driverId,
    v.id,
    userId
  ]);

export const remove = async (userId: string, id: string) =>
  dbHelpers
    .prepare('DELETE FROM vehicles WHERE id = ? AND userId = ?')
    .run([id, userId]);