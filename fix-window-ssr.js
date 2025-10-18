#!/usr/bin/env node

/**
 * SSR Window Access Scanner
 * Detects all potentially problematic browser API usage in React/Next.js projects
 * 
 * Usage: node scan-window-access.js
 * 
 * Install dependencies first:
 * npm install @babel/parser @babel/traverse glob chalk
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { glob } = require('glob');
const chalk = require('chalk');

// Browser-only APIs that cause SSR issues
const BROWSER_APIS = {
  window: ['window', 'self', 'frames'],
  document: ['document'],
  navigator: ['navigator'],
  location: ['location'],
  localStorage: ['localStorage', 'sessionStorage'],
  indexedDB: ['indexedDB'],
  history: ['history'],
  screen: ['screen'],
  performance: ['performance'],
  crypto: ['crypto'],
  intersection: ['IntersectionObserver', 'ResizeObserver', 'MutationObserver'],
  media: ['Image', 'Audio', 'Video', 'MediaRecorder'],
  webrtc: ['RTCPeerConnection', 'RTCSessionDescription'],
  animation: ['requestAnimationFrame', 'cancelAnimationFrame'],
  timers: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'],
  fetch: ['fetch', 'XMLHttpRequest'],
  events: ['addEventListener', 'removeEventListener'],
  dom: ['Element', 'HTMLElement', 'Node', 'NodeList'],
  intl: ['Intl'], // Can be problematic in older Node versions
  url: ['URL', 'URLSearchParams'], // Available in Node but often used with window
};

// Safe contexts where browser APIs are allowed
const SAFE_CONTEXTS = [
  'useEffect',
  'useLayoutEffect',
  'componentDidMount',
  'componentDidUpdate',
  'componentWillUnmount',
  'addEventListener',
  'removeEventListener',
];

// Patterns that indicate safe usage
const SAFE_PATTERNS = [
  /typeof\s+window\s*!==\s*['"](undefined|object)['"]/,
  /typeof\s+window\s*===\s*['"](undefined|object)['"]/,
  /window\s*!==\s*undefined/,
  /window\s*===\s*undefined/,
  /typeof\s+global\s*!==\s*['"](undefined|object)['"]/,
  /process\.browser/,
  /import\(['"]next\/dynamic['"]\)/,
  /@babel\/polyfill/,
  /\{ssr:\s*false\}/,
];

class WindowAccessScanner {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      include: options.include || ['**/*.{js,jsx,ts,tsx}'],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.config.{js,ts}',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
      ],
      verbose: options.verbose || false,
    };

    this.issues = [];
    this.fileCount = 0;
    this.scannedFiles = new Set();
  }

  /**
   * Main scanning function
   */
  async scan() {
    console.log(chalk.cyan.bold('\n🔍 Starting SSR Window Access Scan...\n'));
    
    const files = await this.getFiles();
    console.log(chalk.gray(`Found ${files.length} files to scan\n`));

    for (const file of files) {
      await this.scanFile(file);
    }

    this.printResults();
    return this.issues;
  }

  /**
   * Get all files to scan
   */
  async getFiles() {
    const files = [];
    
    for (const pattern of this.options.include) {
      const matches = await glob(pattern, {
        cwd: this.options.rootDir,
        ignore: this.options.exclude,
        absolute: true,
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Scan a single file
   */
  async scanFile(filePath) {
    try {
      this.fileCount++;
      const relativePath = path.relative(this.options.rootDir, filePath);
      
      if (this.options.verbose) {
        console.log(chalk.gray(`Scanning: ${relativePath}`));
      }

      const code = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(filePath);
      
      // Skip if file has "use client" directive at the top
      if (this.hasUseClientDirective(code)) {
        if (this.options.verbose) {
          console.log(chalk.yellow(`  ⚠️  Skipping (has "use client")`));
        }
        return;
      }

      const ast = this.parseCode(code, ext);
      if (!ast) return;

      this.scannedFiles.add(relativePath);
      this.traverseAST(ast, filePath, code);

    } catch (error) {
      if (this.options.verbose) {
        console.error(chalk.red(`Error scanning ${filePath}:`), error.message);
      }
    }
  }

  /**
   * Check if file has "use client" directive
   */
  hasUseClientDirective(code) {
    const firstLines = code.split('\n').slice(0, 5).join('\n');
    return /['"]use client['"]/.test(firstLines);
  }

  /**
   * Parse code into AST
   */
  parseCode(code, ext) {
    const plugins = [
      'jsx',
      'typescript',
      'classProperties',
      'decorators-legacy',
      'dynamicImport',
      'objectRestSpread',
      'optionalChaining',
      'nullishCoalescingOperator',
    ];

    try {
      return parse(code, {
        sourceType: 'module',
        plugins,
      });
    } catch (error) {
      if (this.options.verbose) {
        console.error(chalk.red('Parse error:'), error.message);
      }
      return null;
    }
  }

  /**
   * Traverse AST and detect issues
   */
  traverseAST(ast, filePath, code) {
    const self = this;
    const lines = code.split('\n');
    const relativePath = path.relative(this.options.rootDir, filePath);

    // Track context
    let currentFunction = null;
    let insideSafeContext = false;
    let functionStack = [];

    traverse(ast, {
      // Track function context
      FunctionDeclaration(path) {
        functionStack.push(path.node.id?.name || 'anonymous');
      },
      FunctionExpression(path) {
        functionStack.push('function expression');
      },
      ArrowFunctionExpression(path) {
        functionStack.push('arrow function');
      },
      
      // Check for safe contexts (useEffect, etc.)
      CallExpression(path) {
        const calleeName = this.getCalleeName(path.node.callee);
        
        if (SAFE_CONTEXTS.includes(calleeName)) {
          insideSafeContext = true;
        }
      },

      // Check Member Expressions (window.something, document.something)
      MemberExpression(path) {
        if (insideSafeContext) return;

        const objectName = this.getObjectName(path.node.object);
        const propertyName = this.getPropertyName(path.node.property);
        
        if (this.isBrowserAPI(objectName) || this.isBrowserAPI(propertyName)) {
          const loc = path.node.loc;
          
          if (!this.isSafeUsage(path, code, loc)) {
            self.addIssue({
              file: relativePath,
              line: loc.start.line,
              column: loc.start.column + 1,
              code: lines[loc.start.line - 1].trim(),
              api: objectName || propertyName,
              type: 'member-access',
              context: functionStack[functionStack.length - 1] || 'global',
              severity: this.getSeverity(objectName || propertyName),
            });
          }
        }
      },

      // Check Identifiers (direct usage like localStorage, navigator)
      Identifier(path) {
        if (insideSafeContext) return;
        
        // Skip if it's a property of an object
        if (path.parent.type === 'MemberExpression' && path.parent.property === path.node) {
          return;
        }

        const name = path.node.name;
        
        if (this.isBrowserAPI(name)) {
          const loc = path.node.loc;
          
          if (!this.isSafeUsage(path, code, loc)) {
            self.addIssue({
              file: relativePath,
              line: loc.start.line,
              column: loc.start.column + 1,
              code: lines[loc.start.line - 1].trim(),
              api: name,
              type: 'identifier',
              context: functionStack[functionStack.length - 1] || 'global',
              severity: this.getSeverity(name),
            });
          }
        }
      },

      // Check useState/useMemo with browser API
      VariableDeclarator(path) {
        if (path.node.init) {
          const initCode = code.substring(path.node.init.start, path.node.init.end);
          
          // Check for useState(() => window.something) or useState(window.something)
          if (
            path.node.init.type === 'CallExpression' &&
            (this.getCalleeName(path.node.init.callee) === 'useState' ||
             this.getCalleeName(path.node.init.callee) === 'useMemo')
          ) {
            const arg = path.node.init.arguments[0];
            if (arg && this.containsBrowserAPI(initCode)) {
              const loc = path.node.loc;
              self.addIssue({
                file: relativePath,
                line: loc.start.line,
                column: loc.start.column + 1,
                code: lines[loc.start.line - 1].trim(),
                api: 'window (in state initialization)',
                type: 'state-initialization',
                context: 'useState/useMemo',
                severity: 'critical',
              });
            }
          }
        }
      },

      // Exit function contexts
      'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': {
        exit() {
          functionStack.pop();
          insideSafeContext = false;
        }
      },
    });
  }

  /**
   * Helper to get callee name
   */
  getCalleeName(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    if (node.type === 'MemberExpression') {
      return this.getPropertyName(node.property);
    }
    return null;
  }

  /**
   * Helper to get object name from MemberExpression
   */
  getObjectName(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    if (node.type === 'MemberExpression') {
      return this.getObjectName(node.object);
    }
    return null;
  }

  /**
   * Helper to get property name
   */
  getPropertyName(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    return null;
  }

  /**
   * Check if identifier is a browser API
   */
  isBrowserAPI(name) {
    if (!name) return false;
    
    for (const category in BROWSER_APIS) {
      if (BROWSER_APIS[category].includes(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if usage is safe (has typeof check, etc.)
   */
  isSafeUsage(path, code, loc) {
    // Get surrounding code context (5 lines before and after)
    const lines = code.split('\n');
    const startLine = Math.max(0, loc.start.line - 6);
    const endLine = Math.min(lines.length, loc.start.line + 5);
    const context = lines.slice(startLine, endLine).join('\n');

    // Check for safe patterns
    for (const pattern of SAFE_PATTERNS) {
      if (pattern.test(context)) {
        return true;
      }
    }

    // Check if inside a typeof check
    let currentPath = path;
    while (currentPath) {
      if (currentPath.node.type === 'BinaryExpression') {
        const left = code.substring(currentPath.node.left.start, currentPath.node.left.end);
        const right = code.substring(currentPath.node.right.start, currentPath.node.right.end);
        
        if (
          (left.includes('typeof') && right.includes('undefined')) ||
          (right.includes('typeof') && left.includes('undefined'))
        ) {
          return true;
        }
      }
      
      currentPath = currentPath.parentPath;
    }

    return false;
  }

  /**
   * Check if code contains browser API
   */
  containsBrowserAPI(code) {
    for (const category in BROWSER_APIS) {
      for (const api of BROWSER_APIS[category]) {
        if (new RegExp(`\\b${api}\\b`).test(code)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get severity level
   */
  getSeverity(api) {
    const critical = ['window', 'document', 'localStorage', 'sessionStorage'];
    const high = ['navigator', 'location', 'history'];
    
    if (critical.includes(api)) return 'critical';
    if (high.includes(api)) return 'high';
    return 'medium';
  }

  /**
   * Add issue to list
   */
  addIssue(issue) {
    this.issues.push(issue);
  }

  /**
   * Print results
   */
  printResults() {
    console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
    console.log(chalk.cyan.bold('📊 Scan Results'));
    console.log(chalk.cyan.bold('='.repeat(80) + '\n'));

    console.log(chalk.gray(`Files scanned: ${this.fileCount}`));
    console.log(chalk.gray(`Files with issues: ${new Set(this.issues.map(i => i.file)).size}`));
    console.log(chalk.gray(`Total issues found: ${this.issues.length}\n`));

    if (this.issues.length === 0) {
      console.log(chalk.green.bold('✅ No SSR issues detected!\n'));
      return;
    }

    // Group by severity
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    const medium = this.issues.filter(i => i.severity === 'medium');

    if (critical.length > 0) {
      console.log(chalk.red.bold(`🚨 Critical Issues (${critical.length}):`));
      this.printIssues(critical);
    }

    if (high.length > 0) {
      console.log(chalk.yellow.bold(`⚠️  High Priority Issues (${high.length}):`));
      this.printIssues(high);
    }

    if (medium.length > 0) {
      console.log(chalk.blue.bold(`ℹ️  Medium Priority Issues (${medium.length}):`));
      this.printIssues(medium);
    }

    console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
    console.log(chalk.cyan.bold('💡 Recommendations'));
    console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
    
    console.log(chalk.white('1. Initialize state with safe defaults:'));
    console.log(chalk.gray('   const [state, setState] = useState(false);'));
    console.log(chalk.gray('   useEffect(() => { setState(window.innerWidth); }, []);\n'));
    
    console.log(chalk.white('2. Check for window before accessing:'));
    console.log(chalk.gray('   if (typeof window !== "undefined") { ... }\n'));
    
    console.log(chalk.white('3. Use dynamic imports with ssr: false:'));
    console.log(chalk.gray('   const Component = dynamic(() => import("..."), { ssr: false });\n'));
    
    console.log(chalk.white('4. Move browser code to useEffect/useLayoutEffect\n'));
  }

  /**
   * Print issues for a severity level
   */
  printIssues(issues) {
    const grouped = this.groupByFile(issues);
    
    for (const [file, fileIssues] of Object.entries(grouped)) {
      console.log(chalk.white.bold(`\n📄 ${file}`));
      
      for (const issue of fileIssues) {
        const location = chalk.gray(`   Line ${issue.line}:${issue.column}`);
        const api = chalk.cyan(`[${issue.api}]`);
        const context = chalk.gray(`in ${issue.context}`);
        
        console.log(`${location} ${api} ${context}`);
        console.log(chalk.gray(`   ${issue.code}`));
      }
    }
    console.log('');
  }

  /**
   * Group issues by file
   */
  groupByFile(issues) {
    const grouped = {};
    
    for (const issue of issues) {
      if (!grouped[issue.file]) {
        grouped[issue.file] = [];
      }
      grouped[issue.file].push(issue);
    }
    
    return grouped;
  }
}

// Run the scanner
async function main() {
  const scanner = new WindowAccessScanner({
    rootDir: process.cwd(),
    include: [
      'src/**/*.{js,jsx,ts,tsx}',
      'app/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/*.config.{js,ts}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
    ],
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  });

  const issues = await scanner.scan();
  
  // Exit with error code if critical issues found
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  if (criticalCount > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = WindowAccessScanner;