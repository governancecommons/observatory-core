import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteEvidenceStore} from "../src/core/sqlite-store.mjs";
const source=(id,version=1)=>({schemaVersion:"0.1.0",recordType:"source",id,version,createdAt:"2026-10-22T19:00:00Z",producer:"fixture",locator:"https://example.org",sourceType:"web",displayName:id});
test("indexed reads preserve version and pagination semantics across connections",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc06d-")),path=join(dir,"records.sqlite");
 let a,b;
 try{
  a=await SQLiteEvidenceStore.open(path);b=await SQLiteEvidenceStore.open(path);
  for(const id of ["a","b","c"]) a.append(source(id));
  b.append(source("a",2));
  assert.equal(a.get("source:a@1").displayName,"a");
  assert.equal(a.get("source:missing@1"),null);
  assert.equal(a.getLatest("source","a").version,2);
  assert.deepEqual(a.history("source","a").map(x=>x.version),[1,2]);
  assert.deepEqual(b.query({recordType:"source",limit:2,offset:1}).items.map(x=>x.id),["b","c"]);
  assert.equal(b.query({recordType:"source",limit:2,offset:1}).total,4);
  assert.equal(b.query({recordType:"source",limit:2,offset:1}).nextOffset,3);
  assert.throws(()=>b.query({limit:101}),RangeError);
  assert.throws(()=>b.getLatest("invalid","a"),TypeError);
  assert.deepEqual(a.integrityCheck(),["ok"]);
 }finally{a?.close();b?.close();await rm(dir,{recursive:true,force:true});}
});
