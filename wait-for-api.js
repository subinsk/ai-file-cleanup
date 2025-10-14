#!/usr/bin/env node

/**
 * Wait for API to be ready before starting desktop/web apps
 */

const http = require('http');

const API_URL = 'http://localhost:3001/docs';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1 second

let retries = 0;

function checkAPI() {
  return new Promise((resolve, reject) => {
    http
      .get(API_URL, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function waitForAPI() {
  console.log('⏳ Waiting for API server to be ready...');

  while (retries < MAX_RETRIES) {
    try {
      await checkAPI();
      console.log('✓ API server is ready!');
      return true;
    } catch (err) {
      retries++;
      if (retries >= MAX_RETRIES) {
        console.error('\n✗ API server failed to start after 30 seconds');
        console.error('Please check if:');
        console.error('  1. Python virtual environment is activated');
        console.error('  2. Dependencies are installed: pip install -r requirements.txt');
        console.error('  3. No other process is using port 3001');
        console.error('\nTry running manually: cd services/api && python run.py\n');
        process.exit(1);
      }
      process.stdout.write('.');
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

waitForAPI();
