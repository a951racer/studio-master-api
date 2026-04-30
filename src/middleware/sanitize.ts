import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoSanitize = require('mongo-sanitize') as (value: unknown) => unknown;

/**
 * Sanitize an object in-place by removing keys that start with `$`.
 * Used for req.query and req.params which may be read-only properties
 * (getter-only) in newer Express versions, so we can't reassign them.
 */
function sanitizeInPlace(target: Record<string, unknown>): void {
  // Sanitize a shallow copy so the result is independent of mutations to `target`
  const sanitized = mongoSanitize({ ...target }) as Record<string, unknown>;

  // Remove all existing keys from the target
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  // Write sanitized values back
  Object.assign(target, sanitized);
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  if (req.query) {
    sanitizeInPlace(req.query as Record<string, unknown>);
  }
  if (req.params) {
    sanitizeInPlace(req.params as Record<string, unknown>);
  }
  next();
}
