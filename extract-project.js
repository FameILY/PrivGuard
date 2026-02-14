// Project Code Extractor
// Save as: extract-project.js
// Run with: node extract-project.js

const fs = require('fs');
const path = require('path');

// Files and folders to ignore
const IGNORE = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.env.local',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.vscode',
  '.venv',
  '.venv39',
  '.idea',
  'extract-project.js', // Don't include this script itself
  'output.txt' // Don't include previous outputs
];

// File extensions to include (add more as needed)
const INCLUDE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.json', '.html', '.css', '.scss',
  '.md', '.env.example', '.gitignore',
  '.yml', '.yaml', '.sh', '.dockerfile',
  '.py', '.java', '.go', '.rs'
];

function shouldInclude(filePath, fileName) {
  // Check if path contains ignored folders
  const pathParts = filePath.split(path.sep);
  if (pathParts.some(part => IGNORE.includes(part))) {
    return false;
  }
  
  // Check if filename is ignored
  if (IGNORE.includes(fileName)) {
    return false;
  }
  
  // Check file extension
  const ext = path.extname(fileName);
  return INCLUDE_EXTENSIONS.includes(ext) || fileName === '.gitignore';
}

function scanDirectory(dir, baseDir = dir, files = {}) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!IGNORE.includes(item)) {
        scanDirectory(fullPath, baseDir, files);
      }
    } else if (stat.isFile() && shouldInclude(fullPath, item)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        files[relativePath] = content;
      } catch (error) {
        console.warn(`⚠️  Skipped ${relativePath}: ${error.message}`);
      }
    }
  }
  
  return files;
}

function generateOutput(files, projectName) {
  let output = `// ${projectName} - Complete Project Code\n`;
  output += `// Generated on: ${new Date().toLocaleString()}\n`;
  output += `// Total files: ${Object.keys(files).length}\n\n`;
  output += `// PASTE THIS ENTIRE CODE TO ANY AI ASSISTANT\n`;
  output += `// They can recreate your project structure from this\n\n`;
  
  output += `const projectFiles = {\n`;
  
  const entries = Object.entries(files);
  entries.forEach(([filePath, content], index) => {
    // Escape backticks and backslashes in content
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    
    output += `  '${filePath}': \`${escapedContent}\``;
    
    if (index < entries.length - 1) {
      output += ',\n\n';
    } else {
      output += '\n';
    }
  });
  
  output += `};\n\n`;
  output += `// File count: ${Object.keys(files).length}\n`;
  output += `// Project: ${projectName}\n`;
  
  return output;
}

function main() {
  console.log('🔍 Scanning project files...\n');
  
  const currentDir = process.cwd();
  const projectName = path.basename(currentDir);
  
  // Scan all files
  const files = scanDirectory(currentDir);
  
  if (Object.keys(files).length === 0) {
    console.error('❌ No files found to extract!');
    process.exit(1);
  }
  
  // Generate output
  const output = generateOutput(files, projectName);
  
  // Save to file
  const outputFile = 'project-code-export.txt';
  fs.writeFileSync(outputFile, output, 'utf8');
  
  // Display summary
  console.log('✅ Files extracted:\n');
  Object.keys(files).forEach(file => {
    console.log(`   📄 ${file}`);
  });
  
  console.log(`\n📦 Total files: ${Object.keys(files).length}`);
  console.log(`💾 Saved to: ${outputFile}\n`);
  console.log('🎉 Done! Copy the content from project-code-export.txt');
  console.log('   and paste it to any AI assistant.\n');
}

main();