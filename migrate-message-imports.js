// fixVaulDropdownsCorrect.js
const fs = require('fs');
const path = require('path');

const COMPONENTS_TO_FIX = ['Select', 'DatePicker', 'TimePicker', 'Cascader', 'TreeSelect'];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', '.next', 'build', 'dist', '.git'].includes(file)) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else if (filePath.match(/\.(jsx?|tsx?)$/)) {
      arrayOfFiles.push(filePath);
    }
  });
  return arrayOfFiles;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  COMPONENTS_TO_FIX.forEach((component) => {
    // More sophisticated regex that handles multi-line components properly
    // Matches <Component ... > or <Component ... />
    const regex = new RegExp(
      `<${component}\\s+([^>]*?)(/?>)`,
      'gs' // 'g' for global, 's' for dotAll (. matches newlines)
    );

    content = content.replace(regex, (match, propsAndContent, closing) => {
      // Check if already has the props
      if (propsAndContent.includes('getPopupContainer') && 
          (propsAndContent.includes('dropdownRender') || propsAndContent.includes('panelRender'))) {
        return match; // Already fixed
      }

      // Determine which render prop to use
      const renderProp = ['DatePicker', 'TimePicker'].includes(component) 
        ? 'panelRender' 
        : 'dropdownRender';

      let newProps = propsAndContent.trimEnd();
      
      // Add getPopupContainer if missing
      if (!propsAndContent.includes('getPopupContainer')) {
        newProps += '\n        getPopupContainer={(trigger) => trigger.parentNode}';
        modified = true;
      }

      // Add dropdownRender/panelRender if missing
      if (!propsAndContent.includes(renderProp)) {
        newProps += `\n        ${renderProp}={(menu) => <div data-vaul-no-drag="">{menu}</div>}`;
        modified = true;
      }

      if (modified) {
        // Add proper spacing before closing
        newProps += '\n      ';
        return `<${component} ${newProps}${closing}`;
      }

      return match;
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }

  return false;
}

// Run the script
const srcDir = process.argv[2] || './src';
console.log(`Scanning ${srcDir} for files to fix...\n`);

const files = getAllFiles(srcDir);
let fixedCount = 0;

files.forEach((file) => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✓ Complete! Fixed ${fixedCount} file(s).`);
console.log('\n⚠️  WARNING: Review the changes with git diff before committing!');