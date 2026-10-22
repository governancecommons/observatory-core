import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteEvidenceStore} from "../src/core/sqlite-store.mjs";
const time="2026-10-22T19:00:00Z";
const source=(id,version=1)=>({schemaVersion:"0.1.0",recordType:"source",id,version,createdAt:time,producer:"fixture",locator:"https://example.org",sourceType:"web",displayName:"Test"});
async function fixture(fn) {
 const dir=await mkdtemp(join(tmpdir(),"oc05-"));
 try {await fn(join(dir,"records.sqlite"));} finally {await rm(dir,{recursive:true,force:true});}
}
test("SQLite adapter persists records across restarts",()=>fixture(async path=>{
 let db=await SQLiteEvidenceStore.open(path);
 assert.equal(db.append(source("a")),"source:a@1");
 db.close();
 db=await SQLiteEvidenceStore.open(path);
 assert.equal(db.getLatest("source","a").displayName,"Test");
 assert.deepEqual(db.integrityCheck(),["ok"]);
 db.close();
}));
test("independent SQLite connections see each other's committed writes",()=>fixture(async path=>{
 const a=await SQLiteEvidenceStore.open(path),b=await SQLiteEvidenceStore.open(path);
 try {
   a.append(source("a"));b.append(source("b"));
   assert.equal(a.query().total,2);
   assert.equal(b.query().total,2);
 } finally {a.close();b.close();}
}));
test("rejected append rolls back transaction and preserves history",()=>fixture(async path=>{
 const db=await SQLiteEvidenceStore.open(path);
 try {
   db.append(source("a"));
   assert.throws(()=>db.append(source("a")),/already exists/);
   assert.throws(()=>db.append(source("a",3)),/version must follow/);
   assert.equal(db.query().total,1);
   db.append(source("a",2));
   assert.deepEqual(db.history("source","a").map(r=>r.version),[1,2]);
 } finally {db.close();}
}));
test("invalid timeout rejected",()=>fixture(async path=>{
 await assert.rejects(SQLiteEvidenceStore.open(path,{busyTimeout:-1}),RangeError);
}));
