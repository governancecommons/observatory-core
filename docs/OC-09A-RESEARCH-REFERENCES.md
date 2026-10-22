# OC-09A — Research reference contract v0.1.0

Experimental pure functions in `src/research/references.mjs` create immutable document, passage and citation descriptors. The caller supplies content and source/capture references; no document storage, text extraction, LLM evaluation or citation verification against the evidence store is implied.

- Document identity binds a capture ref and SHA-256 of the exact supplied UTF-8 content.
- Passage identity binds document identity, offsets and a hash of the passage text.
- Offsets use JavaScript UTF-16 code units, not bytes or Unicode grapheme clusters. Callers must preserve the exact extracted text.
- Citation construction requires quoted text to exactly match the passage and hash.
- These records are *research-layer descriptors*, not yet persisted evidence-store record types or JSON Schema 2020-12 contracts.
- No claim of factual truth, source authenticity, copyright clearance, or trustworthiness is made.

Next gates: validated versioned JSON Schemas, stored immutable extracted content, citation resolution and permissions, extraction provenance, Unicode normalization policy, and passage-level retrieval/search. Agent and LASSO workflows consume read-only citation refs after these gates.