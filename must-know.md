# Must-know shortlist

Curated first-pass list (~25). Full inventory lives in [`PROGRESS.md`](./PROGRESS.md).
Each link is a stub note — fill it using [`templates/pattern.md`](./templates/pattern.md).

Study roughly in this order (reliability & caching early; microservices later).

## Reliability & failure

1. [Retry with backoff](./patterns/reliability/retry-with-backoff.md)
2. [Timeouts](./patterns/reliability/timeouts.md)
3. [Circuit breaker](./patterns/reliability/circuit-breaker.md)
4. [Graceful degradation](./patterns/reliability/graceful-degradation.md)

## Caching

5. [Cache-aside](./patterns/caching/cache-aside.md)
6. [Cache invalidation](./patterns/caching/cache-invalidation.md)
7. [CDN](./patterns/caching/cdn.md)
8. [Cache stampede protection](./patterns/caching/stampede-protection.md)

## Scalability

9. [Horizontal vs vertical scaling](./patterns/scalability/horizontal-vs-vertical.md)
10. [Load balancing](./patterns/scalability/load-balancing.md)
11. [Partitioning / sharding](./patterns/scalability/partitioning-sharding.md)
12. [Consistent hashing](./patterns/distributed/consistent-hashing.md)

## Data & consistency

13. [Replication](./patterns/data-management/replication.md)
14. [CAP / PACELC trade-offs](./patterns/distributed/cap-pacelc.md)
15. [CQRS](./patterns/data-management/cqrs.md)
16. [Idempotency](./patterns/api/idempotent-apis.md)

## Messaging & workflows

17. [Queue vs pub/sub](./patterns/messaging-events/queue-vs-pubsub.md)
18. [Transactional outbox](./patterns/messaging-events/transactional-outbox.md)
19. [Saga](./patterns/messaging-events/saga.md)
20. [Dead-letter queue](./patterns/messaging-events/dead-letter-queue.md)

## API & edge

21. [API gateway](./patterns/api/api-gateway.md)
22. [Rate limiting](./patterns/api/rate-limiting.md)

## Storage (high level)

23. [SQL vs NoSQL](./patterns/storage/sql-vs-nosql.md)
24. [Object / blob storage](./patterns/storage/object-blob-storage.md)

## Microservices (light)

25. [Database per service](./patterns/microservices/database-per-service.md)

---

When a note feels solid, mark it in `PROGRESS.md` and bump `status` in the note frontmatter.
