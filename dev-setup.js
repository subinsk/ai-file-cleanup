#!/usr/bin/env node

/**
 * Development Setup Script
 * Prepares the entire development environment before starting services
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function step(message) {
  log(`\n${colors.bright}${colors.blue}▶ ${message}${colors.reset}`);
}

function success(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function error(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function warning(message) {
  log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (err) {
    return false;
  }
}

function fileExists(filepath) {
  return fs.existsSync(filepath);
}

function copyEnvExample(source, dest) {
  if (!fileExists(dest)) {
    if (fileExists(source)) {
      fs.copyFileSync(source, dest);
      success(`Created ${dest}`);
      return true;
    } else {
      warning(`Example file not found: ${source}`);
      return false;
    }
  } else {
    log(`  ${dest} already exists`, colors.cyan);
    return true;
  }
}

// Main setup function
async function setup() {
  log(
    `\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`
  );
  log(`${colors.bright}${colors.cyan}║   AI File Cleanup - Development Setup    ║${colors.reset}`);
  log(
    `${colors.bright}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`
  );

  // Step 1: Check Node and pnpm versions
  step('Checking environment...');
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    const pnpmVersion = execSync('pnpm --version').toString().trim();
    success(`Node ${nodeVersion}, pnpm ${pnpmVersion}`);
  } catch (err) {
    error('Node or pnpm not found. Please install them first.');
    process.exit(1);
  }

  // Step 2: Install dependencies
  step('Installing dependencies...');
  if (exec('pnpm install')) {
    success('Dependencies installed');
  } else {
    error('Failed to install dependencies');
    process.exit(1);
  }

  // Step 3: Setup environment files
  step('Setting up environment files...');
  const envFiles = [
    { source: 'env.example', dest: '.env' },
    { source: 'apps/web/env.example', dest: 'apps/web/.env.local' },
    { source: 'apps/desktop/env.example', dest: 'apps/desktop/.env' },
  ];

  envFiles.forEach(({ source, dest }) => {
    copyEnvExample(source, dest);
  });

  // Step 4: Generate Prisma Client
  step('Generating Prisma client...');
  if (exec('pnpm --filter @ai-cleanup/db db:generate')) {
    success('Prisma client generated');
  } else {
    warning('Failed to generate Prisma client (database might not be configured)');
  }

  // Step 5: Build shared packages
  step('Building shared packages...');
  const packagesToBuild = [
    '@ai-cleanup/types',
    '@ai-cleanup/core',
    '@ai-cleanup/db',
    '@ai-cleanup/ui',
  ];

  for (const pkg of packagesToBuild) {
    log(`  Building ${pkg}...`, colors.cyan);
    if (exec(`pnpm --filter ${pkg} build`, { stdio: 'pipe' })) {
      success(`  ${pkg} built`);
    } else {
      warning(`  ${pkg} build failed (may not be critical)`);
    }
  }

  // Step 6: Build electron main process
  step('Building desktop electron main process...');
  if (exec('pnpm --filter @ai-cleanup/desktop build:electron')) {
    success('Electron main process built');
  } else {
    error('Failed to build electron main process');
  }

  // Step 7: Check Python and API dependencies
  step('Checking Python API setup...');
  const venvPath = path.join('services', 'api', 'venv');
  if (fileExists(venvPath)) {
    success('Python virtual environment found');
  } else {
    warning('Python virtual environment not found');
    log(
      '  Run: cd services/api && python -m venv venv && pip install -r requirements.txt',
      colors.yellow
    );
  }

  // Final summary
  log(
    `\n${colors.bright}${colors.green}╔════════════════════════════════════════════╗${colors.reset}`
  );
  log(
    `${colors.bright}${colors.green}║     Setup Complete! Ready to develop!     ║${colors.reset}`
  );
  log(
    `${colors.bright}${colors.green}╚════════════════════════════════════════════╝${colors.reset}\n`
  );

  log('Next steps:', colors.cyan);
  log('  1. Start database: Docker or local PostgreSQL', colors.yellow);
  log('  2. Run migrations: pnpm db:push', colors.yellow);
  log('  3. Start development: pnpm dev', colors.yellow);
  log('\n');
}

// Run setup
setup().catch((err) => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});
