import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './events.service';
import { success, created, paginated } from '../../utils/response';

const schoolId = (req: AuthRequest) => req.user!.schoolId!;

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { events, total } = await service.listEvents(schoolId(req), req.query as any);
    paginated(res, events, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getEvent(schoolId(req), req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await service.createEvent(schoolId(req), req.body), 'Event created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.updateEvent(schoolId(req), req.params.id, req.body), 'Event updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteEvent(schoolId(req), req.params.id);
    success(res, null, 'Event deleted');
  } catch (err) { next(err); }
};
