import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './students.service';
import { AppError } from '../../middleware/errorHandler';
import { success, created, paginated } from '../../utils/response';

const resolveSchoolId = (req: AuthRequest): string | undefined =>
  req.user!.role === 'SUPER_ADMIN'
    ? (req.query.schoolId as string | undefined)
    : (req.user!.schoolId ?? undefined);

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { students, total } = await service.listStudents(resolveSchoolId(req), req.query as any);
    paginated(res, students, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getStudent(req.params.id, resolveSchoolId(req)));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sid = req.user!.role === 'SUPER_ADMIN' ? req.body.schoolId : req.user!.schoolId;
    if (!sid) return next(new AppError('schoolId is required', 400));
    created(res, await service.createStudent(sid, req.body), 'Student created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.updateStudent(req.params.id, req.body, resolveSchoolId(req)), 'Student updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteStudent(req.params.id, resolveSchoolId(req));
    success(res, null, 'Student deleted');
  } catch (err) { next(err); }
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(new Error('No file uploaded'));
    const sid = req.user!.role === 'SUPER_ADMIN' ? (req.query.schoolId as string) : req.user!.schoolId;
    if (!sid) return next(new AppError('schoolId is required', 400));
    success(res, await service.bulkCreateStudents(sid, req.file.buffer), 'Import complete');
  } catch (err) { next(err); }
};

export const assignClassroom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.assignClassroom(req.params.id, req.body.classroomId, resolveSchoolId(req)), 'Classroom assigned');
  } catch (err) { next(err); }
};
