# Progress

Check items as you finish notes. Priority: **M** = must-know · **I** = important · **D** = deep-dive.

Legend: `[ ]` not started · `[~]` learning · `[x]` solid

---

## api

- [ ] **M** [api-gateway](./patterns/api/api-gateway.md)
- [ ] **M** [rate-limiting](./patterns/api/rate-limiting.md)
- [ ] **M** [idempotent-apis](./patterns/api/idempotent-apis.md)
- [ ] **I** [bff](./patterns/api/bff.md)
- [ ] **I** [pagination](./patterns/api/pagination.md)
- [ ] **I** [api-versioning](./patterns/api/api-versioning.md)
- [ ] **D** [request-coalescing](./patterns/api/request-coalescing.md)

## caching

- [ ] **M** [cache-aside](./patterns/caching/cache-aside.md)
- [ ] **M** [cache-invalidation](./patterns/caching/cache-invalidation.md)
- [ ] **M** [cdn](./patterns/caching/cdn.md)
- [ ] **M** [stampede-protection](./patterns/caching/stampede-protection.md)
- [ ] **I** [write-through](./patterns/caching/write-through.md)
- [ ] **I** [write-behind](./patterns/caching/write-behind.md)
- [ ] **I** [multi-level-cache](./patterns/caching/multi-level-cache.md)
- [ ] **D** [ttl-strategies](./patterns/caching/ttl-strategies.md)

## concurrency

- [ ] **I** [optimistic-concurrency](./patterns/concurrency/optimistic-concurrency.md)
- [ ] **I** [distributed-locks](./patterns/concurrency/distributed-locks.md)
- [ ] **I** [leader-election](./patterns/concurrency/leader-election.md)
- [ ] **I** [backpressure](./patterns/concurrency/backpressure.md)
- [ ] **D** [actor-model](./patterns/concurrency/actor-model.md)

## data-management

- [ ] **M** [replication](./patterns/data-management/replication.md)
- [ ] **M** [cqrs](./patterns/data-management/cqrs.md)
- [ ] **I** [sharding-strategies](./patterns/data-management/sharding-strategies.md)
- [ ] **I** [denormalization](./patterns/data-management/denormalization.md)
- [ ] **I** [consistency-models](./patterns/data-management/consistency-models.md)
- [ ] **D** [multi-tenancy](./patterns/data-management/multi-tenancy.md)

## data-processing

- [ ] **I** [batch-vs-stream](./patterns/data-processing/batch-vs-stream.md)
- [ ] **I** [etl-elt](./patterns/data-processing/etl-elt.md)
- [ ] **I** [windowing](./patterns/data-processing/windowing.md)
- [ ] **D** [exactly-once-processing](./patterns/data-processing/exactly-once-processing.md)
- [ ] **D** [map-reduce-style](./patterns/data-processing/map-reduce-style.md)

## distributed

- [ ] **M** [cap-pacelc](./patterns/distributed/cap-pacelc.md)
- [ ] **M** [consistent-hashing](./patterns/distributed/consistent-hashing.md)
- [ ] **I** [consensus-raft-overview](./patterns/distributed/consensus-raft-overview.md)
- [ ] **I** [clock-skew-and-time](./patterns/distributed/clock-skew-and-time.md)
- [ ] **D** [gossip-protocols](./patterns/distributed/gossip-protocols.md)

## messaging-events

- [ ] **M** [queue-vs-pubsub](./patterns/messaging-events/queue-vs-pubsub.md)
- [ ] **M** [transactional-outbox](./patterns/messaging-events/transactional-outbox.md)
- [ ] **M** [saga](./patterns/messaging-events/saga.md)
- [ ] **M** [dead-letter-queue](./patterns/messaging-events/dead-letter-queue.md)
- [ ] **I** [competing-consumers](./patterns/messaging-events/competing-consumers.md)
- [ ] **I** [event-sourcing](./patterns/messaging-events/event-sourcing.md)
- [ ] **D** [exactly-once-delivery](./patterns/messaging-events/exactly-once-delivery.md)

## microservices

- [ ] **M** [database-per-service](./patterns/microservices/database-per-service.md)
- [ ] **I** [service-discovery](./patterns/microservices/service-discovery.md)
- [ ] **I** [strangler-fig](./patterns/microservices/strangler-fig.md)
- [ ] **I** [sidecar](./patterns/microservices/sidecar.md)
- [ ] **D** [shared-nothing-tradeoffs](./patterns/microservices/shared-nothing-tradeoffs.md)

## reliability

- [~] **M** [retry-with-backoff](./patterns/reliability/retry-with-backoff.md)
- [~] **M** [timeouts](./patterns/reliability/timeouts.md)
- [ ] **M** [circuit-breaker](./patterns/reliability/circuit-breaker.md)
- [ ] **M** [graceful-degradation](./patterns/reliability/graceful-degradation.md)
- [ ] **I** [bulkhead](./patterns/reliability/bulkhead.md)
- [ ] **I** [health-checks](./patterns/reliability/health-checks.md)
- [ ] **D** [chaos-engineering-basics](./patterns/reliability/chaos-engineering-basics.md)

## scalability

- [ ] **M** [horizontal-vs-vertical](./patterns/scalability/horizontal-vs-vertical.md)
- [ ] **M** [load-balancing](./patterns/scalability/load-balancing.md)
- [ ] **M** [partitioning-sharding](./patterns/scalability/partitioning-sharding.md)
- [ ] **I** [autoscaling](./patterns/scalability/autoscaling.md)
- [ ] **I** [hot-keys](./patterns/scalability/hot-keys.md)
- [ ] **D** [read-replicas-scaling](./patterns/scalability/read-replicas-scaling.md)

## search

- [ ] **I** [inverted-index](./patterns/search/inverted-index.md)
- [ ] **I** [autocomplete](./patterns/search/autocomplete.md)
- [ ] **I** [search-vs-database](./patterns/search/search-vs-database.md)
- [ ] **D** [ranking-basics](./patterns/search/ranking-basics.md)

## security

- [ ] **I** [authn-authz](./patterns/security/authn-authz.md)
- [ ] **I** [oauth-oidc-overview](./patterns/security/oauth-oidc-overview.md)
- [ ] **I** [secrets-management](./patterns/security/secrets-management.md)
- [ ] **D** [least-privilege](./patterns/security/least-privilege.md)
- [ ] **D** [zero-trust-light](./patterns/security/zero-trust-light.md)

## storage

- [ ] **M** [sql-vs-nosql](./patterns/storage/sql-vs-nosql.md)
- [ ] **M** [object-blob-storage](./patterns/storage/object-blob-storage.md)
- [ ] **I** [wal](./patterns/storage/wal.md)
- [ ] **D** [lsm-vs-btree](./patterns/storage/lsm-vs-btree.md)
- [ ] **D** [compaction](./patterns/storage/compaction.md)

## workflow

- [ ] **I** [orchestration-vs-choreography](./patterns/workflow/orchestration-vs-choreography.md)
- [ ] **I** [state-machines](./patterns/workflow/state-machines.md)
- [ ] **I** [durable-workflows](./patterns/workflow/durable-workflows.md)
- [ ] **D** [human-in-the-loop](./patterns/workflow/human-in-the-loop.md)

---

## Counts (scaffolded)

| Bucket     | Stubs |
| ---------- | ----- |
| must-know  | 25    |
| important  | 35    |
| deep-dive  | 19    |
| **total**  | **79** |
