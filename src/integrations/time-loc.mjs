/**
 * OC-07T optional time.loc-compatible provenance metadata.
 * This is an adapter boundary, NOT an implementation of the time.loc protocol.
 * No invented clock confidence, coordinates, signatures or trusted time claims.
 */
export function makeTimeLocEnvelope({eventId,occurredAt,recordedAt,actor,location=null,clock=null,external=null}={}){
 const iso=value=>typeof value==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value)&&!Number.isNaN(Date.parse(value));
 if(typeof eventId!=="string"||!eventId.trim()||eventId.length>256)throw new TypeError("eventId required");
 if(!iso(occurredAt)||!iso(recordedAt))throw new TypeError("UTC event and recording timestamps required");
 if(typeof actor!=="string"||!actor.trim()||actor.length>256)throw new TypeError("actor required");
 if(location!==null||clock!==null||external!==null) {
  for(const [name,value] of Object.entries({location,clock,external}))
   if(value!==null&&(typeof value!=="object"||Array.isArray(value)))throw new TypeError(name+" must be an object or null");
 }
 const result={profile:"observatory-time-loc-adapter/0.1.0",eventId,occurredAt,recordedAt,actor,
  location:location===null?{status:"unknown"}:structuredClone(location),
  clock:clock===null?{status:"unverified"}:structuredClone(clock)};
 if(external!==null)result.external=structuredClone(external);
 return result;
}
export function attachTimeLocExtension(record,envelope){
 if(!record||typeof record!=="object"||Array.isArray(record))throw new TypeError("record required");
 if(!envelope||envelope.profile!=="observatory-time-loc-adapter/0.1.0")throw new TypeError("unsupported provenance envelope");
 const extensions=record.extensions??{};
 if(Object.hasOwn(extensions,"timeLoc"))throw new TypeError("timeLoc extension already exists");
 return {...record,extensions:{...extensions,timeLoc:structuredClone(envelope)}};
}
