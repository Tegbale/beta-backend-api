import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { importUpload } from '../../middleware/upload';
import { createStaffSchema, updateStaffSchema, listQuerySchema } from './staff.schema';
import * as ctrl from './staff.controller';

const router = Router();

router.use(authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'));

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', validate(createStaffSchema), ctrl.create);
router.patch('/:id', validate(updateStaffSchema), ctrl.update);
router.patch('/:id/toggle-status', ctrl.toggleStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), ctrl.remove);
router.post('/bulk-import', importUpload.single('file'), ctrl.bulkImport);

export default router;
