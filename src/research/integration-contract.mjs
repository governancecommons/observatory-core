/**
 * OC-INT-02: validated provider-neutral in-process research integration contract.
 * Host must supply an authenticated, governed facade.
 */
import {validateResearchResult} from "./response-shapes.mjs";
export const RESEARCH_CONTRACT_VERSION="oc.research.v1";
const operations=Object.freeze(["searchEvidence","getDocument","verifyCitation"]);
const docId=/^doc-[a-f0-9]{64}$/;
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const plain=obj=>obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&[Object.prototype,null].includes(Object.getPrototypeOf(obj));
const exact=(obj,keys)=>plain(obj)&&Object.keys(obj).every(key=>keys.includes(key));
function validate(operation,args){
 if(operation==="searchEvidence")return exact(args,["query","limit"])&&typeof args.query==="string"&&args.query.trim().length>0&&args.query.length<=256&&(!own(args,"limit")||(Number.isSafeInteger(args.limit)&&args.limit>=1&&args.limit<=20));
 if(operation==="getDocument")return exact(args,["documentId"])&&typeof args.documentId==="string"&&docId.test(args.documentId);
 if(operation==="verifyCitation")return exact(args,["documentId","start","end","quotedText"])&&typeof args.documentId==="string"&&docId.test(args.documentId)&&Number.isSafeInteger(args.start)&&args.start>=0&&Number.isSafeInteger(args.end)&&args.end>args.start&&args.end-args.start<=10000&&typeof args.quotedText==="string"&&args.quotedText.length===args.end-args.start;
 return false;
}
const MAX_RESPONSE_BYTES=256*1024;
function serializable(value){
 const seen=new Set();
 function inspect(item,depth){
  if(depth>32)throw new TypeError("response nesting limit exceeded");
  if(item===null||typeof item==="string"||typeof item==="boolean")return;
  if(typeof item==="number"&&Number.isFinite(item))return;
  if(typeof item!=="object"||seen.has(item))throw new TypeError("unsupported or cyclic response");
  if(!Array.isArray(item)&&![Object.prototype,null].includes(Object.getPrototypeOf(item)))throw new TypeError("unsupported response object");
  seen.add(item);
  if(Array.isArray(item)){
   if(item.length>1000)throw new TypeError("response array too large");
   for(let i=0;i<item.length;i++){if(!Object.prototype.hasOwnProperty.call(item,i))throw new TypeError("sparse response array");inspect(item[i],depth+1);}
  }else{
   const keys=Object.keys(item);
   if(keys.length>1000)throw new TypeError("response object too large");
   for(const key of keys){
    const descriptor=Object.getOwnPropertyDescriptor(item,key);
    if(!descriptor||!("value" in descriptor))throw new TypeError("response accessor unsupported");
    inspect(descriptor.value,depth+1);
   }
  }
  seen.delete(item);
 }
 inspect(value,0);
 const encoded=JSON.stringify(value);
 if(typeof encoded!=="string"||Buffer.byteLength(encoded,"utf8")>MAX_RESPONSE_BYTES)throw new TypeError("response byte limit exceeded");
 return JSON.parse(encoded);
}
function validatedResult(operation,result){
 const safe=serializable(result);
 if(!validateResearchResult(operation,safe))throw new TypeError("invalid research response shape");
 return safe;
}
export function createResearchIntegration(governedTools){
 if(!governedTools||operations.some(name=>typeof governedTools[name]!=="function"))throw new TypeError("governed research tool facade required");
 return Object.freeze({
  version:RESEARCH_CONTRACT_VERSION,
  capabilities:operations,
  invoke(request){
   if(!exact(request,["version","operation","arguments"])||request.version!==RESEARCH_CONTRACT_VERSION||!operations.includes(request.operation)||!validate(request.operation,request.arguments))throw new TypeError("invalid research tool request");
   try{
    const result=governedTools[request.operation](request.arguments);
    if(result&&typeof result.then==="function")throw new TypeError("asynchronous research facade unsupported");
    return Object.freeze({version:RESEARCH_CONTRACT_VERSION,operation:request.operation,ok:true,result:validatedResult(request.operation,result)});
   }catch(error){
    if(error instanceof TypeError&&error.message==="asynchronous research facade unsupported")throw error;
    return Object.freeze({version:RESEARCH_CONTRACT_VERSION,operation:request.operation,ok:false,error:Object.freeze({code:"RESEARCH_OPERATION_FAILED",message:"research operation unavailable"})});
   }
  }
 });
}
