import "dotenv/config";
import { db } from "../src/db";
import { dbCertificateArtifacts } from "../src/db/schema/certificates-db.schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Connecting to database and updating pending artifacts...");
  const result = await db.update(dbCertificateArtifacts)
    .set({ updatedAt: new Date(Date.now() - 10 * 60 * 1000) })
    .where(eq(dbCertificateArtifacts.status, "pending"))
    .returning({ 
      id: dbCertificateArtifacts.id, 
      status: dbCertificateArtifacts.status, 
      updatedAt: dbCertificateArtifacts.updatedAt 
    });
  console.log("Updated artifacts:", result);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to update artifacts:", err);
    process.exit(1);
  });
