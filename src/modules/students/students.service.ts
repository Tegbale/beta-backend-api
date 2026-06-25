import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { parseImportFile } from '../../utils/importParser';
import { CreateStudentInput, UpdateStudentInput, ListQuery } from './students.schema';

export const listStudents = async (schoolId: string | undefined, query: ListQuery) => {
  const { page, limit, search, classroomId } = query;
  const skip = (page - 1) * limit;
  const where: any = schoolId ? { schoolId } : {};
  if (classroomId) where.classroomId = classroomId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        classroom: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total };
};

export const getStudent = async (id: string, schoolId?: string) => {
  const where: any = { id };
  if (schoolId) where.schoolId = schoolId;

  const student = await prisma.student.findFirst({
    where,
    include: {
      classroom: { select: { id: true, name: true, level: true } },
      parents: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
    },
  });
  if (!student) throw new AppError('Student not found', 404);
  return student;
};

export const createStudent = async (schoolId: string, input: CreateStudentInput) => {
  const { schoolId: _ignored, ...rest } = input as any;
  return prisma.student.create({
    data: { ...rest, schoolId, dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined },
  });
};

export const updateStudent = async (id: string, input: UpdateStudentInput, schoolId?: string) => {
  await getStudent(id, schoolId);
  return prisma.student.update({
    where: { id },
    data: { ...input, dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined },
  });
};

export const deleteStudent = async (id: string, schoolId?: string) => {
  await getStudent(id, schoolId);
  await prisma.student.delete({ where: { id } });
};

export const bulkCreateStudents = async (schoolId: string, buffer: Buffer) => {
  const rows = parseImportFile(buffer);
  const results: { created: number; failed: number; errors: { row: number; message: string }[] } = { created: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const firstName = row['firstname'] ?? row['first_name'] ?? row['first name'] ?? '';
    const lastName = row['lastname'] ?? row['last_name'] ?? row['last name'] ?? '';
    const gender = (row['gender'] ?? '').toLowerCase();
    const dob = row['dateofbirth'] ?? row['date_of_birth'] ?? row['dateofbirth'] ?? row['dob'] ?? '';
    const classroomName = row['classroomname'] ?? row['classroom'] ?? row['classroom name'] ?? '';

    if (!firstName || !lastName) {
      results.failed++;
      results.errors.push({ row: i + 2, message: 'Missing required fields (firstName, lastName)' });
      continue;
    }

    try {
      let classroomId: string | undefined;
      if (classroomName) {
        const classroom = await prisma.classroom.findFirst({
          where: { name: { equals: classroomName, mode: 'insensitive' }, schoolId },
        });
        classroomId = classroom?.id;
      }

      await prisma.student.create({
        data: {
          firstName,
          lastName,
          schoolId,
          gender: ['male', 'female', 'other'].includes(gender) ? gender : undefined,
          dateOfBirth: dob ? new Date(dob) : undefined,
          classroomId,
        },
      });
      results.created++;
    } catch {
      results.failed++;
      results.errors.push({ row: i + 2, message: `Failed to create: ${firstName} ${lastName}` });
    }
  }

  return results;
};

export const assignClassroom = async (studentId: string, classroomId: string, schoolId?: string) => {
  await getStudent(studentId, schoolId);
  const where: any = { id: classroomId };
  if (schoolId) where.schoolId = schoolId;
  const classroom = await prisma.classroom.findFirst({ where });
  if (!classroom) throw new AppError('Classroom not found', 404);
  return prisma.student.update({ where: { id: studentId }, data: { classroomId } });
};
