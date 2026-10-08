import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType };

/**
 * Validates and coerces request input. Failures throw a ZodError, which the error handler
 * turns into a 400. Parsed body replaces `req.body`; parsed query goes to `req.validatedQuery`.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    next();
  };
}
