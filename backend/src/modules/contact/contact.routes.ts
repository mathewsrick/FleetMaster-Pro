import { Router } from 'express';
import * as controller from './contact.controller';

const router = Router();

router.post('/', controller.submitContact as any);

export default router;