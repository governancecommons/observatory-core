# OC-04 — File-backed evidence store (experimental)

The `FileEvidenceStore` adapter persists the existing in-memory record model to a local JSON snapshot with a SHA-256 envelope.

```js
import {FileEvidenceStore} from "./src/core/file-store.mjs";
const store = await FileEvidenceStore.open("./data/observatory-records.json");
const ref = await store.append(record);
const restored = store.get(ref);
```

## Guarantees and limits

- A successful append replaces the complete snapshot via a temporary file and rename, and only then updates the in-process view.
- Startup validates the envelope digest and replays records through `InMemoryEvidenceStore`; a corrupt or invalid snapshot fails closed.
- Append validation rejects missing provenance references and out-of-order versions.
- The snapshot checksum is **integrity detection only**. An attacker who can rewrite the file can also recompute its checksum; this is not a signature or authentication.
- **Single-process, single-writer only**: no cross-process locks, no serialized concurrent append queue, and no optimistic concurrency check. Do not use concurrent writers.
- **Not crash-durable**: no explicit fsync of file and parent directory. A sudden power failure may lose the most recent write despite successful rename.
- **Not encrypted**: files may contain sensitive information. Application owners must enforce filesystem access restrictions, data classification, and backup controls.
- **O(n) writes**: every append replays and rewrites the entire snapshot. Suitable only for small experimental datasets.
- No source ingestion, search indexing, authentication, authorization, schema-wide runtime validator, or publication release.
- Existing Governance Commons publication code is unchanged.

Next gates: serialized writes and locking, crash durability, signed provenance or trusted digest anchoring, strict JSON Schema validation, quotas, backups, and an SQLite adapter.
