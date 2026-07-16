/**
 * Computes how long to wait (ms) before the next attempt.
 * `attempt` is 0-based: 0 = delay after the first failure, 1 after the second, etc.
 */
export interface BackoffStrategy {
  nextDelay(attempt: number): number;
}

export class ImmediateRetryStrategy implements BackoffStrategy {
  nextDelay(_attempt: number): number {
    return 0;
  }
}

export class FixedRetryStrategy implements BackoffStrategy {
  constructor(private readonly delay: number) {}

  nextDelay(_attempt: number): number {
    return this.delay;
  }
}

export class LinearBackoff implements BackoffStrategy {
  constructor(
    private readonly initialDelay: number,
    private readonly increment: number,
    private readonly maxDelay = Number.POSITIVE_INFINITY,
  ) {}

  nextDelay(attempt: number): number {
    return Math.min(
      this.maxDelay,
      this.initialDelay + attempt * this.increment,
    );
  }
}

/**
 * delay = min(maxDelay, baseDelay * 2^attempt)
 */
export class ExponentialBackoff implements BackoffStrategy {
  constructor(
    private readonly baseDelay: number,
    private readonly maxDelay = 30_000,
  ) {}

  nextDelay(attempt: number): number {
    return Math.min(this.maxDelay, this.baseDelay * 2 ** attempt);
  }
}

/**
 * Full jitter (AWS-style):
 * delay = random(0, min(maxDelay, baseDelay * 2^attempt))
 *
 * Spreads retries across the full window so clients don't cluster.
 * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
export class ExponentialBackoffWithJitter implements BackoffStrategy {
  constructor(
    private readonly baseDelay: number,
    private readonly maxDelay = 30_000,
  ) {}

  nextDelay(attempt: number): number {
    const ceiling = Math.min(this.maxDelay, this.baseDelay * 2 ** attempt);
    return Math.random() * ceiling;
  }
}

/**
 * Equal jitter: half exponential + random half of exponential.
 * delay = exp/2 + random(0, exp/2) where exp is capped.
 */
export class ExponentialBackoffWithEqualJitter implements BackoffStrategy {
  constructor(
    private readonly baseDelay: number,
    private readonly maxDelay = 30_000,
  ) {}

  nextDelay(attempt: number): number {
    const exp = Math.min(this.maxDelay, this.baseDelay * 2 ** attempt);
    return exp / 2 + Math.random() * (exp / 2);
  }
}
