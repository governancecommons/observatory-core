import {readFileSync,mkdirSync,writeFileSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {preparePublication} from "../src/publish.mjs";
const [inputPath,metadataPath,outputPath]=process.argv.slice(2);
if(!inputPath||!metadataPath||!outputPath){console.error("Usage: node scripts/prepare-publication.mjs records.json approval-metadata.json output-dir");process.exit(2);}
try{
 const records=JSON.parse(readFileSync(inputPath,"utf8"));
 const metadata=JSON.parse(readFileSync(metadataPath,"utf8"));
 const output=resolve(outputPath);
 if(existsSync(output))throw new Error("output directory already exists; immutable releases cannot be overwritten");
 const {manifestBytes,recordsBytes}=preparePublication({records,...metadata});
 mkdirSync(output,{recursive:true});
 writeFileSync(join(output,"records.json"),recordsBytes,{flag:"wx"});
 writeFileSync(join(output,"manifest.json"),manifestBytes,{flag:"wx"});
 console.log("Prepared validated publication at "+output);
}catch(e){console.error(e.message);process.exit(1);}
