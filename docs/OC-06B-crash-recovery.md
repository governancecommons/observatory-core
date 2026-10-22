# OC-06B — SQLite crash recovery assurance

This regression uses a separate Node process to begin a SQLite write transaction, insert a valid evidence record, and terminate via SIGKILL before COMMIT. Reopening the adapter must not expose that uncommitted record. A second process commits a record and is then killed; reopening must retain it. Both reopenings run PRAGMA integrity_check.

This is an **integration regression**, not proof of power-loss durability, fsync correctness, filesystem reliability, WAL corruption resistance, or operational backup/recovery. SQLite is configured with WAL and synchronous=FULL in the adapter. Tests skip on Windows because the POSIX SIGKILL contract is not portable.

Next: simulate transaction failure/rollback in-process, strict schema validation, migrations, WAL checkpoint/backup procedure, and indexed reads.
