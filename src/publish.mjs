import { validatePublication, sha256 } from "./contract.mjs";
const stable = x => JSON.stringify(x, null, 2) + "\n";
export function preparePublication({records, publicationId, generatedAt, recordsUrl, approvedBy, approvalRecordId, sourceCommit, methodologyVersion}) {
 if(!Array.isArray(records))throw new Error("records must be an array");
 const ids = records.map(r=>r.id);
 if(ids.some(x=>typeof x!=="string") || new Set(ids).size!==ids.length)throw new Error("duplicate or invalid record id");
 const sorted = [...records].sort((a,b)=>a.id.localeCompare(b.id));
 const bytes = Buffer.from(stable(sorted),"utf8");
 const manifest = {schemaVersion:"1.0.0",publicationId,generatedAt,recordsUrl,recordsSha256:sha256(bytes),recordCount:sorted.length,approvedBy,approvalRecordId,sourceCommit,methodologyVersion};
 const errors=validatePublication(manifest,bytes);
 if(errors.length)throw new Error("Publication refused:\n"+errors.join("\n"));
 if(sorted.some(r=>r.approvalRecordId!==approvalRecordId))throw new Error("publication approval reference mismatch");
 return {manifest,manifestBytes:Buffer.from(stable(manifest)),recordsBytes:bytes};
}
