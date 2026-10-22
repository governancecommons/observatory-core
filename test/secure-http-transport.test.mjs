import test from "node:test";
import assert from "node:assert/strict";
import {createSecureFeedTransport} from "../src/ingestion/secure-http-transport.mjs";
const dns=async()=>[{address:"93.184.216.34",family:4}];
test("requires explicit allowlist and approved addresses",()=>{
 assert.throws(()=>createSecureFeedTransport(),/allowedHosts/);
 assert.throws(()=>createSecureFeedTransport({allowedHosts:["EXAMPLE.ORG"]}),/allowedHosts/);
 assert.throws(()=>createSecureFeedTransport({allowedHosts:["example.org"]}),/approvedAddresses/);
 assert.throws(()=>createSecureFeedTransport({allowedHosts:["example.org"],approvedAddresses:{"example.org":["127.0.0.1"]}}),/public approvedAddresses/);
});
test("rejects HTTP, unlisted hosts, IP literals, and redirects before transport",async()=>{
 const transport=createSecureFeedTransport({allowedHosts:["example.org"],approvedAddresses:{"example.org":["93.184.216.34"]},resolveHost:dns});
 await assert.rejects(transport("http://example.org/rss",{redirect:"error"}),/not authorized/);
 await assert.rejects(transport("https://other.org/rss",{redirect:"error"}),/not authorized/);
 await assert.rejects(transport("https://127.0.0.1/rss",{redirect:"error"}),/not authorized/);
 await assert.rejects(transport("https://example.org/rss",{redirect:"follow"}),/redirect rejection/);
});
test("rejects mixed public and private DNS answers before opening connection",async()=>{
 const transport=createSecureFeedTransport({allowedHosts:["example.org"],approvedAddresses:{"example.org":["93.184.216.34"]},resolveHost:async()=>[{address:"93.184.216.34",family:4},{address:"127.0.0.1",family:4}]});
 await assert.rejects(transport("https://example.org/rss",{redirect:"error"}),/unsafe DNS/);
});
test("rejects reserved, local, and non-public address answers",async()=>{
 for(const address of ["10.1.2.3","192.168.1.2","169.254.1.2","100.64.1.1","203.0.113.10","::1","fc00::1","fe80::1"]){
  const transport=createSecureFeedTransport({allowedHosts:["example.org"],approvedAddresses:{"example.org":["93.184.216.34"]},resolveHost:async()=>[{address,family:address.includes(":")?6:4}]});
  await assert.rejects(transport("https://example.org/rss",{redirect:"error"}),/unsafe DNS/,address);
 }
});
