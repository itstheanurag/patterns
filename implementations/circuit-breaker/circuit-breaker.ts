/**
 * Classic three-state circuit breaker:
 *   closed → open (after failureThreshold failures)
 *   open → half-open (after openMs cool-down)
 *   half-open → closed (probe success) or open (probe failure)
 */

export type CircuitState = "closed" | "open" | "half-open";

export class CircuitOpenError extends Error {
  constructor(message = "Circuit breaker is open") {
    super(message);
    this.name = "CircuitOpenError";
  }
}

export type CircuitBreakerOptions = {
  /** Consecutive failures before opening (default 3). */
  failureThreshold?: number;
  /** How long to stay open before allowing a probe (default 1000ms). */
  openMs?: number;
};

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;
  /** Only one trial call while half-open. */
  private probing = false;

  private readonly failureThreshold: number;
  private readonly openMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.openMs = options.openMs ?? 1000;
  }

  getState(): CircuitState {
    return this.state;
  }

  async exec<T>(operation: () => Promise<T>): Promise<T> {
    this.transitionFromOpenIfReady();

    if (this.state === "open") {
      throw new CircuitOpenError();
    }

    if (this.state === "half-open") {
      if (this.probing) {
        throw new CircuitOpenError(
          "Circuit breaker is half-open (probe in flight)",
        );
      }
      this.probing = true;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    } finally {
      this.probing = false;
    }
  }

  private transitionFromOpenIfReady(): void {
    if (this.state !== "open") return;
    if (Date.now() - this.openedAt >= this.openMs) {
      this.state = "half-open";
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures += 1;

    if (this.state === "half-open" || this.failures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }
}
