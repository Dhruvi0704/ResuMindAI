const postgres = require('postgres');
require('dotenv').config();

let url = process.env.DATABASE_URL;
if (url && url.includes('A@ryan_')) {
  url = url.replace('A@ryan_', 'A%40ryan_');
}

const sql = postgres(url, { max: 1, prepare: false });

async function patch() {
  try {
    console.log("Dropping NOT NULL constraints on deprecated columns...");
    
    const colsToDropNotNull = [
      'job_title', 'experience_level', 'job_description', 'score', 'status', 
      'violation_count', 'integrity_score', 'termination_reason', 'round_type'
    ];
    
    for (const col of colsToDropNotNull) {
      try {
        await sql.unsafe(`ALTER TABLE mock_interviews ALTER COLUMN ${col} DROP NOT NULL`);
        console.log(`Dropped NOT NULL for ${col}`);
      } catch (e) {
        // column might not exist or already dropped, ignore safely
      }
    }
    
    console.log("Patch complete!");
  } catch(e) { 
    console.error("SQL Error:", e); 
  }
  process.exit(0);
}
patch();
