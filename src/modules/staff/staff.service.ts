import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { hashPassword } from '../../utils/password';
import { generatePassword } from '../../utils/generatePassword';
import { parseImportFile } from '../../utils/importParser';
import { CreateStaffInput, UpdateStaffInput, ListQuery } from './staff.schema';

export const listStaff = async (schoolId: string | null | undefined, query: ListQuery) => {
  const { page, limit, search, role } = query;
  const skip = (page - 1) * limit;

  const where: any = { role: { in: ['SCHOOL_ADMIN', 'STAFF', 'TEACHER'] as Role[] } };
  if (schoolId) where.schoolId = schoolId;
  if (role) where.role = role as Role;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [staff, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { staff, total };
};

export const getStaff = async (schoolId: string, userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true },
  });
  if (!user) throw new AppError('Staff member not found', 404);
  return user;
};

export const createStaff = async (schoolId: string, input: CreateStaffInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const tempPassword = generatePassword();
  const user = await prisma.user.create({
    data: { ...input, password: await hashPassword(tempPassword), schoolId, role: input.role as Role },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, schoolId: true },
  });

  if (input.role === 'TEACHER') {
    await prisma.teacher.create({ data: { userId: user.id, schoolId } });
  }

  return { user, tempPassword };
};

export const bulkCreateStaff = async (schoolId: string, role: 'TEACHER' | 'STAFF', buffer: Buffer) => {
  const rows = parseImportFile(buffer);
  const results: { created: number; failed: number; errors: { row: number; message: string }[] } = { created: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row['email'] ?? row['emailaddress'] ?? '';
    const firstName = row['firstname'] ?? row['first_name'] ?? row['first name'] ?? '';
    const lastName = row['lastname'] ?? row['last_name'] ?? row['last name'] ?? '';
    const phone = row['phone'] ?? row['phonenumber'] ?? '';

    if (!email || !firstName || !lastName) {
      results.failed++;
      results.errors.push({ row: i + 2, message: 'Missing required fields (email, firstName, lastName)' });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.failed++;
      results.errors.push({ row: i + 2, message: `Invalid email: ${email}` });
      continue;
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.failed++;
        results.errors.push({ row: i + 2, message: `Email already in use: ${email}` });
        continue;
      }
      const tempPassword = generatePassword();
      const user = await prisma.user.create({
        data: { email, password: await hashPassword(tempPassword), firstName, lastName, phone: phone || undefined, schoolId, role: role as Role },
      });
      if (role === 'TEACHER') {
        await prisma.teacher.create({ data: { userId: user.id, schoolId } });
      }
      results.created++;
    } catch {
      results.failed++;
      results.errors.push({ row: i + 2, message: `Failed to create: ${email}` });
    }
  }

  return results;
};

export const updateStaff = async (schoolId: string, userId: string, input: UpdateStaffInput) => {
  await getStaff(schoolId, userId);
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true },
  });
};

export const toggleStaffStatus = async (schoolId: string, userId: string) => {
  const user = await getStaff(schoolId, userId);
  return prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
};

export const deleteStaff = async (schoolId: string | null | undefined, userId: string) => {
  if (schoolId) {
    await getStaff(schoolId, userId);
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Staff member not found', 404);
  }
  await prisma.user.delete({ where: { id: userId } });
};
