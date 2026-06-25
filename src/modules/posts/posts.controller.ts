import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as service from './posts.service';
import { success, created, paginated } from '../../utils/response';

const schoolId = (req: AuthRequest) => req.user!.schoolId!;

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { posts, total } = await service.listPosts(schoolId(req), req.query as any);
    paginated(res, posts, total, Number(req.query.page ?? 1), Number(req.query.limit ?? 20));
  } catch (err) { next(err); }
};

export const get = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.getPost(schoolId(req), req.params.id));
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(res, await service.createPost(schoolId(req), req.user!.sub, req.body), 'Post created');
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deletePost(schoolId(req), req.params.id, req.user!.sub, req.user!.role);
    success(res, null, 'Post deleted');
  } catch (err) { next(err); }
};

export const listComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    success(res, await service.listComments(req.params.id, schoolId(req)));
  } catch (err) { next(err); }
};

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    created(
      res,
      await service.createComment(req.params.id, schoolId(req), req.user!.sub, req.body),
      'Comment added',
    );
  } catch (err) { next(err); }
};

export const removeComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteComment(schoolId(req), req.params.commentId, req.user!.sub, req.user!.role);
    success(res, null, 'Comment deleted');
  } catch (err) { next(err); }
};
