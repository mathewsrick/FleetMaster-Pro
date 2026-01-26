import { dbHelpers } from '../../shared/db';

export const findKeyById = (keyId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE id = ? AND status = 'active'
  `).get([keyId]);

export const bindKeyToUser = (userId: string, keyId: string) =>
  dbHelpers.prepare(`
    UPDATE subscription_keys
    SET userId = ?
    WHERE id = ?
  `).run([userId, keyId]);

export const deactivateUserKeys = (userId: string) =>
  dbHelpers.prepare(`
    UPDATE subscription_keys
    SET status = 'expired'
    WHERE userId = ?
  `).run([userId]);

export const createKey = (k: any) =>
  dbHelpers.prepare(`
    INSERT INTO subscription_keys (
      id, userId, plan, startDate, dueDate, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    k.id,
    k.userId,
    k.plan,
    k.startDate,
    k.dueDate,
    k.status
  ]);