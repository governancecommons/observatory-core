/**
 * OC-AI-05: deterministic audit-chain hashing and verification.
 * Does not provide independent anchoring or protect against full database rewrites.
 */
import {createHash} from "node:crypto";
const GENESIS="0".repeat(64);
function digest(previousHash,entry){
 return createHash("sha256").update(JSON.stringify([previousHash,entry.sequence,entry.occurredAt,entry.subject,entry.documentId,entry.action,entry.allowed])).digest("hex");
}
export function createChainedAudit(audit){
 if(!audit||typeof audit.record!=="function"||typeof audit.list!=="function")throw new TypeError("audit store required");
 function all(){
  const rows=[];let afterSequence=0;
  for(;;){
   const page=audit.list({limit:100,afterSequence});
   if(page.length===0)return rows;
   if(page[0].sequence<=afterSequence)throw new Error("audit pagination did not advance");
   rows.push(...page);
   afterSequence=page.at(-1).sequence;
  }
 }
 function verify(){
  const rows=all();let previousHash=GENESIS;let expectedSequence=1;
  for(const row of rows){
   if(row.sequence!==expectedSequence)return Object.freeze({valid:false,sequence:row.sequence,reason:"sequence gap"});
   if(row.previousHash!==previousHash)return Object.freeze({valid:false,sequence:row.sequence,reason:"previous hash mismatch"});
   const computed=digest(previousHash,row);
   if(row.entryHash!==computed)return Object.freeze({valid:false,sequence:row.sequence,reason:"entry hash mismatch"});
   previousHash=computed;expectedSequence++;
  }
  return Object.freeze({valid:true,count:rows.length,headHash:previousHash});
 }
 return Object.freeze({verify});
}
export {GENESIS,digest};
