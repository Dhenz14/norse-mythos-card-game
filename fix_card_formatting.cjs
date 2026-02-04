/**
 * Card Formatting Fix Script
 * 
 * This script systematically fixes formatting issues across all card files:
 * - Ensures proper indentation of effect properties
 * - Adds missing commas between properties
 * - Fixes closing braces and formatting
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TypeScript files in the card data directory
const cardFiles = glob.sync('client/src/game/data/*.ts');

// Regular expressions for finding and fixing common issues
const effectTypeRegex = /(battlecry|deathrattle|spellEffect|outcastEffect)\s*:\s*{/g;
const propertyLineRegex = /(\s+)(\w+):\s*([^,\n]+)(?!,)(\s*\n)/g;
const misalignedPropertyRegex = /(\s+)(\w+):\s*([^,\n]+),?\n(\s{2,})(?!})/g;
const missingCommaBeforeClosingBraceRegex = /([^,\s])(\s*\n\s*})/g;
const extraCommaBeforeClosingBraceRegex = /(,)(\s*\n\s*})/g;

function fixCardFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Step 1: Fix indentation of properties after effect declarations
  content = content.replace(effectTypeRegex, (match, effectType) => {
    return effectType + ": {";
  });
  
  // Step 2: Fix property alignment and add proper indentation
  content = content.replace(misalignedPropertyRegex, (match, indentation, property, value, nextIndent) => {
    // Ensure consistent indentation (6 spaces after opening brace for properties)
    return `${indentation}  ${property}: ${value},\n${indentation}  `;
  });
  
  // Step 3: Add missing commas to property lines
  content = content.replace(propertyLineRegex, (match, indentation, property, value, endOfLine) => {
    return `${indentation}${property}: ${value},${endOfLine}`;
  });
  
  // Step 4: Fix missing commas before closing braces
  content = content.replace(missingCommaBeforeClosingBraceRegex, (match, lastChar, closingBrace) => {
    // Don't add comma if it's a comment
    if (lastChar === "/") return match;
    
    return `${lastChar},${closingBrace}`;
  });
  
  // Step 5: Remove extra commas before closing braces
  content = content.replace(extraCommaBeforeClosingBraceRegex, (match, comma, closingBrace) => {
    return closingBrace;
  });
  
  // More specific fixes for known patterns
  content = content.replace(/(\s+)type:\s*"([^"]+)",\s*\n\s+requiresTarget/g, (match, indent, type) => {
    return `${indent}type: "${type}",\n${indent}  requiresTarget`;
  });
  
  content = content.replace(/,\s*\n\s*\/\/\s*[^\n]+\s*\n\s*}/g, (match) => {
    return match.replace(/,/, '');
  });
  
  // Fix specific comment pattern issues
  content = content.replace(/,(\s*\n\s*\/\/[^\n]+)\n\s*}/g, (match, comment) => {
    return `${comment}\n    }`;
  });
  
  // Check if content was modified
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed issues in ${filePath}`);
    return true;
  }
  
  console.log(`No issues found in ${filePath}`);
  return false;
}

let filesFixed = 0;
cardFiles.forEach(file => {
  if (fixCardFile(file)) {
    filesFixed++;
  }
});

console.log(`\nSummary: Fixed formatting issues in ${filesFixed} out of ${cardFiles.length} card files.`);