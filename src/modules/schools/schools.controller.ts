import { Request, Response, NextFunction } from 'express';
import * as schoolsService from './schools.service';
import { success, created, paginated } from '../../utils/response';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schools, total } = await schoolsService.listSchools(req.query as any);
    paginated(res, schools, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    success(res, await schoolsService.getSchool(req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    created(res, await schoolsService.createSchool(req.body), 'School created');
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    success(res, await schoolsService.updateSchool(req.params.id, req.body), 'School updated');
  } catch (err) { next(err); }
};

export const toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    success(res, await schoolsService.toggleSchoolStatus(req.params.id), 'School status updated');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schoolsService.deleteSchool(req.params.id);
    success(res, null, 'School deleted');
  } catch (err) { next(err); }
};
