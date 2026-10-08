import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationQuerySchema>;

export const toSkip = ({ page, limit }: Pagination) => (page - 1) * limit;

export function paginationMeta(total: number, { page, limit }: Pagination) {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
