import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './classrooms.service';
import { AppError } from '../../middleware/errorHandler';
import { success, created, paginated } from '../../utils/response';

const resolveSchoolId = (req: AuthRequest): string | undefined =>
  req.user!.role === 'SUPER_ADMIN'
    ? (req.query.schoolId as string | undefined)
    : (req.user!.schoolId ?? undefined);

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { classrooms, total } = await service.listClassrooms(resolveSchoolId(req), req.query as any);
    paginated(res, classrooms, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getClassroom(req.params.id, resolveSchoolId(req)));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sid = req.user!.role === 'SUPER_ADMIN' ? req.body.schoolId : req.user!.schoolId;
    if (!sid) return next(new AppError('schoolId is required', 400));
    created(res, await service.createClassroom(sid, req.body), 'Classroom created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.updateClassroom(req.params.id, req.body, resolveSchoolId(req)), 'Classroom updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteClassroom(req.params.id, resolveSchoolId(req));
    success(res, null, 'Classroom deleted');
  } catch (err) { next(err); }
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(new Error('No file uploaded'));
    const sid = req.user!.role === 'SUPER_ADMIN' ? (req.query.schoolId as string) : req.user!.schoolId;
    if (!sid) return next(new AppError('schoolId is required', 400));
    success(res, await service.bulkCreateClassrooms(sid, req.file.buffer), 'Import complete');
  } catch (err) { next(err); }
};

export const assignTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.assignTeacher(req.params.id, req.body.teacherId, resolveSchoolId(req)), 'Teacher assigned');
  } catch (err) { next(err); }
};

export const removeTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.removeTeacher(req.params.id, req.params.teacherId, resolveSchoolId(req)), 'Teacher removed');
  } catch (err) { next(err); }
};
