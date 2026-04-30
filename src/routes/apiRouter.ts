import { Router } from 'express';
import lookupRouter from './lookupRouter';
import clientRouter from './clientRouter';
import personRouter from './personRouter';
import projectRouter from './projectRouter';
import songRouter from './songRouter';
import fileRouter from './fileRouter';
import s3Router from './s3Router';
import dashboardRouter from './dashboardRouter';

/**
 * API router for JWT-protected routes.
 * Individual resource routers (clients, persons, projects, etc.)
 * are mounted here as they are implemented.
 */
const apiRouter = Router();

apiRouter.use('/lookup', lookupRouter);
apiRouter.use('/clients', clientRouter);
apiRouter.use('/persons', personRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/songs', songRouter);
apiRouter.use('/files', fileRouter);
apiRouter.use('/s3', s3Router);
apiRouter.use('/dashboard', dashboardRouter);

export default apiRouter;
