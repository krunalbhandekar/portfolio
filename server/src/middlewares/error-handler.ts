import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/response.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` });
};

type HttpError = Error & { status?: number; type?: string; code?: number };

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  if (err instanceof AppError) {
    return sendError(res, err.status, {
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: err.issues.map(({ path, message }) => ({ path: path.join("."), message })),
    });
  }

  // body-parser errors
  if (err.type === "entity.parse.failed") {
    return sendError(res, 400, { code: "INVALID_JSON", message: "Malformed JSON body" });
  }
  if (err.type === "entity.too.large") {
    return sendError(res, 413, { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" });
  }

  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 400, { code: "INVALID_ID", message: `Invalid ${err.path}` });
  }
  if (err.code === 11000) {
    return sendError(res, 409, {
      code: "DUPLICATE",
      message: "A record with this value already exists",
    });
  }

  req.log.error({ err }, "Unhandled error");
  return sendError(res, 500, { code: "INTERNAL_ERROR", message: "Something went wrong" });
};
