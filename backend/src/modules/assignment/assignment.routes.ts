import { Router } from 'express';
import * as controller from './assignment.controller.js';

const router = Router();

router.post('/', controller.assign);

export default router;