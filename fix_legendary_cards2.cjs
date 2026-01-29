/**
 * Comprehensive fix for legendaryCards.ts
 * This script fixes the following issues:
 * 1. Adds proper TypeScript syntax with imports
 * 2. Converts the object literals to proper TypeScript with semicolons
 * 3. Adds proper array declaration and export statements
 */

const fs = require('fs');
const path = require('path');

// File path
const filePath = path.join(__dirname, 'client', 'src', 'game', 'data', 'legendaryCards.ts');

try {
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Add proper import and array declaration
  let fixedContent = `import { CardData } from '../types';

/**
 * Collection of legendary cards
 * Powerful unique cards with game-changing effects
 */
export const legendaryCards: CardData[] = [\n`;

  // Split content by card objects (each starting with '{' and ending with '},')
  const cardRegex = /\{\s*id:[\s\S]*?collectible:[\s\S]*?\},?/g;
  const cards = content.match(cardRegex);
  
  if (!cards) {
    console.error("Failed to parse cards from the file.");
    process.exit(1);
  }

  // Process each card object completely differently
  cards.forEach((card, index) => {
    // Extract all the properties from the card object
    const properties = {};
    
    // Extract ID
    const idMatch = card.match(/id:\s*(\d+)/);
    if (idMatch) properties.id = parseInt(idMatch[1]);
    
    // Extract name
    const nameMatch = card.match(/name:\s*"([^"]*)"/);
    if (nameMatch) properties.name = nameMatch[1];
    
    // Extract manaCost
    const manaCostMatch = card.match(/manaCost:\s*(\d+)/);
    if (manaCostMatch) properties.manaCost = parseInt(manaCostMatch[1]);
    
    // Extract attack
    const attackMatch = card.match(/attack:\s*(\d+)/);
    if (attackMatch) properties.attack = parseInt(attackMatch[1]);
    
    // Extract health
    const healthMatch = card.match(/health:\s*(\d+)/);
    if (healthMatch) properties.health = parseInt(healthMatch[1]);
    
    // Extract durability
    const durabilityMatch = card.match(/durability:\s*(\d+)/);
    if (durabilityMatch) properties.durability = parseInt(durabilityMatch[1]);
    
    // Extract type
    const typeMatch = card.match(/type:\s*"([^"]*)"/);
    if (typeMatch) properties.type = typeMatch[1];
    
    // Extract rarity
    const rarityMatch = card.match(/rarity:\s*"([^"]*)"/);
    if (rarityMatch) properties.rarity = rarityMatch[1];
    
    // Extract description
    const descriptionMatch = card.match(/description:\s*"([^"]*)"/);
    if (descriptionMatch) properties.description = descriptionMatch[1];
    
    // Extract keywords
    const keywordsMatch = card.match(/keywords:\s*\[(.*?)\]/);
    if (keywordsMatch) {
      const keywordsStr = keywordsMatch[1].trim();
      properties.keywords = keywordsStr ? keywordsStr.split(/,\s*/).map(k => k.replace(/"/g, '')) : [];
    }
    
    // Extract heroClass
    const heroClassMatch = card.match(/heroClass:\s*"([^"]*)"/);
    if (heroClassMatch) properties.heroClass = heroClassMatch[1];
    
    // Extract race
    const raceMatch = card.match(/race:\s*"([^"]*)"/);
    if (raceMatch) properties.race = raceMatch[1];
    
    // Extract class
    const classMatch = card.match(/class:\s*"([^"]*)"/);
    if (classMatch) properties.class = classMatch[1];
    
    // Extract armorGain
    const armorGainMatch = card.match(/armorGain:\s*(\d+)/);
    if (armorGainMatch) properties.armorGain = parseInt(armorGainMatch[1]);
    
    // Extract collectible
    const collectibleMatch = card.match(/collectible:\s*(true|false)/);
    if (collectibleMatch) properties.collectible = collectibleMatch[1] === 'true';
    
    // Extract battlecry, deathrattle, etc.
    const effectTypes = ['battlecry', 'deathrattle', 'frenzyEffect', 'comboEffect', 'spellEffect'];
    
    effectTypes.forEach(effectType => {
      const effectMatch = card.match(new RegExp(`${effectType}:\\s*\\{([\\s\\S]*?)\\},?`));
      if (effectMatch) {
        const effectContent = effectMatch[1];
        const effect = {};
        
        // Extract effect properties
        const typeMatch = effectContent.match(/type:\s*"([^"]*)"/);
        if (typeMatch) effect.type = typeMatch[1];
        
        const valueMatch = effectContent.match(/value:\s*(\d+)/);
        if (valueMatch) effect.value = parseInt(valueMatch[1]);
        
        const requiresTargetMatch = effectContent.match(/requiresTarget:\s*(true|false)/);
        if (requiresTargetMatch) effect.requiresTarget = requiresTargetMatch[1] === 'true';
        
        const targetTypeMatch = effectContent.match(/targetType:\s*"([^"]*)"/);
        if (targetTypeMatch) effect.targetType = targetTypeMatch[1];
        
        const buffAttackMatch = effectContent.match(/buffAttack:\s*(\d+)/);
        if (buffAttackMatch) effect.buffAttack = parseInt(buffAttackMatch[1]);
        
        const buffHealthMatch = effectContent.match(/buffHealth:\s*(\d+)/);
        if (buffHealthMatch) effect.buffHealth = parseInt(buffHealthMatch[1]);
        
        const isBasedOnStatsMatch = effectContent.match(/isBasedOnStats:\s*(true|false)/);
        if (isBasedOnStatsMatch) effect.isBasedOnStats = isBasedOnStatsMatch[1] === 'true';
        
        const summonCardIdMatch = effectContent.match(/summonCardId:\s*(\d+)/);
        if (summonCardIdMatch) effect.summonCardId = parseInt(summonCardIdMatch[1]);
        
        const isRandomMatch = effectContent.match(/isRandom:\s*(true|false)/);
        if (isRandomMatch) effect.isRandom = isRandomMatch[1] === 'true';
        
        const fromGraveyardMatch = effectContent.match(/fromGraveyard:\s*(true|false)/);
        if (fromGraveyardMatch) effect.fromGraveyard = fromGraveyardMatch[1] === 'true';
        
        const conditionalTargetMatch = effectContent.match(/conditionalTarget:\s*"([^"]*)"/);
        if (conditionalTargetMatch) effect.conditionalTarget = conditionalTargetMatch[1];
        
        const temporaryEffectMatch = effectContent.match(/temporaryEffect:\s*(true|false)/);
        if (temporaryEffectMatch) effect.temporaryEffect = temporaryEffectMatch[1] === 'true';
        
        const delayedEffectMatch = effectContent.match(/delayedEffect:\s*(true|false)/);
        if (delayedEffectMatch) effect.delayedEffect = delayedEffectMatch[1] === 'true';
        
        const delayedTriggerMatch = effectContent.match(/delayedTrigger:\s*"([^"]*)"/);
        if (delayedTriggerMatch) effect.delayedTrigger = delayedTriggerMatch[1];
        
        const discoveryTypeMatch = effectContent.match(/discoveryType:\s*"([^"]*)"/);
        if (discoveryTypeMatch) effect.discoveryType = discoveryTypeMatch[1];
        
        const discoveryCountMatch = effectContent.match(/discoveryCount:\s*(\d+)/);
        if (discoveryCountMatch) effect.discoveryCount = parseInt(discoveryCountMatch[1]);
        
        const triggeredMatch = effectContent.match(/triggered:\s*(true|false)/);
        if (triggeredMatch) effect.triggered = triggeredMatch[1] === 'true';
        
        properties[effectType] = effect;
      }
    });
    
    // Generate proper TypeScript format
    let fixedCard = '{\n';
    
    // Add basic properties
    for (const [key, value] of Object.entries(properties)) {
      if (key !== 'battlecry' && key !== 'deathrattle' && key !== 'frenzyEffect' && 
          key !== 'comboEffect' && key !== 'spellEffect') {
        if (typeof value === 'string') {
          fixedCard += `  ${key}: "${value}"`;
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            fixedCard += `  ${key}: []`;
          } else {
            const formattedArray = value.map(item => typeof item === 'string' ? `"${item}"` : item).join(', ');
            fixedCard += `  ${key}: [${formattedArray}]`;
          }
        } else {
          fixedCard += `  ${key}: ${value}`;
        }
        fixedCard += ',\n';
      }
    }
    
    // Add complex properties (battlecry, deathrattle, etc.)
    for (const effectType of effectTypes) {
      if (properties[effectType]) {
        fixedCard += `  ${effectType}: {\n`;
        
        for (const [key, value] of Object.entries(properties[effectType])) {
          if (typeof value === 'string') {
            fixedCard += `    ${key}: "${value}"`;
          } else {
            fixedCard += `    ${key}: ${value}`;
          }
          fixedCard += ',\n';
        }
        
        fixedCard += '  },\n';
      }
    }
    
    // Close the card object
    fixedCard = fixedCard.slice(0, -2) + '\n}';
    
    // Add the card with proper formatting
    fixedContent += fixedCard;
    // Add appropriate comma except for the last card
    if (index < cards.length - 1 && !fixedCard.trim().endsWith(',')) {
      fixedContent += ',\n';
    } else if (!fixedCard.trim().endsWith(',')) {
      fixedContent += '\n';
    }
  });

  // Close the array and add default export
  fixedContent += '];\n\n// Export the legendary cards\nexport default legendaryCards;\n';

  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log(`Successfully fixed ${filePath}`);
} catch (error) {
  console.error(`Error processing file: ${error}`);
}