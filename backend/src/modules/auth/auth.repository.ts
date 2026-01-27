import { dbHelpers } from '../../shared/db';

export const findUserByUsername = async (username: string) =>
  dbHelpers
    .prepare('SELECT * FROM users WHERE username = ?')
    .get([username]);

export const createUser = async (u: any) =>
  dbHelpers.prepare(`
    INSERT INTO users (id, username, password, createdAt)
    VALUES (?, ?, ?, ?)
  `).run([
    u.id,
    u.username,
    u.password,
    u.createdAt ?? new Date().toISOString()
  ]);

export const getActiveSubscription = async (userId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE userId = ? AND status = 'active'
    ORDER BY dueDate DESC
    LIMIT 1
  `).get([userId]);

export const bindSubscriptionKey = async (userId: string, keyId: string) =>
  dbHelpers.prepare(`
    UPDATE subscription_keys
    SET userId = ?
    WHERE id = ?
  `).run([userId, keyId]);