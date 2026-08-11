import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as staffService from './staff.service';
import { AppError } from '../../middleware/errorHandler';
import { success, created, paginated } from '../../utils/response';

const resolveSchoolId = (req: AuthRequest) =>
  req.user!.role === 'SUPER_ADMIN'
    ? (req.query.schoolId as string | undefined) ?? null
    : req.user!.schoolId!;

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { staff, total } = await staffService.listStaff(resolveSchoolId(req), req.query as any);
    paginated(res, staff, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await staffService.getStaff(resolveSchoolId(req), req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { schoolId: bodySchoolId, ...input } = req.body;
    const schoolId = req.user!.role === 'SUPER_ADMIN'
      ? (bodySchoolId as string | undefined) ?? null
      : req.user!.schoolId!;
    created(res, await staffService.createStaff(schoolId, input), 'Staff member created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await staffService.updateStaff(resolveSchoolId(req), req.params.id, req.body), 'Staff member updated');
  } catch (err) { next(err); }
};

export const toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await staffService.toggleStaffStatus(resolveSchoolId(req), req.params.id), 'Status updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await staffService.deleteStaff(resolveSchoolId(req), req.params.id);
    success(res, null, 'Staff member deleted');
  } catch (err) { next(err); }
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(new AppError('No file uploaded', 400));
    const role = (req.query.role as 'TEACHER' | 'STAFF') === 'TEACHER' ? 'TEACHER' : 'STAFF';
    success(res, await staffService.bulkCreateStaff(req.user!.schoolId!, role, req.file.buffer), 'Import complete');
  } catch (err) { next(err); }
};
