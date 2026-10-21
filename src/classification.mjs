// GC–ICQ.01 v1.0.0 — mirrored publication decision.
// Canonical specification: governance-commons-registry/specs/gc-icq/1.0.0
const quadrants = { "high:restricted":"Q1", "low:restricted":"Q2", "low:open":"Q3", "high:open":"Q4" };
const labels = new Set(["PERSONAL_DATA","CREDENTIAL","EMBARGOED","PROPRIETARY","SECURITY_FINDING","OTHER_SENSITIVE"]);
export function validateClassification(c) {
 const errors=[];
 if(!c || typeof c!=="object" || Array.isArray(c))return ["missing classification"];
 if(c.specVersion!=="1.0.0")errors.push("unsupported ICQ version");
 if(typeof c.assetId!=="string"||!c.assetId.trim())errors.push("missing assetId");
 if(quadrants[`${c.impact}:${c.access}`]!==c.quadrant)errors.push("quadrant mismatch");
 if(!Array.isArray(c.dataLabels)||new Set(c.dataLabels).size!==c.dataLabels.length||c.dataLabels.some(x=>!labels.has(x)))errors.push("invalid dataLabels");
 const p=c.publication;
 if(!p||p.status!=="approved"||typeof p.approvedBy!=="string"||!p.approvedBy.trim()||typeof p.approvalRecordId!=="string"||!p.approvalRecordId.trim())errors.push("classification publication approval missing");
 if(c.impact!=="low"||c.access!=="open")errors.push("classification not publicly releasable");
 if(Array.isArray(c.dataLabels)&&c.dataLabels.length)errors.push("sensitive labels prohibit public export");
 return errors;
}
