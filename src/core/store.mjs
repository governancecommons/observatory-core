/**
 * OC-03: dependency-free, ephemeral, append-only record store.
 * Not a database, authorization layer, JSON Schema validator, or publication gate.
 * References use "recordType:id@version" for internally managed records.
 */
export const RECORD_TYPES = Object.freeze([
  "source", "capture", "evidence", "observation",
  "provenanceEdge", "verificationResult", "changeEvent", "publicationCandidate"
]);
const types = new Set(RECORD_TYPES);
const required = Object.freeze({
  source: ["locator", "sourceType", "displayName"],
  capture: ["sourceRef", "capturedAt", "contentDigest", "mediaType", "retrievalMethod"],
  evidence: ["captureRefs", "assertion", "method", "limitations"],
  observation: ["subjectRef", "evidenceRefs", "observedAt", "value", "methodVersion"],
  provenanceEdge: ["fromRef", "toRef", "relation", "assertedAt"],
  verificationResult: ["targetRef", "procedureId", "procedureVersion", "checkedAt", "outcome", "limitations"],
  changeEvent: ["beforeRef", "afterRef", "comparisonVersion", "changes"],
  publicationCandidate: ["recordRefs", "manifestDigest", "payloadDigest", "preparedAt", "policyRef"]
});
const internalRefs = {
  capture: { sourceRef: "source" },
  evidence: { captureRefs: "capture" },
  observation: { evidenceRefs: "evidence" },
  provenanceEdge: { fromRef: "*", toRef: "*" },
  verificationResult: { targetRef: "*" },
  changeEvent: { beforeRef: "*", afterRef: "*" },
  publicationCandidate: { recordRefs: "*" }
};
const nonempty = x => typeof x === "string" && x.trim().length > 0;
const utc = x => nonempty(x) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(x) && !Number.isNaN(Date.parse(x));
const digest = x => typeof x === "string" && /^sha256:[0-9a-f]{64}$/.test(x);
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
function freeze(value, seen = new WeakSet()) {
  if (value && typeof value === "object") {
    if (seen.has(value)) throw new TypeError("cyclic record data is unsupported");
    seen.add(value);
    for (const child of Object.values(value)) freeze(child, seen);
    seen.delete(value);
    Object.freeze(value);
  }
  return value;
}
function parseRef(ref) {
  if (!nonempty(ref)) throw new TypeError("invalid reference");
  const match = /^([A-Za-z]+):([^@]+)@([1-9]\d*)$/.exec(ref);
  if (!match || !types.has(match[1]) || !Number.isSafeInteger(Number(match[3]))) throw new TypeError("invalid typed reference: " + ref);
  return {type: match[1], id: match[2], version: Number(match[3])};
}
export function recordRef(record) {
  return `${record.recordType}:${record.id}@${record.version}`;
}
function validateShape(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) throw new TypeError("record must be an object");
  if (!types.has(r.recordType)) throw new TypeError("unsupported recordType");
  if (r.schemaVersion !== "0.1.0" || !nonempty(r.id) || /[:@]/.test(r.id) ||
      !Number.isSafeInteger(r.version) || r.version < 1 || !utc(r.createdAt) || !nonempty(r.producer))
    throw new TypeError("invalid common record fields");
  if (r.extensions !== undefined && (r.extensions === null || typeof r.extensions !== "object" || Array.isArray(r.extensions) || Object.keys(r.extensions).some(k => !/^[a-zA-Z][a-zA-Z0-9.-]*:[a-zA-Z0-9._-]+$/.test(k))))
    throw new TypeError("invalid extensions namespace");
  for (const field of required[r.recordType]) {
    if (!own(r,field) || r[field] === null || r[field] === undefined ||
        (typeof r[field] === "string" && !nonempty(r[field])))
      throw new TypeError("missing or empty " + field);
  }
  for (const field of ["capturedAt", "observedAt", "assertedAt", "checkedAt", "preparedAt"])
    if (own(r,field) && !utc(r[field])) throw new TypeError("invalid " + field);
  for (const field of ["contentDigest", "manifestDigest", "payloadDigest"])
    if (own(r,field) && !digest(r[field])) throw new TypeError("invalid " + field);
  for (const field of ["captureRefs", "evidenceRefs", "recordRefs"]) {
    if (own(r,field) && (!Array.isArray(r[field]) || r[field].length === 0 ||
      r[field].some(x => !nonempty(x)) || new Set(r[field]).size !== r[field].length))
      throw new TypeError("invalid " + field);
  }
  if (r.recordType === "verificationResult" && !["passed","failed","inconclusive","error"].includes(r.outcome))
    throw new TypeError("invalid verification outcome");
  if (r.recordType === "changeEvent" && (!Array.isArray(r.changes) || !r.changes.length || r.changes.some(x => !x || typeof x !== "object" || !nonempty(x.path) || !["added","removed","modified"].includes(x.changeType))))
    throw new TypeError("changes must be nonempty");
}
export class InMemoryEvidenceStore {
  #records = new Map();
  #latest = new Map();
  append(input) {
    // Copy first: caller mutations must not change stored history.
    const r = structuredClone(input);
    validateShape(r);
    const ref = recordRef(r);
    const identity = `${r.recordType}:${r.id}`;
    if (this.#records.has(ref)) throw new Error("immutable version already exists: " + ref);
    const latest = this.#latest.get(identity) ?? 0;
    if (r.version !== latest + 1) throw new Error("version must follow previous version");
    for (const [field, expected] of Object.entries(internalRefs[r.recordType] ?? {})) {
      const refs = Array.isArray(r[field]) ? r[field] : [r[field]];
      for (const item of refs) {
        const parsed = parseRef(item);
        if (expected !== "*" && parsed.type !== expected) throw new Error("wrong reference type: " + field);
        if (!this.#records.has(item)) throw new Error("missing provenance reference: " + item);
      }
    }
    if (r.recordType === "changeEvent") {
      const before = parseRef(r.beforeRef), after = parseRef(r.afterRef);
      if (before.type !== after.type || before.id !== after.id || before.version >= after.version)
        throw new Error("change event requires ascending versions of the same identity");
    }
    // Reject cyclic/non-JSON-compatible values before touching store state.
    try { JSON.stringify(r, (_key, value) => {
      if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol" || typeof value === "undefined")
        throw new TypeError("record contains non-JSON value");
      return value;
    }); } catch (error) { throw new TypeError("record must be JSON-compatible", {cause:error}); }
    freeze(r);
    this.#records.set(ref,r);
    this.#latest.set(identity,r.version);
    return ref;
  }
  get(ref) { return this.#records.get(ref) ?? null; }
  getLatest(type,id) {
    if (!types.has(type) || !nonempty(id)) throw new TypeError("invalid identity");
    const version = this.#latest.get(`${type}:${id}`);
    return version ? this.get(`${type}:${id}@${version}`) : null;
  }
  history(type,id) {
    if (!types.has(type) || !nonempty(id)) throw new TypeError("invalid identity");
    const count = this.#latest.get(`${type}:${id}`) ?? 0;
    return Array.from({length:count},(_,i)=>this.get(`${type}:${id}@${i+1}`));
  }
  query({recordType, limit=50, offset=0}={}) {
    if (recordType !== undefined && !types.has(recordType)) throw new TypeError("unsupported recordType");
    if (!Number.isSafeInteger(limit) || limit<1 || limit>100 || !Number.isSafeInteger(offset) || offset<0)
      throw new RangeError("invalid pagination");
    const records = [...this.#records.values()].filter(r=>recordType===undefined||r.recordType===recordType);
    return {items:records.slice(offset,offset+limit), total:records.length,
      nextOffset:offset+limit<records.length ? offset+limit : null};
  }
}
