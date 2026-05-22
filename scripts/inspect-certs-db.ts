import "dotenv/config";
import { db } from "../src/db";
import { 
  dbCanonicalCertificates, 
  dbCertificateArtifacts, 
  dbCertificateEvents 
} from "../src/db/schema/certificates-db.schema";

async function main() {
  console.log("=== Inspecting Certificates Database ===");

  const certs = await db.select().from(dbCanonicalCertificates);
  console.log(`\nCertificates count: ${certs.length}`);
  console.dir(certs, { depth: null });

  const artifacts = await db.select().from(dbCertificateArtifacts);
  console.log(`\nArtifacts count: ${artifacts.length}`);
  console.dir(artifacts, { depth: null });

  const events = await db.select().from(dbCertificateEvents);
  console.log(`\nEvents count: ${events.length}`);
  console.dir(events, { depth: null });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to inspect database:", err);
    process.exit(1);
  });
