import { sleep } from "./sleep";

import type { BackoffStrategy } from "./strategies";

export type RetryOptions = {
  /**
   * How many times to retry after the first attempt fails.
   * Total attempts = 1 + maxRetries (e.g. maxRetries=3 → up to 4 tries).
   */
  maxRetries?: number;
  /** Return false to stop retrying and rethrow immediately (permanent errors). */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Called after a failed attempt when a retry will be scheduled. */
  onRetry?: (info: {
    error: unknown;
    /** 1-based number of the attempt that just failed */
    attempt: number;
    delayMs: number;
    retriesLeft: number;
  }) => void;
  /** Optional abort — stops waiting / further attempts. */
  signal?: AbortSignal;
};

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new Error("Retry aborted");
  }
}

/**
 * Run `operation` with retries and a backoff strategy.
 *
 * @param maxRetries - retries after the first try (default 3 → 4 total attempts)
 */
export async function retry<T>(
  operation: () => Promise<T>,
  strategy: BackoffStrategy,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    shouldRetry = () => true,
    onRetry,
    signal,
  } = options;

  let lastError: unknown;

  // attempt is 0-based index of the current try: 0 = first try, maxRetries = last try
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    assertNotAborted(signal);

    try {
      return await operation();
    } catch (err) {
      lastError = err;

      const isLastAttempt = attempt === maxRetries;
      const retryable = shouldRetry(err, attempt);

      if (isLastAttempt || !retryable) {
        break;
      }

      // attempt is still the index of the failed try — use it as the backoff step
      const delay = strategy.nextDelay(attempt);

      onRetry?.({
        error: err,
        attempt: attempt + 1,
        delayMs: delay,
        retriesLeft: maxRetries - attempt,
      });

      await sleep(delay, signal);
    }
  }

  throw lastError;
}
