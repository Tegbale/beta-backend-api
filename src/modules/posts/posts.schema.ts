import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
