# OC-09D — Citation-backed search (experimental)

`searchCitations(query,{limit,offset})` uses bounded FTS document search and then searches the stored original text for the **first exact, case-sensitive substring**. It resolves the matching span through the existing content-digest and citation constructors. Each result includes document, passage and citation descriptors.

This is intentionally conservative. SQLite FTS is tokenized and case-insensitive while exact substring matching is not; a document may match FTS but produce no citation, and result pages may be underfilled. No snippets, semantic ranking, Unicode folding, token offsets, multi-occurrence matches, source authorization, or tenant controls. Never treat absent results as proof that a passage is absent. Future work should use an explicit token-offset alignment strategy and verified pagination semantics.
