import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as staffService from './staff.service';
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
    success(res, await staffService.getStaff(req.user!.schoolId!, req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await staffService.createStaff(req.user!.schoolId!, req.body), 'Staff member created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await staffService.updateStaff(req.user!.schoolId!, req.params.id, req.body), 'Staff member updated');
  } catch (err) { next(err); }
};

export const toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await staffService.toggleStaffStatus(req.user!.schoolId!, req.params.id), 'Status updated');
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
    if (!req.file) return next(new Error('No file uploaded'));
    const role = (req.query.role as 'TEACHER' | 'STAFF') === 'TEACHER' ? 'TEACHER' : 'STAFF';
    success(res, await staffService.bulkCreateStaff(req.user!.schoolId!, role, req.file.buffer), 'Import complete');
  } catch (err) { next(err); }
};
