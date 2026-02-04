/**
 * Card Effect Analysis Script
 * 
 * This script analyzes all card files to extract the unique effect types used across
 * battlecry, deathrattle, and spell effects. It generates a comprehensive report of
 * all the effect types we need to implement.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CARD_DIR = './client/src/game/data/';
const OUTPUT_REPORT = './card_effects_report.json';
const OUTPUT_SUMMARY = './card_effects_summary.txt';

// Data structures to hold our findings
const effectTypes = {
  battlecry: new Set(),
  deathrattle: new Set(),
  spellEffect: new Set(),
  aura: new Set(),
  onDeath: new Set(),
  onPlay: new Set(),
  endOfTurn: new Set(),
  startOfTurn: new Set(),
  combo: new Set(),
  outcast: new Set(),
  frenzy: new Set(),
  corrupt: new Set(),
  inspire: new Set(),
  discover: new Set(),
  magnetic: new Set(),
  custom: new Set(),
  other: new Set()
};

// Maps to count occurrences of each effect type and track card examples
const effectCounts = {};
const effectExamples = {};
const effectProperties = {};
const invalidEffects = [];
const missingRequiredProps = [];
const propertyTypes = {};

// Cards processed
let totalCards = 0;
let cardsWithEffects = 0;

console.log('Starting card effect analysis...');

// Get all TypeScript files in the card directory
const cardFiles = glob.sync(`${CARD_DIR}*.ts`);

// Process all files
cardFiles.forEach(filePath => {
  try {
    // Skip type definition files and index files
    if (filePath.includes('.d.ts') || filePath.includes('index.ts') || filePath.includes('types.ts')) {
      return;
    }

    console.log(`Processing ${filePath}...`);
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract all card objects from the content
    // This regex looks for objects within array literals (simplified approach)
    const cardObjectRegex = /{\s*id:\s*\d+[^}]*}/gs;
    const cardMatches = content.match(cardObjectRegex) || [];
    
    totalCards += cardMatches.length;
    
    // Process each card object
    cardMatches.forEach(cardText => {
      let hasEffect = false;
      
      // For tracking card info
      let cardId = null;
      let cardName = null;
      
      // Extract card ID and name for better reporting
      const idMatch = cardText.match(/id:\s*(\d+)/);
      const nameMatch = cardText.match(/name:\s*"([^"]+)"/);
      
      if (idMatch) cardId = idMatch[1];
      if (nameMatch) cardName = nameMatch[1];
      const cardIdentifier = cardName ? `${cardName} (ID: ${cardId})` : `Card ID: ${cardId}`;
      
      // Check for battlecry
      const battlecryMatch = cardText.match(/battlecry:\s*{([^}]*)}/s);
      if (battlecryMatch) {
        hasEffect = true;
        processBattlecry(battlecryMatch[1], cardIdentifier);
      }
      
      // Check for deathrattle
      const deathrattleMatch = cardText.match(/deathrattle:\s*{([^}]*)}/s);
      if (deathrattleMatch) {
        hasEffect = true;
        processDeathrattle(deathrattleMatch[1], cardIdentifier);
      }
      
      // Check for spell effect
      const spellEffectMatch = cardText.match(/spellEffect:\s*{([^}]*)}/s);
      if (spellEffectMatch) {
        hasEffect = true;
        processSpellEffect(spellEffectMatch[1], cardIdentifier);
      }
      
      // Check for other effect types
      const auraMatch = cardText.match(/aura:\s*{([^}]*)}/s);
      if (auraMatch) {
        hasEffect = true;
        processGenericEffect('aura', auraMatch[1], cardIdentifier);
      }
      
      // Check for endOfTurn effects
      const endOfTurnMatch = cardText.match(/endOfTurn:\s*{([^}]*)}/s);
      if (endOfTurnMatch) {
        hasEffect = true;
        processGenericEffect('endOfTurn', endOfTurnMatch[1], cardIdentifier);
      }
      
      // Check for startOfTurn effects
      const startOfTurnMatch = cardText.match(/startOfTurn:\s*{([^}]*)}/s);
      if (startOfTurnMatch) {
        hasEffect = true;
        processGenericEffect('startOfTurn', startOfTurnMatch[1], cardIdentifier);
      }
      
      // Check for combo effects
      const comboMatch = cardText.match(/combo:\s*{([^}]*)}/s);
      if (comboMatch) {
        hasEffect = true;
        processGenericEffect('combo', comboMatch[1], cardIdentifier);
      }
      
      // Check for outcast effects
      const outcastMatch = cardText.match(/outcast:\s*{([^}]*)}/s);
      if (outcastMatch) {
        hasEffect = true;
        processGenericEffect('outcast', outcastMatch[1], cardIdentifier);
      }
      
      // Check for frenzy effects
      const frenzyMatch = cardText.match(/frenzy:\s*{([^}]*)}/s);
      if (frenzyMatch) {
        hasEffect = true;
        processGenericEffect('frenzy', frenzyMatch[1], cardIdentifier);
      }

      // Check for discover effects
      const discoverMatch = cardText.match(/discover:\s*{([^}]*)}/s);
      if (discoverMatch) {
        hasEffect = true;
        processGenericEffect('discover', discoverMatch[1], cardIdentifier);
      }
      
      // Check for custom effects
      const customEffectMatch = cardText.match(/customEffect:\s*{([^}]*)}/s);
      if (customEffectMatch) {
        hasEffect = true;
        processGenericEffect('custom', customEffectMatch[1], cardIdentifier);
      }
      
      // Check for other effect properties directly on the card
      ['onDraw', 'onDiscard', 'onPlay', 'onDeath', 'inspire', 'corrupt'].forEach(effectProp => {
        const effectMatch = cardText.match(new RegExp(`${effectProp}:\\s*{([^}]*)}`, 's'));
        if (effectMatch) {
          hasEffect = true;
          processGenericEffect(effectProp, effectMatch[1], cardIdentifier);
        }
      });
      
      // Count cards with effects
      if (hasEffect) {
        cardsWithEffects++;
      }
    });
    
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
});

// Process different effect types
function processBattlecry(effectText, cardIdentifier) {
  processEffectType('battlecry', effectText, cardIdentifier);
}

function processDeathrattle(effectText, cardIdentifier) {
  processEffectType('deathrattle', effectText, cardIdentifier);
}

function processSpellEffect(effectText, cardIdentifier) {
  processEffectType('spellEffect', effectText, cardIdentifier);
}

function processGenericEffect(category, effectText, cardIdentifier) {
  processEffectType(category, effectText, cardIdentifier);
}

// Generic effect processing
function processEffectType(category, effectText, cardIdentifier) {
  // Extract effect type
  const typeMatch = effectText.match(/type:\s*["']([^"']+)["']/);
  
  if (typeMatch) {
    const effectType = typeMatch[1];
    
    // Add to the appropriate set
    if (effectTypes[category]) {
      effectTypes[category].add(effectType);
    } else {
      effectTypes.other.add(`${category}:${effectType}`);
    }
    
    // Track count
    const key = `${category}:${effectType}`;
    effectCounts[key] = (effectCounts[key] || 0) + 1;
    
    // Save an example
    if (!effectExamples[key]) {
      effectExamples[key] = cardIdentifier;
    }
    
    // Extract all properties for this effect type
    const properties = extractProperties(effectText);
    
    // Track property names for each effect type
    if (!effectProperties[key]) {
      effectProperties[key] = new Set();
    }
    
    // Add all properties
    properties.forEach(prop => {
      effectProperties[key].add(prop.name);
      
      // Track property types
      if (!propertyTypes[prop.name]) {
        propertyTypes[prop.name] = new Set();
      }
      propertyTypes[prop.name].add(prop.type);
    });
    
    // Check if required properties are present
    const hasRequiredProps = checkRequiredProperties(category, effectType, properties);
    if (!hasRequiredProps) {
      missingRequiredProps.push({
        card: cardIdentifier,
        effect: `${category}:${effectType}`,
        missingProps: getRequiredProperties(category, effectType).filter(
          prop => !properties.some(p => p.name === prop)
        )
      });
    }
    
  } else {
    // Invalid effect without a type
    invalidEffects.push({
      card: cardIdentifier,
      category,
      effectText
    });
  }
}

// Extract all properties from an effect definition
function extractProperties(effectText) {
  const properties = [];
  
  // Match all property definitions
  const propertyRegex = /(\w+):\s*([^,}\r\n]+)/g;
  let match;
  
  while ((match = propertyRegex.exec(effectText)) !== null) {
    const propName = match[1];
    const propValue = match[2].trim();
    
    // Skip type property as we already processed it
    if (propName === 'type') continue;
    
    // Determine the property type
    let propType = 'unknown';
    
    if (propValue.match(/^(\d+|true|false)$/)) {
      propType = propValue.match(/^\d+$/) ? 'number' : 'boolean';
    } else if (propValue.match(/^['"].*['"]$/)) {
      propType = 'string';
    } else if (propValue.match(/^\[.*\]$/)) {
      propType = 'array';
    } else if (propValue.match(/^{.*}$/s)) {
      propType = 'object';
    }
    
    properties.push({
      name: propName,
      value: propValue,
      type: propType
    });
  }
  
  return properties;
}

// Check if an effect has all required properties
function checkRequiredProperties(category, effectType, properties) {
  const required = getRequiredProperties(category, effectType);
  
  if (required.length === 0) return true;
  
  return required.every(prop => 
    properties.some(p => p.name === prop)
  );
}

// Get required properties for an effect type
function getRequiredProperties(category, effectType) {
  // Define required properties based on effect type
  const requiredProps = {
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
  
  return requiredProps[`${category}:${effectType}`] || [];
}

// Generate the report
const report = {
  summary: {
    totalCards,
    cardsWithEffects,
    percentWithEffects: Math.round((cardsWithEffects / totalCards) * 100),
    totalEffectTypes: Object.keys(effectCounts).length,
    effectTypesByCategory: {}
  },
  effectTypes: {},
  invalidEffects,
  missingRequiredProps,
  propertyUsage: {}
};

// Generate effect types by category
Object.keys(effectTypes).forEach(category => {
  report.summary.effectTypesByCategory[category] = Array.from(effectTypes[category]).length;
  
  Array.from(effectTypes[category]).forEach(type => {
    const key = `${category}:${type}`;
    report.effectTypes[key] = {
      count: effectCounts[key] || 0,
      example: effectExamples[key] || "No example found",
      properties: Array.from(effectProperties[key] || [])
    };
  });
});

// Generate property usage data
Object.keys(propertyTypes).forEach(prop => {
  report.propertyUsage[prop] = {
    types: Array.from(propertyTypes[prop]),
    occurrenceCount: Array.from(Object.keys(effectProperties)).filter(
      key => effectProperties[key].has(prop)
    ).length
  };
});

// Write the full report to a JSON file
fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2));

// Generate a text summary
let summary = "Card Effect Analysis Summary\n";
summary += "============================\n\n";
summary += `Total cards analyzed: ${totalCards}\n`;
summary += `Cards with effects: ${cardsWithEffects} (${report.summary.percentWithEffects}%)\n`;
summary += `Total unique effect types: ${report.summary.totalEffectTypes}\n\n`;

summary += "Effect Types by Category:\n";
Object.keys(report.summary.effectTypesByCategory).forEach(category => {
  const count = report.summary.effectTypesByCategory[category];
  if (count > 0) {
    summary += `  ${category}: ${count} unique types\n`;
  }
});

summary += "\nTop 20 Most Common Effect Types:\n";
const sortedEffects = Object.keys(effectCounts)
  .sort((a, b) => effectCounts[b] - effectCounts[a])
  .slice(0, 20);

sortedEffects.forEach((key, index) => {
  summary += `  ${index + 1}. ${key}: ${effectCounts[key]} occurrences\n`;
  summary += `     Example: ${effectExamples[key]}\n`;
  summary += `     Properties: ${Array.from(effectProperties[key] || []).join(', ')}\n`;
});

summary += "\nInvalid Effects (missing type):\n";
if (invalidEffects.length === 0) {
  summary += "  None found\n";
} else {
  invalidEffects.slice(0, 10).forEach(inv => {
    summary += `  ${inv.card} (${inv.category}): ${inv.effectText.substring(0, 50)}...\n`;
  });
  
  if (invalidEffects.length > 10) {
    summary += `  ...and ${invalidEffects.length - 10} more\n`;
  }
}

summary += "\nMissing Required Properties:\n";
if (missingRequiredProps.length === 0) {
  summary += "  None found\n";
} else {
  missingRequiredProps.slice(0, 10).forEach(item => {
    summary += `  ${item.card} (${item.effect}): missing ${item.missingProps.join(', ')}\n`;
  });
  
  if (missingRequiredProps.length > 10) {
    summary += `  ...and ${missingRequiredProps.length - 10} more\n`;
  }
}

// Write the summary to a text file
fs.writeFileSync(OUTPUT_SUMMARY, summary);

console.log(`\nAnalysis complete!`);
console.log(`- Found ${totalCards} total cards`);
console.log(`- ${cardsWithEffects} cards have effects (${report.summary.percentWithEffects}%)`);
console.log(`- ${report.summary.totalEffectTypes} unique effect types identified`);
console.log(`- ${invalidEffects.length} invalid effects found`);
console.log(`- ${missingRequiredProps.length} effects with missing required properties`);
console.log(`\nFull report written to ${OUTPUT_REPORT}`);
console.log(`Summary written to ${OUTPUT_SUMMARY}`);