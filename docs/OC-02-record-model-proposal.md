# OC-02 — Core Record Model and Schema Design

Status: **proposed**; design specification, not yet executable JSON Schema.

## Common envelope

All records use `schemaVersion`, `id`, `version`, `createdAt`, `producer`, and `extensions` (optional namespaced object). IDs are stable opaque strings scoped by record type and tenant/namespace; versions are immutable. Times are RFC 3339 UTC. Canonical serialization and hashing require a separately versioned canonicalization algorithm; plain JSON key order must not be assumed equivalent across producers.

## Record types

| Type | Required domain-neutral fields | Invariants |
| --- | --- | --- |
| Source | locator, sourceType, displayName | Locator is not an authorization to fetch; connector allowlists apply |
| Capture | sourceRef, capturedAt, contentDigest, mediaType, retrievalMethod | Digest covers captured bytes; raw content can remain external |
| Evidence | captureRefs, assertion, method, limitations | At least one resolvable capture; assertions remain attributed |
| Observation | subjectRef, evidenceRefs, observedAt, value, methodVersion | No implicit claim of truth; preserve prior versions |
| ProvenanceEdge | fromRef, toRef, relation, assertedAt | Typed relations, resolvable endpoints, no hidden rewrites |
| VerificationResult | targetRef, procedureId, procedureVersion, checkedAt, outcome, limitations | Outcomes scoped to procedure; never generic certification |
| ChangeEvent | beforeRef, afterRef, comparisonVersion, changes | Both versions exist and share a compatible identity |
| PublicationCandidate | recordRefs, manifestDigest, payloadDigest, preparedAt, policyRef | Candidate status only; no release authorization implied |

## Record states

- Captures: received -> validated -> retained; rejected captures retain safe error metadata only.
- Evidence/observations: recorded -> reviewed or superseded; review state is descriptive, not public approval.
- Publication candidates: prepared -> externally authorized or rejected -> externally released or withdrawn. Only the external consumer can assert release state.

## Security and validation

- Reject duplicate IDs within a namespace/type and conflicting writes to an existing version.
- Prevent SSRF by connector-specific URL schemes, DNS/IP resolution policy, redirect controls, response size limits, and timeouts; do not fetch arbitrary source locators.
- Bound nesting, string length, array counts, and batch sizes; reject malformed timestamps and unsupported schema versions.
- Treat retrieved text as untrusted data; never execute instructions embedded in it.
- Sensitive fields require classification and export filtering by the consumer policy adapter; default public export is deny.
- Retain lineage for corrections and deletions (tombstone/retention policy), while supporting lawful erasure without falsely promising immutable personal data storage.
- Separate cryptographic byte integrity from authenticity, independent verification, editorial approval, and publication release.

## Fixture and test matrix

1. Source -> capture -> evidence -> observation -> query round trip for a non-GC domain.
2. Duplicate and conflicting versions fail.
3. Missing capture/evidence provenance fails.
4. Same observation versions produce no change; changed values produce deterministic ChangeEvent.
5. A hash mismatch fails capture or publication validation.
6. Restricted observation remains queryable to authorized consumers but is blocked from public export.
7. Approval field spoofing cannot bypass authorization adapter.
8. Legacy GC v1.0.0 publication tests remain unchanged and passing.
9. Connector blocks private-network destinations and unsafe redirects.
10. Verification result distinguishes checksum check from factual claim validation.

## Deferred decisions before implementation

- Exact JSON Schema draft, ID encoding and namespace format.
- Content digest and canonicalization versioning.
- Storage adapter transaction and concurrency semantics.
- Domain-neutral policy decision and authorization-proof shapes.
- Query pagination/cursor stability and authorization context.

No implementation should claim these open questions are resolved until an OC-02 schema review is completed.
