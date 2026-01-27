import { dbHelpers } from '../../shared/db';
import { Subscription } from './subscription.entity';

export const findKeyById = async (keyId: string): Promise<Subscription | null> =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE id = ? AND status = 'active'
  `).get([keyId]);

export const bindKeyToUser = async (userId: string, keyId: string) =>
  dbHelpers.prepare(`
    UPDATE subscription_keys
    SET userId = ?
    WHERE id = ?
  `).run([userId, keyId]);

export const deactivateUserKeys = async (userId: string) =>
  dbHelpers.prepare(`
    UPDATE subscription_keys
    SET status = 'expired'
    WHERE userId = ?
  `).run([userId]);

export const createKey = async (k: Subscription) =>
  dbHelpers.prepare(`
    INSERT INTO subscription_keys (
      id, userId, plan, startDate, dueDate, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    k.id,
    k.userId ?? null,
    k.plan,
    k.price ?? 0,
    k.startDate ?? new Date().toISOString(),
    k.dueDate ?? new Date().toISOString(),
    k.status
  ]);