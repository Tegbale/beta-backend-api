import { Response, NextFunction } from 'express';
import * as schoolsService from './schools.service';
import { success, created, paginated } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../types';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { schools, total } = await schoolsService.listSchools(req.query as any);
    paginated(res, schools, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role === 'SCHOOL_ADMIN' && req.user.schoolId !== req.params.id) {
      return next(new AppError('Forbidden', 403));
    }
    success(res, await schoolsService.getSchool(req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await schoolsService.createSchool(req.body), 'School created');
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await schoolsService.updateSchool(req.params.id, req.body), 'School updated');
  } catch (err) { next(err); }
};

export const toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await schoolsService.toggleSchoolStatus(req.params.id), 'School status updated');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await schoolsService.deleteSchool(req.params.id);
    success(res, null, 'School deleted');
  } catch (err) { next(err); }
};
