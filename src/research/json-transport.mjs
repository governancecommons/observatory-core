/**
 * OC-INT-05: framework-neutral JSON request/response transport boundary.
 * The host owns authentication, authorization, rate limits, network security,
 * and creation of a per-request governed research integration.
 */
export function createResearchJsonTransport(createIntegration,{maxRequestBytes=16*1024}={}){
 if(typeof createIntegration!=="function")throw new TypeError("integration factory required");
 if(!Number.isSafeInteger(maxRequestBytes)||maxRequestBytes<1024||maxRequestBytes>65536)throw new RangeError("invalid request byte limit");
 return Object.freeze({
  handle(body,context){
   if(typeof body!=="string"||Buffer.byteLength(body,"utf8")>maxRequestBytes)return Object.freeze({status:413,body:JSON.stringify({ok:false,error:{code:"REQUEST_TOO_LARGE"}})});
   let request;
   try{request=JSON.parse(body);}catch{return Object.freeze({status:400,body:JSON.stringify({ok:false,error:{code:"INVALID_JSON"}})});}
   try{
    const integration=createIntegration(context);
    if(!integration||typeof integration.invoke!=="function")throw new Error("integration unavailable");
    const response=integration.invoke(request);
    if(response&&typeof response.then==="function")throw new Error("async integration unsupported");
    return Object.freeze({status:response.ok?200:403,body:JSON.stringify(response)});
   }catch(error){
    if(error instanceof TypeError&&error.message==="invalid research tool request")return Object.freeze({status:400,body:JSON.stringify({ok:false,error:{code:"INVALID_REQUEST"}})});
    return Object.freeze({status:503,body:JSON.stringify({ok:false,error:{code:"RESEARCH_UNAVAILABLE"}})});
   }
  }
 });
}
