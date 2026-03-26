import * as Sentry from "@sentry/node";
import express, { Express, Request, Response } from "express";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { WebSocketService } from "./services/websocket.service.js";
import { WarpService } from "./services/warp.service.js";
import { BridgeObserverService } from "./services/bridge-observer.service.js";
import { TTLArchivalMonitorService } from "./services/ttl-archival-monitor.service.js";
import helmet from "helmet";
import cors from "cors";
import apiRouter from "./api/index.js";
import { authMiddleware } from "./middleware/auth.js";
import {
  rateLimitMiddleware,
  sensitiveRateLimitMiddleware,
} from "./middleware/rateLimit.js";
import { requireWalletAuth } from "./middleware/requireWalletAuth.js";
import { getStats, getSearch } from "./api/public.js";
import { getNonce, getMe } from "./api/auth.js";
import { ensureRedis, closeRedis } from "./lib/redis.js";
import { prisma } from "./lib/db.js";
import batchRoutes from "./api/routes.js";
import healthRoutes from "./api/health.routes.js";
import testRoutes from "./api/test.js";
import { scheduleSnapshotMaintenance } from "./services/snapshot.scheduler.js";
import { StaleStreamCleanupWorker } from "./stale-stream-cleanup.worker.js";
import { DataIntegrityWorker } from "./data-integrity.worker.js";
import { YieldAccrualWorker } from "./yield-accrual.worker.js";
import { startWebhookWorker } from "./webhook-dispatcher.worker.js";
import { bigintSerializer } from "./middleware/bigintSerializer.js";
import { swaggerSpec } from "./swagger.js";
import { initializeSchedulers } from "./schedulers.js";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: 1.0,
});

const app: Express = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT ?? 3000;
export const wsService = new WebSocketService(io);
export const warpService = new WarpService(wsService);
export const bridgeObserver = new BridgeObserverService(wsService);
export const ttlMonitor = new TTLArchivalMonitorService(wsService);
const cleanupWorker = new StaleStreamCleanupWorker();
const dataIntegrityWorker = new DataIntegrityWorker();
const yieldAccrualWorker = new YieldAccrualWorker();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
  }),
);

app.use(bigintSerializer);
app.use(compression());
app.use(express.json());
app.use(authMiddleware);

// ── Root redirect → Swagger docs ──────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/api/v1/docs");
});

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/v1/docs.json", (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// ── Auth routes ───────────────────────────────────────────────────────────────
const authRouter = express.Router();
authRouter.get("/nonce", rateLimitMiddleware, getNonce);
authRouter.get("/me", rateLimitMiddleware, requireWalletAuth, getMe);
// Sensitive: 5 req/min on challenge endpoint
authRouter.post(
  "/challenge",
  sensitiveRateLimitMiddleware,
  (_req: Request, res: Response) => {
    res.status(501).json({ error: "Not implemented", code: 501 });
  },
);
app.use("/api/v1/auth", authRouter);

// ── Webhook routes (sensitive: 5 req/min) ────────────────────────────────────
app.post(
  "/webhook/register",
  sensitiveRateLimitMiddleware,
  (_req: Request, res: Response) => {
    res.status(501).json({ error: "Not implemented", code: 501 });
  },
);

// ── Public routes (stats / search) ───────────────────────────────────────────
app.get("/api/v1/stats", rateLimitMiddleware, getStats);
app.get("/api/v1/search", rateLimitMiddleware, getSearch);

// ── Core API router (streams, yield, snapshots, governance, audit-log) ────────
app.use("/api/v1", apiRouter);

// ── V2 API router ─────────────────────────────────────────────────────────────
import apiV2Router from "./api/v2/index.js";
app.use("/api/v2", apiV2Router);

// ── Batch metadata + stream graph ─────────────────────────────────────────────
app.use("/api/v1", batchRoutes);

// ── Health / sync status ──────────────────────────────────────────────────────
app.use("/api/v1", healthRoutes);

// ── Test/dev helpers ──────────────────────────────────────────────────────────
app.use("/api/v1/test", testRoutes);

// ── WebSocket status ──────────────────────────────────────────────────────────
app.get("/ws-status", (_req: Request, res: Response) => {
  res.json({
    connectedUsers: wsService.getConnectedUsers(),
    userConnections: Object.fromEntries(
      wsService
        .getConnectedUsers()
        .map((addr) => [addr, wsService.getUserSocketCount(addr)]),
    ),
  });
});

// ── Sentry error handler ──────────────────────────────────────────────────────
Sentry.setupExpressErrorHandler(app);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await ensureRedis();
  scheduleSnapshotMaintenance();
  initializeSchedulers();
  cleanupWorker.start();
  dataIntegrityWorker.start();
  yieldAccrualWorker.start();
  startWebhookWorker();
  
  // Start background services
  bridgeObserver.start();
  ttlMonitor.start();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 API docs: http://localhost:${PORT}/api/v1/docs`);
    console.log(`🔌 WebSocket ready`);
    console.log(`🌉 Bridge observer active`);
    console.log(`⏱️  TTL monitor active`);
  });
}

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down gracefully...`);
  cleanupWorker.stop();
  dataIntegrityWorker.stop();
  yieldAccrualWorker.stop();
  bridgeObserver.stop();
  ttlMonitor.stop();
  closeRedis()
    .then(() => prisma.$disconnect())
    .then(() => {
      console.log("Goodbye.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Shutdown error:", err);
      process.exit(1);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
