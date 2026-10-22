/**
 * OC-AI-01: provider-neutral read-only research tool facade.
 * Embedders must enforce authorization before invoking this facade.
 */
const validLimit=(limit)=>Number.isSafeInteger(limit)&&limit>=1&&limit<=20;
export function createReadOnlyResearchTools(archive){
 if(!archive||typeof archive.searchCitations!=="function"||typeof archive.get!=="function"||typeof archive.resolveCitation!=="function")throw new TypeError("research archive required");
 return Object.freeze({
  searchEvidence({query,limit=10}={}){
   if(typeof query!=="string"||!query.trim()||query.length>256||!validLimit(limit))throw new TypeError("invalid search arguments");
   const result=archive.searchCitations(query,{limit,offset:0});
   return Object.freeze({results:result.items.map(({document,passage,citation})=>({document,passage,citation})),nextOffset:result.nextOffset});
  },
  getDocument({documentId}={}){
   if(typeof documentId!=="string"||!/^doc-[a-f0-9]{64}$/.test(documentId))throw new TypeError("invalid documentId");
   const stored=archive.get(documentId);
   return stored?Object.freeze({document:stored.document}):null;
  },
  verifyCitation({documentId,start,end,quotedText}={}){
   if(typeof documentId!=="string"||!/^doc-[a-f0-9]{64}$/.test(documentId)||typeof quotedText!=="string"||quotedText.length>10000)throw new TypeError("invalid citation arguments");
   const {document,passage,citation}=archive.resolveCitation({documentId,start,end,quotedText});
   return Object.freeze({document,passage,citation});
  }
 });
}
