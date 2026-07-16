/**
 * Lightweight HTTP-ish error for demos and shouldRetry helpers.
 * In real code you'd map Axios/fetch/SDK errors the same way.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = "HttpError";
  }
}

/** Transient failures that are usually safe to retry. */
export function isRetryableHttpError(error: unknown): boolean {
  if (!(error instanceof HttpError)) {
    // Network blips, timeouts, etc. — treat unknown errors as retryable by default
    // for learning demos. Tighten this in production.
    return true;
  }

  const { status } = error;

  // Rate limited or server/gateway problems
  if (status === 408 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;

  // Client / auth / not-found — permanent for this request
  return false;
}
