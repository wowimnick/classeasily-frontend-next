#!/usr/bin/env node

/**
 * Environment Variable Loader for Next.js 15
 * Handles .env file loading based on STAGE and NODE_ENV
 * 
 * Usage in package.json:
 * "dev": "node load-env.js && next dev --turbopack"
 * "start": "node load-env.js && next start"
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`ℹ️  ${path.basename(filePath)} not found, skipping...`);
    return;
  }

  console.log(`✅ Loading ${path.basename(filePath)}`);
  const envContent = fs.readFileSync(filePath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) return;
    
    const key = match[1].trim();
    const value = match[2].trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\\n/g, '\n'); // Handle newlines
    
    // Only set if not already defined (allows override via actual env vars)
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

// Determine which env file to load
const stage = process.env.STAGE;
const nodeEnv = process.env.NODE_ENV;
const isProduction = nodeEnv === 'production';
const isDevelopment = nodeEnv === 'development' || (!nodeEnv && !stage);

console.log('🔧 Environment Configuration:');
console.log(`   NODE_ENV: ${nodeEnv || 'not set'}`);
console.log(`   STAGE: ${stage || 'not set'}`);

// Load order (later files override earlier ones):
// 1. .env (base)
// 2. .env.local (local overrides, gitignored)
// 3. .env.production (production-specific)
// 4. .env.production.local (production local overrides)

const rootDir = process.cwd();

// Always load base .env
loadEnvFile(path.join(rootDir, '.env'));

// Load based on configuration
if (stage === 'test') {
  // Test stage uses production env
  console.log('📋 Mode: TEST (using production env)');
  loadEnvFile(path.join(rootDir, '.env.production'));
  loadEnvFile(path.join(rootDir, '.env.production.local'));
} else if (isDevelopment) {
  // Development: prioritize .env.local
  console.log('📋 Mode: DEVELOPMENT (using local env)');
  loadEnvFile(path.join(rootDir, '.env.development'));
  loadEnvFile(path.join(rootDir, '.env.local'));
  loadEnvFile(path.join(rootDir, '.env.development.local'));
} else if (isProduction) {
  // Production build/start
  console.log('📋 Mode: PRODUCTION');
  loadEnvFile(path.join(rootDir, '.env.production'));
  loadEnvFile(path.join(rootDir, '.env.production.local'));
} else {
  // Fallback to .env.local for unknown states
  console.log('📋 Mode: DEFAULT (using local env)');
  loadEnvFile(path.join(rootDir, '.env.local'));
}

console.log('✨ Environment loaded successfully\n');