import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';

function createMockRes(): Partial<Response> & { statusCode: number; body: unknown } {
  const res: Partial<Response> & { statusCode: number; body: unknown } = {
    statusCode: 0,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res as Response;
    },
    json(data: unknown) {
      res.body = data;
      return res as Response;
    },
  };
  return res;
}

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 with details for Mongoose ValidationError', () => {
    const err = new Error('Validation failed') as Error & {
      errors: Record<string, { message: string; path: string }>;
    };
    err.name = 'ValidationError';
    err.errors = {
      name: { message: 'name is required', path: 'name' },
      email: { message: 'email is invalid', path: 'email' },
    };

    const res = createMockRes();
    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Validation failed',
      details: expect.arrayContaining([
        { field: 'name', message: 'name is required' },
        { field: 'email', message: 'email is invalid' },
      ]),
    });
    expect(console.error).toHaveBeenCalled();
  });

  it('should return 409 for duplicate key error (code 11000)', () => {
    const err = new Error('Duplicate key') as Error & { code: number };
    err.code = 11000;

    const res = createMockRes();
    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'Duplicate entry' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should return 500 for generic errors', () => {
    const err = new Error('Something went wrong');

    const res = createMockRes();
    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'An unexpected error occurred' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should log the full error stack server-side', () => {
    const err = new Error('Test error');

    const res = createMockRes();
    errorHandler(err, req, res as unknown as Response, next);

    expect(console.error).toHaveBeenCalledWith(err.stack);
  });
});
