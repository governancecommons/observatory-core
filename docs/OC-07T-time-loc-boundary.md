# OC-07T — time.loc integration boundary

This change introduces an **optional Observatory-owned adapter envelope**, not a claim of compatibility with any published time.loc protocol. The canonical time.loc specification, repository, and version have not been verified here. Do not describe this as a signed, attested, or time.loc-conformant event.

- `occurredAt`: caller-provided UTC event time, not necessarily trusted.
- `recordedAt`: caller-provided UTC recording time, not necessarily trusted.
- `actor`: claimed recording actor.
- `location`: unknown unless explicitly supplied with source/provenance.
- `clock`: unverified unless a source-specific clock description is provided.
- `external`: opaque future compatibility data; no validation or signature verification.

The adapter is deliberately separate from feed parsing and storage. Consumers may attach it to the existing `extensions.timeLoc` record field, subject to existing schema constraints. It does not confer publication approval, factual truth, or cryptographic integrity. Before enabling it for production, review the canonical time.loc contract and map only verified fields; test persistence against both in-memory and SQLite stores; specify signing/key-management and privacy handling separately.
