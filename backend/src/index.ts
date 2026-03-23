import express, { Express, Request, Response } from 'express';

const app: Express = express();
const PORT = process.env.PORT !== undefined && process.env.PORT !== "" ? process.env.PORT : 3000;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'StellarStream Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
