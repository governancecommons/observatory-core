import {SQLiteEvidenceStore} from "../../src/core/sqlite-store.mjs";
const [path,prefix,countText]=process.argv.slice(2);
const count=Number(countText);
const db=await SQLiteEvidenceStore.open(path,{busyTimeout:20000});
try {
 for(let i=0;i<count;i++){
  db.append({schemaVersion:"0.1.0",recordType:"source",id:prefix+"-"+i,version:1,createdAt:"2026-10-22T19:00:00Z",producer:"oc06-worker",locator:"https://example.org/"+prefix+"/"+i,sourceType:"web",displayName:prefix+" "+i});
 }
} finally {db.close();}
