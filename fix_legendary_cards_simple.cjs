/**
 * A simpler approach to fix the legendaryCards.ts file
 */
const fs = require('fs');
const path = require('path');

// File paths
const sourcePath = path.join(__dirname, 'client', 'src', 'game', 'data', 'legendaryCards.ts');
const templatePath = path.join(__dirname, 'legendary_cards_template.ts');
const outputPath = sourcePath;

try {
  // Read content
  console.log("Reading files...");
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // Extract template structure
  console.log("Analyzing template structure...");
  const templatePrefix = templateContent.substring(0, templateContent.indexOf('[') + 1); 
  const templateSuffix = templateContent.substring(templateContent.lastIndexOf(']'));
  
  // Parse card data
  console.log("Extracting card data...");
  const cardRegex = /{\s*id:\s*(\d+)[\s\S]*?collectible:\s*(true|false).*?}/gs;
  const allCards = [];
  let match;
  
  while ((match = cardRegex.exec(sourceContent)) !== null) {
    const cardText = match[0];
    allCards.push(cardText);
  }

  if (allCards.length === 0) {
    console.error("No cards found in the source file!");
    process.exit(1);
  }

  console.log(`Found ${allCards.length} cards.`);
  
  // Fix card formatting
  console.log("Reformatting cards...");
  const formattedCards = allCards.map(card => {
    // Format indentation and fix common issues
    return card
      .replace(/\s*{\s*/, '  {\n    ')  // Format opening brace
      .replace(/,\s*}/g, '\n  }')      // Format closing brace
      .replace(/,\s*(\w+):/g, ',\n    $1:') // Format property line breaks
      .replace(/\]\s*,/g, '],')         // Fix arrays
      .replace(/(\w+):\s*{/g, '$1: {')  // Fix nested object format
      .replace(/}\s*,\s*(\w)/g, '},\n    $1') // Fix nested object closing
      .replace(/true\s*,/g, 'true,')    // Fix boolean spacing
      .replace(/false\s*,/g, 'false,')  // Fix boolean spacing
      .replace(/(\d+)\s*,/g, '$1,')     // Fix number spacing
      .replace(/"\s*,/g, '",')          // Fix string spacing
      .replace(/\s+,\s+/g, ', ')        // Clean up excessive spacing around commas
      .replace(/\[\s*\]/g, '[]');       // Clean up empty arrays
  });
  
  // Join cards with commas
  const fixedCardsContent = formattedCards.join(',\n');
  
  // Assemble final content
  const fixedContent = templatePrefix + '\n' + fixedCardsContent + '\n' + templateSuffix;
  
  // Write fixed content
  console.log("Writing fixed content...");
  fs.writeFileSync(outputPath, fixedContent, 'utf8');
  
  console.log(`Successfully fixed ${outputPath}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(error.stack);
}