import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { jwtMiddleware, JwtPayload } from './auth';
import config from '../config';

function createMockReq(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
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

describe('jwtMiddleware', () => {
  const payload: JwtPayload = { id: '123', username: 'testuser', isAdmin: false };

  it('should return 401 with "No token provided" when Authorization header is missing', () => {
    const req = createMockReq() as Request;
    const res = createMockRes();
    const next = jest.fn();

    jwtMiddleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "No token provided" when Bearer token is empty', () => {
    const req = createMockReq('Bearer ') as Request;
    const res = createMockRes();
    const next = jest.fn();

    jwtMiddleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "Invalid token" for a malformed token', () => {
    const req = createMockReq('Bearer not-a-valid-jwt') as Request;
    const res = createMockRes();
    const next = jest.fn();

    jwtMiddleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "Token expired" for an expired token', () => {
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '0s' });
    // Wait a tick to ensure expiry
    const req = createMockReq(`Bearer ${token}`) as Request;
    const res = createMockRes();
    const next = jest.fn();

    // Manually advance time isn't needed — 0s expiry means it's already expired
    jwtMiddleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Token expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach decoded payload to req.user and call next() for a valid token', () => {
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    const req = createMockReq(`Bearer ${token}`) as Request;
    const res = createMockRes();
    const next = jest.fn();

    jwtMiddleware(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe(payload.id);
    expect(req.user!.username).toBe(payload.username);
    expect(req.user!.isAdmin).toBe(payload.isAdmin);
  });

  it('should return 401 with "Invalid token" when token is signed with wrong secret', () => {
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
    const req = createMockReq(`Bearer ${token}`) as Request;
    const res = createMockRes();
    const next = jest.fn();

    jwtMiddleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
