import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import apiRouter from './api';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { requireWalletAuth } from './middleware/requireWalletAuth.js';
import { getStats, getSearch } from './api/public.js';
import { getNonce, getMe } from './api/auth.js';
import { ensureRedis, closeRedis } from './lib/redis.js';
import { prisma } from './lib/db.js';
import batchRoutes from './api/routes.js';
import healthRoutes from './api/health.routes.js';

const app: Express = express();
const PORT = process.env.PORT ?? 3000;

// Security: Helmet for secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Security: CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(authMiddleware);

// Register API routes
app.use('/api', apiRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'StellarStream Backend is running' });
});

app.get('/stats', rateLimitMiddleware, getStats);
app.get('/search', rateLimitMiddleware, getSearch);

const authRouter = express.Router();
authRouter.get('/nonce', rateLimitMiddleware, getNonce);
authRouter.get('/me', rateLimitMiddleware, requireWalletAuth, getMe);
app.use('/api/v1/auth', authRouter);

async function start(): Promise<void> {
  await ensureRedis();
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down gracefully...`);
  closeRedis()
    .then(() => prisma.$disconnect())
    .then(() => {
      console.log('Goodbye.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Shutdown error:', err);
      process.exit(1);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
// Batch metadata endpoint for bulk streaming queries
app.use(batchRoutes);
app.use(healthRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
