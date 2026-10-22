/**
 * OC-09B experimental immutable SQLite research document archive.
 * Independent of evidence record schemas; capture/source refs must be checked by caller.
 */
import {DatabaseSync} from "node:sqlite";
import {mkdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {makeResearchDocument,makeResearchPassage,makeResearchCitation} from "./references.mjs";
export class SQLiteResearchArchive {
 #db;
 constructor(db){this.#db=db;}
 static async open(filePath){
  if(typeof filePath!=="string"||!filePath.trim())throw new TypeError("file path required");
  const path=resolve(filePath);
  await mkdir(dirname(path),{recursive:true});
  const db=new DatabaseSync(path);
  try{
   db.exec("PRAGMA busy_timeout=5000");
   db.exec("PRAGMA journal_mode=WAL");
   db.exec("PRAGMA synchronous=FULL");
   db.exec("CREATE TABLE IF NOT EXISTS research_documents (id TEXT PRIMARY KEY, descriptor TEXT NOT NULL, content TEXT NOT NULL)");
   return new SQLiteResearchArchive(db);
  }catch(error){db.close();throw error;}
 }
 put({sourceRef,captureRef,content,mediaType}){
  const descriptor=makeResearchDocument({sourceRef,captureRef,content,mediaType});
  const existing=this.#db.prepare("SELECT descriptor,content FROM research_documents WHERE id=?").get(descriptor.id);
  if(existing){
   if(existing.content!==content||existing.descriptor!==JSON.stringify(descriptor))throw new Error("document identity collision");
   return descriptor;
  }
  this.#db.prepare("INSERT INTO research_documents(id,descriptor,content) VALUES(?,?,?)").run(descriptor.id,JSON.stringify(descriptor),content);
  return descriptor;
 }
 get(documentId){
  const row=this.#db.prepare("SELECT descriptor,content FROM research_documents WHERE id=?").get(documentId);
  if(!row)return null;
  const descriptor=JSON.parse(row.descriptor);
  const checked=makeResearchDocument({...descriptor,content:row.content});
  if(JSON.stringify(checked)!==JSON.stringify(descriptor))throw new Error("stored research document integrity failure");
  return Object.freeze({document:checked,content:row.content});
 }
 resolveCitation({documentId,start,end,quotedText}){
  const stored=this.get(documentId);
  if(!stored)throw new Error("research document not found");
  const passage=makeResearchPassage({document:stored.document,content:stored.content,start,end});
  const citation=makeResearchCitation({passage,content:stored.content,quotedText});
  return Object.freeze({document:stored.document,passage,citation});
 }
 close(){this.#db.close();}
}
