import test from "node:test";
import assert from "node:assert/strict";
import {parseFeed} from "../src/ingestion/feed-parser.mjs";
test("RSS 2.0 normalizes source and entries",()=>{
 const feed=parseFeed('<?xml version="1.0"?><rss version="2.0"><channel><title>News &amp; Updates</title><link>https://example.org</link><item><guid>post-1</guid><title>A</title><link>https://example.org/a</link><description>Text</description><pubDate>Thu, 22 Oct 2026 19:00:00 GMT</pubDate></item></channel></rss>');
 assert.equal(feed.format,"rss2");assert.equal(feed.title,"News & Updates");assert.equal(feed.entries[0].externalId,"post-1");
 assert.equal(feed.entries[0].publishedAt,"2026-10-22T19:00:00.000Z");
});
test("Atom normalizes alternate links and timestamps",()=>{
 const feed=parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><link rel="alternate" href="https://example.org"/><entry><id>urn:entry:1</id><title>Entry</title><link href="https://example.org/1"/><updated>2026-10-22T19:00:00Z</updated></entry></feed>');
 assert.equal(feed.format,"atom");assert.equal(feed.siteUrl,"https://example.org");assert.equal(feed.entries[0].url,"https://example.org/1");
});
test("rejects DTD, unknown entities, malformed XML and unsupported format",()=>{
 for(const xml of ['<!DOCTYPE rss><rss/>','<rss>&bogus;</rss>','<rss><channel></rss>','<html/>'])
  assert.throws(()=>parseFeed(xml),TypeError);
});
test("rejects oversized feeds",()=>assert.throws(()=>parseFeed("x".repeat(2_000_001)),TypeError));
