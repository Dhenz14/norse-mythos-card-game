/**
 * Advanced script to find any standalone objects marked as collectible
 * that are not proper card definitions
 * 
 * This script analyzes all .ts files in the project to look for objects
 * with collectible: true but missing other essential card properties
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

// Find all TypeScript files in the game data directory
function findAllTypeScriptFiles() {
  return glob.sync('client/src/game/data/**/*.ts');
}

// Check if an object is missing essential card properties
function isMissingEssentialProperties(str) {
  const hasCollectible = str.includes('collectible: true');
  if (!hasCollectible) return false;
  
  // Check if it has essential card properties
  const hasId = /id:\s*\d+/.test(str);
  const hasName = /name:\s*["']/.test(str);
  const hasType = /type:\s*["']/.test(str);
  
  return hasCollectible && (!hasId || !hasName || !hasType);
}

// Extract problematic object from file content
function extractProblematicObject(content, index) {
  let startIndex = content.lastIndexOf('{', index);
  let endIndex = content.indexOf('}', index) + 1;
  
  // Check if we're in a nested object
  let braceCount = 1;
  let i = startIndex + 1;
  
  while (i < content.length && braceCount > 0) {
    if (content[i] === '{') braceCount++;
    else if (content[i] === '}') braceCount--;
    i++;
  }
  
  if (braceCount === 0) {
    endIndex = i;
  }
  
  return content.substring(startIndex, endIndex);
}

// Analyze file for problematic objects
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const collectibleMatches = content.match(/collectible:\s*true/g);
    
    if (!collectibleMatches) return;
    
    for (let i = 0; i < collectibleMatches.length; i++) {
      const matchIndex = content.indexOf(collectibleMatches[i]);
      const objectContext = extractProblematicObject(content, matchIndex);
      
      if (isMissingEssentialProperties(objectContext)) {
        log(`Found problematic object in ${filePath}:`, 'warn');
        log(`${objectContext}`, 'warn');
        
        // Get more context to help locate the issue
        const startContext = Math.max(0, matchIndex - 200);
        const endContext = Math.min(content.length, matchIndex + 200);
        const expandedContext = content.substring(startContext, endContext);
        
        log(`Expanded context: ${expandedContext}`, 'warn');
      }
    }
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
  }
}

// Main function
function main() {
  const files = findAllTypeScriptFiles();
  log(`Found ${files.length} TypeScript files in the game data directory.`);
  
  for (const file of files) {
    analyzeFile(file);
  }
}

// Run the script
main();