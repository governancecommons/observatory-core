# OC-INT-06 — Governed research integration fixture

The end-to-end test composes the SQLite research archive, a host-controlled dynamic authorizer, synchronous SQLite audit sink, versioned research integration, and JSON transport. It exercises a Portal-like authenticated request context, scoped search, exact citation verification, denied document access, revocation and hash-chain verification.

This is a **local integration fixture inside Observatory Core**, not a live connection to `governance-commons-portal`. It deliberately does not create identities or accept browser credentials. Portal must supply a trusted server-side identity, document candidate scope, policy and audit storage; client-provided identity must never be treated as authoritative. Deployment security, network authentication, cross-repository consumer tests, failure injection and threat review remain release gates.
