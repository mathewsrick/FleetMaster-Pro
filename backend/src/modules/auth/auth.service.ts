
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as repo from './auth.repository';
import { ENV } from '../../config/env';
import { PlanLimits, PlanType } from '../../../../types';

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free_trial: { maxVehicles: 1, maxDrivers: 1, hasExcelReports: false, hasCustomApi: false },
  basico: { maxVehicles: 3, maxDrivers: 5, hasExcelReports: false, hasCustomApi: false },
  pro: { maxVehicles: 6, maxDrivers: 10, hasExcelReports: true, hasCustomApi: false },
  enterprise: { maxVehicles: 99999, maxDrivers: 99999, hasExcelReports: true, hasCustomApi: true },
};

// Mock de envío de correos
const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`📧 ENVIANDO EMAIL A: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Cuerpo: ${body}`);
  return true;
};

export const register = async (username: string, password: string) => {
  const confirmationToken = uuid();
  const user = {
    id: uuid(),
    username,
    password: await bcrypt.hash(password, 10),
    role: 'USER',
    isConfirmed: 0,
    confirmationToken,
    createdAt: new Date().toISOString()
  };
  await repo.createUser(user);

  // Simular envío de email
  await sendEmail(
    username,
    "Confirma tu cuenta FleetMaster Pro",
    `Haz clic aquí para confirmar: /confirm/${confirmationToken}`
  );
};

export const confirmAccount = async (token: string) => {
  const user = await repo.findUserByConfirmationToken(token);
  if (!user) throw new Error('Token de confirmación inválido');
  await repo.confirmUser(user.id);
};

export const requestPasswordReset = async (username: string) => {
  const user = await repo.findUserByUsername(username);
  if (!user) throw new Error('Usuario no encontrado');

  const resetToken = uuid();
  await repo.setResetToken(user.id, resetToken);

  await sendEmail(
    username,
    "Recupera tu contraseña",
    `Tu código de recuperación es: ${resetToken}`
  );
};

export const resetPassword = async (token: string, newPass: string) => {
  const user = await repo.findUserByResetToken(token);
  if (!user) throw new Error('Token de recuperación inválido o expirado');
  const hashedPassword = await bcrypt.hash(newPass, 10);
  await repo.updatePassword(user.id, hashedPassword);
  await repo.setResetToken(user.id, null); // Limpiar token
};

export const login = async (username: string, password: string) => {
  const user = await repo.findUserByUsername(username);
  if (!user) throw new Error('Invalid credentials');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid credentials');

  // Actualizar última actividad
  await repo.updateLastActivity(user.id);

  const now = Date.now();
  const createdAt = new Date(user.createdAt).getTime();
  const trialDaysRemaining = Math.max(0, 5 - Math.floor((now - createdAt) / (1000 * 3600 * 24)));

  const subscription = await repo.getActiveSubscription(user.id);

  let plan: PlanType = 'free_trial';
  let accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED' = 'BLOCKED';
  let accountStatus: any = {};

  if (user.role === 'SUPERADMIN') {
    accessLevel = 'FULL';
    accountStatus = { accessLevel, reason: 'ACTIVE_SUBSCRIPTION', plan: 'enterprise', daysRemaining: 9999, limits: PLAN_LIMITS.enterprise };
  } else if (!user.isConfirmed) {
    accountStatus = { accessLevel: 'BLOCKED', reason: 'UNCONFIRMED', plan: 'free_trial', daysRemaining: 0, limits: PLAN_LIMITS.free_trial };
    throw Object.assign(new Error('Debes confirmar tu cuenta por correo.'), { accountStatus });
  } else if (subscription && new Date(subscription.dueDate).getTime() > now) {
    accessLevel = 'FULL';
    plan = subscription.plan as PlanType;
    const daysRemaining = Math.ceil((new Date(subscription.dueDate).getTime() - now) / (1000 * 3600 * 24));
    accountStatus = { accessLevel, reason: 'ACTIVE_SUBSCRIPTION', plan, daysRemaining, limits: PLAN_LIMITS[plan] };
  } else if (trialDaysRemaining > 0) {
    accessLevel = 'LIMITED';
    plan = 'free_trial';
    accountStatus = { accessLevel, reason: 'TRIAL', plan, daysRemaining: trialDaysRemaining, limits: PLAN_LIMITS[plan] };
  } else {
    accountStatus = { accessLevel: 'BLOCKED', reason: 'TRIAL_EXPIRED', plan: 'free_trial', daysRemaining: 0, limits: PLAN_LIMITS.free_trial };
    throw Object.assign(new Error('Subscription required'), { accountStatus });
  }

  const token = jwt.sign({ userId: user.id, accessLevel, role: user.role, plan }, ENV.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role, isConfirmed: !!user.isConfirmed }, 
    accountStatus
  };
};
