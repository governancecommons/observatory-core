# OC-09C — Experimental SQLite full-text search

The opt-in research archive now indexes new documents in SQLite FTS5 and exposes `search(query,{limit,offset})`. Queries are escaped as literal phrases, with bounded query length and pagination. Results return document descriptors, not raw passages, and remain subject to caller-side authorization.

Limitations: existing archives created before this change are not backfilled; no migration/version tracking, snippet offsets, per-tenant isolation, result count, robust stable ranking, or source provenance validation. Do not expose directly to untrusted agents. Next step: migration/backfill, validated citation-bearing passages and scoped read-only agent tools.
