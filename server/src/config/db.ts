import mongoose from "mongoose";
import { logger } from "../lib/logger.js";
import { env } from "./env.js";

// Reject unknown filter keys and wrap `$`-prefixed values in query filters with `$eq`,
// so user input can never become a query operator (NoSQL injection).
mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);

export async function connectDatabase() {
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
  mongoose.connection.on("error", (error) => logger.error({ err: error }, "MongoDB error"));

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info({ db: mongoose.connection.name }, "MongoDB connected");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export function isDatabaseUp() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
