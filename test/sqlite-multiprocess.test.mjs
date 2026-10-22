import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {SQLiteEvidenceStore} from "../src/core/sqlite-store.mjs";

const worker=fileURLToPath(new URL("./fixtures/sqlite-writer.mjs",import.meta.url));
const run=(path,prefix,count)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[worker,path,prefix,String(count)],{stdio:["ignore","pipe","pipe"]});
 let stderr="";
 child.stderr.on("data",d=>stderr+=d);
 child.on("error",reject);
 child.on("close",code=>code===0?resolve():reject(new Error("worker exit "+code+": "+stderr)));
});
test("separate processes commit distinct records without lost updates", {timeout:60000}, async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc06-"));
 const path=join(dir,"records.sqlite");
 try {
  // Initialize schema before starting competing workers.
  (await SQLiteEvidenceStore.open(path)).close();
  await Promise.all([run(path,"alpha",12),run(path,"beta",12),run(path,"gamma",12)]);
  const db=await SQLiteEvidenceStore.open(path);
  try {
   assert.equal(db.query({limit:100}).total,36);
   assert.deepEqual(db.integrityCheck(),["ok"]);
   for(const prefix of ["alpha","beta","gamma"])
    for(let i=0;i<12;i++) assert.ok(db.get("source:"+prefix+"-"+i+"@1"));
  } finally {db.close();}
 } finally {await rm(dir,{recursive:true,force:true});}
});
