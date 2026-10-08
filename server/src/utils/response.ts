import type { Response } from "express";

export type ApiError = { code: string; message: string; details?: unknown };

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: Record<string, unknown>;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  { status = 200, meta }: { status?: number; meta?: Record<string, unknown> } = {},
) {
  const body: ApiResponse<T> = { success: true, data, error: null, ...(meta ? { meta } : {}) };
  return res.status(status).json(body);
}

export function sendError(res: Response, status: number, error: ApiError) {
  const body: ApiResponse<null> = { success: false, data: null, error };
  return res.status(status).json(body);
}
