# OC-AI-01 — Read-only research tool facade (experimental)

`createReadOnlyResearchTools(archive)` provides three provider-neutral methods: `searchEvidence({query,limit})`, `getDocument({documentId})`, and `verifyCitation({documentId,start,end,quotedText})`. It does not expose archive mutation methods or original full document text. The caller owns the archive instance.

**Security boundary:** this facade is NOT an authorization system or a sandbox. Any caller able to invoke it can search all documents in the supplied archive. Embedders must enforce identity, tenant and per-document access policies before making it available to an agent, LASSO workflow, Portal or network endpoint. Search is literal and conservative and can omit tokenized matches; no guarantees of completeness. No model provider dependency, approval capability, publication operation, agent execution, or network transport is included.

Future gates: authorized query scoping, result-level provenance, redaction and output limits, migration/backfill, read-only transport contracts, and independent review.
