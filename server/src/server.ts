import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

try {
  await connectDatabase();
} catch (err) {
  logger.fatal({ err }, "Could not connect to MongoDB");
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await disconnectDatabase().catch((err) => logger.error({ err }, "Error closing MongoDB"));
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => logger.error({ err }, "Unhandled promise rejection"));
