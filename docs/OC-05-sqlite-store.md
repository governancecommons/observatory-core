# OC-05 — Experimental SQLite transactional adapter

Requires Node.js 22.13+ with `node:sqlite` support (prefer current Node 24 LTS). Uses SQLite in WAL mode with FULL synchronous commits.

```js
import {SQLiteEvidenceStore} from "./src/core/sqlite-store.mjs";
const db=await SQLiteEvidenceStore.open("./data/observatory.sqlite");
try {
  const ref=db.append(record);
  console.log(db.get(ref));
} finally {
  db.close();
}
```

## Guarantees and boundaries

- `BEGIN IMMEDIATE` acquires the SQLite writer reservation before replay and append, serializing competing writers **across processes on a supported local filesystem**.
- Unique record references and version constraints are checked inside the transaction; invalid appends roll back.
- WAL allows readers and one writer to operate concurrently, subject to SQLite's locking model.
- Records are reloaded from committed storage for each operation; no stale per-process in-memory cache.
- SQLite `PRAGMA integrity_check` is available, but this is not cryptographic tamper evidence, authentication, or authorization.
- No schema-wide JSON Schema runtime validation yet. Existing core record validation applies.
- Synchronous replay makes reads O(n) and writes O(n); suitable for small experimental datasets only.
- Do not put this SQLite database on network filesystems without separately validating SQLite locking and WAL semantics.
- Call `close()` to release the connection; checkpoint and backup procedures remain to be defined.
- Never store secrets or assume the file is encrypted.
- No approval or publication permissions are granted by writing records.
- SealDex is an optional read-only registry adapter proposal, not a dependency.

## Further hardening

CI must run against a Node version supporting `node:sqlite`. Add actual parallel child-process contention tests, interrupted-process recovery tests, SQLite migrations, indexes and efficient provenance validation, strict schema enforcement, quotas, and authenticated evidence integrity before production deployment.
