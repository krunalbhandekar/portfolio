import pino from "pino";
import { env, isProduction } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : isProduction ? "info" : "debug",
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'],
    censor: "[redacted]",
  },
  ...(isProduction
    ? {}
    : {
        transport: { target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } },
      }),
});
