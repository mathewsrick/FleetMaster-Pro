import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as controller from './wompi.controller.js';

const router = Router();

router.post('/initialize', authenticate, controller.initializePayment);
router.get('/verify/:id', authenticate, controller.verifyTransaction);
router.get('/acceptance', authenticate, controller.getAcceptance);
router.post('/subscriptions', authenticate, controller.createSubscription);
router.get('/subscriptions/me', authenticate, controller.getMySubscription);
router.post('/subscriptions/cancel', authenticate, controller.cancelSubscription);
router.post('/webhook', controller.handleWebhook);

export default router;