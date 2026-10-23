/** OC-INT-04: structural contracts for serialized research results. */
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const string=x=>typeof x==="string";
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const document=x=>object(x)&&x.kind==="researchDocument"&&x.schemaVersion==="0.1.0"&&/^doc-[a-f0-9]{64}$/.test(x.id)&&string(x.sourceRef)&&string(x.captureRef)&&/^sha256:[a-f0-9]{64}$/.test(x.contentDigest)&&string(x.mediaType)&&integer(x.length);
const passage=x=>object(x)&&x.kind==="researchPassage"&&x.schemaVersion==="0.1.0"&&/^passage-[a-f0-9]{64}$/.test(x.id)&&/^doc-[a-f0-9]{64}$/.test(x.documentId)&&integer(x.start)&&integer(x.end)&&x.end>x.start&&/^sha256:[a-f0-9]{64}$/.test(x.textDigest)&&x.offsetUnit==="utf16-code-unit";
const citation=x=>object(x)&&x.kind==="researchCitation"&&x.schemaVersion==="0.1.0"&&/^citation-[a-f0-9]{64}$/.test(x.id)&&/^passage-[a-f0-9]{64}$/.test(x.passageId)&&/^doc-[a-f0-9]{64}$/.test(x.documentId)&&integer(x.start)&&integer(x.end)&&x.end>x.start&&string(x.quotedText)&&x.quotedText.length===x.end-x.start;
const triple=x=>object(x)&&document(x.document)&&passage(x.passage)&&citation(x.citation)&&x.document.id===x.passage.documentId&&x.document.id===x.citation.documentId&&x.passage.id===x.citation.passageId&&x.passage.start===x.citation.start&&x.passage.end===x.citation.end;
export function validateResearchResult(operation,result){
 if(operation==="searchEvidence")return object(result)&&Array.isArray(result.results)&&result.results.length<=20&&result.results.every(triple)&&(!Object.hasOwn(result,"nextOffset")||result.nextOffset===null||integer(result.nextOffset));
 if(operation==="getDocument")return result===null||(object(result)&&document(result.document));
 if(operation==="verifyCitation")return triple(result);
 return false;
}
