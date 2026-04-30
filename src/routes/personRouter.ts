import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import {
  listPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  updatePhoneNumbers,
} from '../services/personService';

const personRouter = Router();

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

// GET /persons — list all persons
personRouter.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const persons = await listPersons();
      res.status(200).json(persons);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// POST /persons — create a person
personRouter.post(
  '/',
  validate([
    body('firstName').notEmpty().withMessage('firstName is required'),
    body('lastName').notEmpty().withMessage('lastName is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const person = await createPerson(req.body);
      res.status(201).json(person);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// GET /persons/:id — get a person
personRouter.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const person = await getPerson(req.params.id as string);
      res.status(200).json(person);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /persons/:id — update a person
personRouter.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const person = await updatePerson(req.params.id as string, req.body);
      res.status(200).json(person);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// DELETE /persons/:id — delete a person
personRouter.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deletePerson(req.params.id as string);
      res.status(200).json({ message: 'Person deleted successfully' });
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

// PUT /persons/:id/phones — update phone numbers
personRouter.put(
  '/:id/phones',
  validate([
    param('id').isMongoId().withMessage('id must be a valid ID'),
    body('phones').isArray().withMessage('phones must be an array'),
    body('phones.*.number').notEmpty().withMessage('each phone must have a number'),
    body('phones.*.typeId').notEmpty().withMessage('each phone must have a typeId')
      .isMongoId().withMessage('typeId must be a valid ID'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const person = await updatePhoneNumbers(
        req.params.id as string,
        req.body.phones,
      );
      res.status(200).json(person);
    } catch (err) {
      handleServiceError(err, res, next);
    }
  },
);

export default personRouter;
