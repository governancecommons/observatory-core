import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteResearchArchive} from "../src/research/sqlite-archive.mjs";
import {createReadOnlyResearchTools} from "../src/research/read-only-tools.mjs";
test("read-only facade searches, resolves and verifies citations",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-agent-"));
 const archive=await SQLiteResearchArchive.open(join(dir,"research.sqlite"));
 try{
  const doc=archive.put({sourceRef:"source:s@1",captureRef:"capture:c@1",content:"Alpha evidence. Beta claim."});
  const tools=createReadOnlyResearchTools(archive);
  const matches=tools.searchEvidence({query:"Alpha evidence"});
  assert.equal(matches.results.length,1);
  assert.equal(matches.results[0].citation.documentId,doc.id);
  assert.deepEqual(tools.getDocument({documentId:doc.id}),{document:doc});
  assert.equal(tools.verifyCitation({documentId:doc.id,start:0,end:15,quotedText:"Alpha evidence."}).citation.quotedText,"Alpha evidence.");
  assert.throws(()=>tools.verifyCitation({documentId:doc.id,start:0,end:15,quotedText:"fabrication"}),/does not match/);
  assert.throws(()=>tools.searchEvidence({query:"a",limit:100}),/invalid search arguments/);
  assert.equal("put" in tools,false);
  assert.equal(Object.isFrozen(tools),true);
 }finally{archive.close();await rm(dir,{recursive:true,force:true});}
});
