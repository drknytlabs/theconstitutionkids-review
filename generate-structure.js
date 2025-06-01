// BASH node generate-structure.js
import fs from 'fs';
import path from 'path';

function walk(dir, depth = 0) {
  if (depth > 3) return '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let output = '';
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const prefix = '│   '.repeat(depth) + (entry.isDirectory() ? '├── 📁 ' : '├── 📄 ');
    output += `${prefix}${entry.name}\n`;
    if (entry.isDirectory()) {
      output += walk(path.join(dir, entry.name), depth + 1);
    }
  }
  return output;
}

// Use __dirname as the current directory if 'process' is not available
let currentDir;
if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  currentDir = process.cwd();
} else if (typeof __dirname !== 'undefined') {
  currentDir = __dirname;
} else {
  throw new Error('Cannot determine current directory');
}
const result = `📁 ${path.basename(currentDir)}\n` + walk(currentDir);
fs.writeFileSync('structure.txt', result);
console.log('✅ structure.txt generated');