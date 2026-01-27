import { Router } from 'express';
import * as controller from './arrear.controller';

const router = Router();

router.get('/', controller.all);
router.get('/driver/:driverId', controller.byDriver);
router.post('/:id/pay', controller.pay);
router.post('/', controller.createFromPartialPayment);
router.delete('/origin-payment/:paymentId', controller.removeByOriginPayment);
router.delete('/:id', controller.removeById);

export default router;
