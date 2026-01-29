/**
 * Fix Missing Effect Properties Script
 * 
 * This script addresses cards with missing required properties identified during analysis.
 * It ensures all card effects have the properties needed for their effect types.
 */
const fs = require('fs');
const path = require('path');

// Load the effect analysis report
const reportPath = './card_effects_report.json';
const effectReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Extract cards with missing required properties
const cardsWithMissingProps = effectReport.missingRequiredProps || [];

console.log(`Found ${cardsWithMissingProps.length} cards with missing required properties`);

// Required properties for each effect type
const requiredProperties = {
  'battlecry:damage': ['value', 'targetType'],
  'battlecry:heal': ['value', 'targetType'],
  'battlecry:summon': ['summonCardId'],
  'battlecry:draw': ['value'],
  'battlecry:transform': ['targetType'],
  'battlecry:buff': ['buffAttack', 'buffHealth', 'targetType'],
  
  'deathrattle:summon': ['summonCardId'],
  'deathrattle:damage': ['value', 'targetType'],
  'deathrattle:draw': ['value'],
  
  'spellEffect:damage': ['value', 'targetType'],
  'spellEffect:heal': ['value', 'targetType'],
  'spellEffect:draw': ['value'],
  'spellEffect:summon': ['summonCardId', 'value'],
  'spellEffect:transform': ['targetType'],
  'spellEffect:aoe_damage': ['value']
};

// Default values for various property types
const defaultValues = {
  'value': 1,
  'buffAttack': 1,
  'buffHealth': 1,
  'targetType': 'any_minion',
  'summonCardId': function(card) {
    // Generate a reasonable summon ID based on the card name or ID
    const cardId = parseInt(card.match(/ID:\s*(\d+)/)?.[1] || '1000');
    return cardId + 1; // Use a related ID for the summoned card
  }
};

// Track cards we need to fix
const cardsToFix = {};

// Group cards by file to minimize file operations
cardsWithMissingProps.forEach(item => {
  const card = item.card;
  const effect = item.effect;
  const missingProps = item.missingProps;
  
  // Extract card ID for matching
  const cardIdMatch = card.match(/ID:\s*(\d+)/);
  if (!cardIdMatch) {
    console.warn(`Could not extract card ID from: ${card}`);
    return;
  }
  
  const cardId = cardIdMatch[1];
  
  // Find the file containing this card
  const files = fs.readdirSync('./client/src/game/data').filter(f => f.endsWith('.ts'));
  
  let cardFile = null;
  let cardContent = null;
  
  for (const file of files) {
    const filePath = path.join('./client/src/game/data', file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(`id: ${cardId},`) || content.includes(`id:${cardId},`)) {
      cardFile = filePath;
      cardContent = content;
      break;
    }
  }
  
  if (!cardFile) {
    console.warn(`Could not find file containing card with ID: ${cardId}`);
    return;
  }
  
  if (!cardsToFix[cardFile]) {
    cardsToFix[cardFile] = [];
  }
  
  // Add to the list of cards to fix in this file
  cardsToFix[cardFile].push({
    id: cardId,
    card,
    effect,
    missingProps,
    content: cardContent
  });
});

// Fix each file
Object.keys(cardsToFix).forEach(filePath => {
  const fileCards = cardsToFix[filePath];
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`Fixing file: ${filePath} (${fileCards.length} cards)`);
  
  // Process each card in the file
  fileCards.forEach(({ id, card, effect, missingProps }) => {
    console.log(`  Card ${id} (${card}) missing properties for ${effect}: ${missingProps.join(', ')}`);
    
    // Determine the effect type and category
    const [category, type] = effect.split(':');
    
    // Find the card object in the file
    const cardRegex = new RegExp(`{\\s*id:\\s*${id}[^}]*}`, 'gs');
    const cardMatch = content.match(cardRegex);
    
    if (!cardMatch) {
      console.warn(`  Could not find card ${id} in the file`);
      return;
    }
    
    const cardContent = cardMatch[0];
    
    // Find the effect object in the card
    const effectRegex = new RegExp(`${category}:\\s*{([^}]*)}`, 'gs');
    const effectMatch = cardContent.match(effectRegex);
    
    if (!effectMatch) {
      console.warn(`  Could not find ${category} effect in card ${id}`);
      return;
    }
    
    const effectContent = effectMatch[0];
    let newEffectContent = effectContent;
    
    // Add each missing property
    missingProps.forEach(prop => {
      let defaultValue;
      
      if (typeof defaultValues[prop] === 'function') {
        defaultValue = defaultValues[prop](card);
      } else {
        defaultValue = defaultValues[prop] || 1; // Default to 1 if no specific default
      }
      
      // Check if the property is already in the effect, but on a new line
      const propRegex = new RegExp(`\\s${prop}:\\s*[^,}]+`, 'g');
      if (!newEffectContent.match(propRegex)) {
        // Add the property before the closing brace
        newEffectContent = newEffectContent.replace(
          /(\s*})$/,
          `\n      ${prop}: ${typeof defaultValue === 'string' ? `"${defaultValue}"` : defaultValue},\n    $1`
        );
        
        console.log(`    Added ${prop}: ${defaultValue}`);
      }
    });
    
    // Replace the old effect content with the new one
    if (newEffectContent !== effectContent) {
      content = content.replace(effectContent, newEffectContent);
      modified = true;
    }
  });
  
  // Save the file if modified
  if (modified) {
    // Make a backup first
    fs.writeFileSync(`${filePath}.bak`, fs.readFileSync(filePath));
    fs.writeFileSync(filePath, content);
    console.log(`Updated file: ${filePath}`);
  } else {
    console.log(`No changes needed for: ${filePath}`);
  }
});

console.log('Done fixing missing effect properties');