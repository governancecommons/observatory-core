/**
 * OC-04: file-backed evidence store, experimental single-process adapter.
 * Atomic snapshot replacement (temp + rename) and SHA-256 checksum.
 * Not an authorization service or a multi-writer database.
 */
import {readFile, writeFile, rename, unlink, mkdir} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {randomUUID, createHash} from "node:crypto";
import {InMemoryEvidenceStore} from "./store.mjs";

const digest = text => createHash("sha256").update(text).digest("hex");
const json = value => JSON.stringify(value);
const snapshot = records => {
  const payload = json({format:"observatory-core/snapshot-v1",records});
  return json({format:"observatory-core/envelope-v1",sha256:digest(payload),payload}) + "\n";
};
function decode(raw) {
  const envelope=JSON.parse(raw);
  if (envelope?.format!=="observatory-core/envelope-v1" ||
      typeof envelope.payload!=="string" || typeof envelope.sha256!=="string" ||
      digest(envelope.payload)!==envelope.sha256) throw new Error("snapshot integrity check failed");
  const body=JSON.parse(envelope.payload);
  if (body?.format!=="observatory-core/snapshot-v1" || !Array.isArray(body.records))
    throw new Error("invalid snapshot payload");
  return body.records;
}
async function persist(path, records) {
  await mkdir(dirname(path),{recursive:true});
  const temporary=path+"."+randomUUID()+".tmp";
  try {
    await writeFile(temporary,snapshot(records),{encoding:"utf8",flag:"wx",mode:0o600});
    await rename(temporary,path);
  } catch(error) {
    await unlink(temporary).catch(()=>{});
    throw error;
  }
}
export class FileEvidenceStore {
  #path;
  #store;
  #records;
  constructor(path,store,records) {
    this.#path=path;this.#store=store;this.#records=records;
  }
  static async open(filePath) {
    if (typeof filePath!=="string" || !filePath.trim()) throw new TypeError("file path required");
    const path=resolve(filePath);
    let records=[];
    try { records=decode(await readFile(path,"utf8")); }
    catch(error) { if(error?.code!=="ENOENT") throw error; }
    const store=new InMemoryEvidenceStore();
    // Replay through the same validation and reference checks; fail closed on corruption.
    for (const record of records) store.append(record);
    return new FileEvidenceStore(path,store,records);
  }
  async append(record) {
    // Prepare and validate a new snapshot without mutating live state on disk failure.
    const trial=new InMemoryEvidenceStore();
    for (const old of this.#records) trial.append(old);
    const ref=trial.append(record);
    const next=[...this.#records,trial.get(ref)];
    await persist(this.#path,next);
    this.#store=trial;
    this.#records=next;
    return ref;
  }
  get(ref) {return this.#store.get(ref);}
  getLatest(type,id) {return this.#store.getLatest(type,id);}
  history(type,id) {return this.#store.history(type,id);}
  query(options) {return this.#store.query(options);}
}
