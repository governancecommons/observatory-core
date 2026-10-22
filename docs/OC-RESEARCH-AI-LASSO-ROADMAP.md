# Observatory Core — Research, AI and LASSO roadmap

Status: proposed architecture scope; no implicit implementation, approval, or publication authority.

## Product boundary
Observatory Core (OC) is independent evidence and research infrastructure. It owns source/capture/evidence provenance, immutable history, indexing and retrieval, source-change observations, versioned outputs, and optional research/agent tool contracts. It does **not** own UI, tenant authorization, editorial approval, model credentials, truth judgments, trading decisions, or publishing authorization.

Governance Commons Portal owns governed workflows, contributor access, model selection, review, and publication requests. Portal Kit owns reusable self-hostable UI/workspace components, not GC-specific policy. The public website consumes explicitly approved outputs. A provider-neutral model gateway/agent runtime is a separately replaceable service. LASSO is an optional future reasoning coordinator; no LASSO runtime dependency is allowed in OC.

## Roadmap and acceptance gates

### OC-08: Secure ingestion (current)
- OC-08A: bounded streaming retrieval interface; implemented.
- OC-08B: allowlisted DNS-pinned HTTPS transport; draft, not production approved.
- OC-08C: independent SSRF/egress and stream review, authoritative address classification, cancellation and resource-limit tests, safe redirect policy (default deny).
- OC-08D: explicit source registration, polling schedule, ETag/Last-Modified, backoff and idempotent ingestion; per-source budgets and audit logs.
Gate: no autonomous polling until network security and operator controls are verified.

### OC-09: Research foundation
- OC-09A: versioned contracts for document, passage, citation anchor, claim attribution, research collection and research query; stable source offsets and content hashes.
- OC-09B: SQLite full-text search and bounded metadata filtering; provenance-preserving search results, pagination, reproducibility tests.
- OC-09C: claim-to-passage edges with support/contradiction recorded as *attributed assessments*, never engine truth.
- OC-09D: saved queries, incremental refresh, stale evidence/change notices.
Gate: each displayed citation resolves to immutable captured content; no invented passage or source.

### OC-AI-01: Agent and model interoperability
- Read-only tools: search_evidence, get_passage, trace_provenance, compare_observations, query_changes.
- Versioned tool I/O, scoped capabilities, least privilege, execution provenance, bounded retrieval, model/provider attribution.
- Optional enrichment outputs (summary, extraction, candidate claims) are separately typed proposals; never overwrite evidence or become verified by model assertion.
- No API keys or direct provider coupling in OC; no automatic external tool execution.
Gate: deterministic tool contract tests, permission checks and untrusted-source prompt-injection tests.

### PK-AI-01 / GC-PAI-01: Portal and Portal Kit
- Portal Kit: reusable model/agent workspace UI components and provider-neutral client contract.
- GC Portal: tenant/user policy, model gateway connection, agent approval gates, tool-call inspection, cost and rate budgets, editorial review and publication authorization.
- OpenAI, Anthropic, Google, Ollama and future providers are adapters, subject to provider API access, license and deployment controls.
Gate: model actions cannot bypass GC approvals or source access controls.

### LASSO-01 (future; separate project): Multi-agent workflow orchestration
- LASSO's primary integration role is coordinating **multiple specialized agents**, not merely improving single-model reasoning: task decomposition, delegation, dependency graphs, parallel/sequential execution, handoffs, checkpoints, retries, cancellation, and bounded resource budgets.
- Example research workflow: discovery agent -> evidence extraction agent -> provenance/verification agent -> synthesis agent; independent critique may run in parallel. Each agent may use a different model through the provider-neutral gateway.
- Define versioned workflow, task, agent capability, handoff, execution event, result and approval-request contracts. Correlate runs with immutable OC evidence refs, model/provider attribution, and traceable input/output boundaries.
- LASSO requests OC's scoped research tools; it cannot rewrite captured evidence, bypass Portal authorization, or publish autonomously.
- Portal visualizes the workflow DAG, agent status, evidence, disagreements, cost and approvals. Portal owns human authorization; the model gateway owns provider adapters and credentials; OC owns evidence.
- Initial workflow runtime must support human-in-the-loop pauses, idempotent resume, least-privilege tools, bounded fan-out, timeouts and durable audit events.
- No canonical LASSO protocol claimed until its own specification is reviewed; no OC dependency on LASSO.
Gate: a multi-agent research workflow can be replayed/audited and LASSO can be disabled or replaced without breaking OC, Portal or source history.

## Cross-cutting requirements
- Source trust is not inferred from source popularity or LLM confidence.
- Distinguish captured evidence, third-party claims, assessments and conclusions.
- Preserve source licenses, access restrictions, deletion/redaction policy and attribution.
- Prevent prompt injection from granting tools, publication or secret access.
- Enforce data minimization, tenant isolation at application boundaries, and explicit model-data sharing policy.
- Keep domain scoring and decisions outside OC.
- Avoid new services until a concrete consumer and contract tests justify them.

## Recommended order
Finish OC-08B/C security gate -> OC-08D polling -> OC-09A/B research contracts/search -> OC-AI-01 read-only tools -> Portal model gateway/workspace -> optional LASSO-01. Workstreams may be specified in parallel, but security gates cannot be bypassed.
