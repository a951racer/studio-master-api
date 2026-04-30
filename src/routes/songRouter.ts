import { Router, Request, Response, NextFunction } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import {
  getSong,
  updateSong,
  deleteSong,
} from '../services/songService';
import { listFiles, createFile } from '../services/fileService';

const songRouter = Router();

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

// GET /songs/:id — get a song
songRouter.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const song = await getSong(req.params.id as string);
      res.status(200).json(song);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /songs/:id — update a song
songRouter.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const song = await updateSong(req.params.id as string, req.body);
      res.status(200).json(song);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /songs/:id — delete a song (cascades to files)
songRouter.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteSong(req.params.id as string);
      res.status(200).json({ message: 'Song deleted successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// GET /songs/:id/files — list files for a song
songRouter.get(
  '/:id/files',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = await listFiles(req.params.id as string);
      res.status(200).json(files);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /songs/:id/files — create a file for a song
songRouter.post(
  '/:id/files',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    body('name').notEmpty().withMessage('name is required'),
    body('format').notEmpty().withMessage('format is required'),
    body('typeId').notEmpty().withMessage('typeId is required')
      .isMongoId().withMessage('typeId must be a valid ID'),
    body('s3Url').notEmpty().withMessage('s3Url is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = await createFile({ ...req.body, songId: req.params.id });
      res.status(201).json(file);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

export default songRouter;
