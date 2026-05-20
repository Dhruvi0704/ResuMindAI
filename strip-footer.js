const fs = require('fs');
const path = require('path');

function getFiles(dir, files_) {
  files_ = files_ || [];
  let files = fs.readdirSync(dir);
  for (let i in files){
    let name = path.join(dir, files[i]);
    if (fs.statSync(name).isDirectory()){
      getFiles(name, files_);
    } else {
      if(name.endsWith('.tsx') || name.endsWith('.ts')) files_.push(name);
    }
  }
  return files_;
}

const files = getFiles(path.join(__dirname, 'client/src/pages'));

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let o = c;
  c = c.replace(/import\s+Footer\s+from\s+["']@\/components\/Footer["'];?\r?\n?/g, '');
  c = c.replace(/<Footer\s*\/?>(.*?<\/Footer>)?\r?\n?/g, '');
  c = c.replace(/import\s+Navbar\s+from\s+["']@\/components\/Navbar["'];?\r?\n?/g, '');
  c = c.replace(/<Navbar\s*\/?>(.*?<\/Navbar>)?\r?\n?/g, '');
  
  if (c !== o) {
    fs.writeFileSync(f, c);
    console.log('Updated ' + f);
  }
});
