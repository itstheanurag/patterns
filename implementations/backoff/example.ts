/**
 * Runnable demo:
 *   npm install
 *   npm run demo:backoff
 */
import { HttpError, isRetryableHttpError } from "./errors";
import { retry } from "./retry";
import { ExponentialBackoffWithJitter } from "./strategies";

/** Simulates a flaky payment API: fails a few times, then succeeds. */
function createFlakyPaymentApi(failuresBeforeSuccess = 3) {
  let calls = 0;

  return async function charge(
    amount: number,
  ): Promise<{ ok: true; amount: number }> {
    calls += 1;
    console.log(`  → charge($${amount}) call #${calls}`);

    if (calls <= failuresBeforeSuccess) {
      // Alternate between 503 and 429 to show "transient" errors
      const status = calls % 2 === 0 ? 429 : 503;
      throw new HttpError(
        status,
        `payment gateway temporarily unavailable (${status})`,
      );
    }

    return { ok: true, amount };
  };
}

/** Permanent failure — should not be retried. */
async function chargeWithBadCard(): Promise<never> {
  console.log("  → charge with invalid card");
  throw new HttpError(400, "invalid card number");
}

async function demoTransientSuccess() {
  console.log(
    "\n=== Demo 1: transient failures then success (full jitter) ===\n",
  );

  const charge = createFlakyPaymentApi(3);
  const strategy = new ExponentialBackoffWithJitter(200, 5_000);

  const result = await retry(() => charge(42), strategy, {
    maxRetries: 5, // up to 6 total attempts
    shouldRetry: isRetryableHttpError,
    onRetry: ({ attempt, delayMs, error, retriesLeft }) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(
        `  ✗ attempt ${attempt} failed (${msg}); ` +
          `retrying in ${delayMs.toFixed(0)}ms (${retriesLeft} retries left)`,
      );
    },
  });

  console.log("  ✓ success:", result);
}

async function demoPermanentFailure() {
  console.log("\n=== Demo 2: permanent 400 — fail fast, no backoff ===\n");

  try {
    await retry(chargeWithBadCard, new ExponentialBackoffWithJitter(200), {
      maxRetries: 5,
      shouldRetry: isRetryableHttpError,
      onRetry: () => {
        console.log("  (should not log — permanent errors are not retried)");
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✓ failed immediately without retries: ${msg}`);
  }
}

async function main() {
  await demoTransientSuccess();
  await demoPermanentFailure();
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("Unhandled:", err);
  process.exitCode = 1;
});
