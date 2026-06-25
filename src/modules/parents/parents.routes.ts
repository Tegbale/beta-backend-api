import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { importUpload } from '../../middleware/upload';
import { createParentSchema, updateParentSchema, listQuerySchema, assignWardSchema } from './parents.schema';
import * as ctrl from './parents.controller';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'));

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', validate(createParentSchema), ctrl.create);
router.patch('/:id', validate(updateParentSchema), ctrl.update);
router.patch('/:id/toggle-status', ctrl.toggleStatus);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.remove);
router.post('/:id/wards', validate(assignWardSchema), ctrl.assignWard);
router.delete('/:id/wards/:studentId', ctrl.removeWard);
router.post('/bulk-import', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), importUpload.single('file'), ctrl.bulkImport);

export default router;
