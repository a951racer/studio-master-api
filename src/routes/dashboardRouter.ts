import { Router, Request, Response, NextFunction } from 'express';
import { getDashboardData } from '../services/dashboardService';

const dashboardRouter = Router();

// GET /dashboard — get dashboard summary counts
dashboardRouter.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await getDashboardData();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default dashboardRouter;
