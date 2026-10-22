import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteResearchArchive} from "../src/research/sqlite-archive.mjs";
test("research documents and citations survive restart",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc-research-"));
 const path=join(dir,"research.sqlite");
 try{
  let archive=await SQLiteResearchArchive.open(path);
  const document=archive.put({sourceRef:"source:sample@1",captureRef:"capture:sample@1",content:"Alpha evidence. Beta claim."});
  assert.equal(archive.put({sourceRef:"source:sample@1",captureRef:"capture:sample@1",content:"Alpha evidence. Beta claim."}).id,document.id);
  archive.close();
  archive=await SQLiteResearchArchive.open(path);
  const result=archive.resolveCitation({documentId:document.id,start:0,end:"Alpha evidence.".length,quotedText:"Alpha evidence."});
  assert.equal(result.citation.quotedText,"Alpha evidence.");
  assert.equal(result.document.id,document.id);
  assert.throws(()=>archive.resolveCitation({documentId:document.id,start:0,end:15,quotedText:"invented quote"}),/citation does not match/);
  assert.equal(archive.get("missing"),null);
  archive.close();
 }finally{await rm(dir,{recursive:true,force:true});}
});
