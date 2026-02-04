import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './superadmin.controller';

const router = Router();

const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acceso denegado. Solo SuperAdmin.' });
  }
  next();
};

router.get('/stats', authenticate, requireSuperAdmin, controller.getGlobalStats);
router.get('/users', authenticate, requireSuperAdmin, controller.getUsers);

export default router;