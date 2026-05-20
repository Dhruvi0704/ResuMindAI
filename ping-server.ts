const http = require('http');

const data = JSON.stringify({
  fileBase64: 'UEsDBBQABgAIAAAAIQAAAAAA', // dummy base64
  fileType: 'application/pdf',
  fileName: 'test.pdf',
  targetRole: 'Software Engineer',
  userId: '123'
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/cv/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res: any) => {
  let body = '';
  res.on('data', (chunk: any) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e: any) => {
  console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
