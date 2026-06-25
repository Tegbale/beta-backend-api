import { Response } from 'express';

export const success = <T>(res: Response, data: T, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const created = <T>(res: Response, data: T, message = 'Created') =>
  success(res, data, message, 201);

export const paginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) =>
  res.status(200).json({
    success: true,
    message,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
