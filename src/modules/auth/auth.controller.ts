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

export const updateMeHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await authService.updateMe(req.user!.sub, { firstName, lastName, phone });
    success(res, user, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

export const uploadAvatarHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(new AppError('No file provided', 400));
    const user = await authService.updateAvatar(req.user!.sub, req.file.buffer);
    success(res, user, 'Avatar updated');
  } catch (err) {
    next(err);
  }
};

export const verifySmtpHandler = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { env } = await import('../../config/env');
    const credentials = Buffer.from(`api:${env.mailgun.apiKey}`).toString('base64');
    const res2 = await fetch(`https://api.mailgun.net/v3/domains/${env.mailgun.domain}`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (!res2.ok) throw new Error(`Mailgun API returned ${res2.status}`);
    success(res, { connected: true, domain: env.mailgun.domain }, 'Mailgun connection OK');
  } catch (err: any) {
    next(new AppError(`Mailgun connection failed: ${err.message}`, 500));
  }
};
