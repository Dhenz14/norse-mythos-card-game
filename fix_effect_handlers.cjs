/**
 * Effect Handler Fix Script
 * 
 * This script fixes common issues in the generated effect handler files, including:
 * 1. Fixed variable names with numbers
 * 2. Proper CardInstance casting and creation
 * 3. Consistent targeting approaches
 */

const fs = require('fs');
const path = require('path');

// Paths
const HANDLERS_DIR = path.join(__dirname, 'client', 'src', 'game', 'effects', 'handlers');

// Helper function to fix property variable definitions
function fixPropertyVariables(content) {
  // Replace numeric variables with proper names
  content = content.replace(/const (\d+) = effect\.(\d+);/g, (match, varNum, propNum) => {
    return `const prop${varNum} = effect.${propNum};`;
  });
  
  return content;
}

// Fix CardInstance creation
function fixCardInstanceCreation(content) {
  // Add CardInstance creation if missing
  if (!content.includes('sourceCardInstance')) {
    const instanceCreation = `
  // Create a temporary CardInstance for targeting purposes
  const sourceCardInstance: any = {
    instanceId: 'temp-' + Date.now(),
    card: sourceCard,
    canAttack: false,
    isPlayed: true,
    isSummoningSick: false,
    attacksPerformed: 0
  };`;
    
    // Insert after the function opening
    content = content.replace(
      /export default function [^{]+{/,
      match => `${match}${instanceCreation}`
    );
  }
  
  // Replace direct references to sourceCard in getTargets
  content = content.replace(
    /context\.getTargets\(targetType, sourceCard\)/g,
    'context.getTargets(targetType, sourceCardInstance)'
  );
  
  return content;
}

// Fix array syntax issues
function fixArraySyntax(content) {
  // Replace [...new Set()] with Array.from(new Set())
  content = content.replace(
    /\[\.\.\.(new Set\([^)]+\))\]/g,
    'Array.from($1)'
  );
  
  return content;
}

// Fix property access
function fixPropertyAccess(content) {
  // Add 'as any' for property access like isFrozen
  content = content.replace(
    /target\.isFrozen = (true|false)/g,
    '(target as any).isFrozen = $1'
  );
  
  return content;
}

// Process a single handler file
function processHandlerFile(filePath) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Apply fixes
    let updatedContent = content;
    updatedContent = fixPropertyVariables(updatedContent);
    updatedContent = fixCardInstanceCreation(updatedContent);
    updatedContent = fixArraySyntax(updatedContent);
    updatedContent = fixPropertyAccess(updatedContent);
    
    // Write the file back if changed
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Fixed: ${path.relative(__dirname, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Process all handler files in a directory
function processHandlerDirectory(dirPath) {
  let fixedCount = 0;
  
  // Get all files
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Process subdirectories recursively
      fixedCount += processHandlerDirectory(filePath);
    } else if (file.endsWith('Handler.ts')) {
      // Process handler files
      if (processHandlerFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main function
async function main() {
  try {
    console.log('Starting effect handler fixes...');
    
    // Process all handler types
    const fixedCount = processHandlerDirectory(HANDLERS_DIR);
    
    console.log(`Completed fixes on ${fixedCount} handler files.`);
  } catch (error) {
    console.error('Error fixing effect handlers:', error);
  }
}

// Run the script
main();