/** Schema-driven enforcement for the keywords currently used in records.schema.json.
 * Not a general-purpose JSON Schema 2020-12 evaluator. Unsupported keywords fail closed.
 */
import {readFileSync} from "node:fs";
const schema=JSON.parse(readFileSync(new URL("../../schemas/core/0.1.0/records.schema.json",import.meta.url),"utf8"));
const supported=new Set(["$schema","$id","title","description","$defs","$ref","oneOf","allOf","type","required","properties","additionalProperties","propertyNames","items","minItems","maxItems","uniqueItems","minLength","maxLength","minimum","maximum","maxProperties","pattern","const","enum","format"]);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const typeOK=(v,t)=> t==="object" ? v!==null&&typeof v==="object"&&!Array.isArray(v) :
 t==="array" ? Array.isArray(v) : t==="integer" ? Number.isSafeInteger(v) : typeof v===t;
function check(v,s,path="$"){
 for(const keyword of Object.keys(s)) if(!supported.has(keyword)) throw new Error("unsupported schema keyword: "+keyword);
 if(s.$ref){
  if(!s.$ref.startsWith("#/$defs/")) throw new Error("unsupported schema reference");
  const target=schema.$defs[s.$ref.slice(8)];
  if(!target) throw new Error("unknown schema reference");
  check(v,target,path);
 }
 if(s.oneOf){
  const matches=[]; const failures=[];
  for(const branch of s.oneOf){try{check(v,branch,path);matches.push(branch);}catch(error){failures.push(error);}}
  if(matches.length!==1) throw matches.length===0 && failures.length ? failures[0] : new TypeError(path+" must match exactly one record schema");
 }
 for(const branch of s.allOf??[]) check(v,branch,path);
 if(s.type && !typeOK(v,s.type)) throw new TypeError(path+" invalid type");
 if(Object.hasOwn(s,"const")&&!equal(v,s.const)) throw new TypeError(path+" invalid constant");
 if(s.enum&&!s.enum.some(x=>equal(v,x))) throw new TypeError(path+" invalid enum");
 if(typeof v==="string"){
  if(s.minLength!==undefined&&v.length<s.minLength) throw new TypeError(path+" too short");
  if(s.maxLength!==undefined&&v.length>s.maxLength) throw new TypeError(path+" too long");
  if(s.pattern&&!new RegExp(s.pattern).test(v)) throw new TypeError(path+" invalid pattern");
  if(s.format==="date-time" && (!/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(?:\\.\\d+)?(?:Z|[+-]\\d\\d:\\d\\d)$/.test(v)||Number.isNaN(Date.parse(v)))) throw new TypeError(path+" invalid date-time");
  if(s.format&&s.format!=="date-time") throw new Error("unsupported format: "+s.format);
 }
 if(typeof v==="number"){
  if(s.minimum!==undefined&&v<s.minimum) throw new TypeError(path+" below minimum");
  if(s.maximum!==undefined&&v>s.maximum) throw new TypeError(path+" above maximum");
 }
 if(Array.isArray(v)){
  if(s.minItems!==undefined&&v.length<s.minItems) throw new TypeError(path+" too few items");
  if(s.maxItems!==undefined&&v.length>s.maxItems) throw new TypeError(path+" too many items");
  if(s.uniqueItems&&new Set(v.map(x=>JSON.stringify(x))).size!==v.length) throw new TypeError(path+" duplicate items");
  if(s.items) v.forEach((item,i)=>check(item,s.items,path+"["+i+"]"));
 }
 if(v!==null&&typeof v==="object"&&!Array.isArray(v)){
  for(const key of s.required??[]) if(!Object.hasOwn(v,key)) throw new TypeError(path+" missing "+key);
  if(s.maxProperties!==undefined&&Object.keys(v).length>s.maxProperties) throw new TypeError(path+" too many properties");
  for(const [key,value] of Object.entries(v)){
   if(s.propertyNames) check(key,s.propertyNames,path+" property");
   if(s.properties?.[key]) check(value,s.properties[key],path+"."+key);
   else if(s.additionalProperties===false) throw new TypeError(path+" unknown property "+key);
  }
 }
}
export function validateRecordSchema(record){check(record,schema);}
