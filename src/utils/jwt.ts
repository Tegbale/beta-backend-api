import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../types';

export const signAccessToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn } as jwt.SignOptions);

export const signRefreshToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AuthPayload =>
  jwt.verify(token, env.jwt.accessSecret) as AuthPayload;

export const verifyRefreshToken = (token: string): AuthPayload =>
  jwt.verify(token, env.jwt.refreshSecret) as AuthPayload;
