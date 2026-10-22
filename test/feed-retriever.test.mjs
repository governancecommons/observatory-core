import test from "node:test";
import assert from "node:assert/strict";
import {retrieveFeed} from "../src/ingestion/feed-retriever.mjs";
const response=(body,headers={})=>new Response(body,{status:200,headers});
test("retrieves bounded UTF-8 through injected transport",async()=>{
 const result=await retrieveFeed("https://example.org/rss",{transport:async(url,opts)=>{
  assert.equal(url,"https://example.org/rss");assert.equal(opts.redirect,"error");
  return response("<rss/>");
 }});
 assert.equal(result.xml,"<rss/>");assert.equal(result.byteLength,6);
});
test("rejects untrusted transport omission and invalid URLs",async()=>{
 await assert.rejects(retrieveFeed("https://example.org/"),/authorized transport/);
 await assert.rejects(retrieveFeed("file:///etc/passwd",{transport:async()=>response("x")}),/invalid feed URL/);
 await assert.rejects(retrieveFeed("https://u:p@example.org/",{transport:async()=>response("x")}),/invalid feed URL/);
});
test("enforces declared and streamed byte limits",async()=>{
 await assert.rejects(retrieveFeed("https://example.org",{maxBytes:3,transport:async()=>response("hello",{"content-length":"5"})}),/byte limit/);
 await assert.rejects(retrieveFeed("https://example.org",{maxBytes:3,transport:async()=>response("hello")}),/byte limit/);
});
test("rejects non-200 and invalid UTF-8",async()=>{
 await assert.rejects(retrieveFeed("https://example.org",{transport:async()=>new Response("no",{status:404})}),/invalid feed response/);
 await assert.rejects(retrieveFeed("https://example.org",{transport:async()=>response(new Uint8Array([255]))}),TypeError);
});
