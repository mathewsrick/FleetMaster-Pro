import { Router } from 'express';
import * as controller from './payment.controller';
const router = Router();
router.get('/', controller.getAll);
router.get('/driver/:driverId', controller.byDriver);
router.post('/', controller.create);
router.delete('/:id', controller.remove);
export default router;
