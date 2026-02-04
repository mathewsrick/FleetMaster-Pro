import { dbHelpers } from '../../shared/db';

export const findUserByUsername = async (username: string) =>
  dbHelpers.prepare('SELECT * FROM users WHERE username = ?').get([username]);

export const findUserByEmail = async (email: string) =>
  dbHelpers.prepare('SELECT * FROM users WHERE email = ?').get([email]);

export const findUserByIdentifier = async (identifier: string) =>
  dbHelpers.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get([identifier, identifier]);

export const findUserById = async (id: string) =>
  dbHelpers.prepare('SELECT * FROM users WHERE id = ?').get([id]);

export const findUserByConfirmationToken = async (token: string) =>
  dbHelpers.prepare('SELECT * FROM users WHERE confirmationToken = ?').get([token]);

export const findUserByResetToken = async (token: string) =>
  dbHelpers.prepare('SELECT * FROM users WHERE resetToken = ?').get([token]);

export const createUser = async (u: any) =>
  dbHelpers.prepare(`
    INSERT INTO users (id, username, email, password, role, isConfirmed, confirmationToken, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run([u.id, u.username, u.email, u.password, u.role, u.isConfirmed, u.confirmationToken, u.createdAt]);

export const confirmUser = async (id: string) =>
  dbHelpers.prepare('UPDATE users SET isConfirmed = 1, confirmationToken = NULL WHERE id = ?').run([id]);

export const setResetToken = async (id: string, token: string | null) =>
  dbHelpers.prepare('UPDATE users SET resetToken = ? WHERE id = ?').run([token, id]);

export const updatePassword = async (id: string, hashedPass: string) =>
  dbHelpers.prepare('UPDATE users SET password = ? WHERE id = ?').run([hashedPass, id]);

export const updateLastActivity = async (id: string) =>
  dbHelpers.prepare('UPDATE users SET lastActivity = ? WHERE id = ?').run([new Date().toISOString(), id]);

export const getActiveSubscription = async (userId: string) =>
  dbHelpers.prepare(`
    SELECT * FROM subscription_keys
    WHERE userId = ? AND status = 'active'
    ORDER BY dueDate DESC
    LIMIT 1
  `).get([userId]);