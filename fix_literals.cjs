const fs = require('fs');
const path = require('path');

const dir = 'client/src/components/resume/engine/sections';
const files = [
  'HeaderSection.tsx',
  'SummarySection.tsx',
  'SkillsSection.tsx',
  'ExperienceSection.tsx',
  'EducationSection.tsx',
  'PublicationsSection.tsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Fix backticks
    content = content.replace(/\\`/g, '`');
    // Fix template interpolation
    content = content.replace(/\\\$/g, '$');
    // Fix regex double escaping in ExperienceSection
    content = content.replace(/\\\\\*/g, '\\*');
    content = content.replace(/\\\\-/g, '\\-');
    content = content.replace(/\\\\s/g, '\\s');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});
