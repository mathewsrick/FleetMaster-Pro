import { Router } from 'express';
import * as controller from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/refresh', authenticate, controller.refresh);
router.get('/confirm/:token', controller.confirm);
router.post('/request-reset', controller.requestReset);
router.post('/reset-password', controller.resetPassword);

export default router;