import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { hashPassword } from '../../utils/password';
import { generatePassword } from '../../utils/generatePassword';
import { parseImportFile } from '../../utils/importParser';
import { CreateParentInput, UpdateParentInput, ListQuery } from './parents.schema';

const parentInclude = {
  user: {
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, isActive: true, createdAt: true },
  },
  wards: {
    select: { id: true, firstName: true, lastName: true, schoolId: true, classroomId: true, classroom: { select: { id: true, name: true } } },
  },
};

export const getMyWards = async (userId: string) => {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      wards: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          classroom: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!parent) throw new AppError('Parent profile not found', 404);
  return { wards: parent.wards, total: parent.wards.length };
};

export const listParents = async (query: ListQuery) => {
  const { page, limit, search, schoolId } = query;
  const skip = (page - 1) * limit;

  const userWhere: any = { role: 'PARENT' };
  if (search) {
    userWhere.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const parentWhere: any = { user: userWhere };
  if (schoolId) parentWhere.wards = { some: { schoolId } };

  const [parents, total] = await prisma.$transaction([
    prisma.parent.findMany({ where: parentWhere, skip, take: limit, orderBy: { createdAt: 'desc' }, include: parentInclude }),
    prisma.parent.count({ where: parentWhere }),
  ]);

  return { parents, total };
};

export const getParent = async (id: string) => {
  const parent = await prisma.parent.findUnique({ where: { id }, include: parentInclude });
  if (!parent) throw new AppError('Parent not found', 404);
  return parent;
};

export const createParent = async (input: CreateParentInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const tempPassword = generatePassword();

  const parent = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: await hashPassword(tempPassword),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: 'PARENT',
      },
    });
    return tx.parent.create({ data: { userId: user.id }, include: parentInclude });
  });

  return { parent, tempPassword };
};

export const updateParent = async (id: string, input: UpdateParentInput) => {
  const parent = await getParent(id);
  return prisma.user.update({
    where: { id: parent.userId },
    data: input,
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, isActive: true },
  });
};

export const toggleParentStatus = async (id: string) => {
  const parent = await getParent(id);
  return prisma.user.update({
    where: { id: parent.userId },
    data: { isActive: !parent.user.isActive },
    select: { id: true, isActive: true },
  });
};

export const deleteParent = async (id: string) => {
  const parent = await getParent(id);
  await prisma.user.delete({ where: { id: parent.userId } });
};

export const assignWard = async (parentId: string, studentId: string, schoolId?: string | null) => {
  await getParent(parentId);
  const where: any = { id: studentId };
  if (schoolId) where.schoolId = schoolId;
  const student = await prisma.student.findFirst({ where });
  if (!student) throw new AppError('Student not found in this school', 404);

  return prisma.parent.update({
    where: { id: parentId },
    data: { wards: { connect: { id: studentId } } },
    include: parentInclude,
  });
};

export const removeWard = async (parentId: string, studentId: string) => {
  await getParent(parentId);
  return prisma.parent.update({
    where: { id: parentId },
    data: { wards: { disconnect: { id: studentId } } },
    include: parentInclude,
  });
};

export const bulkCreateParents = async (buffer: Buffer) => {
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
      results.errors.push({ row: i + 2, message: `Missing required fields (email, firstName, lastName)` });
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
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, password: await hashPassword(tempPassword), firstName, lastName, phone: phone || undefined, role: 'PARENT' },
        });
        await tx.parent.create({ data: { userId: user.id } });
      });
      results.created++;
    } catch {
      results.failed++;
      results.errors.push({ row: i + 2, message: `Failed to create parent: ${email}` });
    }
  }

  return results;
};
