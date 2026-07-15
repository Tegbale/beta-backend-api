import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { loginSchema, registerSchema, refreshSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import * as ctrl from './auth.controller';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

const router = Router();

router.post('/register', validate(registerSchema), ctrl.registerHandler);
router.post('/login', validate(loginSchema), ctrl.loginHandler);
router.post('/refresh', validate(refreshSchema), ctrl.refreshHandler);
router.post('/logout', ctrl.logoutHandler);
router.get('/me', authenticate, ctrl.meHandler);
router.patch('/me', authenticate, ctrl.updateMeHandler);
router.post('/me/avatar', authenticate, avatarUpload.single('avatar'), ctrl.uploadAvatarHandler);
router.patch('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePasswordHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPasswordHandler);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPasswordHandler);
router.get('/verify-smtp', authenticate, authorize('SUPER_ADMIN'), ctrl.verifySmtpHandler);

export default router;
