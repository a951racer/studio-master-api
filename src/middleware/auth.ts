import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface JwtPayload {
  id: string;
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}
