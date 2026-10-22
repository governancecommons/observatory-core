import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {migrateLegacyResearchAudit} from "../src/research/migrate-legacy-audit.mjs";
import {SQLiteResearchAccessAudit} from "../src/research/sqlite-access-audit.mjs";
import {createChainedAudit} from "../src/research/audit-chain.mjs";
test("legacy audit migration preserves decisions and chain verifies",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-migrate-"));const path=join(dir,"legacy.sqlite");
 try{
  const db=new DatabaseSync(path);
  db.exec("CREATE TABLE research_access_audit (sequence INTEGER PRIMARY KEY AUTOINCREMENT, occurred_at TEXT NOT NULL, subject TEXT NOT NULL, document_id TEXT NOT NULL, action TEXT NOT NULL, allowed INTEGER NOT NULL CHECK(allowed IN (0,1)))");
  db.prepare("INSERT INTO research_access_audit(occurred_at,subject,document_id,action,allowed) VALUES(?,?,?,?,?)").run("2026-10-22T12:00:00Z","agent:a","doc-"+"a".repeat(64),"read",1);
  db.prepare("INSERT INTO research_access_audit(occurred_at,subject,document_id,action,allowed) VALUES(?,?,?,?,?)").run("2026-10-22T12:01:00Z","agent:a","doc-"+"a".repeat(64),"read",0);
  db.close();
  assert.throws(()=>migrateLegacyResearchAudit(path),/confirmed backup/);
  const migrated=migrateLegacyResearchAudit(path,{backupConfirmed:true});
  assert.equal(migrated.count,2);
  const audit=await SQLiteResearchAccessAudit.open(path);
  try{
   assert.equal(createChainedAudit(audit).verify().valid,true);
   assert.deepEqual(audit.list().map(x=>x.allowed),[true,false]);
  }finally{audit.close();}
  assert.throws(()=>migrateLegacyResearchAudit(path,{backupConfirmed:true}),/already migrated/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
