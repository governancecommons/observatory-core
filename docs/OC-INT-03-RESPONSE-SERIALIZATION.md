# OC-INT-03 — Bounded research result serialization

The in-process `oc.research.v1` bridge now accepts only JSON-compatible synchronous results with a maximum serialized payload of 256 KiB, 32 nesting levels and 1000 items/properties per collection. It returns a detached JSON copy, rejecting cycles, unsupported object prototypes, accessors, sparse arrays, nonfinite numbers and undefined values. Invalid outputs are mapped to the existing sanitized operation failure envelope.

This is **transport preparation**, not a transport, authenticated endpoint or comprehensive operation-specific response schema. Host-governed access and auditing remain mandatory. JSON normalization may change types and remove object identity; consumers must not depend on class instances. Future gates should validate exact result schemas and error taxonomy before exposure over HTTP/MCP.
