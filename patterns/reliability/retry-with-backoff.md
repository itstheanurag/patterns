---
category: reliability
priority: must-know
status: learning
---

# Retry with backoff

> Category: `reliability` · Priority: `must-know` · Status: `learning`

## Problem

When we call another service, we expect it to respond successfully. But in distributed systems, failure is normal, not exceptional. Imagine a customer clicks Pay Now. Your backend sends a request to the payment gateway.

Instead of getting a response, one of these happens:

- The network connection drops.
- The payment provider is temporarily overloaded.
- The request times out.
- The provider is restarting its servers.
- A load balancer returns 503 Service Unavailable.
- The service responds with 429 Too Many Requests because you've exceeded the rate limit.

None of these necessarily mean the payment can never succeed. They often represent transient failures—temporary conditions that may disappear after a short wait.

If your application immediately gives up after the first failure. The user sees an error even though the service might have been available a second later.

The Retry pattern exists to improve reliability by giving temporary failures another chance to succeed. Instead of failing immediately, the application retries the operation after waiting for some time.

## When to use / when not to use

**Use when:**

Retry isn't something you add everywhere. It's useful only when there's a reasonable chance the operation will succeed if tried again.

Use when

- Calling third-party APIs (payment gateways, SMS providers, email services)
- Communicating between microservices over HTTP or gRPC
- Reading from a temporarily unavailable database
- Accessing cloud services (AWS, Azure, GCP)
- Making network requests where transient failures are expected
- Receiving HTTP 429 (Too Many Requests), especially when the service provides a Retry-After header
- Receiving HTTP 5xx server errors such as 502, 503, or 504
- Consuming messages from a queue when processing fails due to temporary issues

The common theme is that the failure is expected to be temporary.

**Avoid when:**

Retrying is harmful when the failure is permanent or when the operation isn't safe to repeat.

Avoid retries for:

- Invalid user input (400 Bad Request)
- Authentication failures (401 Unauthorized)
- Permission errors (403 Forbidden)
- Resource doesn't exist (404 Not Found)
- Business rule violations (e.g., "insufficient balance")
- Operations that aren't idempotent unless you have safeguards (e.g., charging a credit card twice)

Another situation to avoid is when the downstream service is already overloaded. Blindly retrying thousands of requests can create a retry storm, making the outage even worse. This is why retries are usually combined with exponential backoff and often a circuit breaker.

## How it works

When an operation fails due to a temporary (transient) error, the client doesn't fail immediately. Instead, it waits for a period of time before trying again.

After each failed attempt, the waiting time increases exponentially (called backoff). This gives the downstream service time to recover and prevents clients from overwhelming an already struggling system.

If the operation succeeds, the retry loop stops immediately. If all retry attempts fail, the error is propagated back to the caller.
The delay between retries is commonly calculated as:

```text
delay = baseDelay × 2^attempt
```

where:

- `baseDelay` is the initial wait time (e.g., 500ms or 1 second)
- `attempt` starts at 0 for the first retry

Most production systems also add a small random delay (jitter) to prevent thousands of clients from retrying at exactly the same time.

## Trade-offs

| Dimension     | Notes                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latency       | Increases latency because failed requests are retried after waiting. A request that could have failed in 100ms might now take several seconds before finally succeeding or giving up. |
| Consistency   | Retries can cause duplicate operations if the request is not idempotent (e.g., charging a credit card twice). Idempotency keys or deduplication are often required.                   |
| Complexity    | Adds application complexity. You need retry policies, backoff strategies, retry limits, jitter, and logic to determine which errors are retryable.                                    |
| Cost          | Generates additional network calls and consumes more CPU, bandwidth, and server resources. Excessive retries can increase infrastructure costs.                                       |
| Failure modes | Poorly implemented retries can overwhelm an already struggling service (retry storm). They can also increase latency and waste resources if permanent errors are retried.             |

## Alternatives

For Retry with Backoff, these are the most relevant alternatives and complementary patterns.

| Pattern                                     | Difference                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Immediate Retry**                         | Retries instantly without waiting. Simpler, but can overwhelm a failing service. Suitable only for very short-lived failures.                                            |
| **Retry with Fixed Delay**                  | Waits the same amount of time between retries (e.g., 1 second every time). Easier to implement but less effective than exponential backoff during prolonged outages.     |
| **Retry with Exponential Backoff**          | Increases the delay after each failure, reducing load on struggling services. This is the most common production approach.                                               |
| **Retry with Exponential Backoff + Jitter** | Adds randomness to the backoff delay so many clients don't retry simultaneously. This is considered the production best practice.                                        |
| **Circuit Breaker**                         | Stops sending requests entirely when a service is known to be failing. Unlike retries, it prevents wasting resources during outages. Often used together with retries.   |
| **Fail Fast**                               | Returns an error immediately without retrying. Reduces latency but sacrifices resilience. Best for permanent errors or low-latency systems.                              |
| **Timeout**                                 | Limits how long a request is allowed to run before failing. Doesn't retry by itself, but is usually combined with retries.                                               |
| **Bulkhead**                                | Isolates failures by limiting the resources a failing dependency can consume. Doesn't retry requests, but prevents one failing service from affecting the entire system. |

## Real systems

- **AWS SDK** – Automatically retries failed API requests (e.g., S3, DynamoDB, SQS) using exponential backoff with jitter for transient errors like `429` and `5xx`.
- **Google Cloud SDK** – Retries temporary failures when communicating with Google Cloud services using exponential backoff.
- **Kubernetes** – Uses backoff when restarting failed containers, pulling images, and reconciling resources to avoid overwhelming the API server.
- **Kafka Consumers** – Retry failed message processing before moving messages to a Dead Letter Queue (DLQ) if retries are exhausted.
- **Nginx / Envoy** – Can automatically retry requests to healthy upstream servers when a backend is temporarily unavailable or times out.
- **Stripe** – Recommends clients retry transient failures using **idempotency keys** to safely retry payment requests without creating duplicate charges.

*

## Interview talking points

- Retry with backoff is used to recover from transient failures such as network timeouts, temporary service unavailability (5xx), or rate limiting (429), improving the overall reliability of distributed systems.
- I use exponential backoff instead of immediate or fixed retries because it gives the downstream service time to recover and reduces the risk of overwhelming it with retry storms.
- Retries should only be performed for retryable errors. Permanent failures like 400 Bad Request, 401 Unauthorized, or business validation errors should fail immediately.
- Retries should be combined with jitter and idempotency. Jitter prevents synchronized retries from many clients, while idempotency ensures that retrying an operation (e.g., a payment) doesn't produce duplicate side effects.
- In production, Retry with Backoff is often used alongside timeouts and circuit breakers to build resilient systems that can handle temporary failures without cascading outages.

## Implementation (this repo)

TypeScript teaching code lives under:

[`../../implementations/backoff/`](../../implementations/backoff/)

| Piece | Notes |
| ----- | ----- |
| `retry.ts` | Loop with `maxRetries` (retries *after* first try), `shouldRetry`, `onRetry`, `AbortSignal` |
| `strategies.ts` | Immediate, fixed, linear, exponential, **full jitter**, equal jitter — all with optional `maxDelay` |
| `errors.ts` | `HttpError` + `isRetryableHttpError` (retry 429/5xx, not 4xx) |
| `example.ts` | Demo: transient 503/429 then success; permanent 400 fails fast |

Run:

```bash
npm install
npm run demo:backoff
```

**Full jitter formula used in code:**

```text
delay = random(0, min(maxDelay, baseDelay × 2^attempt))
```

## My notes / mistakes / experiments

- Additive fixed jitter (`exp + U(0, 500)`) barely spreads clients when `exp` is large; full jitter is better for thundering-herd avoidance.
- Always gate retries with `shouldRetry` so permanent HTTP 4xx never burns retry budget.
- Name attempts carefully: `maxRetries: 3` means 1 initial + 3 retries = 4 total attempts.

## References

- [AWS: Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- Implementation: [`implementations/backoff/`](../../implementations/backoff/)
