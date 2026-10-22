import test from "node:test";
import assert from "node:assert/strict";
import {InMemoryEvidenceStore} from "../src/core/store.mjs";
const base={schemaVersion:"0.1.0",recordType:"source",id:"schema-test",version:1,createdAt:"2026-10-22T19:00:00Z",producer:"oc06c",locator:"https://example.org",sourceType:"web",displayName:"Example"};
test("versioned schema accepts valid source",()=>assert.equal(new InMemoryEvidenceStore().append(base),"source:schema-test@1"));
test("schema rejects oversized source identifier",()=>assert.throws(()=>new InMemoryEvidenceStore().append({...base,id:"x".repeat(257)}),/too long/));
test("schema rejects oversized source locator",()=>assert.throws(()=>new InMemoryEvidenceStore().append({...base,locator:"x".repeat(2049)}),/too long/));
test("schema rejects excessive extensions",()=>assert.throws(()=>new InMemoryEvidenceStore().append({...base,extensions:Object.fromEntries(Array.from({length:33},(_,i)=>["org:key"+i,i]))}),/too many properties/));
test("schema rejects wrong property type",()=>assert.throws(()=>new InMemoryEvidenceStore().append({...base,displayName:42}),/invalid type/));
