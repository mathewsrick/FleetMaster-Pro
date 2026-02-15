import { Router } from 'express';
import * as controller from './expense.controller';
const router = Router();
router.get('/', controller.getAll);
router.post('/', controller.save);
router.delete('/:id', controller.remove);
export default router;
