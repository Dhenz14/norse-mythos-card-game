/**
 * Card Loading Verification Script
 * 
 * This script:
 * 1. Checks all card files for syntax errors
 * 2. Counts the number of cards per file
 * 3. Validates that required properties are present
 * 4. Checks for any remaining duplicates
 * 5. Generates a report of all card files
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

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

// Find all card files
async function findCardFiles() {
  try {
    const dataDir = './client/src/game/data/';
    const files = await fs.promises.readdir(dataDir);
    
    return files
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(dataDir, file));
  } catch (error) {
    log(`Error finding card files: ${error.message}`, 'error');
    return [];
  }
}

// Extract cards from file
function extractCardsFromFile(content) {
  const cards = [];
  
  // Define a regex pattern to match objects within an array
  const cardPattern = /{\s*(?:[^{}]*|\{[^{}]*\}|\{(?:[^{}]*|\{[^{}]*\})*\})*?}/g;
  
  // Find all matches
  const matches = content.match(cardPattern);
  
  if (matches) {
    for (const match of matches) {
      if (match.includes('id:') || match.includes('name:')) {
        cards.push(match);
      }
    }
  }
  
  return cards;
}

// Check for required properties
function checkCardProperties(cardString) {
  const issues = [];
  
  // Check for required properties
  if (!cardString.includes('id:')) {
    issues.push('Missing ID property');
  }
  
  if (!cardString.includes('name:')) {
    issues.push('Missing name property');
  }
  
  // Check for class property - should be present in most cards
  if (!cardString.includes('class:') && !cardString.includes('heroClass:')) {
    issues.push('Missing class/heroClass property');
  }
  
  // Check for collectible property - should be present in most cards
  if (!cardString.includes('collectible:')) {
    issues.push('Missing collectible property');
  }
  
  // Check for duplicate properties
  const classCount = (cardString.match(/class:/g) || []).length;
  if (classCount > 1) {
    issues.push(`Duplicate class property (${classCount} times)`);
  }
  
  const collectibleCount = (cardString.match(/collectible:/g) || []).length;
  if (collectibleCount > 1) {
    issues.push(`Duplicate collectible property (${collectibleCount} times)`);
  }
  
  // Check for trailing commas in objects
  if (cardString.match(/,\s*}/)) {
    issues.push('Trailing comma before closing brace');
  }
  
  // Check for syntax errors with missing commas
  const propertyPattern = /([a-zA-Z]+):\s*("[^"]*"|'[^']*'|[0-9]+|true|false|\[[^\]]*\]|{[^}]*})\s+([a-zA-Z]+):/g;
  const missingCommaMatches = cardString.match(propertyPattern);
  if (missingCommaMatches && missingCommaMatches.length > 0) {
    issues.push(`Missing comma between properties`);
  }
  
  return issues;
}

// Extract card ID from string
function extractCardId(cardString) {
  const idMatch = cardString.match(/id:\s*([0-9]+)/);
  return idMatch ? idMatch[1] : null;
}

// Extract card name from string
function extractCardName(cardString) {
  const nameMatch = cardString.match(/name:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1] : 'Unknown';
}

// Analyze a single card file
async function analyzeCardFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const cards = extractCardsFromFile(content);
    
    const fileName = path.basename(filePath);
    log(`Analyzing ${fileName} (${cards.length} cards)...`);
    
    const cardIssues = [];
    const cardIds = new Set();
    const duplicateIds = new Set();
    
    for (const card of cards) {
      const id = extractCardId(card);
      const name = extractCardName(card);
      const issues = checkCardProperties(card);
      
      if (id) {
        if (cardIds.has(id)) {
          duplicateIds.add(id);
        } else {
          cardIds.add(id);
        }
      }
      
      if (issues.length > 0) {
        cardIssues.push({
          id,
          name,
          issues
        });
      }
    }
    
    return {
      fileName,
      path: filePath,
      totalCards: cards.length,
      uniqueIds: cardIds.size,
      duplicateIds: Array.from(duplicateIds),
      cards: cards.length,
      cardIssues
    };
  } catch (error) {
    log(`Error analyzing ${path.basename(filePath)}: ${error.message}`, 'error');
    return {
      fileName: path.basename(filePath),
      path: filePath,
      error: error.message,
      totalCards: 0,
      uniqueIds: 0,
      duplicateIds: [],
      cards: 0,
      cardIssues: []
    };
  }
}

// Check for TypeScript compilation errors
async function checkTypeScriptCompilation(filePath) {
  try {
    // Use TypeScript to check for syntax errors without compiling
    const command = `npx tsc --noEmit --target ES2020 --moduleResolution node ${filePath}`;
    await execPromise(command);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message.split('\n')
        .filter(line => line.includes('error'))
        .join('\n')
    };
  }
}

// Generate report
function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = `./card_verification_report_${timestamp}.txt`;
  
  let report = '======================================================\n';
  report += '   CARD FILES VERIFICATION REPORT\n';
  report += `   Generated: ${new Date().toLocaleString()}\n`;
  report += '======================================================\n\n';
  
  // Overall statistics
  const totalCards = results.reduce((sum, file) => sum + file.totalCards, 0);
  const totalFilesWithIssues = results.filter(file => 
    file.cardIssues.length > 0 || file.error || (file.tsCheck && !file.tsCheck.success)
  ).length;
  
  report += '1. SUMMARY\n';
  report += '----------\n';
  report += `Total card files: ${results.length}\n`;
  report += `Total cards: ${totalCards}\n`;
  report += `Files with issues: ${totalFilesWithIssues}\n\n`;
  
  // Report per file
  report += '2. FILE DETAILS\n';
  report += '--------------\n';
  
  for (const file of results) {
    report += `${file.fileName}:\n`;
    report += `  Cards: ${file.totalCards}\n`;
    report += `  Unique IDs: ${file.uniqueIds}\n`;
    
    if (file.error) {
      report += `  ERROR: ${file.error}\n`;
    }
    
    if (file.tsCheck && !file.tsCheck.success) {
      report += `  TypeScript Errors:\n${file.tsCheck.error.split('\n').map(line => `    ${line}`).join('\n')}\n`;
    }
    
    if (file.duplicateIds.length > 0) {
      report += `  Duplicate IDs: ${file.duplicateIds.join(', ')}\n`;
    }
    
    if (file.cardIssues.length > 0) {
      report += `  Card Issues:\n`;
      
      for (const cardIssue of file.cardIssues) {
        report += `    Card ID ${cardIssue.id} (${cardIssue.name}):\n`;
        
        for (const issue of cardIssue.issues) {
          report += `      - ${issue}\n`;
        }
      }
    }
    
    report += '\n';
  }
  
  // Recommendations
  report += '3. RECOMMENDATIONS\n';
  report += '-----------------\n';
  
  if (totalFilesWithIssues === 0) {
    report += 'No issues found! All card files appear to be valid.\n';
  } else {
    report += 'The following actions are recommended:\n';
    
    if (results.some(file => file.tsCheck && !file.tsCheck.success)) {
      report += '1. Fix TypeScript compilation errors in affected files\n';
    }
    
    if (results.some(file => file.duplicateIds.length > 0)) {
      report += '2. Remove duplicate card IDs\n';
    }
    
    if (results.some(file => file.cardIssues.some(card => card.issues.some(issue => issue.includes('Missing'))))) {
      report += '3. Add missing properties to cards (ID, name, class, collectible)\n';
    }
    
    if (results.some(file => file.cardIssues.some(card => card.issues.some(issue => issue.includes('Duplicate'))))) {
      report += '4. Remove duplicate properties from cards\n';
    }
    
    if (results.some(file => file.cardIssues.some(card => card.issues.some(issue => issue.includes('comma'))))) {
      report += '5. Fix missing or trailing commas in properties\n';
    }
  }
  
  fs.writeFileSync(reportPath, report, 'utf8');
  log(`Report generated: ${reportPath}`);
  return reportPath;
}

// Main function
async function main() {
  try {
    log('Starting card verification process...');
    
    // Find all card files
    const cardFiles = await findCardFiles();
    log(`Found ${cardFiles.length} card files`);
    
    // Analyze each file
    const results = [];
    
    for (const file of cardFiles) {
      const fileResult = await analyzeCardFile(file);
      
      // Check for TypeScript errors
      const tsCheck = await checkTypeScriptCompilation(file);
      fileResult.tsCheck = tsCheck;
      
      results.push(fileResult);
    }
    
    // Generate report
    const reportPath = generateReport(results);
    
    log('Card verification completed. See report for details.');
    return { success: true, reportPath };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();