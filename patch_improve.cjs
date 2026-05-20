const fs = require('fs');

const routesPath = './server/routes.ts';
let code = fs.readFileSync(routesPath, 'utf8');

const newRoute = fs.readFileSync('./new_improve_route.ts', 'utf8');

// Find where app.post('/api/cv/improve' starts and ends.
// In the current script, it starts at `app.post('/api/cv/improve', async (req, res) => {` and ends before `app.post("/api/cv/optimize",`
const startStr = "  app.post('/api/cv/improve', async (req, res) => {";
const endStr = 'app.post("/api/cv/optimize"';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex);
  const updated = before + newRoute + '\n\n  ' + after;
  fs.writeFileSync(routesPath, updated, 'utf8');
  console.log('Successfully patched routes.ts');
} else {
  console.log('Could not find boundaries for patching.');
  process.exit(1);
}
