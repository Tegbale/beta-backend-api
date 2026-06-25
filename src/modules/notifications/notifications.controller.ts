import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './notifications.service';
import { success, paginated } from '../../utils/response';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const { notifications, total } = await service.listNotifications(req.user!.sub, page, limit);
    paginated(res, notifications, total, page, limit);
  } catch (err) { next(err); }
};

export const markRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.markAsRead(req.user!.sub, req.params.id), 'Marked as read');
  } catch (err) { next(err); }
};

export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.markAllAsRead(req.user!.sub);
    success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};
