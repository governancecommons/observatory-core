import { createHash } from "node:crypto";
import { validateClassification } from "./classification.mjs";
const validDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s) && !Number.isNaN(Date.parse(s));
const str = s => typeof s === "string" && s.trim().length > 0;
const url = s => { try {const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;} };
export const evidenceClasses = Object.freeze(["documentation","third-party-evaluation","gc-evaluation","governance-observation","conformance-result"]);
export function sha256(bytes){return createHash("sha256").update(bytes).digest("hex");}
export function validateManifest(m, bundleBytes){
 const errors=[];
 if(!m||typeof m!=="object"||Array.isArray(m))return ["manifest must be object"];
 if(m.schemaVersion!=="1.0.0")errors.push("unsupported schemaVersion");
 for(const k of ["publicationId","approvedBy","approvalRecordId","methodologyVersion"])if(!str(m[k]))errors.push("missing "+k);
 if(!/^[0-9a-f]{40}$/.test(m.sourceCommit||""))errors.push("invalid sourceCommit");
 if(!validDate(m.generatedAt))errors.push("invalid generatedAt");
 if(!url(m.recordsUrl))errors.push("invalid recordsUrl");
 if(!/^[a-f0-9]{64}$/.test(m.recordsSha256||""))errors.push("invalid recordsSha256");
 if(!Number.isInteger(m.recordCount)||m.recordCount<0)errors.push("invalid recordCount");
 if(bundleBytes!==undefined&&sha256(bundleBytes)!==m.recordsSha256)errors.push("checksum mismatch");
 return errors;
}
export function validateRecord(r){
 const errors=[];
 if(!r||typeof r!=="object"||Array.isArray(r))return ["record must be object"];
 for(const k of ["id","subjectId","subjectVersion","claim","evaluator","method","methodVersion","limitations","approvalRecordId"])if(!str(r[k]))errors.push("missing "+k);
 if(!evidenceClasses.includes(r.evidenceClass))errors.push("invalid evidenceClass");
 if(!url(r.sourceUrl))errors.push("invalid sourceUrl");
 if(!validDate(r.capturedAt))errors.push("invalid capturedAt");
 if(r.publicationStatus!=="approved")errors.push("record is not approved");
 for(const error of validateClassification(r.classification))errors.push("ICQ: "+error);
 if(r.classification?.assetId!==r.id)errors.push("ICQ: assetId does not match record id");
 if(r.classification?.publication?.approvalRecordId!==r.approvalRecordId)errors.push("ICQ: approval reference mismatch");
 if(["third-party-evaluation","gc-evaluation","conformance-result"].includes(r.evidenceClass)){
 const x=r.measurement;
 if(!x||!str(x.task)||!Number.isInteger(x.sampleSize)||x.sampleSize<1||!str(x.conditions)||!str(x.metric)||!str(x.unit)||!url(x.artifactUrl))errors.push("incomplete measurement");
 }
 if(r.evidenceClass==="conformance-result"&&(!str(r.specificationId)||!str(r.specificationVersion)))errors.push("missing specification identity");
 return errors;
}
export function validatePublication(m, bytes){
 const errors=validateManifest(m,bytes);
 let records;
 try{records=JSON.parse(Buffer.from(bytes).toString("utf8"));}catch{return [...errors,"invalid JSON bundle"];}
 if(!Array.isArray(records))return [...errors,"bundle must be an array"];
 if(m.recordCount!==records.length)errors.push("recordCount mismatch");
 const ids=new Set();
 for(const [i,r] of records.entries()){
  for(const e of validateRecord(r))errors.push(`record[${i}]: ${e}`);
  if(ids.has(r?.id))errors.push(`record[${i}]: duplicate id`);
  ids.add(r?.id);
 }
 return errors;
}
