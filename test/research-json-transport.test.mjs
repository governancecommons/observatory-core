import test from "node:test";
import assert from "node:assert/strict";
import {createResearchJsonTransport} from "../src/research/json-transport.mjs";
import {createResearchIntegration,RESEARCH_CONTRACT_VERSION as version} from "../src/research/integration-contract.mjs";
test("JSON transport creates request-scoped integration and sanitizes failures",()=>{
 const seen=[];
 const transport=createResearchJsonTransport(context=>{
  seen.push(context);
  return createResearchIntegration({searchEvidence:()=>({results:[]}),getDocument:()=>null,verifyCitation:()=>{throw new Error("private policy")}});
 });
 const context={subject:"portal-user"};
 const valid=JSON.stringify({version,operation:"searchEvidence",arguments:{query:"test"}});
 const ok=transport.handle(valid,context);
 assert.equal(ok.status,200);
 assert.deepEqual(JSON.parse(ok.body).result,{results:[]});
 assert.equal(seen[0],context);
 assert.equal(transport.handle("{",context).status,400);
 assert.equal(transport.handle(JSON.stringify({version,operation:"put",arguments:{}}),context).status,400);
 assert.equal(transport.handle("x".repeat(20000),context).status,413);
 const denied=transport.handle(JSON.stringify({version,operation:"verifyCitation",arguments:{documentId:"doc-"+"a".repeat(64),start:0,end:4,quotedText:"test"}}),context);
 assert.equal(denied.status,403);
 assert.equal(denied.body.includes("private policy"),false);
});
