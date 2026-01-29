/**
 * Check specifically the most problematic card files
 */

const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Problem files to check
const PROBLEM_FILES = [
  'oldGodsCards.ts',
  'neutralSpellsAndTech.ts',
  'newSpellCards.ts',
  'outcastCards.ts',
  'overloadCards.ts',
  'questCards.ts',
  'coldlightTestData.ts',
  'spellCards.ts'
];

// Check if a file has basic syntax errors by looking for common patterns
function validateSyntax(content, fileName) {
  try {
    // Skip certain checks for coldlightTestData.ts as it has a different structure
    const isColdlightFile = fileName === 'coldlightTestData.ts';
    
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
    
    // Check for semicolons after arrays - skip for coldlight as it's expected
    if (!isColdlightFile && content.includes(']') && !content.includes('];')) {
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
    
    // Check for extra closing braces without opening - skip for coldlight as it's formatted differently
    if (!isColdlightFile) {
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
    log('Checking problem files...');
    
    const results = [];
    
    for (const fileName of PROBLEM_FILES) {
      const filePath = `./client/src/game/data/${fileName}`;
      
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const result = validateSyntax(content, fileName);
        
        if (result.valid) {
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
    const validCount = results.filter(r => r.valid).length;
    log(`${validCount} of ${PROBLEM_FILES.length} files have valid syntax`);
    
    if (validCount === PROBLEM_FILES.length) {
      log('All problem files fixed successfully! 🎉');
    } else {
      log(`${PROBLEM_FILES.length - validCount} files still have issues:`, 'warning');
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
    
    return results;
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { error: error.message };
  }
}

// Execute the main function
main();