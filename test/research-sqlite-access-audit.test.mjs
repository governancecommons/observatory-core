import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteResearchArchive} from "../src/research/sqlite-archive.mjs";
import {SQLiteResearchAccessAudit,createResearchAuditCallback} from "../src/research/sqlite-access-audit.mjs";
import {createGovernedResearchTools} from "../src/research/governed-tools.mjs";
test("research audit persists allow and deny decisions across reopen",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-audit-"));
 const auditPath=join(dir,"audit.sqlite");
 const archive=await SQLiteResearchArchive.open(join(dir,"research.sqlite"));
 let audit=await SQLiteResearchAccessAudit.open(auditPath);
 try{
  const doc=archive.put({sourceRef:"source:a@1",captureRef:"capture:a@1",content:"Verified evidence."});
  let permitted=true;
  const tools=createGovernedResearchTools(archive,{candidateDocumentIds:[doc.id],authorize:()=>permitted,audit:createResearchAuditCallback(audit,{subject:"agent:reviewer",clock:()=>"2026-10-22T12:00:00.000Z"})});
  assert.deepEqual(tools.getDocument({documentId:doc.id}),{document:doc});
  permitted=false;
  assert.throws(()=>tools.getDocument({documentId:doc.id}),/unavailable/);
  assert.deepEqual(audit.list().map(e=>e.allowed),[true,false]);
  audit.close();
  audit=await SQLiteResearchAccessAudit.open(auditPath);
  const rows=audit.list();
  assert.equal(rows.length,2);
  assert.equal(rows[0].subject,"agent:reviewer");
  assert.equal(rows[1].action,"read");
  assert.equal(rows[1].allowed,false);
  assert.throws(()=>audit.record({occurredAt:"bad",subject:"x",documentId:doc.id,action:"read",allowed:true}),/timestamp/);
 }finally{audit.close();archive.close();await rm(dir,{recursive:true,force:true});}
});
