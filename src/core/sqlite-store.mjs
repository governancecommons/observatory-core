/**
 * OC-05 experimental SQLite adapter (Node >=22.13 with node:sqlite).
 * Uses WAL and BEGIN IMMEDIATE to serialize cross-process writers.
 * Each append replays existing records through the core integrity rules.
 */
import {DatabaseSync} from "node:sqlite";
import {resolve,dirname} from "node:path";
import {mkdir} from "node:fs/promises";
import {InMemoryEvidenceStore} from "./store.mjs";

export class SQLiteEvidenceStore {
  #db;
  constructor(db) {this.#db=db;}
  static async open(filePath,{busyTimeout=5000}={}) {
    if(typeof filePath!=="string" || !filePath.trim()) throw new TypeError("file path required");
    if(!Number.isSafeInteger(busyTimeout)||busyTimeout<0||busyTimeout>60000) throw new RangeError("invalid busy timeout");
    const path=resolve(filePath);
    await mkdir(dirname(path),{recursive:true});
    const db=new DatabaseSync(path);
    try {
      db.exec("PRAGMA journal_mode=WAL");
      db.exec("PRAGMA synchronous=FULL");
      db.exec("PRAGMA foreign_keys=ON");
      db.exec("PRAGMA busy_timeout="+busyTimeout);
      db.exec("CREATE TABLE IF NOT EXISTS evidence_records (seq INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT NOT NULL UNIQUE, record_type TEXT NOT NULL, record_id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, UNIQUE(record_type,record_id,version))");
      const adapter=new SQLiteEvidenceStore(db);
      adapter.#load();
      return adapter;
    } catch(error) {db.close();throw error;}
  }
  #load() {
    const store=new InMemoryEvidenceStore();
    for(const row of this.#db.prepare("SELECT payload FROM evidence_records ORDER BY seq").all())
      store.append(JSON.parse(row.payload));
    return store;
  }
  append(record) {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const store=this.#load();
      const ref=store.append(record);
      const persisted=store.get(ref);
      this.#db.prepare("INSERT INTO evidence_records(ref,record_type,record_id,version,payload) VALUES(?,?,?,?,?)")
        .run(ref,persisted.recordType,persisted.id,persisted.version,JSON.stringify(persisted));
      this.#db.exec("COMMIT");
      return ref;
    } catch(error) {this.#db.exec("ROLLBACK");throw error;}
  }
  get(ref) {return this.#load().get(ref);}
  getLatest(type,id) {return this.#load().getLatest(type,id);}
  history(type,id) {return this.#load().history(type,id);}
  query(options) {return this.#load().query(options);}
  integrityCheck() {
    return this.#db.prepare("PRAGMA integrity_check").all().map(row=>row.integrity_check);
  }
  close() {this.#db.close();}
}
