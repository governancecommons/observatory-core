import test from "node:test";
import assert from "node:assert/strict";
import {createResearchIntegration,RESEARCH_CONTRACT_VERSION} from "../src/research/integration-contract.mjs";
test("integration contract routes only allowlisted operations",()=>{
 const calls=[];
 const facade={
  searchEvidence:args=>{calls.push(["search",args]);return {results:[]};},
  getDocument:args=>{calls.push(["get",args]);return null;},
  verifyCitation:args=>{calls.push(["verify",args]);return {valid:true};}
 };
 const bridge=createResearchIntegration(facade);
 assert.equal(bridge.version,RESEARCH_CONTRACT_VERSION);
 assert.deepEqual(bridge.invoke({version:RESEARCH_CONTRACT_VERSION,operation:"searchEvidence",arguments:{query:"evidence"}}).result,{results:[]});
 assert.equal(calls.length,1);
 assert.throws(()=>bridge.invoke({version:"oc.research.v0",operation:"searchEvidence",arguments:{query:"x"}}),/invalid/);
 assert.throws(()=>bridge.invoke({version:RESEARCH_CONTRACT_VERSION,operation:"put",arguments:{content:"bad"}}),/invalid/);
 assert.throws(()=>createResearchIntegration({searchEvidence:()=>{}}),/governed/);
 assert.equal("put" in bridge,false);
});
