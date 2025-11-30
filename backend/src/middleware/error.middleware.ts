import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export class HttpError extends Error {
  statusCode: number;
  errors: any[];

  constructor(message: string, statusCode: number = 500, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'HttpError';
  }
}

export const createHttpError = (message: string, statusCode: number = 500, errors: any[] = []): HttpError => {
  return new HttpError(message, statusCode, errors);
};

