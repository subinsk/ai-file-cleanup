#!/usr/bin/env node
/**
 * Generate Prisma Python client before commit
 * This ensures the generated client is always up-to-date in the repo
 */
/* eslint-disable @typescript-eslint/no-var-requires, no-console */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const apiDir = path.join(rootDir, 'services', 'api');
const schemaPath = path.join(rootDir, 'packages', 'db', 'prisma', 'schema.prisma');

// Detect shell
const isWindows = process.platform === 'win32';
const isPowerShell = process.env.SHELL === undefined && isWindows;
const shell = isPowerShell ? 'powershell' : isWindows ? 'cmd' : 'bash';

console.log('🔄 Generating Prisma Python client...');
console.log(`ℹ️  Detected shell: ${shell} (${process.platform})`);

// Check for Node.js and pnpm (required for Prisma Python generation)
let nodeAvailable = false;
let pnpmAvailable = false;

try {
  execSync('node --version', { stdio: 'ignore' });
  nodeAvailable = true;
} catch (error) {
  console.error('❌ Node.js not found in PATH');
}

try {
  execSync('pnpm --version', { stdio: 'ignore' });
  pnpmAvailable = true;
} catch (error) {
  console.error('❌ pnpm not found in PATH');
}

if (!nodeAvailable || !pnpmAvailable) {
  console.error('');
  console.error('❌ Prisma Python requires Node.js and pnpm for client generation');
  console.error('ℹ️  Please install:');
  console.error('   1. Node.js: https://nodejs.org/');
  console.error('   2. pnpm: npm install -g pnpm');
  console.error('');
  console.error('❌ Commit blocked: Node.js/pnpm required for Prisma generation');
  process.exit(1);
}

// Check if schema exists
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema not found at: ${schemaPath}`);
  process.exit(1);
}

// Check for Python - MUST use venv Python (where Prisma is installed)
let pythonCmd = null;
const venvPythonExe = path.join(
  apiDir,
  'venv',
  process.platform === 'win32' ? 'Scripts' : 'bin',
  process.platform === 'win32' ? 'python.exe' : 'python'
);
const venvPython = path.join(
  apiDir,
  'venv',
  process.platform === 'win32' ? 'Scripts' : 'bin',
  'python'
);
const venvPython3 = path.join(
  apiDir,
  'venv',
  process.platform === 'win32' ? 'Scripts' : 'bin',
  'python3'
);

// Check venv Python first (where Prisma is installed)
if (fs.existsSync(venvPythonExe)) {
  pythonCmd = venvPythonExe;
} else if (fs.existsSync(venvPython)) {
  pythonCmd = venvPython;
} else if (fs.existsSync(venvPython3)) {
  pythonCmd = venvPython3;
} else {
  console.error('❌ Python venv not found in services/api/venv');
  console.error('ℹ️  Please set up the venv:');
  console.error('   cd services/api');
  console.error('   python -m venv venv');
  console.error(`   ${process.platform === 'win32' ? 'venv\\Scripts\\pip' : 'venv/bin/pip'} install -r requirements.txt`);
  console.error('');
  console.error('❌ Commit blocked: Prisma client must be generated before commit');
  process.exit(1); // Fail the commit
}

try {
  // Generate Prisma client from API directory
  // Prisma Python needs Node.js/pnpm in PATH to spawn prisma-client-py
  // Get Node.js and pnpm paths
  let nodePath = '';
  let pnpmPath = '';
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    const whereNode = execSync(isWindows ? 'where node' : 'which node', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    nodePath = path.dirname(whereNode.split('\n')[0]);
    console.log(`ℹ️  Node.js found: ${nodeVersion} at ${nodePath}`);
  } catch (error) {
    // Ignore
  }
  
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    const wherePnpm = execSync(isWindows ? 'where pnpm' : 'which pnpm', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    pnpmPath = path.dirname(wherePnpm.split('\n')[0]);
    console.log(`ℹ️  pnpm found: ${pnpmVersion} at ${pnpmPath}`);
  } catch (error) {
    // Ignore
  }
  
  // Build PATH with Node.js and pnpm directories first
  const currentPath = process.env.PATH || process.env.Path || '';
  const pathParts = [nodePath, pnpmPath, currentPath].filter(Boolean);
  const newPath = pathParts.join(isWindows ? ';' : ':');
  
  // Try to ensure Prisma CLI is available
  // Prisma Python needs the Prisma CLI binary, which it downloads via pnpm
  console.log('ℹ️  Ensuring Prisma CLI is available...');
  
  let prismaInstalled = false;
  let prismaCliPath = '';
  
  // First check if Prisma CLI is already available
  try {
    const prismaVersion = execSync('prisma --version', {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, PATH: newPath },
    }).trim();
    console.log(`✅ Prisma CLI already installed: ${prismaVersion}`);
    prismaInstalled = true;
    
    // Get Prisma CLI path
    try {
      const wherePrisma = execSync(isWindows ? 'where prisma' : 'which prisma', {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, PATH: newPath },
      }).trim();
      prismaCliPath = wherePrisma.split('\n')[0];
      console.log(`ℹ️  Prisma CLI found at: ${prismaCliPath}`);
    } catch (error) {
      // Ignore
    }
  } catch (error) {
    // Prisma CLI not found, try to install it
    console.log('⚠️  Prisma CLI not found, installing...');
    try {
      // Try to install Prisma CLI globally using npm (more reliable than pnpm for global installs)
      execSync('npm install -g prisma@latest', {
        stdio: 'inherit', // Show output to verify installation
        env: { ...process.env, PATH: newPath },
        timeout: 60000, // 60 second timeout
      });
      
      // Verify installation
      try {
        const prismaVersion = execSync('prisma --version', {
          encoding: 'utf-8',
          stdio: 'pipe',
          env: { ...process.env, PATH: newPath },
        }).trim();
        console.log(`✅ Prisma CLI installed successfully: ${prismaVersion}`);
        prismaInstalled = true;
      } catch (verifyError) {
        console.error('❌ Prisma CLI installation verification failed');
        throw verifyError;
      }
    } catch (error) {
      // If npm install fails, try pnpm
      console.log('⚠️  npm install failed, trying pnpm...');
      try {
        execSync('pnpm install -g prisma@latest', {
          stdio: 'inherit',
          env: { ...process.env, PATH: newPath },
          timeout: 60000,
        });
        
        // Verify installation
        try {
          const prismaVersion = execSync('prisma --version', {
            encoding: 'utf-8',
            stdio: 'pipe',
            env: { ...process.env, PATH: newPath },
          }).trim();
          console.log(`✅ Prisma CLI installed successfully via pnpm: ${prismaVersion}`);
          prismaInstalled = true;
        } catch (verifyError) {
          console.error('❌ Prisma CLI installation verification failed');
          throw verifyError;
        }
      } catch (error2) {
        console.error('❌ Failed to install Prisma CLI');
        console.error('ℹ️  Prisma Python will try to download it, but this may fail');
      }
    }
  }
  
  if (!prismaInstalled) {
    console.warn('⚠️  Prisma CLI not available - generation may fail');
  }
  
  // Prisma Python needs to be able to download/install Prisma CLI binaries
  // Don't skip postinstall - let it install what it needs
  const env = {
    ...process.env,
    // Don't skip postinstall - Prisma Python needs to install binaries
    // PRISMA_SKIP_POSTINSTALL_GENERATE: '1', // Commented out - let Prisma Python install binaries
    PATH: newPath,
    Path: newPath, // Windows uses both PATH and Path
    // Ensure npm/pnpm cache is accessible
    npm_config_cache: process.env.npm_config_cache || '',
    // Help Prisma Python find Node.js
    NODE_PATH: nodePath,
    // Ensure Prisma CLI is in PATH for Prisma Python to find
    PRISMA_CLI_BINARY_PATH: prismaCliPath || '',
  };

  const relativeSchemaPath = path.relative(apiDir, schemaPath).replace(/\\/g, '/');

  // Quote Python path if it contains spaces (Windows paths)
  const pythonCmdQuoted = pythonCmd.includes(' ') ? `"${pythonCmd}"` : pythonCmd;

  console.log(`Running: ${pythonCmdQuoted} -m prisma generate --schema ${relativeSchemaPath}`);
  console.log(`ℹ️  Using Python: ${pythonCmd}`);
  console.log(`ℹ️  Node.js: ${nodeAvailable ? '✅' : '❌'}, pnpm: ${pnpmAvailable ? '✅' : '❌'}`);

  // Use shell on Windows for proper PATH handling
  const execOptions = {
    stdio: 'inherit',
    env,
    cwd: apiDir,
    shell: isWindows,
    // Ensure we can find executables
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  };

  // On Windows PowerShell, use cmd.exe for better compatibility
  if (isPowerShell) {
    execOptions.shell = 'C:\\Windows\\System32\\cmd.exe';
  }

  // Ensure Prisma Python has its binaries installed
  // Prisma Python needs to run postinstall to download binaries
  console.log('ℹ️  Ensuring Prisma Python binaries are installed...');
  try {
    // Try to trigger Prisma Python's postinstall by reinstalling it
    execSync(`${pythonCmdQuoted} -m pip install --force-reinstall --no-deps prisma==0.15.0`, {
      stdio: 'pipe',
      env,
      cwd: apiDir,
      shell: isPowerShell ? 'C:\\Windows\\System32\\cmd.exe' : isWindows,
      timeout: 120000, // 2 minute timeout
    });
    console.log('✅ Prisma Python package reinstalled (binaries should be available)');
  } catch (error) {
    console.log('ℹ️  Prisma Python will download binaries during generation...');
  }
  
  console.log('ℹ️  Generating Prisma client...');
  execSync(`${pythonCmdQuoted} -m prisma generate --schema ${relativeSchemaPath}`, execOptions);

  console.log('✅ Prisma client generated successfully!');

  // Stage any generated Prisma files
  // Prisma Python generates files in various locations, try to find and stage them
  const possiblePaths = [
    path.join(apiDir, 'prisma'),
    path.join(apiDir, '.prisma'),
    path.join(rootDir, 'prisma'),
  ];

  let staged = false;
  for (const prismaPath of possiblePaths) {
    if (fs.existsSync(prismaPath)) {
      try {
        // Change to root to stage files properly
        execSync(`git add ${path.relative(rootDir, prismaPath)}`, {
          stdio: 'ignore',
          cwd: rootDir,
        });
        staged = true;
        console.log(`✅ Staged Prisma files from: ${path.relative(rootDir, prismaPath)}`);
      } catch (error) {
        // Continue trying other paths
      }
    }
  }

  // Also try to stage any new/modified files in the API directory that might be Prisma-related
  try {
    execSync('git add -u', { stdio: 'ignore', cwd: apiDir });
    execSync('git add .', { stdio: 'ignore', cwd: apiDir });
  } catch (error) {
    // Ignore errors - files might already be staged
  }

  if (!staged) {
    console.log('ℹ️  Note: Generated Prisma files may need to be manually staged');
    console.log('ℹ️  Run: git add services/api/prisma/ (or wherever Prisma generated files)');
  }
} catch (error) {
  console.error('❌ Failed to generate Prisma client:');
  console.error(error.message);
  
  // Check for specific error types
  if (error.message.includes('ENOENT') || error.message.includes('spawn')) {
    console.error('');
    console.error('⚠️  This error usually means Prisma Python cannot find Node.js Prisma CLI');
    console.error('ℹ️  Prisma Python requires Node.js/pnpm to generate the client');
    console.error('');
    console.error('Try:');
    console.error('   1. Make sure Node.js and pnpm are in your PATH');
    console.error('   2. Restart your terminal/PowerShell after installing Node.js');
    console.error('   3. Verify: node --version && pnpm --version');
    console.error('   4. Generate manually: pnpm api:generate-prisma');
  }
  
  console.error('');
  console.error('❌ Commit blocked: Prisma client generation failed');
  console.error('ℹ️  Make sure:');
  console.error('   1. Python venv is set up: cd services/api && python -m venv venv');
  console.error('   2. Prisma is installed: venv\\Scripts\\pip install -r requirements.txt');
  console.error('   3. Node.js and pnpm are installed and in PATH');
  console.error('   4. Or generate manually: pnpm api:generate-prisma');
  console.error('');
  process.exit(1); // Fail the commit - don't allow commit without generated client
}
