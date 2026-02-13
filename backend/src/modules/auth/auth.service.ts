import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as repo from './auth.repository';
import { ENV } from '../../config/env';
import { PlanLimits, PlanType } from '../../../../types';
import * as emailService from '../../shared/email.service';

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free_trial: { maxVehicles: 1, maxDrivers: 1, hasExcelReports: false, hasCustomApi: false, maxHistoryDays: 30, maxRangeDays: null },
  basico: { maxVehicles: 3, maxDrivers: 5, hasExcelReports: false, hasCustomApi: false, maxHistoryDays: 30, maxRangeDays: null },
  pro: { maxVehicles: 6, maxDrivers: 10, hasExcelReports: true, hasCustomApi: false, maxHistoryDays: null, maxRangeDays: 90 },
  enterprise: { maxVehicles: 99999, maxDrivers: 99999, hasExcelReports: true, hasCustomApi: true, maxHistoryDays: null, maxRangeDays: null },
};

const isPasswordSecure = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

const getAccountStatusForUser = async (user: any) => {
  const now = Date.now();
  const createdAt = new Date(user.createdAt).getTime();
  const trialDaysRemaining = Math.max(0, 5 - Math.floor((now - createdAt) / (1000 * 3600 * 24)));

  const licenseOverride = await repo.getActiveLicenseOverride(user.id);
  const subscription = await repo.getActiveSubscription(user.id);

  let plan: PlanType = 'free_trial';
  let accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED' = 'BLOCKED';
  let accountStatus: any = {};

  if (user.role === 'SUPERADMIN') {
    accessLevel = 'FULL';
    accountStatus = { accessLevel, reason: 'ACTIVE_SUBSCRIPTION', plan: 'enterprise', daysRemaining: 9999, limits: PLAN_LIMITS.enterprise };
  } else if (!user.isConfirmed) {
    accountStatus = { accessLevel: 'BLOCKED', reason: 'UNCONFIRMED', plan: 'free_trial', daysRemaining: 0, limits: PLAN_LIMITS.free_trial };
  } 
  else if (licenseOverride) {
    accessLevel = 'FULL';
    plan = licenseOverride.plan as PlanType;
    const daysRemaining = licenseOverride.expiresAt 
      ? Math.ceil((new Date(licenseOverride.expiresAt).getTime() - now) / (1000 * 3600 * 24))
      : 9999;
    accountStatus = { 
      accessLevel, 
      reason: 'ACTIVE_SUBSCRIPTION', 
      plan, 
      daysRemaining, 
      limits: PLAN_LIMITS[plan],
      isManual: true,
      reasonOverride: licenseOverride.reason
    };
  }
  else if (
    subscription &&
    subscription.dueDate &&
    new Date(subscription.dueDate).getTime() > now
  ) {
    accessLevel = 'FULL';
    plan = subscription.plan as PlanType;
    const daysRemaining = subscription.dueDate ? Math.ceil(
      (new Date(subscription.dueDate).getTime() - now) /
      (1000 * 3600 * 24)
    ) : 0;
    accountStatus = { accessLevel, reason: 'ACTIVE_SUBSCRIPTION', plan, daysRemaining, limits: PLAN_LIMITS[plan] };
  } 
  else if (trialDaysRemaining > 0) {
    accessLevel = 'LIMITED';
    plan = 'free_trial';
    accountStatus = { accessLevel, reason: 'TRIAL', plan, daysRemaining: trialDaysRemaining, limits: PLAN_LIMITS[plan] };
  } 
  else {
    accountStatus = { accessLevel: 'BLOCKED', reason: 'TRIAL_EXPIRED', plan: 'free_trial', daysRemaining: 0, limits: PLAN_LIMITS.free_trial };
  }

  return { plan, accessLevel, accountStatus };
};

export const register = async (email: string, username: string, password: string) => {
  if (!isPasswordSecure(password)) {
    throw new Error('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');
  }

  const existingEmail = await repo.findUserByEmail(email);
  if (existingEmail) throw new Error('El correo electrónico ya está registrado.');
  
  const existingUsername = await repo.findUserByUsername(username);
  if (existingUsername) throw new Error('El nombre de usuario ya está en uso.');

  const confirmationToken = uuid();
  const user = {
    email,
    username,
    password: await bcrypt.hash(password, 12),
    role: 'USER',
    isConfirmed: false,
    confirmationToken,
  };
  await repo.createUser(user);

  await emailService.sendEmail({
    to: email,
    subject: "Bienvenido a FleetMaster Hub - Confirma tu cuenta",
    html: emailService.templates.welcome(username, confirmationToken)
  });
};

export const confirmAccount = async (token: string) => {
  const user = await repo.findUserByConfirmationToken(token);
  if (!user) {
    throw new Error('Token de confirmación inválido');
  }
  await repo.confirmUser(user.id);
};

export const requestPasswordReset = async (identifier: string) => {
  const user = await repo.findUserByIdentifier(identifier);
  if (!user) throw new Error('Usuario no encontrado');
  const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
  await repo.setResetToken(user.id, resetToken);
  await emailService.sendEmail({
    to: user.email,
    subject: "Recuperación de Contraseña - FleetMaster Hub",
    html: emailService.templates.passwordReset(resetToken)
  });
};

export const resetPassword = async (token: string, newPass: string) => {
  if (!isPasswordSecure(newPass)) {
    throw new Error('La nueva contraseña no cumple los requisitos de seguridad.');
  }
  
  const user = await repo.findUserByResetToken(token);
  if (!user) throw new Error('Token de recuperación inválido o expirado');
  const hashedPassword = await bcrypt.hash(newPass, 12);
  await repo.updatePassword(user.id, hashedPassword);
  await repo.setResetToken(user.id, null); 
};

export const login = async (identifier: string, password: string) => {
  const user = await repo.findUserByIdentifier(identifier);
  if (!user) throw new Error('Credenciales inválidas');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Credenciales inválidas');

  await repo.updateLastActivity(user.id);

  const { plan, accessLevel, accountStatus } = await getAccountStatusForUser(user);

  if (accountStatus.reason === 'UNCONFIRMED') {
    throw Object.assign(new Error('Debes confirmar tu cuenta por correo.'), { accountStatus });
  }
  if (accountStatus.accessLevel === 'BLOCKED' && user.role !== 'SUPERADMIN') {
    throw Object.assign(new Error('Subscription required'), { accountStatus });
  }

  const token = jwt.sign({ userId: user.id, accessLevel, role: user.role, plan }, ENV.JWT_SECRET, { expiresIn: '7d' });

  return { 
    token, 
    user: { id: user.id, username: user.username, email: user.email, role: user.role, isConfirmed: !!user.isConfirmed }, 
    accountStatus 
  };
};

export const refresh = async (userId: string) => {
  const user = await repo.findUserById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  const { plan, accessLevel, accountStatus } = await getAccountStatusForUser(user);

  const token = jwt.sign({ userId: user.id, accessLevel, role: user.role, plan }, ENV.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, isConfirmed: !!user.isConfirmed },
    accountStatus
  };
};