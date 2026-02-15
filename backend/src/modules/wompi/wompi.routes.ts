import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as controller from './wompi.controller.js';

const router = Router();

router.post('/initialize', authenticate, controller.initializePayment);
router.get('/verify/:id', authenticate, controller.verifyTransaction);
router.post('/webhook', controller.handleWebhook);

export default router;