import test from "node:test";
import assert from "node:assert/strict";
import {createResearchIntegration,RESEARCH_CONTRACT_VERSION as version} from "../src/research/integration-contract.mjs";
import {makeResearchDocument,makeResearchPassage,makeResearchCitation} from "../src/research/references.mjs";
const id="doc-"+"a".repeat(64);
const invoke=(facade,operation,args)=>createResearchIntegration(facade).invoke({version,operation,arguments:args});
test("accepts linked document/passage/citation and rejects malformed results",()=>{
 const content="quoted text";
 const document=makeResearchDocument({sourceRef:"source",captureRef:"capture",content});
 const passage=makeResearchPassage({document,content,start:0,end:content.length});
 const citation=makeResearchCitation({passage,content,quotedText:content});
 const good={document,passage,citation};
 const facade={searchEvidence:()=>({results:[good]}),getDocument:()=>({document}),verifyCitation:()=>good};
 assert.equal(invoke(facade,"searchEvidence",{query:"quoted"}).ok,true);
 assert.equal(invoke(facade,"getDocument",{documentId:id}).ok,true);
 assert.equal(invoke(facade,"verifyCitation",{documentId:id,start:0,end:content.length,quotedText:content}).ok,true);
 for(const invalid of [{results:[{document}]},{results:"not array"},{results:[{...good,citation:{...citation,documentId:id}}]}]){
  const response=invoke({...facade,searchEvidence:()=>invalid},"searchEvidence",{query:"quoted"});
  assert.equal(response.ok,false);
 }
 assert.equal(invoke({...facade,getDocument:()=>({secret:"x"})},"getDocument",{documentId:id}).ok,false);
 assert.equal(invoke({...facade,verifyCitation:()=>({valid:true})},"verifyCitation",{documentId:id,start:0,end:content.length,quotedText:content}).ok,false);
});
