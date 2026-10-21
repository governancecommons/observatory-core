# Governance Commons Observatory Core

Independent, evidence-first publication contracts for the Governance Commons Observatory.

**Status:** bootstrap; no benchmark execution or live publication pipeline yet.

## Architecture
Core owns validated evidence and approved, checksum-pinned publication exports. The Astro website is a read-only consumer. Agent Matrix, Agent Dossier, Agent Roster and Registry retain independent normative/editorial authority.

## Commands
- `npm test` — positive and negative contract tests (Node.js 24)
- `npm run validate:export -- manifest.json records.json` — validate an approved publication

The publication manifest contract is specified in [GC–OBS.02 architecture](https://github.com/governancecommons/governance-commons-www/blob/main/docs/gc-obs-02-architecture-separation.md) (pending website PR #3). No claims of independent verification, certifications or rankings are implied.

## Safety
Only publish records with explicit human approval and sufficient provenance. Do not commit private Dossier or Roster source data. Documentation-only records must not be promoted to benchmark evidence.
