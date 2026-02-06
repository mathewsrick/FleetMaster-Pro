import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string, options: { page: number, limit: number }) => {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const query = `
    SELECT d.*, 
           v.licensePlate as vehiclePlate,
           v.id as vehicleId,
           (SELECT IFNULL(SUM(amountOwed), 0) FROM arrears WHERE driverId = d.id AND status = 'pending') as totalDebt
    FROM drivers d
    LEFT JOIN vehicles v ON v.driverId = d.id
    WHERE d.userId = ? 
    ORDER BY d.lastName ASC 
    LIMIT ? OFFSET ?
  `;

  const data = dbHelpers.prepare(query).all([userId, limit, offset]);

  const total = dbHelpers.prepare(
    'SELECT COUNT(*) as count FROM drivers WHERE userId = ?'
  ).get([userId]).count;

  return { data, total };
};

export const create = async (d: any) =>
  dbHelpers.prepare(`
    INSERT INTO drivers (id, userId, firstName, lastName, phone, idNumber, licensePhoto, idPhoto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run([
    d.id,
    d.userId,
    d.firstName,
    d.lastName,
    d.phone,
    d.idNumber,
    d.licensePhoto || null,
    d.idPhoto || null
  ]);

export const update = async (userId: string, id: string, d: any) =>
  dbHelpers.prepare(`
    UPDATE drivers
    SET firstName=?, lastName=?, phone=?, idNumber=?, licensePhoto=?, idPhoto=?
    WHERE id=? AND userId=?
  `).run([
    d.firstName,
    d.lastName,
    d.phone,
    d.idNumber,
    d.licensePhoto,
    d.idPhoto,
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
  ).run([id, userId]);1