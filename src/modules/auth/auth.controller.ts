import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as authService from './auth.service';
import { success, created } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export const registerHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    created(res, user, 'Account created');
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const refreshHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const logoutHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.body.refreshToken;
    if (!token) return next(new AppError('Refresh token required', 400));
    await authService.logout(token);
    success(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
};

export const changePasswordHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.changePassword(req.user!.sub, req.body);
    success(res, null, 'Password changed');
  } catch (err) {
    next(err);
  }
};

export const meHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.me(req.user!.sub);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.forgotPassword(req.body);
    // Always return 200 — don't leak whether the email exists
    success(res, null, 'If that email is registered, a reset link has been sent');
  } catch (err) {
    next(err);
  }
};

export const resetPasswordHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body);
    success(res, null, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
};

export const verifySmtpHandler = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { verifySmtp } = await import('../../lib/mailer');
    await verifySmtp();
    success(res, { connected: true, host: process.env.SMTP_HOST, port: process.env.SMTP_PORT }, 'SMTP connection OK');
  } catch (err: any) {
    next(new AppError(`SMTP connection failed: ${err.message}`, 500));
  }
};
