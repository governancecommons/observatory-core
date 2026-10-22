import test from "node:test";
import assert from "node:assert/strict";
import {InMemoryEvidenceStore} from "../src/core/store.mjs";
import {ingestFeedSnapshot} from "../src/ingestion/feed-ingestor.mjs";
const feedUrl="https://example.org/feed.xml",capturedAt="2026-10-22T19:00:00Z";
const xml=title=>'<rss version="2.0"><channel><title>News</title><item><guid>entry-1</guid><title>'+title+'</title><link>https://example.org/a</link></item></channel></rss>';
test("feed snapshot creates typed provenance records and skips exact replay",()=>{
 const store=new InMemoryEvidenceStore(),input={feedUrl,xml:xml("First"),capturedAt};
 const first=ingestFeedSnapshot(store,input);
 assert.equal(first.sourceCreated,true);assert.equal(first.captureCreated,true);assert.equal(first.evidenceCreated,1);
 assert.equal(store.query().total,3);
 const capture=store.get(first.captureRef),evidence=store.get(first.evidenceRefs[0]);
 assert.equal(capture.sourceRef,first.sourceRef);assert.deepEqual(evidence.captureRefs,[first.captureRef]);
 assert.match(evidence.limitations,/unverified/);
 const replay=ingestFeedSnapshot(store,input);
 assert.equal(replay.evidenceCreated,0);assert.equal(replay.duplicates,1);
 assert.equal(replay.captureCreated,false);assert.equal(store.query().total,3);
});
test("changed feed snapshot adds new capture and changed evidence",()=>{
 const store=new InMemoryEvidenceStore();
 const first=ingestFeedSnapshot(store,{feedUrl,xml:xml("First"),capturedAt});
 const next=ingestFeedSnapshot(store,{feedUrl,xml:xml("Updated"),capturedAt});
 assert.equal(next.sourceRef,first.sourceRef);
 assert.notEqual(next.captureRef,first.captureRef);
 assert.notEqual(next.evidenceRefs[0],first.evidenceRefs[0]);
 assert.equal(store.query({recordType:"capture"}).total,2);
 assert.equal(store.query({recordType:"evidence"}).total,2);
});
test("malformed entries reject before any writes",()=>{
 const store=new InMemoryEvidenceStore();
 const invalid='<rss version="2.0"><channel><title>News</title><item><title>No identifier</title></item></channel></rss>';
 assert.throws(()=>ingestFeedSnapshot(store,{feedUrl,xml:invalid,capturedAt}),/stable identifier/);
 assert.equal(store.query().total,0);
});
