/**
 * OC-AI-04: append-only research access decision audit.
 * Caller supplies the clock and subject correlation identifier.
 * Audit sink is synchronous so governed tools can fail closed.
 */
import {DatabaseSync} from "node:sqlite";
import {mkdir} from "node:fs/promises";
import {dirname,resolve} from "node:path";
export class SQLiteResearchAccessAudit {
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
   db.exec("CREATE TABLE IF NOT EXISTS research_access_audit (sequence INTEGER PRIMARY KEY AUTOINCREMENT, occurred_at TEXT NOT NULL, subject TEXT NOT NULL, document_id TEXT NOT NULL, action TEXT NOT NULL, allowed INTEGER NOT NULL CHECK(allowed IN (0,1)))");
   return new SQLiteResearchAccessAudit(db);
  }catch(error){db.close();throw error;}
 }
 record({occurredAt,subject,documentId,action,allowed}){
  if(typeof occurredAt!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(occurredAt)||!Number.isFinite(Date.parse(occurredAt)))throw new TypeError("valid timestamp required");
  if(typeof subject!=="string"||!subject.trim()||subject.length>256)throw new TypeError("bounded subject required");
  if(typeof documentId!=="string"||!/^doc-[a-f0-9]{64}$/.test(documentId))throw new TypeError("invalid documentId");
  if(!["search","read","verify"].includes(action)||typeof allowed!=="boolean")throw new TypeError("invalid audit decision");
  const result=this.#db.prepare("INSERT INTO research_access_audit(occurred_at,subject,document_id,action,allowed) VALUES(?,?,?,?,?)").run(occurredAt,subject,documentId,action,allowed?1:0);
  return result.lastInsertRowid;
 }
 list({limit=50,afterSequence=0}={}){
  if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(afterSequence)||afterSequence<0)throw new RangeError("invalid audit pagination");
  const rows=this.#db.prepare("SELECT sequence,occurred_at,subject,document_id,action,allowed FROM research_access_audit WHERE sequence>? ORDER BY sequence LIMIT ?").all(afterSequence,limit);
  return Object.freeze(rows.map(r=>Object.freeze({sequence:Number(r.sequence),occurredAt:r.occurred_at,subject:r.subject,documentId:r.document_id,action:r.action,allowed:r.allowed===1})));
 }
 close(){this.#db.close();}
}
export function createResearchAuditCallback(audit,{subject,clock=()=>new Date().toISOString()}={}){
 if(!audit||typeof audit.record!=="function"||typeof subject!=="string"||!subject.trim()||typeof clock!=="function")throw new TypeError("audit, subject and clock required");
 return decision=>audit.record({...decision,subject,occurredAt:clock()});
}
