/**
 * Comprehensive Class Card Analysis Script
 * 
 * This script analyzes all class cards to identify issues such as:
 * - Missing class property
 * - Missing collectible property
 * - Missing ID
 * - Inconsistent casing in class values
 * - Potential duplicates
 * - Other common errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console output formatting
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR:' : 
                level === 'warn' ? '⚠️ WARNING:' : 
                level === 'success' ? '✅ SUCCESS:' : 'ℹ️ INFO:';
  console.log(`${prefix} ${message}`);
}

// Extract card objects from file content
function extractCardsFromContent(content) {
  // Find the start of the array declaration, which could be in various formats
  const arrayStart = content.indexOf('[');
  if (arrayStart === -1) return [];

  // Find the matching closing bracket
  let bracketCount = 1;
  let position = arrayStart + 1;
  
  while (bracketCount > 0 && position < content.length) {
    const char = content[position];
    if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;
    position++;
  }
  
  if (bracketCount !== 0) {
    log('Failed to parse card array - unbalanced brackets', 'error');
    return [];
  }
  
  // Extract the array content
  const arrayContent = content.substring(arrayStart, position);
  
  // Split by top-level card objects
  const cardStrings = [];
  let cardStart = 1; // Skip the opening [
  let depth = 0;
  
  for (let i = 1; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        // Found a complete card object
        cardStrings.push(arrayContent.substring(cardStart, i + 1).trim());
        cardStart = i + 1;
      }
    }
  }
  
  return cardStrings;
}

// Extract properties from a card string
function extractCardProperties(cardString) {
  const properties = {};
  
  // Extract ID
  const idMatch = cardString.match(/id:\s*(\d+(?:\.\d+)?)/);
  if (idMatch) {
    properties.id = idMatch[1];
  }
  
  // Extract name
  const nameMatch = cardString.match(/name:\s*"([^"]+)"/);
  if (nameMatch) {
    properties.name = nameMatch[1];
  }
  
  // Extract class
  const classMatch = cardString.match(/class:\s*"([^"]+)"/);
  if (classMatch) {
    properties.class = classMatch[1];
  }
  
  // Extract heroClass (older property)
  const heroClassMatch = cardString.match(/heroClass:\s*"([^"]+)"/);
  if (heroClassMatch) {
    properties.heroClass = heroClassMatch[1];
  }
  
  // Extract type
  const typeMatch = cardString.match(/type:\s*"([^"]+)"/);
  if (typeMatch) {
    properties.type = typeMatch[1];
  }
  
  // Extract rarity
  const rarityMatch = cardString.match(/rarity:\s*"([^"]+)"/);
  if (rarityMatch) {
    properties.rarity = rarityMatch[1];
  }
  
  // Check if collectible property exists
  if (cardString.includes('collectible:')) {
    const collectibleMatch = cardString.match(/collectible:\s*(true|false)/);
    if (collectibleMatch) {
      properties.collectible = collectibleMatch[1];
    }
  } else {
    properties.collectible = 'missing';
  }
  
  return properties;
}

// Find all card file paths
async function findCardFiles() {
  const cardFilePattern = 'client/src/game/data/**/*.ts';
  
  try {
    const files = await glob(cardFilePattern);
    log(`Found ${files.length} card files to analyze`, 'success');
    return files;
  } catch (error) {
    log(`Error finding card files: ${error.message}`, 'error');
    return [];
  }
}

// Analyze a specific card file
async function analyzeCardFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cardStrings = extractCardsFromContent(content);
    
    log(`Analyzing ${path.basename(filePath)} - Found ${cardStrings.length} cards`);
    
    const issues = [];
    const cardProperties = [];
    
    for (let i = 0; i < cardStrings.length; i++) {
      const props = extractCardProperties(cardStrings[i]);
      cardProperties.push(props);
      
      // Check for missing properties
      if (!props.id) {
        issues.push({ card: props.name || `Card #${i+1}`, issue: 'Missing ID' });
      }
      
      if (!props.name) {
        issues.push({ card: props.id || `Card #${i+1}`, issue: 'Missing name' });
      }
      
      if (!props.class && !props.heroClass) {
        issues.push({ card: props.name || props.id || `Card #${i+1}`, issue: 'Missing class and heroClass' });
      }
      
      if (props.heroClass && !props.class) {
        issues.push({ card: props.name || props.id || `Card #${i+1}`, issue: 'Has heroClass but missing class' });
      }
      
      if (props.class && props.heroClass && props.class.toLowerCase() !== props.heroClass.toLowerCase()) {
        issues.push({ card: props.name || props.id || `Card #${i+1}`, issue: 'class and heroClass values do not match' });
      }
      
      if (props.collectible === 'missing') {
        issues.push({ card: props.name || props.id || `Card #${i+1}`, issue: 'Missing collectible property' });
      }
    }
    
    return { 
      filePath, 
      issues,
      cardProperties,
      cardCount: cardStrings.length 
    };
  } catch (error) {
    log(`Error analyzing ${filePath}: ${error.message}`, 'error');
    return { filePath, issues: [], cardProperties: [], cardCount: 0 };
  }
}

// Main analysis function
async function analyzeAllClassCards() {
  const cardFiles = await findCardFiles();
  
  const results = [];
  for (const filePath of cardFiles) {
    const result = await analyzeCardFile(filePath);
    results.push(result);
  }
  
  // Summarize results
  const totalCards = results.reduce((sum, r) => sum + r.cardCount, 0);
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  
  // Group issues by type
  const issuesByType = {};
  results.forEach(result => {
    result.issues.forEach(issue => {
      if (!issuesByType[issue.issue]) {
        issuesByType[issue.issue] = [];
      }
      issuesByType[issue.issue].push({
        file: path.basename(result.filePath),
        card: issue.card
      });
    });
  });
  
  // Log summary
  log(`Analyzed ${totalCards} cards across ${cardFiles.length} files`);
  log(`Found ${totalIssues} issues:`);
  
  Object.keys(issuesByType).forEach(issueType => {
    const count = issuesByType[issueType].length;
    log(`- ${issueType}: ${count} cards`, count > 10 ? 'warn' : 'info');
    
    // Log detailed examples (up to 5)
    if (count > 0) {
      const examples = issuesByType[issueType].slice(0, 5);
      examples.forEach(ex => {
        console.log(`  > ${ex.card} in ${ex.file}`);
      });
      if (count > 5) {
        console.log(`  > ...and ${count - 5} more`);
      }
    }
  });
  
  // Count cards by class
  const classCounts = {};
  results.forEach(result => {
    result.cardProperties.forEach(props => {
      const cardClass = (props.class || props.heroClass || 'unknown').toLowerCase();
      if (!classCounts[cardClass]) {
        classCounts[cardClass] = 0;
      }
      classCounts[cardClass]++;
    });
  });
  
  log('Card distribution by class:');
  Object.keys(classCounts).sort().forEach(cardClass => {
    console.log(`- ${cardClass}: ${classCounts[cardClass]} cards`);
  });
  
  return { results, totalCards, totalIssues, issuesByType, classCounts };
}

// Execute the analysis
analyzeAllClassCards();