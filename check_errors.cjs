/**
 * Script to check for common errors in card files
 * This script analyzes all card files and reports issues
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function findCardFiles() {
  const pattern = 'client/src/game/data/**/*.ts';
  return glob.sync(pattern);
}

function checkCardFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for dangling commas within deathrattle
    const deathrattleRegex = /deathrattle:\s*\{[^}]*,\s*\}/g;
    if (deathrattleRegex.test(content)) {
      issues.push('Dangling comma in deathrattle object');
    }

    // Check for collectible property in deathrattle
    const deathrattleCollectibleRegex = /deathrattle:\s*\{[^}]*collectible:[^}]*\}/g;
    if (deathrattleCollectibleRegex.test(content)) {
      issues.push('collectible property inside deathrattle object');
    }
    
    // Check for collectible property in battlecry
    const battlecryCollectibleRegex = /battlecry:\s*\{[^}]*collectible:[^}]*\}/g;
    if (battlecryCollectibleRegex.test(content)) {
      issues.push('collectible property inside battlecry object');
    }
    
    // Check for duplicate class property
    const duplicateClassRegex = /class:\s*"[^"]+"\s*,[^{}]*class:/g;
    if (duplicateClassRegex.test(content)) {
      issues.push('duplicate class property in card definition');
    }
    
    // Check for missing closing braces
    const unclosedObjectRegex = /\{[^}]*\{[^}]*$/g;
    if (unclosedObjectRegex.test(content)) {
      issues.push('potentially unclosed object (missing closing brace)');
    }
    
    // Return the results
    return {
      filepath: filePath,
      issues: issues
    };
    
  } catch (error) {
    log(`Error checking ${filePath}: ${error.message}`, 'error');
    return {
      filepath: filePath,
      issues: [`File read error: ${error.message}`]
    };
  }
}

function main() {
  const files = findCardFiles();
  log(`Found ${files.length} card files to check`);
  
  let totalIssues = 0;
  const fileIssues = [];
  
  files.forEach(file => {
    const result = checkCardFile(file);
    if (result.issues.length > 0) {
      fileIssues.push(result);
      totalIssues += result.issues.length;
    }
  });
  
  if (fileIssues.length > 0) {
    log(`Found ${totalIssues} issues in ${fileIssues.length} files:`, 'warn');
    fileIssues.forEach(fileIssue => {
      log(`${fileIssue.filepath}:`, 'warn');
      fileIssue.issues.forEach(issue => {
        log(`  - ${issue}`, 'warn');
      });
    });
  } else {
    log('No issues found in any files. All checks passed!');
  }
}

main();