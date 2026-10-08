/**
 * Browser API client for the Express server (portfolio.md §10).
 * - Same-origin `/api/v1` by default (proxied by next.config rewrites), cookies included.
 * - Sends the CSRF header the server requires on state-changing requests.
 * - Survives Render cold starts: 60s timeout, retries on 502/503/504 (and network errors for GETs).
 * - On an expired access token, refreshes once (shared across concurrent calls) and retries.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const CSRF_HEADER = { "X-Requested-With": "portfolio" } as const;
const TIMEOUT_MS = 60_000;
const RETRY_DELAYS_MS = [1_500, 4_000];
const RETRYABLE_STATUS = new Set([502, 503, 504]);

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta?: Record<string, unknown>;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  body?: unknown;
  signal?: AbortSignal;
  /** Set false for auth endpoints so a 401 doesn't trigger a refresh loop. */
  refreshOn401?: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function send(method: Method, path: string, { body, signal }: RequestOptions) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: "application/json", ...CSRF_HEADER };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "include",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      if (RETRYABLE_STATUS.has(res.status) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]!);
        continue;
      }
      return res;
    } catch (error) {
      if (signal?.aborted) throw error; // cancelled by the caller (e.g. React Query)
      const timedOut = timeout.aborted;
      // Network failure: only retry reads, since a write may already have been applied.
      if (timedOut || method !== "GET" || attempt >= RETRY_DELAYS_MS.length) {
        throw new ApiError(0, timedOut ? "TIMEOUT" : "NETWORK_ERROR", networkMessage(timedOut));
      }
      await sleep(RETRY_DELAYS_MS[attempt]!);
    }
  }
}

function networkMessage(timedOut: boolean) {
  return timedOut
    ? "The server took too long to respond. It may be waking up, so try again in a moment."
    : "Can't reach the server. Check your connection and try again.";
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const envelope = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!envelope) {
    // Not our API's JSON (e.g. proxy error page, or another app on the API port).
    throw new ApiError(
      res.status,
      "UNEXPECTED_RESPONSE",
      `The API returned an unexpected response (${res.status}). Check that the API server is running and API_URL points to it.`,
    );
  }
  if (!res.ok || !envelope.success) {
    throw new ApiError(
      res.status,
      envelope?.error?.code ?? "HTTP_ERROR",
      envelope?.error?.message ?? `Request failed (${res.status})`,
      envelope?.error?.details,
    );
  }
  return envelope;
}

async function parse<T>(res: Response): Promise<T> {
  return (await parseEnvelope<T>(res)).data as T;
}

export type Paginated<T> = {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

let refreshing: Promise<boolean> | null = null;

/** Rotates the session once, sharing the in-flight request between concurrent callers. */
export function refreshSession() {
  refreshing ??= send("POST", "/auth/refresh", {})
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function sendWithRefresh(method: Method, path: string, options: RequestOptions) {
  const res = await send(method, path, options);
  if (res.status === 401 && options.refreshOn401 !== false && (await refreshSession())) {
    return send(method, path, options);
  }
  return res;
}

async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  return parse<T>(await sendWithRefresh(method, path, options));
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  /** GET a paginated list, keeping the `meta` block. */
  list: async <T>(path: string, options?: Omit<RequestOptions, "body">): Promise<Paginated<T>> => {
    const envelope = await parseEnvelope<T[]>(await sendWithRefresh("GET", path, options ?? {}));
    return { items: envelope.data ?? [], meta: envelope.meta as Paginated<T>["meta"] };
  },
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
