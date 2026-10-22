# OC-06 — Storage assurance gates

## Scope of this increment

Adds a child-process concurrency regression test against the SQLite adapter. Three independent Node processes each append 12 source records to one database. After all processes exit, the test opens a fresh connection, verifies all 36 references and runs SQLite integrity_check.

This is a **test**, not proof of production concurrency safety across all filesystems, crash scenarios or operating systems.

## Acceptance gates for the full OC-06 milestone

1. Cross-process writes: test independent concurrent writers and timeout behavior.
2. Interrupted write recovery: terminate a worker mid-transaction and confirm no partial commit.
3. Schema compliance: validate all eight record types against their versioned JSON Schema contracts, including formats and strict JSON types.
4. Storage performance: remove O(n) full-record replay on every SQLite operation while retaining provenance checks.
5. Security and migration: filesystem permissions, database backup/restore, migration versioning, integrity and audit strategy.
6. CI matrix: run the SQLite test suite on supported Node versions and operating systems.

No ingestion, automation, SealDex runtime dependency, or publication approval is introduced by this increment.

## Product north star

Observatory Core preserves what was observed, the supporting evidence, how verification was performed, what changed, and what remains uncertain. Interpretation and publication authorization stay with consuming applications.
