import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './events.service';
import { success, created, paginated } from '../../utils/response';

const resolveSchoolId = (req: AuthRequest) =>
  req.user!.role === 'SUPER_ADMIN'
    ? (req.query.schoolId as string | undefined) ?? null
    : req.user!.schoolId!;

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { events, total } = await service.listEvents(resolveSchoolId(req), req.query as any);
    paginated(res, events, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getEvent(resolveSchoolId(req), req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await service.createEvent(req.user!.schoolId!, req.body), 'Event created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.updateEvent(req.user!.schoolId!, req.params.id, req.body), 'Event updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteEvent(req.user!.schoolId!, req.params.id);
    success(res, null, 'Event deleted');
  } catch (err) { next(err); }
};
