import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createMessageSchema, listQuerySchema, readConversationSchema } from './messages.schema';
import * as ctrl from './messages.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.patch('/read-conversation', validate(readConversationSchema), ctrl.markConversationRead);
router.get('/:id', ctrl.get);
router.post('/', validate(createMessageSchema), ctrl.send);
router.delete('/:id', ctrl.remove);

export default router;
