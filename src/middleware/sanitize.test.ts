import { Request, Response, NextFunction } from 'express';
import { sanitizeMiddleware } from './sanitize';

function createMockReq(
  bodyData?: Record<string, unknown>,
  queryData?: Record<string, unknown>,
  paramsData?: Record<string, unknown>,
): Partial<Request> {
  return {
    body: bodyData || {},
    query: (queryData || {}) as Request['query'],
    params: (paramsData || {}) as Request['params'],
  };
}

describe('sanitizeMiddleware', () => {
  const res = {} as Response;

  it('should strip $ operators from req.body', () => {
    const req = createMockReq({ $gt: 'malicious', name: 'safe' }) as Request;
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(req.body).toEqual({ name: 'safe' });
    expect(next).toHaveBeenCalled();
  });

  it('should strip $ operators from req.query', () => {
    const req = createMockReq({}, { $ne: '1', search: 'ok' }) as Request;
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(req.query).toEqual({ search: 'ok' });
    expect(next).toHaveBeenCalled();
  });

  it('should strip $ operators from req.params', () => {
    const req = createMockReq({}, {}, { $where: 'evil', id: '123' }) as Request;
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(req.params).toEqual({ id: '123' });
    expect(next).toHaveBeenCalled();
  });

  it('should call next() even when no sanitization is needed', () => {
    const req = createMockReq({ name: 'clean' }) as Request;
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(req.body).toEqual({ name: 'clean' });
    expect(next).toHaveBeenCalled();
  });

  it('should handle nested objects with $ operators', () => {
    const req = createMockReq({
      filter: { $gt: 100, name: 'test' },
    }) as Request;
    const next = jest.fn();

    sanitizeMiddleware(req, res, next);

    expect(req.body).toEqual({ filter: { name: 'test' } });
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize req.query in-place when the property is read-only', () => {
    const queryObj: Record<string, unknown> = { $ne: '1', search: 'ok' };
    const req = { body: {}, params: {} } as unknown as Record<string, unknown>;
    Object.defineProperty(req, 'query', {
      get() { return queryObj; },
      configurable: false,
      enumerable: true,
    });
    const next = jest.fn();

    sanitizeMiddleware(req as unknown as Request, res, next);

    expect(queryObj).toEqual({ search: 'ok' });
    expect(next).toHaveBeenCalled();
  });
});
