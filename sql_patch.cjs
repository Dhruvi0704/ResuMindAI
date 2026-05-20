const postgres = require('postgres');
require('dotenv').config();

let url = process.env.DATABASE_URL;
if (url && url.includes('A@ryan_')) {
  url = url.replace('A@ryan_', 'A%40ryan_');
}

const sql = postgres(url, { max: 1, prepare: false });

async function patch() {
  try {
    console.log("Adding missing columns to mock_interviews...");
    // Only add columns that do not exist safely
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS target_role text NOT NULL DEFAULT 'Developer'`;
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS questions jsonb NOT NULL DEFAULT '[]'`;
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '[]'`;
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS scores jsonb NOT NULL DEFAULT '{}'`;
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS overall_score real`;
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS feedback text`;
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS duration integer`;
    
    // Check if new tables need to be created too, but usually only mock_interviews was failing.
    console.log("Columns added successfully!");
  } catch(e) { 
    console.error("SQL Error:", e); 
  }
  process.exit(0);
}
patch();
