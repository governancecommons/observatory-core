# OC-04B — Optional SealDex integration boundary (proposal)

## Purpose

SealDex may provide read-only, non-secret registry metadata used to resolve or describe a source, producer, procedure, or adapter configuration referenced by Observatory Core records. It is **not** an evidence store, content-verification engine, key vault, or publication authority.

## Proposed port

`RegistryReferenceResolver.resolve(reference, context) -> { status, reference, version?, metadata?, resolvedAt? }`

Statuses: `resolved`, `not_found`, `unavailable`, `forbidden`, `invalid`.

Requirements:
- Optional, dependency-inverted interface; no import from SealDex inside the core record store.
- Metadata only; no secrets, tokens, private values, or implicit authorization grants.
- Explicit allowlist and permission checks in the application adapter.
- Immutable record snapshots must not be rewritten when registry metadata changes.
- Registry outages must not silently transform unresolved references into verified claims.
- Reference resolution is advisory for provenance context; cryptographic identity/trust requires separate proof and policy.
- Core storage and retrieval continue without SealDex installed.
- Publication authorization remains with the consumer, such as Governance Commons Portal.

## Candidate reference uses

- `producer`: identity or provenance metadata for the generating component.
- `procedureId`: registry metadata for a verification procedure.
- `policyRef`: non-secret pointer to a policy, never evidence of approval.
- `source` records: configuration metadata for collection adapters.

## Deferred implementation

Do not implement a SealDex adapter until its actual v0.3 provider API and threat model are verified against the current repository. Avoid guessing endpoint names, permissions, or data shapes. The proposed port is not yet an accepted public SDK contract.
