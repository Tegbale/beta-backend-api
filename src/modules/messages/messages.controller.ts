import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './messages.service';
import { success, created, paginated } from '../../utils/response';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messages, total } = await service.listMessages(req.user!.sub, req.query as any);
    paginated(res, messages, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getMessage(req.user!.sub, req.params.id));
  } catch (err) { next(err); }
};

export const send = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await service.sendMessage(req.user!.sub, req.body), 'Message sent');
  } catch (err) { next(err); }
};

export const markConversationRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.markConversationRead(req.user!.sub, req.body.partnerId);
    success(res, null, 'Conversation marked as read');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteMessage(req.user!.sub, req.params.id);
    success(res, null, 'Message deleted');
  } catch (err) { next(err); }
};
