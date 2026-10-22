# Observatory Core — Scope and Integration Register (2026-10-22)

Status: **proposed scope baseline**, not an implementation or a licensing agreement.

## Product identity

Observatory Core is a reusable, domain-neutral evidence and observation engine. It owns source ingestion/normalization, immutable capture and evidence records, provenance and traceability, verification results, observation history, change detection, retrieval, event contracts, and versioned export/publication *candidates*. It does **not** decide truth by fiat, authorize publication, execute trades, own an application UI, or send notifications directly.

The engine must remain independent of Governance Commons and reusable by Signal Radar, agriculture, research and publishing applications.

## Architectural ownership

| Component | Responsibility |
|---|---|
| Observatory Core | Evidence engine, source/capture/observation records, provenance, deterministic changes, retrieval, export candidates, provider-neutral event contracts |
| Storage adapters | Memory, experimental file snapshots, SQLite transactions; future migrations and indexing |
| Governance Commons Portal | Control plane for source setup, workflows, review, human approvals, subscriptions, distribution rules and operator audit |
| Portal Kit | Reusable workspace and UI components, not core engine logic |
| governance-commons-www | Public display and publication verification |
| SealDex (optional) | Read-only, non-secret registry references, producer/configuration/procedure metadata; not evidence storage, authentication or publication authority |
| External automation/delivery | Schedulers, queues, n8n/Huginn-like integrations, email/SMS transports and subscriber delivery |

## Feed and event capabilities

- Inbound adapters: RSS, Atom, JSON Feed, APIs, webhooks, selected web pages; future domain-specific adapters.
- Outbound adapters: versioned RSS/Atom/JSON Feed and portable evidence packages, under consumer publication policy.
- Core events (proposed): `source.changed`, `observation.created`, `verification.completed`, `publication_candidate.prepared`. Consumers control delivery.
- Email/SMS/newsletters: optional downstream adapters after opt-in, permission checks, idempotency, retries, rate limits and cost controls; no sending in Core.

## News and media intelligence — optional domain extension

Do not bake news-specific political labels into domain-neutral Core. Define provider-attributed source assessments with explicit methodology/version, timestamp, licensing provenance, confidence/limitations and links.

Research comparators:
- AllSides: perspective spectrum and side-by-side coverage comparison.
- Ad Fontes Media: separate bias and reliability dimensions.
- Media Bias/Fact Check: source dossiers, factual-reporting and transparency indicators.
- Ground News: event/story clustering, source diversity and coverage-gap exploration.

**Integration is contingent on verified current API terms, permission and licensing.** No scraping, bulk redistribution, reproduction of proprietary ratings, brand endorsement claims, or implied partnerships. Links to public assessments are the default until rights are established.

Build independently: source dossiers, evidence-linked story clustering, transparent comparisons, and coverage-gap measures with denominator/source-set disclosure. Do not label a political leaning as proof of truth or create a universal composite 'truth score'. Preserve provider disagreement, uncertainty and methodological changes.

## Differentiation

1. Evidence-native capture with content hashes, provenance and immutable versions.
2. Reproducible verification procedures and uncertainty/conflicting-claim handling.
3. Deterministic and optionally assisted change detection, with interpretation separately attributed.
4. Portable independently verifiable evidence packages.
5. Domain-neutral extensibility and zero-trust-oriented boundaries.
6. Transparent source and coverage intelligence as an optional domain module.

## Execution sequence

- OC-06: concurrency/crash recovery tests, strict schema enforcement, efficient indexed storage, migration and integrity controls.
- OC-07: RSS/Atom ingestion and normalized captures.
- OC-08: change detection and provenance retrieval.
- OC-09: event contracts and external automation hooks.
- OC-10: evidence package export and independent verification.
- GC Portal integration: source management, review, governed distribution, RSS/JSON publishing.
- Optional Media Intelligence: source dossiers, provider assessment adapters after licensing review, clustering, coverage comparisons.
- Competitive benchmark: FreshRSS, Huginn, Inoreader, n8n, AllSides, Ad Fontes, MBFC, Ground News, plus provenance/evidence systems. Measure functionality, reproducibility, operations, licensing and cost.

## Acceptance principles

No automatic promotion from captured to verified to approved; independent human authorization where required. Every external assessment must retain attribution. Every workflow should remain usable without SealDex, Portal, commercial media-bias APIs, or a particular AI provider.

## Scope freeze

This register captures the currently discussed feature set. Additional ideas go to a future backlog rather than interrupting OC-06 through OC-10. Changes to architecture boundaries require explicit review.
