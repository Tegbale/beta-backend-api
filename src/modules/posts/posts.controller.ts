import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './posts.service';
import { success, created, paginated } from '../../utils/response';

const resolveSchoolId = (req: AuthRequest) =>
  req.user!.role === 'SUPER_ADMIN'
    ? (req.query.schoolId as string | undefined) ?? null
    : req.user!.schoolId!;

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { posts, total } = await service.listPosts(resolveSchoolId(req), req.query as any);
    paginated(res, posts, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getPost(resolveSchoolId(req), req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await service.createPost(req.user!.schoolId!, req.user!.sub, req.body), 'Post created');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deletePost(req.user!.schoolId!, req.params.id, req.user!.sub, req.user!.role);
    success(res, null, 'Post deleted');
  } catch (err) { next(err); }
};

export const listComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.listComments(req.params.id, req.user!.schoolId!));
  } catch (err) { next(err); }
};

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(
      res,
      await service.createComment(req.params.id, req.user!.schoolId!, req.user!.sub, req.body),
      'Comment added',
    );
  } catch (err) { next(err); }
};

export const removeComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteComment(req.user!.schoolId!, req.params.commentId, req.user!.sub, req.user!.role);
    success(res, null, 'Comment deleted');
  } catch (err) { next(err); }
};
