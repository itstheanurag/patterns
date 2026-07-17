/**
 *   npm run demo:circuit-breaker
 *
 * 1) Dependency fails → breaker opens after 3 failures
 * 2) Further calls fail fast (never hit the dependency)
 * 3) After cool-down, a probe succeeds → breaker closes
 */
import { CircuitBreaker, CircuitOpenError } from "./circuit-breaker";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fake payment API — set `down` to simulate an outage. */
function createPaymentApi() {
  let down = true;
  let calls = 0;

  return {
    setDown(value: boolean) {
      down = value;
    },
    async charge(amount: number): Promise<{ ok: true; amount: number }> {
      calls += 1;
      console.log(`  → payment.charge($${amount}) call #${calls}`);

      if (down) {
        throw new Error("payment gateway unavailable");
      }
      return { ok: true, amount };
    },
    getCalls: () => calls,
  };
}

async function main() {
  const payment = createPaymentApi();
  const breaker = new CircuitBreaker({ failureThreshold: 3, openMs: 500 });

  console.log("\n--- 1) three failures trip the breaker ---");
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.exec(() => payment.charge(10));
    } catch (err) {
      console.log(
        `  ✗ ${(err as Error).message}  [state=${breaker.getState()}]`,
      );
    }
  }

  console.log("\n--- 2) open: fail fast, dependency not called ---");
  const callsBefore = payment.getCalls();
  try {
    await breaker.exec(() => payment.charge(10));
  } catch (err) {
    console.log(`  ✗ ${(err as Error).message}  [state=${breaker.getState()}]`);
  }
  console.log(
    `  payment calls stayed at ${payment.getCalls()} (was ${callsBefore})`,
  );

  console.log(
    "\n--- 3) cool-down, dependency recovers, probe closes circuit ---",
  );
  await sleep(500);
  payment.setDown(false);

  const result = await breaker.exec(() => payment.charge(10));
  console.log(`  ✓ ${JSON.stringify(result)}  [state=${breaker.getState()}]`);

  // Sanity: CircuitOpenError is distinct from dependency errors
  console.log("\n--- 4) force open again, show CircuitOpenError ---");
  payment.setDown(true);
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.exec(() => payment.charge(10));
    } catch {
      /* trip */
    }
  }
  try {
    await breaker.exec(() => payment.charge(10));
  } catch (err) {
    console.log(
      `  ${err instanceof CircuitOpenError ? "CircuitOpenError" : "other"}: ${(err as Error).message}`,
    );
  }

  console.log("\nDone.\n");
}

main();
