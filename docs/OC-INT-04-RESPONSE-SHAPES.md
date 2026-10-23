# OC-INT-04 — Research result structural contracts

The in-process `oc.research.v1` integration now rejects operation results that do not match the research descriptor structures: `searchEvidence` returns a bounded list of linked document/passage/citation triples, `getDocument` returns a document wrapper or null, and `verifyCitation` returns one linked triple. The adapter validates after JSON normalization, and invalid outputs receive the sanitized operation failure envelope.

The change intentionally rejects previously tolerated arbitrary JSON mock responses. It validates structure and reference relationships, **not** cryptographic content authenticity; the archive's citation resolution remains the integrity authority. It does not implement a transport, authenticated endpoint, or publication authority.
