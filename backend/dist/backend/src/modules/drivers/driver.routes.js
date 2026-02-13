import { Router } from 'express';
import * as controller from './driver.controller';
const router = Router();
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
export default router;
//# sourceMappingURL=driver.routes.js.map