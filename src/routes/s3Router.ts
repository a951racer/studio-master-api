import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { generatePresignedUploadUrl } from '../services/s3Service';

const s3Router = Router();

/**
 * POST /s3/presign
 * Generates a pre-signed S3 upload URL for a given file name and format.
 * Returns { uploadUrl, key } on success, or 500 if pre-sign fails.
 */
s3Router.post(
  '/presign',
  validate([
    body('fileName').notEmpty().withMessage('fileName is required'),
    body('format').notEmpty().withMessage('format is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileName, format } = req.body;
      const result = await generatePresignedUploadUrl(fileName, format);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate pre-signed URL' });
    }
  },
);

export default s3Router;
