import { Request, Response, NextFunction } from 'express';

interface MongooseValidationError extends Error {
  name: 'ValidationError';
  errors: Record<string, { message: string; path: string }>;
}

interface MongoDuplicateKeyError extends Error {
  code: number;
}

function isMongooseValidationError(err: unknown): err is MongooseValidationError {
  return err instanceof Error && err.name === 'ValidationError';
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as MongoDuplicateKeyError).code === 11000
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err.stack || err);

  if (isMongooseValidationError(err)) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({ error: 'Validation failed', details });
    return;
  }

  if (isDuplicateKeyError(err)) {
    res.status(409).json({ error: 'Duplicate entry' });
    return;
  }

  res.status(500).json({ error: 'An unexpected error occurred' });
}
