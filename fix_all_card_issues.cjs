/**
 * Comprehensive script to fix all card files through pattern-based and specialized fixes
 * 
 * This script:
 * 1. Applies pattern-based fixes to all card files first
 * 2. Then applies specialized fixes for specific problematic files
 * 3. Generates a report of the fixes applied
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const PATTERN_FIXER = './fix_card_syntax_patterns.cjs';
const SPECIALIZED_FIXERS = [
  './fix_old_gods_cards.cjs',
  './fix_neutral_spells_and_tech.cjs',
  './fix_new_spell_cards.cjs'
];

// Map of file names to potential issues
const PROBLEM_FILES = {
  'oldGodsCards.ts': 'Complex nested objects with mixed collectible properties',
  'neutralSpellsAndTech.ts': 'Indentation issues and missing commas',
  'newSpellCards.ts': 'Missing closing braces before array end',
  'outcastCards.ts': 'Outcast effect property placement',
  'overloadCards.ts': 'Overload property placement',
  'questCards.ts': 'Complex nested objects for quest rewards',
  'coldlightTestData.ts': 'Test data with syntax errors',
  'spellCards.ts': 'Major structural issues with broken syntax'
};

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Check which files exist and should be fixed
async function checkFilesStatus() {
  const results = {};
  const cardFiles = [];
  
  // First check the pattern fixer
  try {
    await fs.promises.access(PATTERN_FIXER);
    results.patternFixer = true;
  } catch (error) {
    results.patternFixer = false;
    log(`Pattern fixer script not found: ${PATTERN_FIXER}`, 'error');
  }
  
  // Check specialized fixers
  results.specializedFixers = [];
  for (const fixer of SPECIALIZED_FIXERS) {
    try {
      await fs.promises.access(fixer);
      results.specializedFixers.push({ name: fixer, exists: true });
    } catch (error) {
      results.specializedFixers.push({ name: fixer, exists: false });
      log(`Specialized fixer script not found: ${fixer}`, 'warning');
    }
  }
  
  // Check problem files
  results.problemFiles = [];
  for (const [fileName, description] of Object.entries(PROBLEM_FILES)) {
    const filePath = `./client/src/game/data/${fileName}`;
    try {
      await fs.promises.access(filePath);
      results.problemFiles.push({ name: fileName, path: filePath, exists: true, description });
      cardFiles.push(filePath); // Add to the list of files to analyze
    } catch (error) {
      results.problemFiles.push({ name: fileName, path: filePath, exists: false, description });
      log(`Problem file not found: ${filePath}`, 'warning');
    }
  }
  
  // Find all other card files
  try {
    const files = await fs.promises.readdir('./client/src/game/data/');
    for (const file of files) {
      if (file.endsWith('.ts') && !Object.keys(PROBLEM_FILES).includes(file)) {
        const filePath = `./client/src/game/data/${file}`;
        cardFiles.push(filePath);
      }
    }
  } catch (error) {
    log(`Error finding card files: ${error.message}`, 'error');
  }
  
  results.allCardFiles = cardFiles;
  return results;
}

// Run the pattern-based fixer script
async function runPatternFixer() {
  try {
    log('Running pattern-based fixer on all card files...');
    const output = await execPromise(`node ${PATTERN_FIXER}`);
    console.log(output);
    return true;
  } catch (error) {
    log(`Error running pattern fixer: ${error.message}`, 'error');
    return false;
  }
}

// Run specialized fixers
async function runSpecializedFixers() {
  const results = [];
  
  for (const fixer of SPECIALIZED_FIXERS) {
    try {
      log(`Running specialized fixer: ${path.basename(fixer)}...`);
      const output = await execPromise(`node ${fixer}`);
      console.log(output);
      results.push({ name: fixer, success: true });
    } catch (error) {
      log(`Error running ${fixer}: ${error.message}`, 'error');
      results.push({ name: fixer, success: false, error: error.message });
    }
  }
  
  return results;
}

// Generate a report on the fixes applied
function generateReport(fileStatus, patternFixerResult, specializedFixerResults) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = `./card_fixes_report_${timestamp}.txt`;
  
  let report = '======================================================\n';
  report += '   CARD FILES SYNTAX FIXES REPORT\n';
  report += `   Generated: ${new Date().toLocaleString()}\n`;
  report += '======================================================\n\n';
  
  // Pattern fixer status
  report += '1. PATTERN-BASED FIXER\n';
  report += '----------------------\n';
  report += `Status: ${patternFixerResult ? 'SUCCESS' : 'FAILED'}\n\n`;
  
  // Specialized fixer status
  report += '2. SPECIALIZED FIXERS\n';
  report += '-------------------\n';
  for (const result of specializedFixerResults) {
    report += `${path.basename(result.name)}: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}\n`;
  }
  report += '\n';
  
  // Problem files status
  report += '3. KNOWN PROBLEM FILES\n';
  report += '---------------------\n';
  for (const file of fileStatus.problemFiles) {
    report += `${file.name}: ${file.exists ? 'FOUND' : 'NOT FOUND'}\n`;
    if (file.exists) {
      report += `  Issue: ${file.description}\n`;
    }
  }
  report += '\n';
  
  // Summary
  report += '4. SUMMARY\n';
  report += '----------\n';
  report += `Total card files found: ${fileStatus.allCardFiles.length}\n`;
  report += `Known problem files: ${fileStatus.problemFiles.filter(f => f.exists).length}\n`;
  report += `Pattern fixer: ${patternFixerResult ? 'Applied successfully' : 'Failed to apply'}\n`;
  report += `Specialized fixers: ${specializedFixerResults.filter(r => r.success).length} of ${specializedFixerResults.length} applied successfully\n\n`;
  
  report += '5. NEXT STEPS\n';
  report += '------------\n';
  report += 'The following manual checks are recommended:\n';
  report += '1. Verify all card files compile without syntax errors\n';
  report += '2. Check for any remaining duplicate class properties\n';
  report += '3. Validate all cards have correct collectible property placement\n';
  report += '4. Test the game to ensure cards load correctly\n';
  
  fs.writeFileSync(reportPath, report, 'utf8');
  log(`Report generated: ${reportPath}`);
  return reportPath;
}

// Main function
async function main() {
  try {
    log('Starting comprehensive card fixes...');
    
    // Check file status
    const fileStatus = await checkFilesStatus();
    
    // Run pattern fixer
    const patternFixerResult = fileStatus.patternFixer ? await runPatternFixer() : false;
    
    // Run specialized fixers
    const specializedFixerResults = await runSpecializedFixers();
    
    // Generate report
    const reportPath = generateReport(fileStatus, patternFixerResult, specializedFixerResults);
    
    log('Card fixes completed. See report for details.');
    return { success: true, reportPath };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();