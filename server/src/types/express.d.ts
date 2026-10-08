import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAdmin` once the access token has been verified. */
      admin?: { id: Types.ObjectId; email: string };
      /** Parsed query from `validate({ query })` (Express 5 makes `req.query` read-only). */
      validatedQuery?: unknown;
    }
  }
}

export {};
