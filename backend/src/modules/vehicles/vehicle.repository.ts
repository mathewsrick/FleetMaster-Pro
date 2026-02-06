import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const data = dbHelpers
    .prepare(`
      SELECT v.*, d.firstName || ' ' || d.lastName as driverName
      FROM vehicles v
      LEFT JOIN drivers d ON v.driverId = d.id
      WHERE v.userId = ? 
      ORDER BY v.licensePlate ASC 
      LIMIT ? OFFSET ?
    `)
    .all([userId, limit, offset]);

  // Transform photos from JSON string to array
  const transformed = data.map((v: any) => ({
    ...v,
    photos: v.photos ? JSON.parse(v.photos) : []
  }));

  const total = dbHelpers
    .prepare('SELECT COUNT(*) as count FROM vehicles WHERE userId = ?')
    .get([userId]).count;

  return { data: transformed, total };
};

export const findById = async (id: string) => {
  const v = await dbHelpers
    .prepare('SELECT id FROM vehicles WHERE id = ?')
    .get([id]);
  return v;
};

export const create = async (v: any) =>
  dbHelpers.prepare(`
    INSERT INTO vehicles (
      id, userId, year, licensePlate, model, color,
      purchaseDate, insurance, insuranceNumber,
      soatExpiration, techExpiration, canonValue, driverId, photos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    v.driverId,
    JSON.stringify(v.photos || [])
  ]);

export const update = async (userId: string, v: any) =>
  dbHelpers.prepare(`
    UPDATE vehicles SET
      year=?, licensePlate=?, model=?, color=?, purchaseDate=?,
      insurance=?, insuranceNumber=?, soatExpiration=?, techExpiration=?,
      canonValue=?, driverId=?, photos=?
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
    JSON.stringify(v.photos || []),
    v.id,
    userId
  ]);

export const remove = async (userId: string, id: string) =>
  dbHelpers
    .prepare('DELETE FROM vehicles WHERE id = ? AND userId = ?')
    .run([id, userId]);