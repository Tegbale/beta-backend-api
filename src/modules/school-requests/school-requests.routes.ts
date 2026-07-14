import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createRequestSchema, listRequestsSchema, rejectRequestSchema } from './school-requests.schema';
import * as ctrl from './school-requests.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Public — no auth required
router.post(
  '/',
  upload.fields([
    { name: 'cacDocument', maxCount: 1 },
    { name: 'govtDocument', maxCount: 1 },
  ]),
  validate(createRequestSchema),
  ctrl.create,
);

// Superadmin only
router.get('/', authenticate, authorize('SUPER_ADMIN'), validate(listRequestsSchema, 'query'), ctrl.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN'), ctrl.get);
router.post('/:id/approve', authenticate, authorize('SUPER_ADMIN'), ctrl.approve);
router.patch('/:id/reject', authenticate, authorize('SUPER_ADMIN'), validate(rejectRequestSchema), ctrl.reject);

export default router;
