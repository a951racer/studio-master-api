import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateWorkflowStage,
} from '../services/projectService';
import { listSongs, createSong } from '../services/songService';

const projectRouter = Router();

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

// GET /projects — list projects (accept optional clientId and workflowStageId query params)
projectRouter.get(
  '/',
  validate([
    query('clientId').optional().isMongoId().withMessage('clientId must be a valid ID'),
    query('workflowStageId').optional().isMongoId().withMessage('workflowStageId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: { clientId?: string; workflowStageId?: string } = {};
      if (req.query.clientId) {
        filters.clientId = req.query.clientId as string;
      }
      if (req.query.workflowStageId) {
        filters.workflowStageId = req.query.workflowStageId as string;
      }
      const projects = await listProjects(filters);
      res.status(200).json(projects);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /projects — create a project
projectRouter.post(
  '/',
  validate([
    body('name').notEmpty().withMessage('name is required'),
    body('clientId').notEmpty().withMessage('clientId is required')
      .isMongoId().withMessage('clientId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await createProject(req.body);
      res.status(201).json(project);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// GET /projects/:id — get a project
projectRouter.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await getProject(req.params.id as string);
      res.status(200).json(project);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /projects/:id — update a project
projectRouter.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await updateProject(req.params.id as string, req.body);
      res.status(200).json(project);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /projects/:id — delete a project
projectRouter.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteProject(req.params.id as string);
      res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /projects/:id/stage — update workflow stage
projectRouter.put(
  '/:id/stage',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    body('workflowStageId').notEmpty().withMessage('workflowStageId is required')
      .isMongoId().withMessage('workflowStageId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await updateWorkflowStage(
        req.params.id as string,
        req.body.workflowStageId,
      );
      res.status(200).json(project);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// GET /projects/:id/songs — list songs for a project
projectRouter.get(
  '/:id/songs',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const songs = await listSongs(req.params.id as string);
      res.status(200).json(songs);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /projects/:id/songs — create a song for a project
projectRouter.post(
  '/:id/songs',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    body('title').notEmpty().withMessage('title is required'),
    body('author').notEmpty().withMessage('author is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const song = await createSong({ ...req.body, projectId: req.params.id });
      res.status(201).json(song);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

export default projectRouter;
