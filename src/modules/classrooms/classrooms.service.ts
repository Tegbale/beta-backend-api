import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { parseImportFile } from '../../utils/importParser';
import { CreateClassroomInput, UpdateClassroomInput, ListQuery } from './classrooms.schema';

export const listClassrooms = async (schoolId: string | undefined, query: ListQuery) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const where: any = schoolId ? { schoolId } : {};
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [classrooms, total] = await prisma.$transaction([
    prisma.classroom.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { students: true, teachers: true } },
        school: { select: { id: true, name: true } },
        teachers: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    }),
    prisma.classroom.count({ where }),
  ]);

  return { classrooms, total };
};

export const getClassroom = async (id: string, schoolId?: string) => {
  const where: any = { id };
  if (schoolId) where.schoolId = schoolId;

  const classroom = await prisma.classroom.findFirst({
    where,
    include: {
      teachers: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      students: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
  if (!classroom) throw new AppError('Classroom not found', 404);
  return classroom;
};

export const createClassroom = async (schoolId: string, input: CreateClassroomInput) => {
  const { schoolId: _ignored, ...rest } = input as any;
  return prisma.classroom.create({ data: { ...rest, schoolId } });
};

export const updateClassroom = async (id: string, input: UpdateClassroomInput, schoolId?: string) => {
  await getClassroom(id, schoolId);
  return prisma.classroom.update({ where: { id }, data: input });
};

export const deleteClassroom = async (id: string, schoolId?: string) => {
  await getClassroom(id, schoolId);
  await prisma.classroom.delete({ where: { id } });
};

export const bulkCreateClassrooms = async (schoolId: string, buffer: Buffer) => {
  const rows = parseImportFile(buffer);
  const results: { created: number; failed: number; errors: { row: number; message: string }[] } = { created: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row['name'] ?? row['classroomname'] ?? row['classroom name'] ?? '';
    const level = row['level'] ?? '';

    if (!name) {
      results.failed++;
      results.errors.push({ row: i + 2, message: 'Missing required field: name' });
      continue;
    }

    try {
      await prisma.classroom.create({ data: { name, level: level || undefined, schoolId } });
      results.created++;
    } catch {
      results.failed++;
      results.errors.push({ row: i + 2, message: `Failed to create classroom: ${name}` });
    }
  }

  return results;
};

export const assignTeacher = async (classroomId: string, teacherId: string, schoolId?: string) => {
  const classroom = await getClassroom(classroomId, schoolId);
  const where: any = { id: teacherId };
  if (schoolId) where.schoolId = schoolId;
  const teacher = await prisma.teacher.findFirst({ where });
  if (!teacher) throw new AppError('Teacher not found', 404);

  return prisma.classroom.update({
    where: { id: classroom.id },
    data: { teachers: { connect: { id: teacherId } } },
  });
};

export const removeTeacher = async (classroomId: string, teacherId: string, schoolId?: string) => {
  const classroom = await getClassroom(classroomId, schoolId);
  return prisma.classroom.update({
    where: { id: classroom.id },
    data: { teachers: { disconnect: { id: teacherId } } },
  });
};
