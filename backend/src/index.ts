import express, { Express, Request, Response } from 'express';
import analyticsRouter from './api/analytics.js';

const app: Express = express();
const PORT = process.env.PORT !== undefined && process.env.PORT !== "" ? process.env.PORT : 3000;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'StellarStream Backend is running' });
});

app.use('/api/v1/analytics', analyticsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
