/**
 * Run `operation` with a time budget.
 * Passes an AbortSignal so the work can actually stop when time is up.
 */
export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await operation(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`Timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
