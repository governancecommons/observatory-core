/**
 * OC-09A research reference contracts. References are content-addressed;
 * they do not assert that extracted text is true or that an agent is trusted.
 */
import {createHash} from "node:crypto";
const digest=value=>createHash("sha256").update(value,"utf8").digest("hex");
const required=(value,name)=>{if(typeof value!=="string"||!value.trim())throw new TypeError(name+" required");return value;};
const hex=/^[a-f0-9]{64}$/;
export function makeResearchDocument({sourceRef,captureRef,content,mediaType="text/plain"}){
 required(sourceRef,"sourceRef");required(captureRef,"captureRef");
 if(typeof content!=="string")throw new TypeError("content required");
 required(mediaType,"mediaType");
 const contentDigest="sha256:"+digest(content);
 return Object.freeze({kind:"researchDocument",schemaVersion:"0.1.0",id:"doc-"+digest(captureRef+"\n"+contentDigest),sourceRef,captureRef,contentDigest,mediaType,length:content.length});
}
export function makeResearchPassage({document,content,start,end}){
 if(!document||document.kind!=="researchDocument")throw new TypeError("research document required");
 if(typeof content!=="string"||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>content.length)throw new RangeError("invalid passage range");
 if("sha256:"+digest(content)!==document.contentDigest)throw new Error("document digest mismatch");
 const text=content.slice(start,end);
 return Object.freeze({kind:"researchPassage",schemaVersion:"0.1.0",id:"passage-"+digest(document.id+"\n"+start+"\n"+end+"\n"+digest(text)),documentId:document.id,start,end,textDigest:"sha256:"+digest(text),offsetUnit:"utf16-code-unit"});
}
export function makeResearchCitation({passage,quotedText,content}){
 if(!passage||passage.kind!=="researchPassage")throw new TypeError("research passage required");
 if(typeof content!=="string"||content.slice(passage.start,passage.end)!==quotedText||"sha256:"+digest(quotedText)!==passage.textDigest)throw new Error("citation does not match passage");
 return Object.freeze({kind:"researchCitation",schemaVersion:"0.1.0",id:"citation-"+digest(passage.id),passageId:passage.id,documentId:passage.documentId,start:passage.start,end:passage.end,quotedText});
}
