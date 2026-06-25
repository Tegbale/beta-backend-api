import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createSchoolSchema, updateSchoolSchema, listQuerySchema } from './schools.schema';
import * as ctrl from './schools.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN'), validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', authorize('SUPER_ADMIN'), ctrl.get);
router.post('/', authorize('SUPER_ADMIN'), validate(createSchoolSchema), ctrl.create);
router.patch('/:id', authorize('SUPER_ADMIN'), validate(updateSchoolSchema), ctrl.update);
router.patch('/:id/toggle-status', authorize('SUPER_ADMIN'), ctrl.toggleStatus);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.remove);

export default router;
