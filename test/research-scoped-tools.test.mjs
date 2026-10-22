import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteResearchArchive} from "../src/research/sqlite-archive.mjs";
import {createScopedResearchTools} from "../src/research/scoped-tools.mjs";
test("scoped tools never expose out-of-scope research",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-scoped-"));
 const archive=await SQLiteResearchArchive.open(join(dir,"research.sqlite"));
 try{
  const publicDoc=archive.put({sourceRef:"source:a@1",captureRef:"capture:a@1",content:"Alpha evidence. Shared phrase."});
  const privateDoc=archive.put({sourceRef:"source:b@1",captureRef:"capture:b@1",content:"Private secret. Shared phrase."});
  assert.throws(()=>createScopedResearchTools(archive),/explicit bounded/);
  const tools=createScopedResearchTools(archive,{allowedDocumentIds:[publicDoc.id]});
  assert.deepEqual(tools.searchEvidence({query:"Shared phrase"}).results.map(x=>x.document.id),[publicDoc.id]);
  assert.deepEqual(tools.searchEvidence({query:"Private secret"}).results,[]);
  assert.deepEqual(tools.getDocument({documentId:publicDoc.id}),{document:publicDoc});
  assert.throws(()=>tools.getDocument({documentId:privateDoc.id}),/unavailable/);
  assert.throws(()=>tools.verifyCitation({documentId:privateDoc.id,start:0,end:7,quotedText:"Private"}),/unavailable/);
  assert.equal(tools.verifyCitation({documentId:publicDoc.id,start:0,end:5,quotedText:"Alpha"}).citation.quotedText,"Alpha");
  assert.throws(()=>tools.verifyCitation({documentId:publicDoc.id,start:0,end:5,quotedText:"wrong"}),/does not match/);
  assert.deepEqual(createScopedResearchTools(archive,{allowedDocumentIds:[]}).searchEvidence({query:"Shared"}).results,[]);
  assert.equal("put" in tools,false);
 }finally{archive.close();await rm(dir,{recursive:true,force:true});}
});
