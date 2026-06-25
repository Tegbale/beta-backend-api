import { z } from 'zod';

export const createClassroomSchema = z.object({
  name: z.string().min(1),
  level: z.string().optional(),
  schoolId: z.string().optional(), // provided by SUPER_ADMIN
});

export const updateClassroomSchema = createClassroomSchema.partial();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const assignTeacherSchema = z.object({
  teacherId: z.string(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
