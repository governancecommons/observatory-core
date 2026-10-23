import test from "node:test";
import assert from "node:assert/strict";
import {makeResearchDocument,makeResearchPassage,makeResearchCitation} from "../src/research/references.mjs";
import {createResearchIntegration,RESEARCH_CONTRACT_VERSION as version} from "../src/research/integration-contract.mjs";
const req={version,operation:"searchEvidence",arguments:{query:"research"}};
test("research result is JSON-safe and detached from facade",()=>{
 const content="one";
 const document=makeResearchDocument({sourceRef:"source",captureRef:"capture",content});
 const passage=makeResearchPassage({document,content,start:0,end:3});
 const citation=makeResearchCitation({passage,content,quotedText:"one"});
 const source={results:[{document,passage,citation}]};
 const integration=createResearchIntegration({searchEvidence:()=>source,getDocument:()=>null,verifyCitation:()=>({valid:true})});
 const result=integration.invoke(req);
 assert.equal(result.ok,true);
 source.results[0].citation={...citation,quotedText:"changed"};
 assert.equal(result.result.results[0].citation.quotedText,"one");
 assert.equal(JSON.stringify(result).includes("one"),true);
});
test("rejects cyclic, oversized and non-JSON results without leaking details",()=>{
 const cyclic={};cyclic.self=cyclic;
 for(const payload of [cyclic,{content:"x".repeat(300000)},{date:new Date()},undefined]){
  const integration=createResearchIntegration({searchEvidence:()=>payload,getDocument:()=>null,verifyCitation:()=>({valid:true})});
  const response=integration.invoke(req);
  assert.equal(response.ok,false);
  assert.equal(response.error.code,"RESEARCH_OPERATION_FAILED");
 }
});
