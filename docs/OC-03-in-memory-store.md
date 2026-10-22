# OC-03 — In-memory evidence store

Status: experimental implementation, not a production persistence service.

## API

Import `InMemoryEvidenceStore` and `recordRef` from `src/core/store.mjs`.

- `append(record)` validates basic record shape, enforces sequential immutable versions and resolves required typed references, returning `recordType:id@version`.
- `get(ref)`, `getLatest(recordType,id)`, `history(recordType,id)` and `query({recordType,limit,offset})` retrieve immutable snapshots.
- Internal references use `recordType:id@version`; `subjectRef` and `policyRef` are external references and are not resolved here.
- `npm test` runs existing GC publication tests plus OC-03 Node tests.

## Boundaries and known limitations

- **Ephemeral**: process restart loses all data; no filesystem/database adapter, concurrency controls, authorization or multi-tenant isolation.
- **Not a full JSON Schema validator**: this module performs a small runtime subset of validation. The JSON Schema and Python conformance suite remain normative for record shapes; full schema validation integration is future work.
- **No ingestion/network**: source locators are data, not fetch instructions.
- **No release approval**: a PublicationCandidate is not approved or released by the store.
- **No proof of truth**: a VerificationResult only records the outcome claimed by a procedure.
- **Pagination**: offset pagination is stable only when no concurrent append changes the collection.
- **Identity grammar**: the typed reference syntax is provisional and should be versioned before public SDK commitments.
- **Provenance**: references must exist at append time; this is not a full graph-consistency or cycle detection engine.
- **Legacy**: existing GC v1.0.0 publication validation and export preparation are untouched.

Next steps: integrate strict Draft 2020-12 runtime schema validation; add namespace/tenant scoping and authorization; design a durable adapter and transactional referential checks; test error cases and adversarial inputs before production use.
