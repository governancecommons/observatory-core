import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {SQLiteEvidenceStore} from "../src/core/sqlite-store.mjs";

const worker=fileURLToPath(new URL("./fixtures/sqlite-crash-worker.mjs",import.meta.url));
const crash=(path,mode)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[worker,path,mode],{stdio:["ignore","ignore","pipe"]});
 let stderr="";
 child.stderr.on("data",d=>stderr+=d);
 child.on("error",reject);
 child.on("close",(code,signal)=>signal==="SIGKILL"?resolve():reject(new Error("expected SIGKILL, got "+code+"/"+signal+": "+stderr)));
});
test("SQLite recovers committed evidence and discards killed uncommitted transaction", {timeout:30000,skip:process.platform==="win32"?"SIGKILL unavailable on Windows":false},async()=>{
 const dir=await mkdtemp(join(tmpdir(),"oc06b-"));
 const path=join(dir,"evidence.sqlite");
 try {
  (await SQLiteEvidenceStore.open(path)).close();
  await crash(path,"rollback");
  let db=await SQLiteEvidenceStore.open(path);
  try {
   assert.equal(db.get("source:crash-rollback@1"),null);
   assert.deepEqual(db.integrityCheck(),["ok"]);
  } finally {db.close();}
  await crash(path,"commit");
  db=await SQLiteEvidenceStore.open(path);
  try {
   assert.equal(db.get("source:crash-rollback@1"),null);
   assert.equal(db.get("source:crash-commit@1")?.id,"crash-commit");
   assert.deepEqual(db.integrityCheck(),["ok"]);
   assert.equal(db.query({limit:10}).total,1);
  } finally {db.close();}
 } finally {await rm(dir,{recursive:true,force:true});}
});
