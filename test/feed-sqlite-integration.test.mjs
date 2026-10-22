import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {SQLiteEvidenceStore} from "../src/core/sqlite-store.mjs";
import {ingestFeedSnapshot} from "../src/ingestion/feed-ingestor.mjs";
const capturedAt="2026-10-22T19:00:00Z",feedUrl="https://example.org/news.xml";
const xml=title=>'<rss version="2.0"><channel><title>News</title><item><guid>item-1</guid><title>'+title+'</title><link>https://example.org/item-1</link></item></channel></rss>';
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),"oc07d-")),path=join(dir,"evidence.sqlite");
 try{await fn(path);}finally{await rm(dir,{recursive:true,force:true});}
}
test("SQLite feed ingest survives restart and exact replay remains deduplicated",()=>fixture(async path=>{
 let db=await SQLiteEvidenceStore.open(path);
 const input={feedUrl,xml:xml("First"),capturedAt};
 const first=ingestFeedSnapshot(db,input);
 assert.equal(first.evidenceCreated,1);
 assert.equal(db.query().total,3);
 db.close();
 db=await SQLiteEvidenceStore.open(path);
 try{
  assert.equal(db.get(first.captureRef).sourceRef,first.sourceRef);
  assert.deepEqual(db.get(first.evidenceRefs[0]).captureRefs,[first.captureRef]);
  const replay=ingestFeedSnapshot(db,input);
  assert.equal(replay.captureCreated,false);
  assert.equal(replay.evidenceCreated,0);
  assert.equal(replay.duplicates,1);
  assert.equal(db.query().total,3);
  assert.deepEqual(db.integrityCheck(),["ok"]);
 }finally{db.close();}
}));
test("SQLite changed feed snapshot preserves prior evidence and provenance after restart",()=>fixture(async path=>{
 let db=await SQLiteEvidenceStore.open(path);
 const first=ingestFeedSnapshot(db,{feedUrl,xml:xml("First"),capturedAt});
 const second=ingestFeedSnapshot(db,{feedUrl,xml:xml("Second"),capturedAt});
 assert.equal(second.sourceRef,first.sourceRef);
 assert.notEqual(second.captureRef,first.captureRef);
 assert.notEqual(second.evidenceRefs[0],first.evidenceRefs[0]);
 db.close();
 db=await SQLiteEvidenceStore.open(path);
 try{
  assert.equal(db.query({recordType:"source"}).total,1);
  assert.equal(db.query({recordType:"capture"}).total,2);
  assert.equal(db.query({recordType:"evidence"}).total,2);
  assert.deepEqual(db.get(first.evidenceRefs[0]).captureRefs,[first.captureRef]);
  assert.deepEqual(db.get(second.evidenceRefs[0]).captureRefs,[second.captureRef]);
  assert.deepEqual(db.integrityCheck(),["ok"]);
 }finally{db.close();}
}));
test("invalid snapshot makes no SQLite writes",()=>fixture(async path=>{
 const db=await SQLiteEvidenceStore.open(path);
 try{
  assert.throws(()=>ingestFeedSnapshot(db,{feedUrl,xml:'<rss version="2.0"><channel><item><title>Missing ID</title></item></channel></rss>',capturedAt}),/stable identifier/);
  assert.equal(db.query().total,0);
 }finally{db.close();}
}));
