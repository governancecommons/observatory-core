/**
 * OC-07B: deterministic, replay-safe feed snapshot ingestion.
 * Feed snapshots are captures, NOT verified article bodies.
 * Caller supplies XML and an approved feed URL; no fetching or publication.
 */
import {createHash} from "node:crypto";
import {parseFeed} from "./feed-parser.mjs";
const sha=x=>createHash("sha256").update(x).digest("hex");
const base=(recordType,id,at,producer)=>({recordType,id,schemaVersion:"0.1.0",version:1,createdAt:at,producer});
const ref=(type,id)=>type+":"+id+"@1";
export function ingestFeedSnapshot(store,{feedUrl,xml,capturedAt,producer="observatory-feed-ingestor"}={}){
 if(!store||typeof store.get!=="function"||typeof store.append!=="function")throw new TypeError("evidence store required");
 if(typeof feedUrl!=="string"||!/^https?:\/\//.test(feedUrl))throw new TypeError("HTTP(S) feed URL required");
 if(typeof xml!=="string")throw new TypeError("XML string required");
 if(typeof capturedAt!=="string"||Number.isNaN(Date.parse(capturedAt))||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(capturedAt))throw new TypeError("UTC capturedAt required");
 if(typeof producer!=="string"||!producer.trim())throw new TypeError("producer required");
 const feed=parseFeed(xml);
 const sourceId="feed-"+sha(feedUrl),sourceRef=ref("source",sourceId);
 const digest="sha256:"+sha(xml),captureId="feed-snapshot-"+sha(feedUrl+"\n"+digest),captureRef=ref("capture",captureId);
 // Prepare all entries before any writes; reject entries without stable identity.
 const entries=feed.entries.map(entry=>{
  const key=entry.externalId??entry.url;
  if(!key)throw new TypeError("feed entry lacks stable identifier and URL");
  const identity=sha(feedUrl+"\n"+key);
  const fingerprint=sha(JSON.stringify(entry));
  const id="feed-entry-"+sha(identity+"\n"+fingerprint);
  return {entry,id,evidenceRef:ref("evidence",id)};
 });
 let sourceCreated=false,captureCreated=false,evidenceCreated=0,duplicates=0;
 if(!store.get(sourceRef)){
  store.append({...base("source",sourceId,capturedAt,producer),locator:feedUrl,sourceType:"feed",displayName:feed.title||feedUrl});
  sourceCreated=true;
 }
 if(!store.get(captureRef)){
  store.append({...base("capture",captureId,capturedAt,producer),sourceRef,capturedAt,contentDigest:digest,mediaType:"application/xml",retrievalMethod:"supplied-feed-snapshot"});
  captureCreated=true;
 }
 const evidenceRefs=[];
 for(const {entry,id,evidenceRef} of entries){
  evidenceRefs.push(evidenceRef);
  if(store.get(evidenceRef)){duplicates++;continue;}
  store.append({...base("evidence",id,capturedAt,producer),captureRefs:[captureRef],assertion:JSON.stringify(entry),method:"feed-entry-normalization/0.1.0",limitations:"Feed publisher metadata only; article content and claims unverified."});
  evidenceCreated++;
 }
 return {format:feed.format,sourceRef,captureRef,evidenceRefs,sourceCreated,captureCreated,evidenceCreated,duplicates};
}
