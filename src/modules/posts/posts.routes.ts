import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createPostSchema, createCommentSchema, listQuerySchema } from './posts.schema';
import * as ctrl from './posts.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listQuerySchema, 'query'), ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', validate(createPostSchema), ctrl.create);
router.delete('/:id', ctrl.remove);

router.get('/:id/comments', ctrl.listComments);
router.post('/:id/comments', validate(createCommentSchema), ctrl.createComment);
router.delete('/:id/comments/:commentId', ctrl.removeComment);

export default router;
