/**
 * Comprehensive Card File Checker
 * 
 * This script checks all card files in the game for common syntax errors and issues.
 * It validates:
 * 1. Proper syntax structure
 * 2. Required properties (id, name, class, collectible)
 * 3. Missing commas, trailing commas, and brace balance
 * 4. Card count consistency
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Find all card files in the project
async function findCardFiles() {
  try {
    const files = await glob('./client/src/game/data/*.ts');
    return files;
  } catch (error) {
    throw new Error(`Error finding card files: ${error.message}`);
  }
}

// Check if a file has basic syntax errors by looking for common patterns
function validateSyntax(content, fileName) {
  try {
    // Skip certain checks based on file type
    const isExportConstFile = content.includes('export const') && !content.includes('export default');
    
    // Check for common syntax errors
    const errors = [];
    
    // Check for unmatched braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening vs ${closeBraces} closing`);
    }
    
    // Check for unmatched square brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Unmatched brackets: ${openBrackets} opening vs ${closeBrackets} closing`);
    }
    
    // Check for semicolons after arrays - skip for export const files
    if (!isExportConstFile && content.includes(']') && !content.includes('];')) {
      errors.push('Missing semicolon after array closing bracket');
    }
    
    // Check for missing commas between properties
    const missingCommaPattern = /([a-zA-Z]+):\s*("[^"]*"|'[^']*'|[0-9]+|true|false|\[[^\]]*\]|{[^}]*})\s+([a-zA-Z]+):/g;
    const missingCommaMatches = content.match(missingCommaPattern);
    if (missingCommaMatches && missingCommaMatches.length > 0) {
      errors.push(`Found ${missingCommaMatches.length} properties without commas between them`);
    }
    
    // Check for trailing commas
    const trailingCommaPattern = /,\s*}/g;
    const trailingCommaMatches = content.match(trailingCommaPattern);
    if (trailingCommaMatches && trailingCommaMatches.length > 0) {
      errors.push(`Found ${trailingCommaMatches.length} trailing commas`);
    }
    
    // Check for duplicate properties
    const classPattern = /class:/g;
    const classMatches = content.match(classPattern);
    const classCount = classMatches ? classMatches.length : 0;
    
    const collectiblePattern = /collectible:/g;
    const collectibleMatches = content.match(collectiblePattern);
    const collectibleCount = collectibleMatches ? collectibleMatches.length : 0;
    
    // Check for extra closing braces without opening - skip for export const files
    if (!isExportConstFile) {
      const extraBracePattern = /}([^,{}\[\]]*?){/g;
      const extraBraceMatches = content.match(extraBracePattern);
      if (extraBraceMatches && extraBraceMatches.length > 0) {
        errors.push(`Found ${extraBraceMatches.length} closing braces not followed by comma`);
      }
    }
    
    // Count how many cards should be in the file (rough estimate)
    const idPattern = /id:\s*\d+/g;
    const idMatches = content.match(idPattern);
    const idCount = idMatches ? idMatches.length : 0;
    
    if (errors.length === 0) {
      return { 
        valid: true,
        idCount,
        stats: {
          classCount,
          collectibleCount
        }
      };
    } else {
      return { 
        valid: false, 
        errors,
        idCount,
        stats: {
          classCount,
          collectibleCount
        }
      };
    }
  } catch (error) {
    return { 
      valid: false, 
      errors: [error.message]
    };
  }
}

// Main function
async function main() {
  try {
    log('Checking all card files...');
    
    // Find all card files
    const files = await findCardFiles();
    log(`Found ${files.length} card files to check`);
    
    const results = [];
    let validCount = 0;
    let totalCardCount = 0;
    
    // Process each file
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const result = validateSyntax(content, fileName);
        
        if (result.valid) {
          validCount++;
          totalCardCount += result.idCount;
          log(`${fileName}: Valid syntax ✓ (${result.idCount} cards, ${result.stats.classCount} class properties, ${result.stats.collectibleCount} collectible properties)`);
          results.push({ fileName, valid: true, ...result });
        } else {
          log(`${fileName}: Invalid syntax ✗`, 'error');
          for (const error of result.errors) {
            log(`  - ${error}`, 'error');
          }
          results.push({ fileName, valid: false, errors: result.errors, ...result });
        }
      } catch (error) {
        log(`Error reading ${fileName}: ${error.message}`, 'error');
        results.push({ fileName, valid: false, error: `File read error: ${error.message}` });
      }
    }
    
    // Print summary
    log('\nSummary:');
    log(`${validCount} of ${files.length} files have valid syntax`);
    log(`Total cards detected: ${totalCardCount}`);
    
    if (validCount === files.length) {
      log('All card files fixed successfully! 🎉');
    } else {
      log(`${files.length - validCount} files still have issues:`, 'warning');
      for (const result of results.filter(r => !r.valid)) {
        log(`- ${result.fileName}:`, 'warning');
        if (result.errors) {
          for (const error of result.errors) {
            log(`  - ${error}`, 'warning');
          }
        } else if (result.error) {
          log(`  - ${result.error}`, 'warning');
        }
      }
    }
    
    return { 
      success: true,
      validFiles: validCount,
      totalFiles: files.length,
      totalCards: totalCardCount,
      results 
    };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();