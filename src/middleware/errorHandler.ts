import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const FILE_SIZE_MB = 5;

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    const firstMessage = errors[0]?.message ?? 'Validation failed';
    res.status(422).json({ success: false, message: firstMessage, errors });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: `File is too large. Maximum allowed size is ${FILE_SIZE_MB} MB. Please compress your file and try again.`,
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ success: false, message: 'Unexpected file field in request.' });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ success: false, message: 'Too many files uploaded at once.' });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // fileFilter errors come through as plain Errors (not MulterError)
  if (err instanceof Error && (err.message.includes('PDF') || err.message.includes('JPG') || err.message.includes('PNG') || err.message.includes('CSV') || err.message.includes('Excel'))) {
    res.status(415).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[] | undefined)?.[0] ?? 'value';
      res.status(409).json({ success: false, message: `An account with this ${field} already exists.` });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'The requested record could not be found.' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({ success: false, message: 'This action references a record that does not exist.' });
      return;
    }
    if (err.code === 'P2014') {
      res.status(400).json({ success: false, message: 'This record is linked to other data and cannot be removed.' });
      return;
    }
    if (err.code === 'P2021') {
      logger.error(`Database table missing: ${err.meta?.table ?? 'unknown'} — run prisma migrate deploy`);
      res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again shortly.' });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data provided. Please check your input and try again.' });
    return;
  }

  logger.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on our end. Please try again later.' });
};
