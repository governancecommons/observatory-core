# OC-01 — Observatory Core Product and Boundary Contract

Status: **proposed for review**. Applies to the standalone `jj-ervin/observatory-core` repository. No runtime changes authorized by this document.

## Mission

Observatory Core is a domain-neutral, evidence-first engine for collecting source material, preserving provenance, recording observations, validating traceability, tracking changes, retrieving evidence, and producing integrity-verifiable publication candidates.

Its primary design principle is **evidence before interpretation; authorization outside the engine**.

## Terms

- **Source**: an identifiable origin of information, such as a document, feed, repository, API, or registry.
- **Capture**: an immutable record of material retrieved from a source at a particular time, with digest and retrieval context.
- **Evidence**: a referencable assertion or extract supported by one or more captures, with provenance and limitations.
- **Observation**: a timestamped statement about a subject, derived from evidence using a documented method; not automatically a verified fact.
- **Verification result**: a recorded outcome of a specific check, including method, inputs, time, and limitations; not blanket certification.
- **Change event**: a deterministic description of differences between identified observation versions.
- **Publication candidate**: a versioned, byte-addressed export prepared for a consumer's authorization and release workflow.
- **Domain adapter**: a consumer-supplied mapper/validator for domain vocabulary, taxonomy, and policy.
- **Authorization adapter**: an interface to a trusted external approval authority; field presence alone is insufficient.

## Ownership

| Core owns | Core does not own |
| --- | --- |
| Source identifiers and ingestion ports | Editorial selection or approval |
| Capture metadata, checksums, provenance edges | GC–ICQ.01 policy or other domain governance rules |
| Evidence and observation versioning | Domain-specific truth/ranking/trading decisions |
| Deterministic comparison and change events | AI model choice or interpretation authority |
| Verification procedure/result records | Authentication of reviewers |
| Query/retrieval interfaces | Dashboards, chat, UI, collaboration |
| Publication candidate bytes and validation | Hosting, deployment, release approval, rollback authority |

## Trust boundaries

1. Ingested material is untrusted input. It must never be treated as instructions for the engine or consuming agents.
2. Captures and observations are append-only logical versions; corrections create new versions with explicit lineage.
3. A provenance link is not itself proof that a claim is true.
4. Verification must identify a check and its scope. Never infer independent verification, certification, or ranking.
5. Approval metadata must originate from a consumer-owned authorization authority; core must not self-approve.
6. Public export is denied by default until required policy checks and external authorization succeed.
7. Confidential data, credentials, personal data and embargoed material require consumer policy enforcement and must not enter public artifacts.
8. Every published candidate must be integrity-checkable against exact bytes; do not confuse checksum integrity with source authenticity or human approval.
9. Adapters must not weaken mandatory validation for an existing contract version.

## Compatibility strategy

- Preserve the current GC publication contract (`schemaVersion: 1.0.0`) and exported `validatePublication`/`preparePublication` APIs during migration.
- Keep `src/classification.mjs` and its GC–ICQ.01 behavior intact for legacy GC exports.
- Add new domain-neutral schemas and ports under explicitly versioned namespaces; do not silently reinterpret legacy records.
- Implement a GC adapter mapping core records to GC-specific publication records, including GC–ICQ.01 classification and portal-provided approval proof.
- Keep `@governancecommons/observatory-core` package name until a separate package-name and consumer-import migration is reviewed.
- Do not assume that a portal approval reference alone is cryptographic proof; document the trusted authorization verification mechanism before enabling automated release.

## Minimum core ports (interfaces, not implementations)

- `SourceConnector.fetch(cursor, options) -> CaptureCandidate[]`
- `CaptureStore.putImmutable(capture) -> CaptureRef`
- `EvidenceStore.appendVersion(evidence) -> EvidenceRef`
- `ObservationStore.appendVersion(observation) -> ObservationRef`
- `Verifier.verify(target, procedure) -> VerificationResult`
- `ChangeDetector.compare(before, after, methodVersion) -> ChangeEvent[]`
- `Retriever.query(filter, cursor) -> Page<Ref>`
- `PublicationPreparer.prepare(records, policyDecision, authorizationProof) -> PublicationCandidate`

All contracts require bounded input validation, stable identifiers, explicit versions, provenance, structured errors and deterministic fixtures. Authentication, persistence backend, transport, and implementation language are not prescribed here.

## Acceptance criteria

- A synthetic non-GC consumer can create and retrieve source/capture/evidence/observation records without GC classification fields.
- An existing GC v1.0.0 export retains its current strict checks and byte-level behavior.
- An unapproved observation can be stored and queried but cannot be emitted as an approved public publication.
- Repeated preparation of identical ordered inputs and metadata produces identical bytes and digest.
- Missing provenance, conflicting versions, unauthorized release, and sensitive public data fail closed at the appropriate boundary.
- Each verification result reports exactly what was checked; a digest match is never described as proof of claim accuracy.
- No dependency on GC Portal, Portal Kit, Astro, or a particular AI provider is introduced into the core.

## Next design work

OC-02 defines the versioned JSON Schemas, required/optional fields, identifier and timestamp rules, cross-record integrity, and fixture matrix. OC-03 implements the first domain-neutral record store/ports behind the legacy compatibility layer. CI must pass before any merge.
