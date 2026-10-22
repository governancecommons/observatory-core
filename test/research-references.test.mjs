import test from "node:test";
import assert from "node:assert/strict";
import {makeResearchDocument,makeResearchPassage,makeResearchCitation} from "../src/research/references.mjs";
test("document, passage and citation are deterministic and traceable",()=>{
 const content="Alpha evidence. Beta claim.";
 const args={sourceRef:"source:s@1",captureRef:"capture:c@1",content};
 const doc=makeResearchDocument(args);
 const passage=makeResearchPassage({document:doc,content,start:0,end:14});
 const citation=makeResearchCitation({passage,content,quotedText:"Alpha evidence."});
 assert.equal(citation.documentId,doc.id);
 assert.equal(citation.passageId,passage.id);
 assert.equal(citation.quotedText,"Alpha evidence.");
 assert.deepEqual(makeResearchDocument(args),doc);
 assert.deepEqual(makeResearchPassage({document:doc,content,start:0,end:14}),passage);
});
test("rejects stale document and forged citation text",()=>{
 const content="A verified source excerpt";
 const doc=makeResearchDocument({sourceRef:"source:s@1",captureRef:"capture:c@1",content});
 assert.throws(()=>makeResearchPassage({document:doc,content:"different",start:0,end:4}),/digest mismatch/);
 const passage=makeResearchPassage({document:doc,content,start:0,end:8});
 assert.throws(()=>makeResearchCitation({passage,content,quotedText:"invented"}),/does not match/);
 assert.throws(()=>makeResearchPassage({document:doc,content,start:0,end:content.length+1}),/invalid passage range/);
});
