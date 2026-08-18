import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createPostSchema, createCommentSchema, listQuerySchema } from './posts.schema';
import * as ctrl from './posts.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', authorize('SCHOOL_ADMIN', 'STAFF', 'TEACHER'), validate(createPostSchema), ctrl.create);
router.delete('/:id', authorize('SCHOOL_ADMIN', 'STAFF', 'TEACHER'), ctrl.remove);

router.get('/:id/comments', ctrl.listComments);
router.post('/:id/comments', authorize('SCHOOL_ADMIN', 'STAFF', 'TEACHER', 'PARENT'), validate(createCommentSchema), ctrl.createComment);
router.delete('/:id/comments/:commentId', authorize('SCHOOL_ADMIN', 'STAFF', 'TEACHER'), ctrl.removeComment);

export default router;
