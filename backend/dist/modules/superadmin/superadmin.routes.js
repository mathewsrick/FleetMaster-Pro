import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './superadmin.controller';
const router = Router();
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Acceso denegado. Solo SuperAdmin.' });
    }
    next();
};
router.get('/stats', authenticate, requireSuperAdmin, controller.getGlobalStats);
router.get('/users', authenticate, requireSuperAdmin, controller.getUsers);
router.post('/grant-license', authenticate, requireSuperAdmin, controller.grantLicense);
export default router;
