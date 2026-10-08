import { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export const badRequest = (m = 'Bad request') => new HttpError(400, m, 'BAD_REQUEST');
export const unauthorized = (m = 'Unauthorized') => new HttpError(401, m, 'UNAUTHORIZED');
export const forbidden = (m = 'Forbidden') => new HttpError(403, m, 'FORBIDDEN');
export const notFound = (m = 'Not found') => new HttpError(404, m, 'NOT_FOUND');
export const conflict = (m = 'Conflict') => new HttpError(409, m, 'CONFLICT');
export const gone = (m = 'Contest mutation window closed') => new HttpError(410, m, 'GONE');
export const unprocessable = (m = 'Invalid value') => new HttpError(422, m, 'UNPROCESSABLE');
export const tooManyRequests = (m = 'Too many requests') => new HttpError(429, m, 'TOO_MANY_ATTEMPTS');

/** Express 4 does not catch rejected promises; wrap every async handler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
