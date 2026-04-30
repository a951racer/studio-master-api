import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listClientPersons,
  addPersonToClient,
  updateClientPerson,
  removePersonFromClient,
} from '../services/clientService';

const clientRouter = Router();

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

// GET /clients — list all clients
clientRouter.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clients = await listClients();
      res.status(200).json(clients);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /clients — create a client
clientRouter.post(
  '/',
  validate([
    body('name').notEmpty().withMessage('name is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await createClient(req.body);
      res.status(201).json(client);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// GET /clients/:id — get a client
clientRouter.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await getClient(req.params.id as string);
      res.status(200).json(client);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /clients/:id — update a client
clientRouter.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await updateClient(req.params.id as string, req.body);
      res.status(200).json(client);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /clients/:id — delete a client
clientRouter.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteClient(req.params.id as string);
      res.status(200).json({ message: 'Client deleted successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// --- ClientPersonAssociation sub-routes ---

// GET /clients/:id/persons — list persons for a client
clientRouter.get(
  '/:id/persons',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await listClientPersons(req.params.id as string);
      res.status(200).json(client.persons);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /clients/:id/persons — add a person to a client
clientRouter.post(
  '/:id/persons',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    body('personId').notEmpty().withMessage('personId is required')
      .isMongoId().withMessage('personId must be a valid ID'),
    body('roleId').notEmpty().withMessage('roleId is required')
      .isMongoId().withMessage('roleId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await addPersonToClient(req.params.id as string, req.body);
      res.status(201).json(client);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /clients/:id/persons/:personId — update a person's role or isPrimary for a client
clientRouter.put(
  '/:id/persons/:personId',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    param('personId').isMongoId().withMessage('personId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await updateClientPerson(
        req.params.id as string,
        req.params.personId as string,
        req.body,
      );
      res.status(200).json(client);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /clients/:id/persons/:personId — remove a person from a client
clientRouter.delete(
  '/:id/persons/:personId',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    param('personId').isMongoId().withMessage('personId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await removePersonFromClient(
        req.params.id as string,
        req.params.personId as string,
      );
      res.status(200).json({ message: 'Person removed from client' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

export default clientRouter;
