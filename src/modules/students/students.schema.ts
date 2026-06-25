import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  avatar: z.string().url().optional(),
  classroomId: z.string().optional(),
  schoolId: z.string().optional(), // provided by SUPER_ADMIN
});

export const updateStudentSchema = createStudentSchema.partial();

export const assignClassroomSchema = z.object({
  classroomId: z.string(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  classroomId: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
