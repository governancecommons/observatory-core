/**
 * OC-AI-07: export and verify independently retained audit head checkpoints.
 * The caller must store checkpoints outside the audit database trust boundary.
 */
import {createHash} from "node:crypto";
import {createChainedAudit} from "./audit-chain.mjs";
const hex=/^[a-f0-9]{64}$/;
const digest=value=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function exportAuditCheckpoint(audit,{issuedAt}={}){
 if(typeof issuedAt!=="string"||!Number.isFinite(Date.parse(issuedAt)))throw new TypeError("valid issuedAt required");
 const status=createChainedAudit(audit).verify();
 if(!status.valid)throw new Error("audit chain integrity failure");
 const payload=Object.freeze({format:"oc-audit-checkpoint-v1",issuedAt,count:status.count,headHash:status.headHash});
 return Object.freeze({...payload,checkpointHash:digest([payload.format,payload.issuedAt,payload.count,payload.headHash])});
}
export function verifyAuditCheckpoint(audit,checkpoint){
 if(!checkpoint||checkpoint.format!=="oc-audit-checkpoint-v1"||typeof checkpoint.issuedAt!=="string"||!Number.isFinite(Date.parse(checkpoint.issuedAt))||!Number.isSafeInteger(checkpoint.count)||checkpoint.count<0||typeof checkpoint.headHash!=="string"||!hex.test(checkpoint.headHash)||typeof checkpoint.checkpointHash!=="string"||!hex.test(checkpoint.checkpointHash))throw new TypeError("invalid checkpoint");
 const computed=digest([checkpoint.format,checkpoint.issuedAt,checkpoint.count,checkpoint.headHash]);
 if(computed!==checkpoint.checkpointHash)return Object.freeze({valid:false,reason:"checkpoint payload modified"});
 const status=createChainedAudit(audit).verify();
 if(!status.valid)return Object.freeze({valid:false,reason:"audit chain integrity failure"});
 if(status.count<checkpoint.count)return Object.freeze({valid:false,reason:"audit history truncated"});
 const rows=audit.list({limit:1,afterSequence:Math.max(0,checkpoint.count-1)});
 const anchoredHash=checkpoint.count===0?"0".repeat(64):rows[0]?.entryHash;
 if(anchoredHash!==checkpoint.headHash)return Object.freeze({valid:false,reason:"checkpoint history mismatch"});
 return Object.freeze({valid:true,count:status.count,checkpointCount:checkpoint.count});
}
