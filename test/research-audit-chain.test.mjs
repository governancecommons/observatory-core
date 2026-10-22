import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {SQLiteResearchAccessAudit} from "../src/research/sqlite-access-audit.mjs";
import {createChainedAudit} from "../src/research/audit-chain.mjs";
test("audit hash chain verifies, survives reopen and detects tampering",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-chain-"));const path=join(dir,"audit.sqlite");
 let audit=await SQLiteResearchAccessAudit.open(path);
 try{
  const base={occurredAt:"2026-10-22T12:00:00.000Z",subject:"agent:a",documentId:"doc-"+"a".repeat(64),action:"read"};
  audit.record({...base,allowed:true});
  audit.record({...base,allowed:false});
  assert.deepEqual(createChainedAudit(audit).verify().valid,true);
  audit.close();audit=await SQLiteResearchAccessAudit.open(path);
  assert.equal(createChainedAudit(audit).verify().count,2);
  const db=new DatabaseSync(path);
  try{db.prepare("UPDATE research_access_audit SET allowed=1 WHERE sequence=2").run();}finally{db.close();}
  assert.equal(createChainedAudit(audit).verify().valid,false);
 }finally{audit.close();await rm(dir,{recursive:true,force:true});}
});
