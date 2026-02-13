import { Router } from 'express';
import * as controller from './contact.controller';
const router = Router();
router.post('/', controller.submitContact);
export default router;
//# sourceMappingURL=contact.routes.js.map