/**
 * OC-07A: bounded RSS 2.0 / Atom 1.0 feed normalization.
 * Pure parsing only: no network access, persistence, approval or publication.
 * Supports a conservative XML subset; rejects DTDs, processing instructions
 * other than XML declaration, malformed nesting and unknown entities.
 */
const MAX_BYTES=2_000_000;
function decode(s) {
 return s.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi,(_,v)=>{
  const named={amp:"&",lt:"<",gt:">",quot:'"',apos:"'"};
  if(named[v])return named[v];
  const n=v.toLowerCase().startsWith("#x")?parseInt(v.slice(2),16):Number(v.slice(1));
  if(!Number.isInteger(n)||n<1||n>0x10ffff||(n>=0xd800&&n<=0xdfff))throw new TypeError("invalid XML entity");
  return String.fromCodePoint(n);
 }).replace(/&(?!(?:amp|lt|gt|quot|apos|#x[0-9a-f]+|#[0-9]+);)/i,()=>{throw new TypeError("unsupported XML entity");});
}
function xmlTree(xml){
 if(typeof xml!=="string"||Buffer.byteLength(xml,"utf8")>MAX_BYTES)throw new TypeError("invalid or oversized feed");
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new TypeError("DTD and entities are unsupported");
 const root={name:"#document",attrs:{},children:[],text:""},stack=[root];
 const tokens=xml.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<[^>]*>|[^<]+/g)??[];
 if(tokens.join("")!==xml)throw new TypeError("malformed XML");
 for(const token of tokens){
  if(token.startsWith("<!--"))continue;
  if(token.startsWith("<![CDATA[")){stack.at(-1).text+=token.slice(9,-3);continue;}
  if(token.startsWith("<?")){if(!/^<\?xml\s/i.test(token)||stack.length!==1||root.children.length)throw new TypeError("unsupported XML processing instruction");continue;}
  if(token.startsWith("</")){
   const name=token.match(/^<\/([\w:.-]+)\s*>$/)?.[1];
   if(stack.length===1||stack.at(-1).name!==name)throw new TypeError("unbalanced XML");
   stack.pop();continue;
  }
  if(token.startsWith("<")){
   const match=token.match(/^<([\w:.-]+)([\s\S]*?)\s*(\/?)>$/);
   if(!match)throw new TypeError("invalid XML element");
   const attrs={},raw=match[2].trim().replace(/\/$/,"").trim();
   const attrRe=/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
   let remaining=raw,m;
   while((m=attrRe.exec(raw))!==null){attrs[m[1]]=decode(m[2]??m[3]);remaining=remaining.replace(m[0],"").trim();}
   if(remaining)throw new TypeError("invalid XML attributes");
   const node={name:match[1],attrs,children:[],text:""};
   stack.at(-1).children.push(node);
   if(match[3]!=="/")stack.push(node);
  }else stack.at(-1).text+=decode(token);
 }
 if(stack.length!==1||root.children.length!==1)throw new TypeError("invalid XML document");
 return root.children[0];
}
const children=(node,name)=>node.children.filter(x=>x.name===name);
const child=(node,name)=>children(node,name)[0];
const value=(node,name)=>child(node,name)?.text.trim()??"";
const optional=x=>x||null;
function link(node){
 const candidates=children(node,"link");
 return candidates.find(x=>!x.attrs.rel||x.attrs.rel==="alternate")?.attrs.href??null;
}
function normalizeDate(s){
 if(!s)return null;
 const t=Date.parse(s);
 return Number.isNaN(t)?null:new Date(t).toISOString();
}
export function parseFeed(xml){
 const root=xmlTree(xml);
 if(root.name==="rss"&&root.attrs.version==="2.0"){
  const channel=child(root,"channel");
  if(!channel)throw new TypeError("missing RSS channel");
  return {format:"rss2",title:value(channel,"title"),siteUrl:optional(value(channel,"link")),
   entries:children(channel,"item").map(item=>({
    externalId:optional(value(item,"guid"))??optional(value(item,"link")),
    title:value(item,"title"),url:optional(value(item,"link")),
    summary:optional(value(item,"description")),publishedAt:normalizeDate(value(item,"pubDate"))
   }))};
 }
 if(root.name==="feed"&&root.attrs.xmlns==="http://www.w3.org/2005/Atom"){
  return {format:"atom",title:value(root,"title"),siteUrl:link(root),
   entries:children(root,"entry").map(item=>({
    externalId:optional(value(item,"id")),title:value(item,"title"),url:link(item),
    summary:optional(value(item,"summary"))??optional(value(item,"content")),
    publishedAt:normalizeDate(value(item,"published")||value(item,"updated"))
   }))};
 }
 throw new TypeError("unsupported feed format");
}
