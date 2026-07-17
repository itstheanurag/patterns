---
category: reliability
priority: must-know
status: learning
---

# Timeouts

> Category: `reliability` · Priority: `must-know` · Status: `learning`

## Problem

Imagine your app has a Users Service. One day, because of a network issue, a slow database, or an unresponsive third-party service, it stops responding. If your service keeps waiting forever, the user will keep seeing a loading spinner that never ends—like opening Instagram and seeing "Loading..." indefinitely.

As more requests get stuck waiting, they start using up your server's threads, memory, and connections. Eventually, the service becomes too busy to handle new requests, making the entire application slow or even unavailable. This can also affect other services that depend on it, causing failures to spread throughout the system.

Timeouts solve this by putting a hard upper bound on how long you are willing to wait. When that bound is hit, you fail fast, free resources, and keep the rest of the system healthy.

## When to use / when not to use

**Use when:**

- Calling external APIs or third-party services.
- Making database, cache, or message queue requests.
- Performing any network or I/O operation that could be slow or unresponsive.
- You want to fail fast and prevent resource exhaustion.
- You are chaining multiple dependencies and need a budget for the whole request (deadline propagation).

**Avoid when:**

- The operation is guaranteed to complete almost instantly and doesn't involve waiting on external systems (pure in-memory work).
- Background jobs where waiting longer is acceptable and won't block user requests — use a _longer_ timeout, not _no_ timeout.
- Using arbitrary timeout values without understanding the expected latency of the operation (guessing `30s` everywhere is still a timeout, but a bad one).
- You only set a client timeout without cancelling work on the server — the client fails, but the server may still burn CPU and hold locks.

## How it works

A timeout starts a timer whenever your service calls another service or resource. If the operation completes before the timer expires, the response is returned normally. If the timeout is reached first, the request is cancelled (or abandoned), an error is returned, and the service can continue processing other requests instead of waiting indefinitely.

```text
Request
Client ─────────────▶ Users Service
             │
             │ Call User Database
             ▼
       User Database
             │
(No response within 2 seconds)
             │
             ▼
        Timeout Triggered
             │
             ▼
Cancel request / Return timeout error
             │
             ▼
   Client receives failure response
```

In practice, "a timeout" is usually several related budgets:

| Kind                       | What it limits                                                                  |
| -------------------------- | ------------------------------------------------------------------------------- |
| **Connect timeout**        | How long to wait to establish a TCP/TLS connection                              |
| **Request / read timeout** | How long to wait for a response after the request is sent                       |
| **Idle / socket timeout**  | How long a connection can sit unused before being closed                        |
| **Overall deadline**       | Total time budget for the whole operation (including retries and multiple hops) |

**Deadline propagation** is the advanced form: the client sets a deadline (e.g. "respond by T+200ms"). Each downstream hop subtracts elapsed time and either respects the remaining budget or fails early. Without this, a gateway with a 5s timeout can call a service that waits 30s, and resources stay stuck long after the original client has given up.

When a timeout fires, prefer **cancellation** (`AbortSignal` in JS/TS, context cancellation in Go, etc.) so in-flight work stops. A timeout that only abandons the _client_ wait without cancelling the _server_ work still wastes capacity.

## How to choose a reasonable timeout

A timeout should reflect how long a **healthy** call actually takes — not a default like 30 seconds copied from a tutorial. If you set 30s when real work finishes in a few hundred milliseconds, a stuck dependency can pin threads and connections for far too long before you fail.

### Start from measured latency

Look at production (or realistic load-test) latency for that specific dependency and operation:

| Metric          | What it tells you                                                              |
| --------------- | ------------------------------------------------------------------------------ |
| **p50**         | Typical case — useful context, too low as a timeout by itself                  |
| **p95 / p99**   | How long the slowest _normal_ requests take under healthy load                 |
| **p99.9 / max** | Outliers and rare spikes — often _not_ what you want to wait for on every call |

The important number is usually **p99** (or p95 for very latency-sensitive paths): “almost all successful requests finish by this time.”

### Rule of thumb

```text
timeout ≈ p99 latency × safety factor
```

A safety factor of about **1.5×–2×** leaves headroom for small variance without treating a hang as success.

**Example:** if a user-db lookup’s p99 is ~**400ms** under normal load, a timeout around **800ms** (2×) is reasonable. A **30s** timeout would let a dead or wedged dependency hold resources ~75× longer than a healthy slow request needs — and still look “working” to operators until pools fill up.

```text
Healthy slow path:  ──████ 400ms──
Good timeout:       ──████████ 800ms──  (fail soon after healthy p99)
Bad default:        ──████████████████████████████ 30s──  (fails too late)
```

### Other factors that change the number

- **SLO / user wait budget** — If the product promises “API responds in under 1s,” every dependency timeout must fit inside that budget (with room for retries if you use them).
- **Retries** — If you allow 2 retries with backoff, the _per-attempt_ timeout must be much smaller than the overall deadline:  
  `per_attempt_timeout × attempts + backoff delays ≤ overall deadline`.
- **Fan-out** — Parallel calls share one parent deadline; each child gets the remaining budget, not a full 30s of its own.
- **Connect vs request** — Connect timeouts are often short (tens to a few hundred ms). Request timeouts follow p99 of the full call. Don’t use one giant number for both.
- **Cold starts / multi-tenant noise** — If p99 is inflated by rare cold paths, either fix that path or use a timeout near “warm” p99 and accept rare false timeouts (or a slightly higher factor), rather than 30s for everyone.
- **Background vs interactive** — Jobs and async workers can use longer timeouts; user-facing requests should stay tight to the latency distribution above.

### Too low vs too high

| Setting                                    | What goes wrong                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Too low** (e.g. 100ms when p99 is 400ms) | Healthy requests fail; error rate and retries spike; users see flakes                      |
| **Right ballpark** (e.g. ~2× p99)          | Almost all good calls succeed; hangs fail fast                                             |
| **Too high** (e.g. 30s when p99 is 400ms)  | Partial outages look “slow” for a long time; threads/connections pile up; failures cascade |

### Practical process

1. Measure p50 / p95 / p99 for the call path under normal load.
2. Set `timeout ≈ 1.5–2× p99` (or just above your latency SLO for that hop).
3. Ship and watch **timeout rate** and **success latency**. If timeouts are common under healthy traffic, raise slightly or fix the slow path. If hangs last many seconds before error, lower.
4. Revisit when the dependency’s latency profile changes (new features, load, region).

Avoid magical constants: **30s is not “safe”** — it’s often just “forgot to think about it.” Prefer a value tied to real p99 (and the caller’s overall budget), then adjust with metrics.

## Trade-offs

| Dimension     | Notes                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latency       | Improves overall responsiveness by failing fast. If set too low, legitimate slow requests fail and users retry, which can increase _perceived_ latency.                   |
| Consistency   | Doesn't change data models directly, but a timeout leaves the client unsure whether the server completed the operation. Pair with idempotency for safe retries.           |
| Complexity    | Requires choosing per-dependency values, connect vs request budgets, cancellation, and (ideally) deadline propagation across service boundaries.                          |
| Cost          | Aggressive timeouts raise error rates and can trigger more retries/work. Missing timeouts cost more: hung requests, exhausted pools, cascading outages.                   |
| Failure modes | Wrong values cause false failures or hung requests. Timeouts alone don't recover — combine with retries (with backoff), circuit breakers, and monitoring of timeout rate. |

## Alternatives

Related patterns and how they differ. Timeouts are usually the foundation; the others build on top.

| Pattern                       | Difference                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Retry with backoff**        | After a timeout (or other transient error), tries again with increasing delay. Timeout _detects_ the hang; retry _recovers_ from it.                                                    |
| **Circuit breaker**           | Stops calling a dependency that is already failing (including high timeout rates). Timeouts still apply on each attempt; the breaker reduces traffic while the dependency is unhealthy. |
| **Bulkhead**                  | Limits how many concurrent calls a dependency can consume (thread/connection pools). Timeouts free a slot after a bound; bulkheads cap how many slots exist.                            |
| **Graceful degradation**      | Returns a fallback (cached/stale/default response) when a dependency times out, instead of failing the whole request.                                                                   |
| **Fail fast (no wait)**       | Rejects work immediately when overloaded or when a dependency is known bad — even stricter than a short timeout.                                                                        |
| **Long polling / async jobs** | For work that _should_ take a long time, don't hold an HTTP request open with a huge timeout; accept the job, return a handle, and poll or push results later.                          |

## Real systems

- **HTTP clients (fetch, axios, OkHttp, Java HttpClient)** – Support connect and request timeouts; modern JS uses `AbortSignal` + `AbortSignal.timeout(ms)` to cancel in-flight `fetch`.
- **gRPC / Go `context`** – Deadlines and cancellation are first-class: `context.WithTimeout` propagates across RPC boundaries so every hop shares one budget.
- **Envoy / Nginx / API gateways** – Per-route and upstream timeouts (`route timeout`, `idle_timeout`, connect timeouts) protect the edge from slow backends.
- **Databases** – Postgres `statement_timeout`, MySQL `max_execution_time`, Redis client timeouts prevent queries and commands from running unboundedly.
- **AWS SDK / cloud clients** – Socket and API call timeouts; combined with retries and backoff for transient failures.
- **Kubernetes** – Probe timeouts (`timeoutSeconds` on liveness/readiness) and graceful termination periods bound how long the control plane waits for pods.
- **Load balancers (ALB, NLB, cloud LBs)** – Idle and request timeouts drop connections that hang, so one slow target doesn't pin frontend capacity forever.

## Interview talking points

- Every remote call needs a timeout. Unbounded waits are a common root cause of cascading failures under partial outages.
- Timeouts protect _your_ service's resources (threads, connections, memory). They are a reliability control, not just a UX preference.
- Prefer separate connect vs request timeouts, and an overall deadline when you fan out or retry. Client timeout should be less than or equal to what the caller is willing to wait, with budget left for retries if you use them.
- A timeout error is often ambiguous: the work may still have completed on the server. Design APIs to be idempotent so clients can retry safely after a timeout.
- Timeouts + retries + circuit breaker is the usual production stack: timeout bounds each attempt, retry handles blips, circuit breaker stops hammering a dead dependency.
- Set values from p99 latency and SLOs, then monitor timeout rate. A sudden spike in timeouts is often an early signal of dependency degradation.

## Implementation (this repo)

TypeScript teaching code lives under:

[`../../implementations/timeout/`](../../implementations/timeout/)

| Piece        | Notes                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| `timeout.ts` | Small `withTimeout(fn, ms)` — timer + `AbortController`                 |
| `example.ts` | Local mock: 400ms work / 800ms budget succeeds; 5s hang fails at ~800ms |

Run:

```bash
npm install
npm run demo:timeout
```

**Why not httpbin?** External delay endpoints are flaky (slow, 503s). A local mock with known latency makes p99-style timeouts teachable and deterministic.

## My notes / mistakes / experiments

- "No timeout" is worse than a slightly wrong timeout. Start with something based on p99, then tighten with metrics.
- Client timeout without cancellation still burns server capacity — always wire cancel/abort when the library supports it.
- Nested timeouts must nest correctly: if the gateway allows 3s, the service's DB call can't use 10s. Propagate remaining budget or use a smaller child timeout.
- Don't retry every timeout blindly if the operation isn't idempotent; prefer idempotency keys or "at most once" semantics for writes.
- Watching only average latency hides hangs; track p99 and timeout error rate as first-class SLIs.
- Demo that hits `httpbin.org/delay/*` is a bad teaching tool — the free service often exceeds the delay or returns 503, so you can't tell timeout bugs from network noise.

## References

- [Google SRE Book – Handling Overload](https://sre.google/sre-book/handling-overload/) (timeouts, load shedding, and related controls)
- [Microsoft Azure Architecture – Timeout pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/timeout)
- [MDN – AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
- Implementation: [`implementations/timeout/`](../../implementations/timeout/)
- Related notes in this repo: [Retry with backoff](./retry-with-backoff.md), [Circuit breaker](./circuit-breaker.md), [Bulkhead](./bulkhead.md)
