import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import config from './config';
import { sanitizeMiddleware } from './middleware/sanitize';
import { jwtMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/authRouter';
import apiRouter from './routes/apiRouter';

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS — restrict to configured origins
app.use(cors({ origin: config.allowedOrigins }));

// 3. HTTP request logging
app.use(morgan('combined'));

// 4. JSON body parsing
app.use(express.json());

// 5. NoSQL injection prevention — strip $ and . operators from all inputs
app.use(sanitizeMiddleware);

// 6. Auth routes — no JWT required
app.use('/api/auth', authRouter);

// 7. All other API routes — JWT required
app.use('/api', jwtMiddleware, apiRouter);

// 8. Global error handler (must be last)
app.use(errorHandler);

export default app;
