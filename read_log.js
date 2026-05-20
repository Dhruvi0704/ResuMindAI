const fs = require('fs');
const content = fs.readFileSync('test2_out.txt', 'utf16le');
fs.writeFileSync('error.txt', content, 'utf8');
