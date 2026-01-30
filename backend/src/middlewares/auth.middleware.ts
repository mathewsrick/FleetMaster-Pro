import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const authenticate: any = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
    console.log('User authenticated:', decoded);
    req.user = {
      userId: decoded.userId,
      accessLevel: decoded.accessLevel,
    };

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};