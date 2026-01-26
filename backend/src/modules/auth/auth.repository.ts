import { dbHelpers } from '../../shared/db';

export const findUserByUsername = (username: string) =>
  dbHelpers
    .prepare('SELECT * FROM users WHERE username = ?')
    .get([username]);

export const createUser = (u: any) =>
  dbHelpers.prepare(`
    INSERT INTO users (id, username, password, createdAt)
    VALUES (?, ?, ?, ?)
  `).run([
    u.id,
    u.username,
    u.password,
    u.createdAt
  ]);

export const getActiveSubscription = (userId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE userId = ? AND status = 'active'
    ORDER BY dueDate DESC
    LIMIT 1
  `).get([userId]);

export const bindSubscriptionKey = (userId: string, keyId: string) =>
  dbHelpers.prepare(`
    UPDATE subscription_keys
    SET userId = ?
    WHERE id = ?
  `).run([userId, keyId]);