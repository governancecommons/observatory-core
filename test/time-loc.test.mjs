import test from "node:test";
import assert from "node:assert/strict";
import {makeTimeLocEnvelope,attachTimeLocExtension} from "../src/integrations/time-loc.mjs";
const time="2026-10-22T19:00:00Z";
test("time.loc adapter distinguishes event and record time without guessing location",()=>{
 const envelope=makeTimeLocEnvelope({eventId:"capture:1",occurredAt:time,recordedAt:"2026-10-22T19:01:00Z",actor:"feed-ingestor"});
 assert.equal(envelope.location.status,"unknown");
 assert.equal(envelope.clock.status,"unverified");
 assert.notEqual(envelope.occurredAt,envelope.recordedAt);
 const record=attachTimeLocExtension({recordType:"capture",extensions:{consumer:{ok:true}}},envelope);
 assert.equal(record.extensions.timeLoc.eventId,"capture:1");
 assert.equal(record.extensions.consumer.ok,true);
});
test("rejects missing timestamps and duplicate extensions",()=>{
 assert.throws(()=>makeTimeLocEnvelope({eventId:"x",occurredAt:"y",recordedAt:time,actor:"a"}),/UTC/);
 const envelope=makeTimeLocEnvelope({eventId:"x",occurredAt:time,recordedAt:time,actor:"a"});
 assert.throws(()=>attachTimeLocExtension({extensions:{timeLoc:{}}},envelope),/already exists/);
});
