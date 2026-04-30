import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  reorderWorkflowStages,
  AppError,
} from '../services/lookupService';

const lookupRouter = Router();

const VALID_LIST_TYPES = ['file-format', 'file-type', 'workflow-stage', 'phone-number-type', 'role'];

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

// PUT /lookup/workflow-stages/order — reorder workflow stages
// This route MUST be defined before the /:type/:id routes to avoid conflicts
lookupRouter.put(
  '/workflow-stages/order',
  validate([
    body('orderedIds')
      .isArray({ min: 1 })
      .withMessage('orderedIds must be a non-empty array'),
    body('orderedIds.*')
      .isString()
      .notEmpty()
      .withMessage('Each orderedId must be a non-empty string'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reorderWorkflowStages(req.body.orderedIds);
      res.status(200).json({ message: 'Workflow stages reordered successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// GET /lookup/:type — list entries for a lookup type
lookupRouter.get(
  '/:type',
  param('type')
    .isIn(VALID_LIST_TYPES)
    .withMessage(`type must be one of: ${VALID_LIST_TYPES.join(', ')}`),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as string;
      const entries = await getEntries(type);
      res.status(200).json(entries);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /lookup/:type — create a new entry
lookupRouter.post(
  '/:type',
  validate([
    param('type')
      .isIn(VALID_LIST_TYPES)
      .withMessage(`type must be one of: ${VALID_LIST_TYPES.join(', ')}`),
    body('name').notEmpty().withMessage('name is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as string;
      const entry = await createEntry(type, req.body.name);
      res.status(201).json(entry);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /lookup/:type/:id — update an entry's name
lookupRouter.put(
  '/:type/:id',
  validate([
    param('type')
      .isIn(VALID_LIST_TYPES)
      .withMessage(`type must be one of: ${VALID_LIST_TYPES.join(', ')}`),
    param('id').isMongoId().withMessage('id must be a valid ID'),
    body('name').notEmpty().withMessage('name is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const entry = await updateEntry(id, req.body.name);
      res.status(200).json(entry);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /lookup/:type/:id — delete an entry
lookupRouter.delete(
  '/:type/:id',
  validate([
    param('type')
      .isIn(VALID_LIST_TYPES)
      .withMessage(`type must be one of: ${VALID_LIST_TYPES.join(', ')}`),
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await deleteEntry(id);
      res.status(200).json({ message: 'Lookup entry deleted successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

export default lookupRouter;
