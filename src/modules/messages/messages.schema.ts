import { z } from 'zod';

export const createMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  body: z.string().min(1),
  schoolId: z.string().optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['sent', 'received', 'all']).default('received'),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
