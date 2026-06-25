import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { LoginInput, RegisterInput, ChangePasswordInput } from './auth.schema';

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const user = await prisma.user.create({
    data: {
      ...input,
      password: await hashPassword(input.password),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, schoolId: true },
  });

  return user;
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

  const valid = await verifyPassword(input.password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const payload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, schoolId: user.schoolId },
  };
};

export const refresh = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
  if (!stored || stored.expiresAt < new Date()) throw new AppError('Invalid refresh token', 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const newAccessToken = signAccessToken({ sub: payload.sub, email: payload.email, role: payload.role, schoolId: payload.schoolId });
  return { accessToken: newAccessToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await verifyPassword(input.currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(input.newPassword) },
  });
};

export const me = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, schoolId: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};
