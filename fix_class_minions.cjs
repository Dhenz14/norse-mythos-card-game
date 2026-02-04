/**
 * Script to fix structure issues in classMinions.ts
 */
const fs = require('fs');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/classMinions.ts';

async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix the Sandhoof Waterbearer card
    const fixedContent = content.replace(
      /id: 5109,[\s\S]+?targetType: "damaged_friendly_character",\s*collectible: true\s*},\s*{/,
      `id: 5109,
    name: 'Sandhoof Waterbearer',
  manaCost: 5,
  attack: 5,
  health: 5,
  type: "minion",
  rarity: "common",
  description: "At the end of your turn, restore 5 Health to a damaged friendly character.",
  keywords: [],
  heroClass: "priest",
  class: "Priest",
    endOfTurn: {
  type: "heal",
  value: 5,
  requiresTarget: true,
  targetType: "damaged_friendly_character"
  },
  collectible: true
  },
  {`
    );
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed structure issues in classMinions.ts');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixFile()
  .then(result => {
    if (result.success) {
      log('Successfully fixed issues');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });