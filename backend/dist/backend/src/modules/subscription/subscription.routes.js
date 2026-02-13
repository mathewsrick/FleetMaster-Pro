import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './subscription.controller';
const router = Router();
router.post('/activate', authenticate, controller.activate);
router.post('/purchase', authenticate, controller.purchase);
router.post('/generate', authenticate, controller.generateKey);
export default router;
//# sourceMappingURL=subscription.routes.js.map