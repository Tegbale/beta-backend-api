import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthPayload {
  sub: string;
  email: string;
  role: Role;
  schoolId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}
