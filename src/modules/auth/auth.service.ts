import { randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { sendMail } from '../../lib/mailer';
import { passwordResetEmail } from '../../lib/emailTemplates';
import { env } from '../../config/env';
import { LoginInput, RegisterInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

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

export const forgotPassword = async (input: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Always respond with success to avoid leaking which emails are registered
  if (!user || !user.isActive) return;

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  const resetUrl = `${env.clientOrigins[0]}/reset-password?token=${token}`;
  sendMail(
    user.email,
    'Reset your Tègbalé password',
    passwordResetEmail(`${user.firstName} ${user.lastName}`, resetUrl),
  ).catch((err: any) => console.error(`[mailer] ${err.message}`));
};

export const resetPassword = async (input: ResetPasswordInput) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { token: input.token } });

  if (!record || record.used || record.expiresAt < new Date()) {
    throw new AppError('This reset link is invalid or has expired', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: await hashPassword(input.newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
    // Invalidate all existing refresh tokens on password reset
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);
};

export const me = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, schoolId: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateMe = async (userId: string, data: { firstName?: string; lastName?: string; phone?: string }) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, schoolId: true, createdAt: true },
  });
  return user;
};

export const updateAvatar = async (userId: string, buffer: Buffer) => {
  const { uploadBuffer } = await import('../../lib/storage');
  const url = await uploadBuffer(buffer, 'tegbale/avatars', `${userId}-${Date.now()}`);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: url },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, schoolId: true, createdAt: true },
  });
  return user;
};
