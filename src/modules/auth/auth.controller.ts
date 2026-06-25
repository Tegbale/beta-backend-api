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
