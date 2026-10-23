import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteResearchArchive} from "../src/research/sqlite-archive.mjs";
import {SQLiteResearchAccessAudit,createResearchAuditCallback} from "../src/research/sqlite-access-audit.mjs";
import {createGovernedResearchTools} from "../src/research/governed-tools.mjs";
import {createResearchIntegration,RESEARCH_CONTRACT_VERSION as version} from "../src/research/integration-contract.mjs";
import {createResearchJsonTransport} from "../src/research/json-transport.mjs";
import {createChainedAudit} from "../src/research/audit-chain.mjs";
test("Portal-style research requests are scoped, audited and citation-verifiable",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-portal-fixture-"));
 const archive=await SQLiteResearchArchive.open(join(dir,"research.sqlite"));
 const audit=await SQLiteResearchAccessAudit.open(join(dir,"access.sqlite"));
 try{
  const content="Verified research passage";
  const allowed=archive.put({sourceRef:"source:public",captureRef:"capture:one",content});
  const blocked=archive.put({sourceRef:"source:private",captureRef:"capture:two",content:"Private research passage"});
  const state={revoked:false};
  const transport=createResearchJsonTransport(context=>{
   if(!context||context.authenticated!==true||context.subject!=="editor-1")throw new Error("unauthenticated");
   const tools=createGovernedResearchTools(archive,{
    candidateDocumentIds:[allowed.id,blocked.id],
    authorize:({documentId})=>!state.revoked&&documentId===allowed.id,
    audit:createResearchAuditCallback(audit,{subject:context.subject,clock:()=>"2026-10-22T12:00:00Z"})
   });
   return createResearchIntegration(tools);
  });
  const ctx={authenticated:true,subject:"editor-1"};
  const call=(operation,args,context=ctx)=>transport.handle(JSON.stringify({version,operation,arguments:args}),context);
  assert.equal(call("searchEvidence",{query:"research"}).status,200);
  const found=JSON.parse(call("searchEvidence",{query:"Verified"}).body);
  assert.equal(found.result.results.length,1);
  assert.equal(found.result.results[0].document.id,allowed.id);
  const cite=found.result.results[0].citation;
  const verified=call("verifyCitation",{documentId:allowed.id,start:cite.start,end:cite.end,quotedText:cite.quotedText});
  assert.equal(verified.status,200);
  assert.equal(JSON.parse(verified.body).result.citation.id,cite.id);
  assert.equal(call("getDocument",{documentId:blocked.id}).status,403);
  assert.equal(call("getDocument",{documentId:allowed.id},{authenticated:false,subject:"editor-1"}).status,503);
  state.revoked=true;
  assert.equal(call("getDocument",{documentId:allowed.id}).status,403);
  const rows=audit.list();
  assert.ok(rows.some(row=>row.allowed===true&&row.action==="verify"));
  assert.ok(rows.some(row=>row.allowed===false&&row.documentId===blocked.id));
  assert.ok(rows.some(row=>row.allowed===false&&row.documentId===allowed.id));
  assert.equal(createChainedAudit(audit).verify().valid,true);
 }finally{audit.close();archive.close();await rm(dir,{recursive:true,force:true});}
});
