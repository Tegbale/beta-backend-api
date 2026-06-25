import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createRequestSchema, listRequestsSchema, rejectRequestSchema } from './school-requests.schema';
import * as ctrl from './school-requests.controller';

const router = Router();

// Public — no auth required
router.post('/', validate(createRequestSchema), ctrl.create);

// Superadmin only
router.get('/', authenticate, authorize('SUPER_ADMIN'), validate(listRequestsSchema, 'query'), ctrl.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN'), ctrl.get);
router.post('/:id/approve', authenticate, authorize('SUPER_ADMIN'), ctrl.approve);
router.patch('/:id/reject', authenticate, authorize('SUPER_ADMIN'), validate(rejectRequestSchema), ctrl.reject);

export default router;
