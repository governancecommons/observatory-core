# OC-09B — Experimental research archive

`SQLiteResearchArchive` stores exact extracted text and immutable content-addressed document descriptors in a separate SQLite database. It can reconstruct passages and citations after restart and refuses mismatched quotations or altered stored content.

This is an opt-in local research archive, **not** a replacement for the evidence store. Callers must separately validate that `sourceRef` and `captureRef` exist and that the text was lawfully obtained from that capture. There is no tenant authorization, retention policy, full-text indexing, document extraction, concurrent-writer certification, or external API. Do not expose it to untrusted clients.

Next: integrate validated provenance with evidence records, define access/retention policies, and add bounded SQLite FTS search with passage-level results before enabling agent access.
