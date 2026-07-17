---
category: reliability
priority: must-know
status: learning
---

# Circuit breaker

> Category: `reliability` · Priority: `must-know` · Status: `learning`

## Problem

Timeouts and retries help when a dependency is _occasionally_ slow or flaky. They hurt when the dependency is _down_.

Imagine your checkout service calls a Payment Gateway. The gateway is having an outage: every call times out after 800ms. Clients keep retrying. Hundreds of concurrent checkouts each burn threads, connection-pool slots, and time waiting for failures that are almost guaranteed.

Meanwhile:

- Your own service gets slower and may run out of capacity.
- The payment team’s recovery is harder because traffic keeps hammering them.
- Failures cascade: inventory, notifications, and other hops pile up behind the same stuck requests.

Retries assume “try again soon and it might work.” When the dependency is known to be unhealthy, the better move is **stop calling it for a while**, fail fast (or degrade), and only probe occasionally to see if it recovered. That is the circuit breaker.

## When to use / when not to use

**Use when:**

- Calling remote dependencies that can fail or slow down: third-party APIs, other microservices, DBs, caches, queues.
- You already have timeouts (and often retries) and still see cascading load during dependency outages.
- A high rate of timeouts / 5xx / connection errors means further calls are unlikely to succeed.
- You want to give a struggling dependency time to recover instead of drowning it with retries.
- You can return a clear error or a **fallback** (cache, default, queue-for-later) while the circuit is open.

**Avoid when:**

- The call is pure in-memory work with no remote I/O — nothing to “open” against.
- Failures are permanent business errors (400, 401, 403, validation). Those should not trip the breaker; only infrastructure / transient failure signals should.
- A single one-off failure is enough to open the circuit (too sensitive) — you need a threshold or error _rate_, not “any error.”
- You open one global breaker for _all_ dependencies — isolate per dependency (and often per endpoint) so one bad payment vendor doesn’t block your user service.
- You treat the breaker as a substitute for timeouts. Without timeouts, slow calls never “fail” and the breaker may not open in time.

## How it works

The circuit breaker wraps calls to a dependency and tracks recent success/failure. It behaves like an electrical breaker: when things look bad, it **opens** so current (traffic) stops flowing until it is safe to try again.

Classic states:

```text
                    failures exceed threshold
         ┌──────────────────────────────────────┐
         │                                      ▼
    ┌────────┐  success / healthy   ┌──────────────┐
    │ CLOSED │ ◄─────────────────── │ HALF-OPEN    │
    │ (normal│                      │ (trial calls)│
    │  traffic)                     └──────┬───────┘
    └────┬───┘                             │
         │                                 │ trial fails
         │ open after cooldown             ▼
         │                          ┌────────────┐
         └─────────────────────────►│ OPEN       │
            (fail fast, no call)    │ (reject)   │
                                    └────────────┘
                                           │
                                           │ after reset timeout
                                           ▼
                                      HALF-OPEN again
```

| State         | Behavior                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Closed**    | Calls go through. Failures (timeouts, 5xx, connection errors) are counted. Successes reset or decay the failure count (implementation-dependent). |
| **Open**      | Calls are **not** sent to the dependency. The breaker fails fast (error or fallback). Saves your resources and reduces load on the dependency.    |
| **Half-open** | After a cool-down, a **limited** number of trial requests are allowed. If they succeed → **closed**. If they fail → **open** again.               |

What counts as a “failure” is important: timeouts, connection refused, and 5xx usually yes; 4xx validation errors usually **no** (the dependency is fine; your request is wrong).

### Typical knobs

| Knob                             | Role                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------- |
| **Failure threshold**            | e.g. 5 failures in a window, or error rate > 50% over N requests             |
| **Window**                       | Sliding or fixed time/count window for measuring health                      |
| **Open duration / sleep window** | How long to stay open before a half-open probe (e.g. 30s)                    |
| **Half-open max trials**         | How many concurrent probes (often 1) so you don’t flood a recovering service |
| **Success threshold to close**   | e.g. 2–3 successes in half-open before fully closing                         |

### How it fits with timeouts and retries

```text
Request
  → Circuit breaker (if OPEN → fail fast / fallback)
       → Retry loop (only if CLOSED / allowed)
            → each attempt has a Timeout
                 → Dependency
```

- **Timeout** — bounds each attempt.
- **Retry** — handles short blips when the circuit is closed.
- **Circuit breaker** — stops retries and traffic when the dependency is clearly unhealthy.

Without a breaker, retries + many clients = **retry storm**. With a breaker, most clients fail fast until probes succeed.

## Trade-offs

| Dimension     | Notes                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latency       | When open, latency drops (fail fast). When closed, adds negligible overhead. Half-open is slightly careful (limited trials).                          |
| Consistency   | Doesn’t change data models. Open circuits mean more errors or **stale/fallback** responses — clients must handle degraded mode.                       |
| Complexity    | State machine, thresholds, metrics, per-dependency configuration, and careful definition of “failure.” Easy to misconfigure.                          |
| Cost          | Reduces wasted CPU, threads, and outbound calls during outages. Mis-tuned breakers can reject traffic that would have succeeded.                      |
| Failure modes | Flapping (open/close thrash), opening on bad signals (counting 4xx), one shared breaker for many hosts, or never half-opening so recovery is delayed. |

## Alternatives

Related patterns and how they differ. Breakers are usually layered with the others, not used alone.

| Pattern                           | Difference                                                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timeout**                       | Limits how long one call may run. Does not stop the _next_ call. Breaker uses timeouts (and other errors) as failure signals, then blocks further calls.                                           |
| **Retry with backoff**            | Tries again after failure. Helps transient errors; can worsen outages. Breaker _suppresses_ calls (and retries) while open.                                                                        |
| **Bulkhead**                      | Limits concurrent calls / pool size per dependency so one slow service can’t take all threads. Breaker stops calls entirely when unhealthy; bulkhead caps parallelism always. Often used together. |
| **Graceful degradation**          | What you return when the breaker is open (cached price, “payments temporarily unavailable,” queue the write). Breaker decides _whether_ to call; degradation decides _what the user gets_.         |
| **Load shedding / rate limiting** | Protects _your_ service by dropping excess inbound load. Breaker protects you (and the peer) from a _specific dependency_ failure.                                                                 |
| **Health checks**                 | Proactive probes (K8s readiness, active checks). Breakers are usually **reactive** (based on real traffic failures) plus limited half-open probes.                                                 |

## Real systems

- **Netflix Hystrix** (legacy) / **Resilience4j** (Java) — Popular breaker libraries with sliding windows, open/half-open, and fallbacks.
- **Polly** (.NET) — Circuit breaker policies composed with retry, timeout, and bulkhead.
- **Envoy / service meshes** — Outlier detection and ejection: remove unhealthy hosts from the pool (host-level “breaker” behavior).
- **AWS / cloud SDKs & API gateways** — Often combine retries with circuit-breaking or endpoint disabling after repeated failures.
- **Nginx / reverse proxies** — `max_fails` + `fail_timeout` mark upstreams as unavailable for a period (simple open period without a full half-open state machine).
- **Kubernetes** — Not a classic app-level breaker, but readiness failures remove pods from Service endpoints so traffic stops hitting bad instances.

## Interview talking points

- A circuit breaker prevents cascading failures: when a dependency is unhealthy, **fail fast** instead of waiting on timeouts and piling up retries.
- Three states: **closed** (normal), **open** (block calls), **half-open** (limited probes to test recovery).
- Pair with **timeouts** (so failures are detected quickly) and **retries with backoff** (for blips while closed). Don’t retry aggressively through an open dependency.
- Trip on **infrastructure signals** (timeouts, connection errors, 5xx), not on business 4xx. Scope breakers **per dependency** (and often per operation).
- While open, return an error or a **fallback** (graceful degradation). Monitor open rate and error rate — a breaker that is always open is a product/ops signal, not just a library setting.
- Tuning: failure threshold + sleep window + half-open probes. Too aggressive → false opens; too loose → you still cascade.

## Implementation (this repo)

TypeScript teaching code lives under:

[`../../implementations/circuit-breaker/`](../../implementations/circuit-breaker/)

| Piece | Notes |
| ----- | ----- |
| `circuit-breaker.ts` | `CircuitBreaker.exec(fn)` — closed / open / half-open; consecutive failure threshold; one probe while half-open |
| `example.ts` | Fake payment API: trip after 3 fails → fail fast → cool-down + recover → closed |

Run:

```bash
npm install
npm run demo:circuit-breaker
```

**Teaching model (intentionally simple):** consecutive failures, not a full sliding-window error-rate. Production libraries (Resilience4j, Polly) add windows, slow-call rates, and richer metrics.

## My notes / mistakes / experiments

- Timeouts first, then retries, then breaker — a breaker without timeouts is half-blind to “slow death.”
- One breaker for “all HTTP outbound” is a footgun; isolate payment vs catalog vs search.
- Counting every exception as failure will open the circuit on bad client input; filter failure types.
- Half-open with unlimited concurrent trials can recreate the stampede the moment the cool-down ends — keep probes small.
- Log/metric `circuit_state` and `short_circuited` count so you can see open periods in dashboards next to dependency error rates.

## References

- [Microsoft Azure Architecture – Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Martin Fowler – Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Resilience4j CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker)
- Implementation: [`implementations/circuit-breaker/`](../../implementations/circuit-breaker/)
- Related notes in this repo: [Timeouts](./timeouts.md), [Retry with backoff](./retry-with-backoff.md), [Bulkhead](./bulkhead.md), [Graceful degradation](./graceful-degradation.md)
