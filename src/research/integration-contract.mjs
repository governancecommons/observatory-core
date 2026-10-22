/**
 * OC-INT-01: provider-neutral in-process research integration contract.
 * The host must supply a governed tool facade; no raw archive is accepted.
 */
export const RESEARCH_CONTRACT_VERSION="oc.research.v1";
const operations=Object.freeze(["searchEvidence","getDocument","verifyCitation"]);
export function createResearchIntegration(governedTools){
 if(!governedTools||operations.some(name=>typeof governedTools[name]!=="function"))throw new TypeError("governed research tool facade required");
 return Object.freeze({
  version:RESEARCH_CONTRACT_VERSION,
  capabilities:operations,
  invoke(request){
   if(!request||typeof request!=="object"||Array.isArray(request)||request.version!==RESEARCH_CONTRACT_VERSION||!operations.includes(request.operation)||!request.arguments||typeof request.arguments!=="object"||Array.isArray(request.arguments))throw new TypeError("invalid research tool request");
   const result=governedTools[request.operation](request.arguments);
   return Object.freeze({version:RESEARCH_CONTRACT_VERSION,operation:request.operation,result});
  }
 });
}
