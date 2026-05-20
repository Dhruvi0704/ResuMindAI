const postgres = require('postgres');
require('dotenv').config();

let url = process.env.DATABASE_URL;
if (url && url.includes('A@ryan_')) {
  url = url.replace('A@ryan_', 'A%40ryan_');
}

const sql = postgres(url, { max: 1, prepare: false });

async function patch() {
  try {
    console.log("Fixing duration_seconds column...");
    await sql`ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS duration_seconds integer`;
    console.log("Column added successfully!");
  } catch(e) { 
    console.error("SQL Error:", e); 
  }
  process.exit(0);
}
patch();
