require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');

let url = process.env.DATABASE_URL;
if (url && url.includes('A@ryan_')) {
  url = url.replace('A@ryan_', 'A%40ryan_');
}

console.log('Running drizzle-kit push autonomously...');

const child = exec(`npx drizzle-kit push`, { 
  env: { ...process.env, DATABASE_URL: url }
});

child.stdout.on('data', data => {
  process.stdout.write(data);
  const str = data.toString();
  if (str.includes('created or renamed') || str.includes('Y/n') || str.includes('?')) {
    child.stdin.write('\n');
  }
});

child.stderr.on('data', data => {
  process.stderr.write(data);
});

child.on('exit', code => {
  console.log(`Push completed with code ${code}`);
});
