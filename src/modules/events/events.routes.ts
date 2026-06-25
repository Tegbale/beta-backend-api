import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createEventSchema, updateEventSchema, listQuerySchema } from './events.schema';
import * as ctrl from './events.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', authorize('SCHOOL_ADMIN', 'STAFF'), validate(createEventSchema), ctrl.create);
router.patch('/:id', authorize('SCHOOL_ADMIN', 'STAFF'), validate(updateEventSchema), ctrl.update);
router.delete('/:id', authorize('SCHOOL_ADMIN'), ctrl.remove);

export default router;
