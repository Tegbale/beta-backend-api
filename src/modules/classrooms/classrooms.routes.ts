import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { importUpload } from '../../middleware/upload';
import { createClassroomSchema, updateClassroomSchema, listQuerySchema, assignTeacherSchema } from './classrooms.schema';
import * as ctrl from './classrooms.controller';

const router = Router();

router.use(authenticate, authorize('SCHOOL_ADMIN', 'STAFF', 'SUPER_ADMIN'));

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', validate(createClassroomSchema), ctrl.create);
router.patch('/:id', validate(updateClassroomSchema), ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/teachers', validate(assignTeacherSchema), ctrl.assignTeacher);
router.delete('/:id/teachers/:teacherId', ctrl.removeTeacher);
router.post('/bulk-import', importUpload.single('file'), ctrl.bulkImport);

export default router;
