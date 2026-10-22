# OC-INT-01 — Versioned research integration contract (experimental)

`createResearchIntegration(governedTools)` exposes `version: "oc.research.v1"`, a fixed list of three capabilities, and an `invoke({version,operation,arguments})` entry point. It delegates to a host-provided governed tool facade, and refuses unknown versions or operations. There is no mutation or publication operation.

**Trust boundary:** This is an in-process invocation contract, not an HTTP/MCP endpoint or authorization system. The host must construct the governed facade using authenticated context, trusted policy and audit callbacks, and must prevent consumers from reaching raw archive objects or legacy unscoped tools. Version negotiation, serialized schemas, response size bounds, error normalization, request identity, service transport and integration security tests remain future gates. LASSO and Portal are consumers, not dependencies of Observatory Core.
