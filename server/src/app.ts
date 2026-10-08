import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { isDatabaseUp } from "./config/db.js";
import { corsOrigins, env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { CSRF_HEADER } from "./middlewares/csrf.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { apiLimiter } from "./middlewares/rate-limit.js";
import { sanitizeBody } from "./middlewares/sanitize.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { sendSuccess } from "./utils/response.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY_HOPS);

const REQUEST_ID = /^[\w-]{8,64}$/;
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers["x-request-id"];
      const id =
        typeof incoming === "string" && REQUEST_ID.test(incoming) ? incoming : randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
    customLogLevel: (_req, res, err) =>
      err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
  }),
);

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", CSRF_HEADER, "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeBody);

app.get("/api/v1/health", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    env: env.NODE_ENV,
    database: isDatabaseUp() ? "up" : "down",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Admin routes are mounted before the general limiter, so they don't count against it.
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
