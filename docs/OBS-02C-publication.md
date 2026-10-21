# GC–OBS.02C — Approved publication pipeline

**Implementation status:** candidate export preparation only; no live publication or automatic human approval.

The producer accepts a JSON array of evidence records and a separately supplied JSON metadata file. It validates the existing Observatory evidence contract and GC–ICQ.01 classification for every record, sorts by stable ID, serializes deterministically, computes a SHA-256 digest, and writes `records.json` and `manifest.json` to a new, non-existing directory. It fails closed before writing files if any record is unapproved or invalid.

## Usage

```bash
npm test
node scripts/prepare-publication.mjs path/to/approved-records.json path/to/approval-metadata.json out/releases/<publication-id>
npm run validate:export -- out/releases/<publication-id>/manifest.json out/releases/<publication-id>/records.json
```

Metadata must contain `publicationId`, `generatedAt` (UTC), `recordsUrl` (final HTTPS location), `approvedBy`, `approvalRecordId`, `sourceCommit` (40 hex characters), and `methodologyVersion`. The reviewer identity and approval reference must be obtained from a genuine human review record; the tool does **not** authenticate reviewer identity or approve claims itself. The release manager must confirm that the source commit and hosted URL match the bytes actually released.

## Important boundaries

- The 14 website catalog entries are **documentation-only and not reviewed**. They must **not** be backfilled as approved evidence until source review and human approval exist.
- No ranking, conformance, independent benchmark, or source verification is inferred.
- Never include restricted/private records or credentials in the publication input.
- Export preparation is not a release: upload, immutable hosting, authorization, release attestation, website consumption, and rollback remain future gates.
- Fixture tests are synthetic and are not approved production evidence.
