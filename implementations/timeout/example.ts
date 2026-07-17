/**
 *   npm run demo:timeout
 *
 * Local mock only (no httpbin) so timing is deterministic.
 * Healthy p99 ≈ 400ms → timeout 800ms (2×), not 30s.
 */
import { withTimeout } from "./timeout";

/** Fake dependency that takes `ms` to finish, and stops if aborted. */
function fakeDb(ms: number, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve("user-1"), ms);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });
}

async function main() {
  // 1) Healthy call finishes under budget
  console.log("\n--- success (work 400ms, budget 800ms) ---");
  const user = await withTimeout((signal) => fakeDb(400, signal), 800);
  console.log("ok:", user);

  // 2) Slow/hung call fails fast at ~800ms
  console.log("\n--- timeout (work 5000ms, budget 800ms) ---");
  const started = Date.now();
  try {
    await withTimeout((signal) => fakeDb(5000, signal), 800);
  } catch (err) {
    console.log(
      `${(err as Error).message} (elapsed ~${Date.now() - started}ms)`,
    );
    console.log("A 30s default would hold resources much longer.");
  }
}

main();
