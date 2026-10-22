import test from "node:test";
import assert from "node:assert/strict";
import {InMemoryEvidenceStore,recordRef} from "../src/core/store.mjs";
const time="2026-10-22T19:00:00Z";
const base=(recordType,id,version=1)=>({schemaVersion:"0.1.0",recordType,id,version,createdAt:time,producer:"oc-03-fixture"});
const source=(id="source-1",version=1)=>({...base("source",id,version),locator:"https://example.org",sourceType:"web",displayName:"Synthetic"});
const capture=()=>({...base("capture","capture-1"),sourceRef:"source:source-1@1",capturedAt:time,contentDigest:"sha256:"+"a".repeat(64),mediaType:"text/plain",retrievalMethod:"http"});
const evidence=()=>({...base("evidence","evidence-1"),captureRefs:["capture:capture-1@1"],assertion:"Synthetic",method:"extract",limitations:"Test only"});
const observation=(version=1)=>({...base("observation","observation-1",version),subjectRef:"external-subject",evidenceRefs:["evidence:evidence-1@1"],observedAt:time,value:{count:version},methodVersion:"1"});
function seeded() {
 const store=new InMemoryEvidenceStore();
 for(const r of [source(),capture(),evidence(),observation()])store.append(r);
 return store;
}
test("source -> capture -> evidence -> observation round trip",()=>{
 const store=seeded();
 assert.equal(store.get("observation:observation-1@1").value.count,1);
 assert.equal(store.query({recordType:"evidence"}).total,1);
 assert.equal(store.query().total,4);
});
test("recordRef returns typed versioned reference",()=>assert.equal(recordRef(source()),"source:source-1@1"));
test("rejects missing provenance without writing",()=>{
 const store=new InMemoryEvidenceStore();
 assert.throws(()=>store.append(capture()),/missing provenance/);
 assert.equal(store.query().total,0);
});
test("rejects wrong provenance type",()=>{
 const store=seeded();
 assert.throws(()=>store.append({...base("evidence","bad"),captureRefs:["source:source-1@1"],assertion:"x",method:"x",limitations:"x"}),/wrong reference type/);
});
test("append-only versions and history",()=>{
 const store=seeded();
 store.append(observation(2));
 assert.equal(store.getLatest("observation","observation-1").value.count,2);
 assert.deepEqual(store.history("observation","observation-1").map(x=>x.version),[1,2]);
 assert.throws(()=>store.append(observation(2)),/already exists/);
 assert.throws(()=>store.append(observation(4)),/version must follow/);
});
test("immutable snapshot cannot be mutated through caller or reader",()=>{
 const store=new InMemoryEvidenceStore();
 const input=source();
 store.append(input);
 input.displayName="tampered";
 assert.equal(store.get("source:source-1@1").displayName,"Synthetic");
 assert.throws(()=>{store.get("source:source-1@1").displayName="mutated";},TypeError);
});
test("verification and provenance links require existing targets",()=>{
 const store=seeded();
 const verified={...base("verificationResult","verify-1"),targetRef:"capture:capture-1@1",procedureId:"digest",procedureVersion:"1",checkedAt:time,outcome:"passed",limitations:"Digest only"};
 assert.equal(store.append(verified),"verificationResult:verify-1@1");
 assert.throws(()=>store.append({...verified,id:"verify-2",outcome:"certified"}),/outcome/);
 assert.equal(store.append({...base("provenanceEdge","edge-1"),fromRef:"capture:capture-1@1",toRef:"evidence:evidence-1@1",relation:"supports",assertedAt:time}),"provenanceEdge:edge-1@1");
});
test("change event requires same identity and ascending versions",()=>{
 const store=seeded();store.append(observation(2));
 const change={...base("changeEvent","change-1"),beforeRef:"observation:observation-1@1",afterRef:"observation:observation-1@2",comparisonVersion:"1",changes:[{path:"/value",changeType:"modified"}]};
 store.append(change);
 assert.throws(()=>store.append({...change,id:"bad",afterRef:"source:source-1@1"}),/same identity/);
});
test("publication candidate is not authorization",()=>{
 const store=seeded();
 const candidate={...base("publicationCandidate","candidate-1"),recordRefs:["evidence:evidence-1@1"],manifestDigest:"sha256:"+"b".repeat(64),payloadDigest:"sha256:"+"c".repeat(64),preparedAt:time,policyRef:"external-policy"};
 store.append(candidate);
 assert.equal(store.getLatest("publicationCandidate","candidate-1").recordType,"publicationCandidate");
 assert.equal("approved" in store.getLatest("publicationCandidate","candidate-1"),false);
});
test("query pagination is bounded and deterministic without concurrent writes",()=>{
 const store=seeded();
 assert.equal(store.query({limit:2}).nextOffset,2);
 assert.equal(store.query({limit:2,offset:2}).items.length,2);
 assert.throws(()=>store.query({limit:101}),RangeError);
});
