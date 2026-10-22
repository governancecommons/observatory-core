import test from "node:test";
import assert from "node:assert/strict";
import {InMemoryEvidenceStore} from "../src/core/store.mjs";
const t="2026-10-22T19:00:00Z";
const source=(id="s")=>({schemaVersion:"0.1.0",recordType:"source",id,version:1,createdAt:t,producer:"test",locator:"https://example.org",sourceType:"web",displayName:"Synthetic"});
test("rejects ambiguous record identities without side effects",()=>{
 const store=new InMemoryEvidenceStore();
 for(const id of ["s@2","source:s"])assert.throws(()=>store.append(source(id)),/common record fields/);
 assert.equal(store.query().total,0);
});
test("rejects malformed namespaced extensions",()=>{
 const store=new InMemoryEvidenceStore();
 assert.throws(()=>store.append({...source(),extensions:{"unscoped":true}}),/extensions/);
 assert.equal(store.query().total,0);
});
test("rejects non-JSON payloads without committing records",()=>{
 const store=new InMemoryEvidenceStore();
 const bad={...source(),extensions:{"test:value":undefined}};
 assert.throws(()=>store.append(bad),/JSON-compatible/);
 const cyclic=source();cyclic.loop=cyclic;
 assert.throws(()=>store.append(cyclic),/JSON-compatible/);
 assert.equal(store.query().total,0);
});
test("rejects malformed change entries",()=>{
 const store=new InMemoryEvidenceStore();
 const bad={schemaVersion:"0.1.0",recordType:"changeEvent",id:"bad",version:1,createdAt:t,producer:"test",beforeRef:"source:s@1",afterRef:"source:s@2",comparisonVersion:"1",changes:[{path:"/x",changeType:"unknown"}]};
 assert.throws(()=>store.append(bad),/changes must be nonempty/);
});
test("rejects unsafe reference versions",()=>{
 const store=new InMemoryEvidenceStore();store.append(source());
 const capture={schemaVersion:"0.1.0",recordType:"capture",id:"c",version:1,createdAt:t,producer:"test",sourceRef:"source:s@999999999999999999999",capturedAt:t,contentDigest:"sha256:"+"a".repeat(64),mediaType:"text/plain",retrievalMethod:"http"};
 assert.throws(()=>store.append(capture),/invalid typed reference/);
 assert.equal(store.query().total,1);
});
