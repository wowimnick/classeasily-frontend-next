// migrate-button-imports.js
// Run with: node migrate-button-imports.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all JS/JSX/TS/TSX files in src directory
const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/components/common/Button.jsx', '**/components/common/Button.tsx']
});

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Pattern 1: Simple single-line import { Button } from 'antd';
  const simpleButtonImportRegex = /import\s*{\s*Button\s*}\s*from\s*['"]antd['"]\s*;?/g;
  if (content.match(simpleButtonImportRegex)) {
    content = content.replace(
      simpleButtonImportRegex,
      "import Button from '@/components/common/Button';"
    );
    updated = true;
  }

  // Pattern 2: Multi-line or single-line imports with Button and other components
  // This regex matches imports that may span multiple lines
  const multiImportRegex = /import\s*{\s*([^}]*)\s*}\s*from\s*['"]antd['"]\s*;?/gs;
  
  content = content.replace(multiImportRegex, (match, importList) => {
    // Parse the import list, handling line breaks and comments
    const imports = importList
      .split(',')
      .map(s => {
        // Remove inline comments and trim
        const cleaned = s.replace(/\/\/.*$/gm, '').trim();
        return cleaned;
      })
      .filter(s => s.length > 0);
    
    const hasButton = imports.some(imp => imp === 'Button');
    
    if (!hasButton) {
      return match; // No Button import, keep as is
    }
    
    updated = true;
    
    // Remove Button from the list
    const otherImports = imports.filter(imp => imp !== 'Button');
    
    if (otherImports.length > 0) {
      // Keep other imports on one line, add separate Button import
      return `import { ${otherImports.join(', ')} } from 'antd';\nimport Button from '@/components/common/Button';`;
    } else {
      // Only Button was imported
      return "import Button from '@/components/common/Button';";
    }
  });

  if (updated) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`✅ Updated: ${file}`);
  }
});

console.log(`\n🎉 Migration complete! Updated ${updatedCount} files.`);
console.log('\n⚠️  Please review the changes and test your app before committing.');
console.log('\n📝 Make sure you have created @/components/common/Button.jsx first!');