import { Router } from 'express';
import * as controller from './reports.controller.js';

const router = Router();

router.get('/summary', controller.summary);
router.get('/vehicles', controller.vehicles);
router.get('/drivers', controller.drivers);
router.get('/maintenance', controller.maintenance);
router.get('/monthly.pdf', controller.monthlyPdf);

export default router;
