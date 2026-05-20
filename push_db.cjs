require('dotenv').config();
const { execSync } = require('child_process');

let url = process.env.DATABASE_URL;
if (url && url.includes('A@ryan_')) {
  url = url.replace('A@ryan_', 'A%40ryan_');
}

console.log('Running drizzle-kit push with proper URL...');
try {
  execSync(`npx drizzle-kit push --force`, { 
    env: { ...process.env, DATABASE_URL: url }, 
    stdio: 'inherit' 
  });
  console.log('Push complete!');
} catch(e) {
  console.error("Error during push:", e);
}
