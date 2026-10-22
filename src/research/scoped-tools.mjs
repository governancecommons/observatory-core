/**
 * OC-AI-02: fail-closed, explicitly scoped research tools.
 * An authoritative host must derive allowedDocumentIds from its own policy engine.
 * This facade never exposes an unscoped search operation.
 */
const idPattern=/^doc-[a-f0-9]{64}$/;
const checkId=id=>{if(typeof id!=="string"||!idPattern.test(id))throw new TypeError("invalid documentId");};
export function createScopedResearchTools(archive,{allowedDocumentIds}={}){
 if(!archive||typeof archive.get!=="function"||typeof archive.resolveCitation!=="function")throw new TypeError("research archive required");
 if(!Array.isArray(allowedDocumentIds)||allowedDocumentIds.length>100||allowedDocumentIds.some(id=>!idPattern.test(id))||new Set(allowedDocumentIds).size!==allowedDocumentIds.length)throw new TypeError("explicit bounded document scope required");
 const allowed=new Set(allowedDocumentIds);
 const authorized=id=>{checkId(id);if(!allowed.has(id))throw new Error("research document unavailable");};
 return Object.freeze({
  searchEvidence({query,limit=10}={}){
   if(typeof query!=="string"||!query.trim()||query.length>256||!Number.isSafeInteger(limit)||limit<1||limit>20)throw new TypeError("invalid search arguments");
   const results=[];
   // Search only explicitly authorized IDs, never a global search then filter.
   for(const id of allowed){
    const stored=archive.get(id);
    if(!stored)continue;
    const start=stored.content.indexOf(query);
    if(start<0)continue;
    const item=archive.resolveCitation({documentId:id,start,end:start+query.length,quotedText:query});
    results.push(Object.freeze({document:item.document,passage:item.passage,citation:item.citation}));
    if(results.length===limit)break;
   }
   return Object.freeze({results});
  },
  getDocument({documentId}={}){
   authorized(documentId);
   const stored=archive.get(documentId);
   return stored?Object.freeze({document:stored.document}):null;
  },
  verifyCitation({documentId,start,end,quotedText}={}){
   authorized(documentId);
   if(typeof quotedText!=="string"||quotedText.length>10000)throw new TypeError("invalid citation arguments");
   return archive.resolveCitation({documentId,start,end,quotedText});
  }
 });
}
