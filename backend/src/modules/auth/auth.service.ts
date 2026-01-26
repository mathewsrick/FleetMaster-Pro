import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as repo from './auth.repository';

const JWT_SECRET = process.env.JWT_SECRET!;

const FIVE_DAYS = 1000 * 60 * 60 * 24 * 5;

export const register = (username: string, password: string) => {
  const user = {
    id: uuid(),
    username,
    password: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };

  repo.createUser(user);
};

export const login = (username: string, password: string) => {
  const user = repo.findUserByUsername(username);
  if (!user) throw new Error('Invalid credentials');

  if (!bcrypt.compareSync(password, user.password)) {
    throw new Error('Invalid credentials');
  }

  const subscription = repo.getActiveSubscription(user.id);

  const now = Date.now();
  const createdAt = new Date(user.createdAt).getTime();
  const inGracePeriod = now - createdAt <= FIVE_DAYS;

  let accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED' = 'BLOCKED';

  if (subscription && new Date(subscription.dueDate) > new Date()) {
    accessLevel = 'FULL';
  } else if (!subscription && inGracePeriod) {
    accessLevel = 'LIMITED';
  }

  if (accessLevel === 'BLOCKED') {
    throw new Error('Subscription required');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      accessLevel
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { id: user.id, username: user.username },
    accessLevel
  };
};