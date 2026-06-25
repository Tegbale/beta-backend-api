import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { loginSchema, registerSchema, refreshSchema, changePasswordSchema } from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.registerHandler);
router.post('/login', validate(loginSchema), ctrl.loginHandler);
router.post('/refresh', validate(refreshSchema), ctrl.refreshHandler);
router.post('/logout', ctrl.logoutHandler);
router.get('/me', authenticate, ctrl.meHandler);
router.patch('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePasswordHandler);

export default router;
