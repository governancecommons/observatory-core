import test from "node:test";
import assert from "node:assert/strict";
import {createResearchIntegration,RESEARCH_CONTRACT_VERSION as version} from "../src/research/integration-contract.mjs";
test("operation-specific input validation and sanitized failures",()=>{
 const calls=[];
 const bridge=createResearchIntegration({
  searchEvidence:args=>{calls.push(args);return {results:[]};},
  getDocument:()=>{throw new Error("private policy and file path");},
  verifyCitation:()=>({valid:true})
 });
 const invoke=(operation,args)=>bridge.invoke({version,operation,arguments:args});
 assert.equal(invoke("searchEvidence",{query:"verified"}).ok,true);
 assert.equal(calls.length,1);
 assert.throws(()=>invoke("searchEvidence",{query:"",limit:1}),/invalid research tool request/);
 assert.throws(()=>invoke("searchEvidence",{query:"x",limit:999}),/invalid research tool request/);
 assert.throws(()=>invoke("searchEvidence",{query:"x",scope:"all"}),/invalid research tool request/);
 assert.throws(()=>invoke("verifyCitation",{documentId:"doc-"+"a".repeat(64),start:0,end:5,quotedText:"four"}),/invalid research tool request/);
 const denied=invoke("getDocument",{documentId:"doc-"+"a".repeat(64)});
 assert.equal(denied.ok,false);
 assert.equal(denied.error.code,"RESEARCH_OPERATION_FAILED");
 assert.equal(JSON.stringify(denied).includes("private policy"),false);
});
