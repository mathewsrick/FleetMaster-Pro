import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as repo from './auth.repository';
import { ENV } from '../../config/env';

const WARNING_DAYS = 10;

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
  const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, 5 - daysSinceCreation);

  const subscription = await repo.getActiveSubscription(user.id);

  let accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED' = 'BLOCKED';
  let accountStatus: any = {};

  // -------------------------
  // 1️⃣ USUARIO CON SUBSCRIPCIÓN
  // -------------------------
  if (subscription && new Date(subscription.dueDate).getTime() > now) {
    accessLevel = 'FULL';

    const dueDate = new Date(subscription.dueDate).getTime();
    const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    accountStatus = {
      accessLevel,
      reason: 'ACTIVE_SUBSCRIPTION',
      daysRemaining,
      warning: daysRemaining <= WARNING_DAYS ? 'SUBSCRIPTION_EXPIRING_SOON' : null
    };
  }

  // -------------------------
  // 2️⃣ USUARIO EN FREE TRIAL
  // -------------------------
  else if (!subscription && trialDaysRemaining > 0) {
    accessLevel = 'LIMITED';

    accountStatus = {
      accessLevel,
      reason: 'TRIAL',
      daysRemaining: trialDaysRemaining
    };
  }

  // -------------------------
  // 3️⃣ TRIAL EXPIRADO
  // -------------------------
  else {
    accountStatus = {
      accessLevel: 'BLOCKED',
      reason: 'TRIAL_EXPIRED',
      daysRemaining: 0
    };

    throw Object.assign(
      new Error('Subscription required'),
      { accountStatus }
    );
  }

  // -------------------------
  // TOKEN
  // -------------------------
  const token = jwt.sign(
    {
      userId: user.id,
      accessLevel
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username
    },
    accountStatus
  };
};