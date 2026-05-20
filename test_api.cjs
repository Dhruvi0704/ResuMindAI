const http = require('http');

const data = JSON.stringify({
  jobTitle: "Ai Engineer",
  experienceLevel: "Fresher (0-1 years)",
  jobDescription: "Python",
  roundType: "Technical Round"
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/interviews/start',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    // Dummy session or cookie might be needed since we check req.isAuthenticated()
    // Let's just pass some random cookie to see if it bounces 401
    // Actually, if it's 401, it returns "Unauthorized".
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log(`STATUS: ${res.statusCode} BODY: ${body}`));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
