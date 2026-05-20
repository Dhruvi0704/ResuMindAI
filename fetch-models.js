const https = require('https');
const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API Key");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('models.json', data);
        console.log(`Status: ${res.statusCode}`);
    });
}).on('error', err => {
    fs.writeFileSync('models.json', JSON.stringify({ error: err.message }));
});
