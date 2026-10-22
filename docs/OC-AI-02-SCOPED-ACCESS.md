# OC-AI-02 — Document-scoped read-only research tools

`createScopedResearchTools(archive,{allowedDocumentIds})` creates a provider-neutral, fail-closed in-process research facade. An explicit allowlist is required, including an empty list for no access. Search iterates only authorized documents; it does not query all documents and filter afterward. Metadata and citation resolution reject IDs outside the scope before touching the archive.

**Limitations and required controls:** The host must authenticate callers and derive document IDs from its authoritative policy engine. The scope is a snapshot, not revocable in place; recreate the facade for policy changes. The underlying archive and the legacy unscoped `createReadOnlyResearchTools` remain directly callable by trusted code; this is not a process sandbox or a complete authorization boundary. The scope is limited to 100 IDs, performs a literal case-sensitive substring scan, returns at most one result per document, and has no pagination or full-text ranking. Search may reveal content of explicitly authorized documents. Do not expose the raw archive to untrusted agents or grant network access without a separate policy-enforcing service.

Future gates: service-side policy enforcement, revocation, tenant partitioning, auditable decisions, source provenance, and pagination.
