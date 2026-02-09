import { dbHelpers } from '../../shared/db';
import { Subscription } from './subscription.entity';

export const findKeyById = async (keyId: string): Promise<Subscription | null> =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE id = ? AND status = 'active'
  `).get([keyId]);

// findActiveSubscriptionByUserId: Busca la suscripción activa más reciente para un usuario
export const findActiveSubscriptionByUserId = async (userId: string): Promise<Subscription | null> =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE userId = ? AND status = 'active'
    ORDER BY dueDate DESC
    LIMIT 1
  `).get([userId]);

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
      id, userId, plan, price, months, startDate, dueDate, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run([
    k.id,
    k.userId ?? null,
    k.plan,
    k.price ?? 0,
    k.months ?? 1,
    k.startDate ?? new Date().toISOString(),
    k.dueDate ?? new Date().toISOString(),
    k.status
  ]);