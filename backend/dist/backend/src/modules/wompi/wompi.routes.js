import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './wompi.controller';
const router = Router();
router.post('/initialize', authenticate, controller.initializePayment);
router.get('/verify/:id', authenticate, controller.verifyTransaction);
router.post('/webhook', controller.handleWebhook);
export default router;
//# sourceMappingURL=wompi.routes.js.map