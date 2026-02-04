/**
 * Script to fix duplicate class property in additionalClassMinions.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message, level = 'info') {
  const levels = {
    info: '\x1b[32m%s\x1b[0m', // green
    warn: '\x1b[33m%s\x1b[0m', // yellow
    error: '\x1b[31m%s\x1b[0m', // red
  };
  console.log(levels[level] || levels.info, message);
}

function fixFile(filePath) {
  log(`Processing ${filePath}...`);
  
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix duplicate class property
  const fixedContent = content.replace(
    /class: "([^"]+)", class: "([^"]+)"/g, 
    'class: "$1"'
  );
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  
  log(`Fixed file: ${filePath}`, 'info');
}

function main() {
  const filePath = path.join('client', 'src', 'game', 'data', 'additionalClassMinions.ts');
  
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'error');
    return;
  }
  
  fixFile(filePath);
  log('Duplicate class properties fixed!', 'info');
}

main();