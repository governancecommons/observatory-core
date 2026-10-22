# OC-00 / OC-01 — Independent Engine Baseline (proposal)

Status: proposed, not ratified. Baseline audited at `f6e02c2` (2026-10-22).

## Product contract

Observatory Core is a standalone, domain-neutral evidence and observation engine. It collects and normalizes source material, records provenance, retains observation history, supports verification and retrieval, detects changes, and prepares versioned, integrity-verifiable publication candidates.

It does **not** own editorial authority, approval authentication, governance policy, trading decisions, benchmark rankings, application UI, or deployment authorization. Consumers include Governance Commons, Signal Radar, publishing tools, market applications and Agrilogik.

## Current repository inventory (reviewed)

| Path | Disposition | Rationale |
| --- | --- | --- |
| `src/contract.mjs` | Refactor behind compatibility boundary | GC-specific evidence classes and mandatory ICQ classification |
| `src/classification.mjs` | Extract GC adapter | Mirrors GC–ICQ.01 and enforces GC publication policy |
| `src/publish.mjs` | Preserve and extend | Deterministic sorting, SHA-256 and fail-closed publication preparation |
| `scripts/prepare-publication.mjs` | Preserve | CLI for immutable candidate export directory |
| `scripts/validate-export.mjs` | Preserve | CLI validates manifest and records |
| `test/contract.test.mjs` | Preserve and expand | Negative and positive publication contract tests |
| `test/publish.test.mjs` | Preserve and expand | Export determinism and security regression tests |
| `docs/OBS-02C-publication.md` | Preserve | Historical GC integration contract |
| `package.json` | Rename only after compatibility plan | GC-specific package identity; v0.1.0 private Node ESM |

## Architectural boundaries

1. **Core**: sources, captures, evidence, observations, provenance edges, verification results, historical snapshots, change events, query ports, export candidate preparation.
2. **Domain adapters**: map domain records, taxonomies, interpretation, classifications, and domain-specific validators into core contracts.
3. **Authorization adapters**: verify consumer-supplied approval assertions against an external trusted authority. A matching `approvedBy` string is not proof of authorization.
4. **Publication consumers**: apply domain policy, approve releases, host artifacts, attest deployments, handle rollback and present results.
5. **Storage and ingestion adapters**: replaceable; no application or framework dependency in core contracts.

## Compatibility and migration rules

- Keep existing `validatePublication`, `preparePublication` and CLI behavior working for the GC v1.0.0 contract until an explicit versioned migration.
- Do not silently make GC–ICQ.01 optional for existing GC publication exports.
- Introduce neutral, versioned core schemas alongside legacy GC contracts; map via an explicit adapter.
- Separate capture/observation validity from public-release eligibility. Unapproved evidence can exist internally but must not be exported as approved.
- Preserve SHA-256 byte verification, duplicate-ID rejection, restrictive classification checks, deterministic output, and fail-closed publication gates.
- Do not label an evidence record independently verified unless an actual verification process and result are recorded.

## Proposed next milestones

- **OC-01**: ratify product scope, vocabulary, package naming and compatibility policy.
- **OC-02**: design versioned core records (Source, Capture, Evidence, Observation, ProvenanceEdge, VerificationResult, ChangeEvent, PublicationCandidate).
- **OC-03**: define ports for ingestion, persistence, retrieval and verification with deterministic fixtures.
- **OC-04**: implement GC compatibility adapter and cross-domain synthetic contract tests.
- **OC-05**: add publication authorization/attestation adapter contracts; do not embed GC Portal policy.
- **OC-06**: document integration recipes for GC Portal and one non-GC consumer.

## Audit caveats

This is a source review, not a passing CI claim, full dependency audit, or proof of production readiness. In particular, the current publication tool validates approval fields but does not authenticate reviewer identity; candidate preparation is not release authorization or deployment.
