import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { importUpload } from '../../middleware/upload';
import { createStudentSchema, updateStudentSchema, listQuerySchema, assignClassroomSchema } from './students.schema';
import * as ctrl from './students.controller';

const router = Router();

router.use(authenticate, authorize('SCHOOL_ADMIN', 'STAFF', 'TEACHER', 'SUPER_ADMIN'));

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', authorize('SCHOOL_ADMIN', 'STAFF'), validate(createStudentSchema), ctrl.create);
router.patch('/:id', authorize('SCHOOL_ADMIN', 'STAFF'), validate(updateStudentSchema), ctrl.update);
router.delete('/:id', authorize('SCHOOL_ADMIN'), ctrl.remove);
router.patch('/:id/classroom', authorize('SCHOOL_ADMIN', 'STAFF'), validate(assignClassroomSchema), ctrl.assignClassroom);
router.post('/bulk-import', authorize('SCHOOL_ADMIN', 'STAFF', 'SUPER_ADMIN'), importUpload.single('file'), ctrl.bulkImport);

export default router;
