import { Client } from "pg";
import fs from "fs";

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });
  
  try {
    await client.connect();
    console.log("Connected to database");
    
    // The migration failed because the enum already existed. Let's fix that.
    // Try to add the value, ignore error if it exists.
    try {
      await client.query(`ALTER TYPE "public"."activity_type" ADD VALUE 'lesson_task';`);
      console.log("Added lesson_task to activity_type");
    } catch (err) {
      console.log("Note: activity_type might already have lesson_task", err.message);
    }
    
    // Create the tables if they don't exist
    const sql = fs.readFileSync("drizzle/0025_confused_moondragon.sql", "utf-8");
    
    // We split by statement-breakpoint because drizzle separates statements
    const statements = sql.split("--> statement-breakpoint");
    for (const stmt of statements) {
      const q = stmt.trim();
      if (!q) continue;
      
      try {
        console.log("Executing:", q.slice(0, 50) + "...");
        await client.query(q);
        console.log("Success");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("Already exists, skipping");
        } else {
          console.error("Error executing statement:", err.message);
        }
      }
    }
    
  } finally {
    await client.end();
  }
}

run().catch(console.error);
