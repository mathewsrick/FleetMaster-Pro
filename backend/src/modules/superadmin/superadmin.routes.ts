import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './superadmin.controller';

const router = Router();

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
  }
  next();
};

router.get('/dashboard', authenticate, requireRole(['SUPERADMIN', 'SUPPORT']), controller.getGlobalStats);
router.get('/fleets', authenticate, requireRole(['SUPERADMIN', 'SUPPORT']), controller.listFleets);
router.post('/fleets/toggle', authenticate, requireRole(['SUPERADMIN']), controller.toggleFleet);
router.get('/plans', authenticate, requireRole(['SUPERADMIN', 'SUPPORT']), controller.getPlansConfig);
router.put('/plans/:key', authenticate, requireRole(['SUPERADMIN']), controller.updatePlan);
router.get('/staff', authenticate, requireRole(['SUPERADMIN']), controller.listStaff);
router.post('/banners', authenticate, requireRole(['SUPERADMIN']), controller.postBanner);

export default router;