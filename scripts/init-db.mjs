import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Attempt to read DATABASE_URL from .env.local if not already in process.env
function loadEnv() {
  if (process.env.DATABASE_URL) return;

  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          const rawValue = trimmed.slice("DATABASE_URL=".length).trim();
          // Remove trailing inline comments
          const cleaned = rawValue.split("#")[0].trim().replace(/^["']|["']$/g, "");
          process.env.DATABASE_URL = cleaned;
          break;
        }
      }
      if (process.env.DATABASE_URL) break;
    }
  }
}

async function main() {
  loadEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL is not defined in .env.local or environment.");
    process.exit(1);
  }

  console.log("⚡ Connecting to Neon PostgreSQL database...");
  const sql = neon(dbUrl);

  const schemaPath = path.join(projectRoot, "src", "lib", "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  try {
    console.log("📦 Applying schema migrations (registrations table & indexes)...");
    
    // Split into individual SQL statements, respecting $$-quoted blocks
    // (e.g. DO $$ ... $$ bodies) so semicolons inside them aren't treated
    // as statement terminators.
    const statements = [];
    let current = "";
    let inDollarQuote = false;

    for (const line of schemaSql.split("\n")) {
      current += line + "\n";

      const dollarMatches = line.match(/\$\$/g);
      if (dollarMatches) {
        for (let i = 0; i < dollarMatches.length; i += 1) {
          inDollarQuote = !inDollarQuote;
        }
      }

      if (!inDollarQuote && line.trim().endsWith(";")) {
        const trimmed = current.trim();
        if (trimmed.length > 0) statements.push(trimmed);
        current = "";
      }
    }

    const trailing = current.trim();
    if (trailing.length > 0) statements.push(trailing);

    for (const statement of statements) {
      await sql.query(statement);
    }

    console.log("✅ Neon database schema applied successfully! The registrations table is ready.");
  } catch (err) {
    console.error("❌ Failed to apply database schema:", err);
    process.exit(1);
  }
}

main();
