import { Router, Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import {
  getFile,
  updateFile,
  deleteFile,
} from '../services/fileService';

const fileRouter = Router();

/**
 * Helper to catch service-layer AppErrors and send the appropriate HTTP response.
 */
function handleServiceError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

// GET /files/:id — get a file
fileRouter.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await getFile(req.params.id as string);
      res.status(200).json(file);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /files/:id — update a file
fileRouter.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await updateFile(req.params.id as string, req.body);
      res.status(200).json(file);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /files/:id — delete a file
fileRouter.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteFile(req.params.id as string);
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

export default fileRouter;
