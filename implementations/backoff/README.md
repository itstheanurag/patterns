# Retry with backoff (TypeScript)

Minimal teaching implementation of the reliability pattern.

## Run the demo

From the repo root:

```bash
npm install
npm run demo:backoff
```

## Layout

| File | Purpose |
| ---- | ------- |
| `retry.ts` | Retry loop: `maxRetries`, `shouldRetry`, `onRetry`, `AbortSignal` |
| `strategies.ts` | Immediate, fixed, linear, exponential, full/equal jitter |
| `errors.ts` | `HttpError` + `isRetryableHttpError` |
| `sleep.ts` | Abortable delay |
| `example.ts` | Transient success + permanent 400 demos |

## Semantics

- **`maxRetries`**: retries *after* the first attempt. `maxRetries: 3` ⇒ up to **4** total tries.
- **Full jitter**: `delay = random(0, min(maxDelay, base * 2^attempt))`.
- **`shouldRetry`**: return `false` for permanent errors (e.g. HTTP 400) to fail fast.

See the pattern note: [`../../patterns/reliability/retry-with-backoff.md`](../../patterns/reliability/retry-with-backoff.md).
