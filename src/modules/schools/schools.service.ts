import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateSchoolInput, UpdateSchoolInput, ListQuery } from './schools.schema';

export const listSchools = async (query: ListQuery) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : {};

  const [schools, total] = await prisma.$transaction([
    prisma.school.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.school.count({ where }),
  ]);

  return { schools, total };
};

export const getSchool = async (id: string) => {
  const school = await prisma.school.findUnique({
    where: { id },
    include: { _count: { select: { classrooms: true, students: true, staff: true } } },
  });
  if (!school) throw new AppError('School not found', 404);
  return school;
};

export const createSchool = async (input: CreateSchoolInput) => {
  return prisma.school.create({ data: input });
};

export const updateSchool = async (id: string, input: UpdateSchoolInput) => {
  await getSchool(id);
  return prisma.school.update({ where: { id }, data: input });
};

export const toggleSchoolStatus = async (id: string) => {
  const school = await getSchool(id);
  return prisma.school.update({ where: { id }, data: { isActive: !school.isActive } });
};

export const deleteSchool = async (id: string) => {
  await getSchool(id);
  await prisma.school.delete({ where: { id } });
};
