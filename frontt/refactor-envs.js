const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Quick check if file has localhost:3000
  if (content.includes('http://localhost:3000')) {
    
    // Replace string literals: 'http://localhost:3000/api...'
    // with: `${environment.apiUrl}/api...`
    // First, let's replace backticks
    content = content.replace(/`http:\/\/localhost:3000(.*?)`/g, '`${environment.apiUrl}$1`');
    
    // Now single quotes
    content = content.replace(/'http:\/\/localhost:3000(.*?)'/g, '`${environment.apiUrl}$1`');
    
    // Now double quotes
    content = content.replace(/"http:\/\/localhost:3000(.*?)"/g, '`${environment.apiUrl}$1`');

    // Make sure we have the import statement
    if (!content.includes('import { environment }')) {
      // Calculate relative path to environments folder
      // Determine depth of current file relative to src/app
      const relativeToApp = path.relative(srcDir, file);
      const depth = relativeToApp.split(path.sep).length - 1; // if in src/app directly, depth is 0
      
      let relativePrefix = '../';
      for(let i=0; i<depth; i++) relativePrefix += '../';
      
      const importStatement = `import { environment } from '${relativePrefix}environments/environment';\n`;
      content = importStatement + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
