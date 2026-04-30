import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from './validate';

function createMockReq(bodyData: Record<string, unknown> = {}): Partial<Request> {
  return {
    body: bodyData,
    // express-validator needs these to exist
    query: {},
    params: {},
    headers: {},
  } as Partial<Request>;
}

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

describe('validate middleware', () => {
  it('should call next() when all validations pass', async () => {
    const validations = [body('name').notEmpty()];
    const middleware = validate(validations);

    const req = createMockReq({ name: 'Test' }) as Request;
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(0);
  });

  it('should return 400 with errors when validation fails', async () => {
    const validations = [body('name').notEmpty().withMessage('name is required')];
    const middleware = validate(validations);

    const req = createMockReq({}) as Request;
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect((res.body as { errors: unknown[] }).errors.length).toBeGreaterThan(0);
  });

  it('should return all validation errors when multiple fields fail', async () => {
    const validations = [
      body('firstName').notEmpty().withMessage('firstName is required'),
      body('lastName').notEmpty().withMessage('lastName is required'),
    ];
    const middleware = validate(validations);

    const req = createMockReq({}) as Request;
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    const errors = (res.body as { errors: Array<{ path: string }> }).errors;
    expect(errors.length).toBe(2);
  });
});
