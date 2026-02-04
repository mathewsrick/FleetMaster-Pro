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

export const register = async (username: string, password: string) => {
  const user = {
    id: uuid(),
    username,
    password: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString()
  };
  await repo.createUser(user);
};

export const login = async (username: string, password: string) => {
  const user = await repo.findUserByUsername(username);
  if (!user) throw new Error('Invalid credentials');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid credentials');

  const now = Date.now();
  const createdAt = new Date(user.createdAt).getTime();
  const trialDaysRemaining = Math.max(0, 5 - Math.floor((now - createdAt) / (1000 * 3600 * 24)));

  const subscription = await repo.getActiveSubscription(user.id);

  let plan: PlanType = 'free_trial';
  let accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED' = 'BLOCKED';
  let accountStatus: any = {};

  if (subscription && new Date(subscription.dueDate).getTime() > now) {
    accessLevel = 'FULL';
    plan = subscription.plan as PlanType;
    const daysRemaining = Math.ceil((new Date(subscription.dueDate).getTime() - now) / (1000 * 3600 * 24));
    accountStatus = {
      accessLevel,
      reason: 'ACTIVE_SUBSCRIPTION',
      plan,
      daysRemaining,
      limits: PLAN_LIMITS[plan]
    };
  } else if (trialDaysRemaining > 0) {
    accessLevel = 'LIMITED';
    plan = 'free_trial';
    accountStatus = {
      accessLevel,
      reason: 'TRIAL',
      plan,
      daysRemaining: trialDaysRemaining,
      limits: PLAN_LIMITS[plan]
    };
  } else {
    accountStatus = { accessLevel: 'BLOCKED', reason: 'TRIAL_EXPIRED', plan: 'free_trial', daysRemaining: 0, limits: PLAN_LIMITS.free_trial };
    throw Object.assign(new Error('Subscription required'), { accountStatus });
  }

  const token = jwt.sign({ userId: user.id, accessLevel, plan }, ENV.JWT_SECRET, { expiresIn: '7d' });

  return { token, user: { id: user.id, username: user.username }, accountStatus };
};
