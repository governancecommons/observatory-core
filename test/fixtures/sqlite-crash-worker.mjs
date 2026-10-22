import {DatabaseSync} from "node:sqlite";
const [path,mode] = process.argv.slice(2);
if (!path || !["rollback","commit"].includes(mode)) process.exit(2);
const db = new DatabaseSync(path);
db.exec("PRAGMA busy_timeout=10000");
db.exec("PRAGMA synchronous=FULL");
db.exec("BEGIN IMMEDIATE");
db.prepare("INSERT INTO evidence_records(ref,record_type,record_id,version,payload) VALUES(?,?,?,?,?)").run(
  "source:crash-"+mode+"@1","source","crash-"+mode,1,
  JSON.stringify({schemaVersion:"0.1.0",recordType:"source",id:"crash-"+mode,version:1,createdAt:"2026-10-22T19:00:00Z",producer:"crash-test",locator:"https://example.org/crash-"+mode,sourceType:"web",displayName:"Crash "+mode})
);
if (mode==="commit") db.exec("COMMIT");
// Abrupt termination deliberately bypasses close and normal cleanup.
process.kill(process.pid,"SIGKILL");
