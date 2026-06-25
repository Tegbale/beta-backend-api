import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './parents.service';
import { success, created, paginated } from '../../utils/response';

const resolveSchoolId = (req: AuthRequest) =>
  req.user!.role === 'SUPER_ADMIN'
    ? ((req.query.schoolId as string | undefined) ?? null)
    : (req.user!.schoolId ?? null);

export const getMyWards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getMyWards(req.user!.sub));
  } catch (err) { next(err); }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parents, total } = await service.listParents(req.query as any);
    paginated(res, parents, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getParent(req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.createParent(req.body);
    created(res, result, 'Parent created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.updateParent(req.params.id, req.body), 'Parent updated');
  } catch (err) { next(err); }
};

export const toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.toggleParentStatus(req.params.id), 'Status updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteParent(req.params.id);
    success(res, null, 'Parent deleted');
  } catch (err) { next(err); }
};

export const assignWard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.assignWard(req.params.id, req.body.studentId, resolveSchoolId(req)), 'Ward assigned');
  } catch (err) { next(err); }
};

export const removeWard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.removeWard(req.params.id, req.params.studentId), 'Ward removed');
  } catch (err) { next(err); }
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(new Error('No file uploaded'));
    success(res, await service.bulkCreateParents(req.file.buffer), 'Import complete');
  } catch (err) { next(err); }
};
