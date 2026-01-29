/**
 * Script to add class property to cards based on their heroClass property
 * 
 * Many cards in our database use heroClass but not class property
 * This causes issues with filtering in the deck builder
 * This script analyzes each card and adds a class property matching
 * the heroClass value but with proper capitalization
 * 
 * Usage:
 * ```
 * node copy_heroclass_to_class.js [--dry-run] [--file=path/to/file.ts]
 * ```
 * 
 * Options:
 * --dry-run: Only show what would be changed without actually updating files
 * --file: Process only a specific file instead of all card files
 */

import fs from 'fs';
import { glob } from 'glob';

// Define command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const fileArg = args.find(arg => arg.startsWith('--file='));
const specificFile = fileArg ? fileArg.split('=')[1] : null;

// Process a single file to convert heroClass to class
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let modifiedContent = content;
    
    // Identify the pattern: heroClass: "value" but without a corresponding class: "Value"
    // This basic string search approach is more reliable than complex regex for this task
    
    // Find all occurrences of heroClass
    const heroClassRegex = /heroClass:\s*"([^"]+)"/g;
    const matches = [...content.matchAll(heroClassRegex)];
    
    console.log(`Found ${matches.length} heroClass instances in ${filePath}`);
    
    if (matches.length === 0) {
      return 0;
    }
    
    let updatedCount = 0;
    
    // Process each match
    for (const match of matches) {
      const fullMatch = match[0]; // The full match heroClass: "value"
      const heroClassValue = match[1]; // Just the value
      
      // Properly capitalize for the class property
      const classValue = heroClassValue === 'neutral' 
        ? 'Neutral' 
        : heroClassValue.charAt(0).toUpperCase() + heroClassValue.slice(1);
      
      // Create the replacement with both properties
      const replacement = `heroClass: "${heroClassValue}", class: "${classValue}"`;
      
      // Only replace if it doesn't already have a class property nearby
      const contextBeforeAfter = 100; // Characters to check before/after the match
      const matchIndex = match.index;
      
      const startContext = Math.max(0, matchIndex - contextBeforeAfter);
      const endContext = Math.min(content.length, matchIndex + fullMatch.length + contextBeforeAfter);
      const context = content.substring(startContext, endContext);
      
      // Skip if the context already contains a class property
      if (context.includes('class:')) {
        console.log(`  Skipping a heroClass that already has class nearby`);
        continue;
      }
      
      // Replace just this instance of heroClass
      const beforeReplacement = modifiedContent.substring(0, matchIndex);
      const afterReplacement = modifiedContent.substring(matchIndex + fullMatch.length);
      modifiedContent = beforeReplacement + replacement + afterReplacement;
      
      modified = true;
      updatedCount++;
      
      console.log(`  Added class="${classValue}" based on heroClass="${heroClassValue}"`);
    }
    
    // Write the changes back to the file if we made any
    if (modified && !isDryRun) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      console.log(`Updated ${updatedCount} occurrences in ${filePath}`);
    } else if (modified) {
      console.log(`Would update ${updatedCount} occurrences in ${filePath} (dry run)`);
    }
    
    return updatedCount;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main execution
async function main() {
  console.log('--- HeroClass to Class Converter ---');
  
  if (isDryRun) {
    console.log('Running in dry-run mode (no changes will be made)');
  }
  
  let files;
  
  if (specificFile) {
    // Process only the specified file
    files = [specificFile];
    console.log(`Processing only ${specificFile}`);
  } else {
    // Find all card data files
    files = await glob('client/src/game/data/**/*.ts');
    console.log(`Found ${files.length} card files to process`);
  }
  
  let totalUpdated = 0;
  
  // Process each file
  for (const file of files) {
    try {
      const updates = processFile(file);
      totalUpdated += updates;
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }
  
  console.log('--- Summary ---');
  
  if (isDryRun) {
    console.log(`Would update ${totalUpdated} heroClass occurrences (dry run)`);
  } else {
    console.log(`Updated ${totalUpdated} heroClass occurrences`);
  }
}

// Run the main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});