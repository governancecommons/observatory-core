import { readFileSync } from "node:fs";
import { validatePublication } from "../src/contract.mjs";
const [manifestPath,bundlePath]=process.argv.slice(2);
if(!manifestPath||!bundlePath){console.error("Usage: npm run validate:export -- manifest.json records.json");process.exit(2);}
const errors=validatePublication(JSON.parse(readFileSync(manifestPath,"utf8")),readFileSync(bundlePath));
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("Approved Observatory export validated");
