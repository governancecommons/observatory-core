# OC-AI-05 — Audit integrity chain (experimental)

New SQLite audit databases store SHA-256 entry hashes linked by previous-hash values. Each append uses a SQLite IMMEDIATE transaction; `createChainedAudit(audit).verify()` scans bounded pages and checks sequence continuity and the hash chain. Tests check persistence and detect direct modification of a record.

**Migration gate:** existing OC-AI-04 audit databases do not have hash columns. Opening them fails closed; export and verified migration tooling must be designed before upgrading a deployed database. Do not discard existing audit records.

**Integrity limitations:** A privileged database writer can rewrite the complete chain. Truncation of the tail cannot be detected without an independently preserved head hash. No external anchoring, signatures, identity attestation, retention protection, or independent review is included. This is tamper-evident under partial edits, not tamper-proof.
