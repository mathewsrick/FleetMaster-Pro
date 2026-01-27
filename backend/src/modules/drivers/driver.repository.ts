import { dbHelpers } from '../../shared/db';

export const findAll = async (userId: string) =>
  dbHelpers.prepare(
    'SELECT * FROM drivers WHERE userId = ?'
  ).all([userId]);

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