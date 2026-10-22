import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {FileEvidenceStore} from "../src/core/file-store.mjs";
const time="2026-10-22T19:00:00Z";
const source=(id="s",version=1)=>({schemaVersion:"0.1.0",recordType:"source",id,version,createdAt:time,producer:"fixture",locator:"https://example.org",sourceType:"web",displayName:"Test"});
async function fixture(fn) {
 const dir=await mkdtemp(join(tmpdir(),"oc04-"));
 try {await fn(join(dir,"records.json"));} finally {await rm(dir,{recursive:true,force:true});}
}
test("record survives restart with history",()=>fixture(async path=>{
 let store=await FileEvidenceStore.open(path);
 await store.append(source());await store.append(source("s",2));
 store=await FileEvidenceStore.open(path);
 assert.deepEqual(store.history("source","s").map(x=>x.version),[1,2]);
 assert.equal(store.getLatest("source","s").displayName,"Test");
}));
test("tampered snapshot fails closed",()=>fixture(async path=>{
 const store=await FileEvidenceStore.open(path);
 await store.append(source());
 const raw=await readFile(path,"utf8");
 await writeFile(path,raw.replace("envelope-v1","envelope-v2"));
 await assert.rejects(FileEvidenceStore.open(path),/integrity check failed/);
}));
test("rejected append preserves previous snapshot",()=>fixture(async path=>{
 const store=await FileEvidenceStore.open(path);
 await store.append(source());
 const before=await readFile(path,"utf8");
 await assert.rejects(store.append(source()),/immutable version/);
 assert.equal(await readFile(path,"utf8"),before);
 assert.equal(store.query().total,1);
}));
test("missing snapshot initializes empty store",()=>fixture(async path=>{
 const store=await FileEvidenceStore.open(path);
 assert.equal(store.query().total,0);
 await store.append(source());
 assert.equal((await FileEvidenceStore.open(path)).query().total,1);
}));
test("invalid persisted JSON fails closed",()=>fixture(async path=>{
 await writeFile(path,"{not json");
 await assert.rejects(FileEvidenceStore.open(path),SyntaxError);
}));
