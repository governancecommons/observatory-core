import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {SQLiteResearchAccessAudit} from "../src/research/sqlite-access-audit.mjs";
import {exportAuditCheckpoint,verifyAuditCheckpoint} from "../src/research/audit-checkpoint.mjs";
test("external audit checkpoint detects truncated tail and supports later appends",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-anchor-"));const path=join(dir,"audit.sqlite");
 const audit=await SQLiteResearchAccessAudit.open(path);
 try{
  const base={occurredAt:"2026-10-22T12:00:00Z",subject:"agent:a",documentId:"doc-"+"a".repeat(64),action:"read",allowed:true};
  audit.record(base);audit.record({...base,allowed:false});
  const checkpoint=exportAuditCheckpoint(audit,{issuedAt:"2026-10-22T12:10:00Z"});
  assert.equal(verifyAuditCheckpoint(audit,checkpoint).valid,true);
  audit.record(base);
  assert.equal(verifyAuditCheckpoint(audit,checkpoint).valid,true);
  assert.equal(verifyAuditCheckpoint(audit,{...checkpoint,count:1}).valid,false);
  const db=new DatabaseSync(path);
  try{db.prepare("DELETE FROM research_access_audit WHERE sequence>=2").run();}finally{db.close();}
  assert.equal(verifyAuditCheckpoint(audit,checkpoint).valid,false);
 }finally{audit.close();await rm(dir,{recursive:true,force:true});}
});
